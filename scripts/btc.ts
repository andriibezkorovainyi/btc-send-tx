import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import * as ecc from "tiny-secp256k1";
import axios from "axios";
import { config } from "dotenv";
config();

// npx ts-node scripts/btc.ts
const ECPair = ECPairFactory(ecc);
const MAINNET = bitcoin.networks.bitcoin;

function createBitcoinAddress() {
  const keyPair = ECPair.makeRandom({ network: MAINNET });

  const privateKey = keyPair.toWIF();
  const publicKey = keyPair.publicKey.toString("hex");
  console.log("Private key:", privateKey);
  console.log("Public key:", publicKey);

  const keys = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
  console.log("Address:", keys.address);
}

function getAddressAndPubKeyFromPrivateKey(privateKey: string) {
  const keyPair = bitcoin.ECPair.fromWIF(privateKey, MAINNET);
  console.log("Public key:", keyPair.publicKey.toString("hex"));

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: keyPair.publicKey,
    network: MAINNET,
  });
  console.log("Address:", address);
}

function getAddressTypes(privateKey: string) {
  const keyPair = bitcoin.ECPair.fromWIF(privateKey, MAINNET);

  const keysSegWit = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
  const keysLegacy = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
  console.log("Address SegWit:", keysSegWit.address);
  console.log("Address Legacy:", keysLegacy.address);
}

async function getTransactionHistory(address: string) {
  try {
    const response = await axios.get(
      `https://blockchain.info/rawaddr/${address}`
    );

    if (response.status === 200) {
      console.log("Total transactions:", response.data.n_tx);
      console.log("Total received:", response.data.total_received);
      console.log("Total sent:", response.data.total_sent);
      console.log("Final balance:", response.data.final_balance);
    } else {
      console.error("Error retrieving address information");
    }
  } catch (error) {
    console.error("Error API request:", error);
  }
}

async function checkBalance(address: string) {
  try {
    const response = await axios.get(
      `https://blockchain.info/balance?active=${address}`
    );

    if (response.status === 200) {
      const balanceInfo = response.data[address];
      const balance = balanceInfo.final_balance;
      console.log(`Balance of address ${address}: ${balance} satoshis`);
    } else {
      console.error("Error retrieving balance information");
    }
  } catch (error) {
    console.error("Error API request:", error);
  }
}

const privateKey = <string>process.env.PRIVATE_KEY;
const address = "bc1qvz6cpy0wyf2lverenjjy64easzudsmajxucsyw";

// createBitcoinAddress();
// getAddressAndPubKeyFromPrivateKey(privateKey);
// getAddressTypes(privateKey);
// getTransactionHistory(address);
// checkBalance(address);
