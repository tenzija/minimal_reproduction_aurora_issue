require("dotenv").config();
const ethers = require("ethers");

async function main() {
  const RPC =
    process.env.SPROUTLY_RPC_URL ||
    "https://0x4e454246.rpc.aurora-cloud.dev";

  // v5-style provider ctor
  const provider = new ethers.providers.JsonRpcProvider(
    RPC,
    { name: "Sproutly Testnet", chainId: 1313161798 }
  );

  const rawPk = process.env.PRIVATE_KEY || "";
  const pk = rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`;
  const wallet = new ethers.Wallet(pk, provider);

  // Basic diagnostics
  const net = await provider.getNetwork();
  console.log("rpc:", RPC);
  console.log("from:", wallet.address, "chainId:", net.chainId);

  // Choose gas price: env override > node suggestion > 1 gwei fallback
  const suggested = await provider.getGasPrice().catch(() => null);
  const gasPrice = process.env.SPROUTLY_GAS_PRICE_GWEI
    ? ethers.utils.parseUnits(process.env.SPROUTLY_GAS_PRICE_GWEI, "gwei")
    : (suggested || ethers.utils.parseUnits("1", "gwei"));

  console.log("gasPrice(gwei):", ethers.utils.formatUnits(gasPrice, "gwei"));

  // Force a raw, legacy (type:0) tx with explicit gasPrice
  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0,
    gasPrice,          // forces legacy mode in v5
    gasLimit: 21000,
    type: 0            // explicit legacy
  });

  console.log("sent tx:", tx.hash);
  const r = await tx.wait(1);
  console.log("mined in block:", r.blockNumber);
}

main().catch((e) => {
  console.error("SMOKE ERROR:", e);
  process.exit(1);
});
