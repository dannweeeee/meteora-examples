import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { CpAmm, derivePositionNftAccount } from "@meteora-ag/cp-amm-sdk";
import { BN, Wallet } from "@coral-xyz/anchor";
import bs58 from "bs58";
import {
  AuthorityType,
  createSetAuthorityInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

async function getAndLockPosition() {
  console.log("Starting position retrieval and locking process...");

  // Initialize connection
  const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
  );

  const userKeypair = Keypair.fromSecretKey(bs58.decode(""));
  const userWallet = new Wallet(userKeypair);
  console.log("User wallet initialized:", userWallet.publicKey.toBase58());

  const creatorWallet = new PublicKey("");
  console.log("Creator wallet:", creatorWallet.toBase58());

  const cpAmm = new CpAmm(connection);

  try {
    // get pool state
    const poolState = await cpAmm.fetchPoolState(new PublicKey("")); // DAMM V2 pool address (can use deriveDAMMV2PoolAddress)

    // get position address for the user
    const userPositions = await cpAmm.getUserPositionByPool(
      new PublicKey(""), // DAMM V2 pool address (can use deriveDAMMV2PoolAddress)
      userWallet.publicKey // user wallet address
    );

    if (userPositions.length === 0) {
      console.log("No positions found for this user.");
      return;
    }

    // display information about each position
    userPositions.forEach((position, index) => {
      console.log(`\nPosition #${index + 1}:`);
      console.log(`Position Address: ${position.position.toBase58()}`);
      console.log(`NFT Account: ${position.positionNftAccount.toBase58()}`);
      console.log(
        `Total Liquidity: ${position.positionState.unlockedLiquidity
          .add(position.positionState.vestedLiquidity)
          .toString()}`
      );
      console.log(
        `Unlocked Liquidity: ${position.positionState.unlockedLiquidity.toString()}`
      );
      console.log(
        `Vested Liquidity: ${position.positionState.vestedLiquidity.toString()}`
      );
    });

    // lock LP for 1 year
    const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60; // 1 year in seconds (because my activation type is timestamp)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const cliffPoint = new BN(currentTimestamp + ONE_YEAR_IN_SECONDS);
    const periodFrequency = new BN(1);
    const numberOfPeriods = 0; // Set to 0 since we want all liquidity at cliff
    const cliffUnlockLiquidity =
      userPositions[0].positionState.unlockedLiquidity;
    const liquidityPerPeriod = new BN(0);

    // create vesting account
    const vestingAccount = Keypair.generate(); // no need to save this keypair
    console.log(
      "Created vesting account:",
      vestingAccount.publicKey.toBase58()
    );

    // Lock the position
    const lockPositionTx = await cpAmm.lockPosition({
      owner: userWallet.publicKey,
      pool: userPositions[0].positionState.pool,
      payer: userWallet.publicKey,
      vestingAccount: vestingAccount.publicKey,
      position: userPositions[0].position,
      positionNftAccount: userPositions[0].positionNftAccount,
      cliffPoint,
      periodFrequency,
      cliffUnlockLiquidity,
      liquidityPerPeriod,
      numberOfPeriod: numberOfPeriods,
    });

    // send and confirm the transaction
    const signature = await connection.sendTransaction(lockPositionTx, [
      userKeypair,
      vestingAccount,
    ]);
    await connection.confirmTransaction(signature, "confirmed");

    console.log("\nPosition locked successfully!");
    console.log("Transaction: https://solscan.io/tx/" + signature);
    console.log("Vesting account:", vestingAccount.publicKey.toBase58());

    // optional: transfer position to creator
    // const setAuthorityIx = createSetAuthorityInstruction(
    //   userPositions[0].positionNftAccount,
    //   userWallet.publicKey,
    //   AuthorityType.AccountOwner,
    //   creatorWallet,
    //   [],
    //   TOKEN_2022_PROGRAM_ID
    // );
    // const assignOwnerTx = new Transaction().add(setAuthorityIx);
    // const assignSig = await sendAndConfirmTransaction(
    //   connection,
    //   assignOwnerTx,
    //   [userKeypair],
    //   {
    //     commitment: "confirmed",
    //   }
    // );

    // console.log(
    //   "Position locked and transferred to creator. Transaction: https://solscan.io/tx/" +
    //     assignSig
    // );

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Execute the main function
getAndLockPosition().catch((error) => {
  console.error("Fatal error in main function:", error);
  process.exit(1);
});
