import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import * as ecc from "tiny-secp256k1";
import axios from "axios";
import { config } from "dotenv";
config();

// npx ts-node scripts/btcSendTx.ts
const ECPair = ECPairFactory(ecc);
const MAINNET = bitcoin.networks.bitcoin;

async function getUTXO(address: string) {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://btcbook.nownodes.io/api/v2/utxo//${address}`,
    headers: {
      "api-key": <string>process.env.API_KEY,
    },
  };

  try {
    const response = await axios(config);
    // console.log(response.data);
    return response.data[0];
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function sendBitcoin(
  fromPrivateKey: string,
  toAddress: string,
  amount: number
) {
  const keyPair = ECPair.fromWIF(fromPrivateKey, MAINNET);
  const psbt = new bitcoin.Psbt({ network: MAINNET });

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: keyPair.publicKey,
    network: MAINNET,
  });

  const txUtxo = await getUTXO(address!);

  const inputData = {
    hash: txUtxo.txid,
    index: txUtxo.vout,
    witnessUtxo: {
      script: Buffer.from(
        "76a9148bbc95d2709c71607c60ee3f097c1217482f518d88ac",
        "hex"
      ),
      value: 49420,
    },
  };

  psbt.addInput(inputData);
  psbt.addOutput({ address: toAddress, value: amount });

  psbt.signInput(0, keyPair);
  psbt.finalizeAllInputs();

  const hex = psbt.extractTransaction().toHex();
  console.log("Signed tx:", hex);
}

const fromPrivKey = <string>process.env.PRIVATE_KEY;
const toAddress = "bc1qc56rfsnvc20fv67mve6efg8tn87f6ah4pzcypf";
const amount = 10000;

sendBitcoin(fromPrivKey, toAddress, amount);
