import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import AmmImpl from "@meteora-ag/dynamic-amm-sdk";
import bs58 from "bs58";

async function checkAndClaimLockFees(
  connection: Connection,
  poolAddress: PublicKey,
  owner: Keypair
) {
  try {
    // init AMM instance
    const amm = await AmmImpl.create(connection, poolAddress);

    // get user's lock escrow info
    const lockEscrow = await amm.getUserLockEscrow(owner.publicKey);

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

    const amountToClaim = unclaimedFees.lp;

    // create and send claim transaction
    const claimTx = await amm.claimLockFee(owner.publicKey, amountToClaim);

    // sign and send transaction
    const signature = await connection.sendTransaction(claimTx, [owner]);

    console.log(`Claim transaction sent: ${signature}`);
    console.log("Waiting for confirmation...");

    await connection.confirmTransaction(signature);
    console.log("Fees claimed successfully!");
  } catch (error) {
    console.error("Error claiming fees:", error);
  }
}

// Main execution
async function main() {
  try {
    const poolAddress = new PublicKey("");

    const PRIVATE_KEY = "";
    const secretKey = bs58.decode(PRIVATE_KEY);
    const wallet = Keypair.fromSecretKey(secretKey);
    console.log("Wallet public key:", wallet.publicKey.toBase58());

    const connection = new Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    await checkAndClaimLockFees(connection, poolAddress, wallet);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
