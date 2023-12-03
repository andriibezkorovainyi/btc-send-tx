import mempoolJS from "@mempool/mempool.js";

// npx ts-node scripts/mempoolAPI.ts
export const mempoolInit = (network: string) => {
  const {
    bitcoin: { addresses, transactions, fees },
  } = mempoolJS({
    hostname: "mempool.space",
    network,
  });

  return { addresses, transactions, fees };
};

