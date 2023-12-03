import axios from "axios";
import { config } from "dotenv";
import { mempoolInit} from "./mempoolAPI";
config();

const {Network, Output, Coin, MTX, KeyRing, WalletDB, TX, Amount} = require("bcoin");
const network = Network.get(process.env.NETWORK!);
const mempoolClient = mempoolInit(network.type);
const walletName = process.env.WALLET_NAME!;

async function pushTx(rawTx: string) {
    try {
        const prefix = network.type === "testnet" ? "test3" : "main";
        const {data} = await axios.post(`https://api.blockcypher.com/v1/btc/${prefix}/txs/push`, {tx: rawTx});
        return data;
    } catch (error: any) {
        console.log(error.message);
    }
}

async function walletInit(privateKey: string) {
    const walletDB = new WalletDB({ db: 'memory', network });
    await walletDB.open();
    let wallet = await walletDB.get(walletName);

    if (!wallet) {
        wallet = await walletDB.create({
            id: walletName,
            master: Buffer.from(privateKey, 'hex').toString(),
        });
    }

    return wallet;
}

async function coinsFromUtxo(utxo: any, amount: number, rate: number) {
    const coins = [];
    let totalAmount = 0;

    for (const u of utxo) {
        if (!u.status.confirmed) continue;

        const txHex = await mempoolClient.transactions.getTxHex({ txid: u.txid });
        const tx = TX.fromRaw(Buffer.from(txHex, "hex"));
        const coin = Coin.fromTX(tx, u.vout, u.status.block_height);
        if (coin.isDust(rate)) { console.log(`UTXO ${u.txid} is Dust!`); continue; }

        coins.push(coin);
        totalAmount += u.value;

        if (totalAmount >= amount * 2) break; // Если сумма собранных UTXO в два раза больше суммы перевода, значит на комиссию точно хватит. Лучшее что придумал
    }

    return coins;
}

async function sendBitcoin(
    sendTo: string,
    sendFrom: string = process.env.SEND_FROM!,
    privateKey: string = process.env.PRIVATE_KEY!,
    amount: number,
) {
    const wallet = await walletInit(privateKey);
    const rate = (await mempoolClient.fees.getFeesRecommended()).halfHourFee * 1000; // Средний приоритет, в sat/KB

    const utxo = await mempoolClient.addresses.getAddressTxsUtxo({ address: sendFrom });
    if (!utxo.length) throw new Error('No UTXO found.');

    const coins = await coinsFromUtxo(utxo, amount, rate);
    if (coins.length === 0) throw new Error('No spendable UTXO found.');

    const keyRing = await KeyRing.fromSecret(privateKey, network);
    keyRing.witness = coins[0].type === 'witnesspubkeyhash';

    const mtx = new MTX();

    const output = new Output({
        address: sendTo,
        value: amount
    });

    if (output.isDust()) throw new Error('Output is dust.');

    mtx.outputs.push(output);

    await mtx.fund(coins, {
        rate,
        changeAddress: sendFrom,
        getAccount: wallet.getAccount.bind(wallet),
    });

    await mtx.sign(keyRing);

    if (!(await mtx.verify())) throw new Error('Signature failed to verify.');

    const rawTx = mtx.toRaw().toString('hex');

    console.log(rawTx);
    // const tx = await mempoolClient.transactions.postTx({ tx: rawTx });
    const tx = await pushTx(rawTx);
    console.log(tx);
}

const toSatoshi = (amount: number) => +Amount.fromBTC(amount).toSatoshis(true);
const toBtc = (amount: number) => +Amount.btc(amount, true);

const sendTo = "";
const sendFrom = "";
const privateKey = process.env.PRIVATE_KEY!;
const amount = 20000;

sendBitcoin(sendTo, sendFrom, privateKey, amount);

