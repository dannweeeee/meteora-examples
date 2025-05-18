import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import AmmImpl from "@meteora-ag/dynamic-amm-sdk";
import bs58 from "bs58";
import { ComputeBudgetProgram } from "@solana/web3.js";

async function checkLockFees(
  connection: Connection,
  poolAddress: PublicKey,
  owner: PublicKey
) {
  // init AMM instance
  const amm = await AmmImpl.create(connection, poolAddress);

  // get user's lock escrow info
  const lockEscrow = await amm.getUserLockEscrow(owner);

  if (!lockEscrow) {
    console.log("No lock escrow found for this user");
    return;
  }

  // check if there are unclaimed fees
  const unclaimedFees = lockEscrow.fee.unClaimed;

  if (unclaimedFees.lp.isZero()) {
    console.log("No unclaimed fees available");
    return;
  }

  console.log("Unclaimed fees:");
  console.log(`LP tokens: ${unclaimedFees.lp.toString()}`);
  console.log(`Token A: ${unclaimedFees.tokenA.toString()}`);
  console.log(`Token B: ${unclaimedFees.tokenB.toString()}`);
}

async function main() {
  try {
    const poolAddress = new PublicKey("");

    const owner = new PublicKey("");

    const connection = new Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    await checkLockFees(connection, poolAddress, owner);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
