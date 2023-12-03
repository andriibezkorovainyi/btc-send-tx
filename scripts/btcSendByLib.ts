import CryptoAccount from "send-crypto";

// npx ts-node scripts/btcSendByLib.ts
const privateKey = process.env.PRIVATE_KEY || CryptoAccount.newPrivateKey();
const privateKeyBuffer = Buffer.from(privateKey, "hex");

const account = new CryptoAccount(privateKeyBuffer);
console.log(account);

async function getAddress() {
  console.log(await account.address("BTC"));
}

async function getBalance() {
  console.log(await account.getBalance("BTC"));
}

async function sendBtc() {
  const txHash = await account
    .send("bc1qc56rfsnvc20fv67mve6efg8tn87f6ah4pzcypf", 0.0001, "BTC")
    .on("transactionHash", console.log)
    .on("confirmation", console.log);
}

getAddress();
getBalance();
