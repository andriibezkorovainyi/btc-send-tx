import mempoolJS from "@mempool/mempool.js";

// npx ts-node scripts/mempoolAPI.ts
const init = async () => {
  const {
    bitcoin: { addresses },
  } = mempoolJS({
    hostname: "mempool.space",
  });

  const address = "bc1qvz6cpy0wyf2lverenjjy64easzudsmajxucsyw";
  const addressTxsUtxo = await addresses.getAddressTxsUtxo({ address });
  console.log(addressTxsUtxo);
};

init();

