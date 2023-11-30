import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import * as ecc from "tiny-secp256k1";
import axios from "axios";

// npx ts-node scripts/btcSendTx.ts
const ECPair = ECPairFactory(ecc);
const MAINNET = bitcoin.networks.bitcoin;

async function getLastTxHash(address: string) {
  const response = await axios.get(
    `https://blockchain.info/rawaddr/${address}`
  );
  if (response.status === 200) {
    return response.data.txs[0].hash;
  } else {
    console.error("Address data error");
  }
}

async function sendBitcoin(
  fromPrivateKey: string,
  fromAddress: string,
  toPublicKey: string,
  toAddress: string,
  amount: number
) {
  const keyPair = ECPair.fromWIF(fromPrivateKey);
  const psbt = new bitcoin.Psbt({ network: MAINNET });

  const lastTxHash = await getLastTxHash(fromAddress);

  const inputDataTest = {
    hash: lastTxHash,
    index: 0,
    witnessUtxo: {
      script: Buffer.from(toPublicKey, "hex"),
      value: amount,
    },
  };

  psbt.addInput(inputDataTest);
  psbt.addOutput({ address: toAddress, value: amount });

  psbt.signInput(0, keyPair);
  psbt.finalizeAllInputs();

  const hex = psbt.extractTransaction().toHex();
  console.log("Signed tx:", hex);
}

const fromPrivKey = "";
const fromAddress = "bc1qvz6cpy0wyf2lverenjjy64easzudsmajxucsyw";
const toPublicKey = "037d76ad0083bd5d5cc889a4e74e230a2851e63bc24f3382e99768cbeb2ecf4beb";
const toAddress = "bc1qc56rfsnvc20fv67mve6efg8tn87f6ah4pzcypf";
const amount = 10000;

sendBitcoin(fromPrivKey, fromAddress, toPublicKey, toAddress, amount);
