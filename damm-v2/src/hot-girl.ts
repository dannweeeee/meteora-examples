import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";
import { FeeSchedulerMode } from "@meteora-ag/cp-amm-sdk";
import {
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  DEVNET_RPC_URL,
  MAINNET_RPC_URL,
  USDC_MINT,
  keypair1,
  keypair2,
} from "./env/constants";
import { createTokenMint, getAmountInLamports } from "./helpers/token";
import { CancelMode, UpdateRecipientMode } from "@meteora-ag/met-lock-sdk";
import { createVestingEscrowV2 } from "./helpers/locker";
import { createDammV2BalancedPool } from "./lib";
import { DammV2PoolConfig } from "./utils/types";

async function main() {
  const firstKeypair = Keypair.fromSecretKey(new Uint8Array(keypair1));
  const wallet = new Wallet(firstKeypair);
  console.log(`Pool Creator Wallet: ${wallet.publicKey.toString()}`);

  // strategic seed sale -> 20% jup lock
  const strategicSeedRecipient = new PublicKey(
    "YOUR_STRATEGIC_SEED_RECIPIENT_ADDRESS"
  );
  // potential utility -> 20% jup lock
  const potentialUtilityRecipient = new PublicKey(
    "YOUR_POTENTIAL_UTILITY_RECIPIENT_ADDRESS"
  );
  // marketing -> 15% jup lock
  const marketingRecipient = new PublicKey(
    "YOUR_MARKETING_RECIPIENT_ADDRESS"
  );
  // team -> 10% jup lock
  const teamRecipient = new PublicKey(
    "YOUR_TEAM_RECIPIENT_ADDRESS"
  );
  // future activation -> 10% jup lock
  const futureActivationRecipient = new PublicKey(
    "YOUR_FUTURE_ACTIVATION_RECIPIENT_ADDRESS"
  );
  // CEX -> 10% jup lock
  const cexRecipient = new PublicKey(
    "YOUR_CEX_RECIPIENT_ADDRESS"
  );

  // advisor -> 5% jup lock
  const advisorRecipient = new PublicKey(
    "YOUR_ADVISOR_RECIPIENT_ADDRESS"
  );
  // community -> 5% jup lock
  const communityRecipient = new PublicKey(
    "YOUR_COMMUNITY_RECIPIENT_ADDRESS"
  );

  const connection = new Connection(MAINNET_RPC_URL, "confirmed");

  // create base mint
  const tokenAMintOptions = {
    mintTokenAmount: 10_000_000,
    decimals: 6,
    computeUnitPriceMicroLamports: 1000,
  };

  const tokenAMint = await createTokenMint(connection, wallet, {
    ...tokenAMintOptions,
  });

  console.log(`Created token mint ${tokenAMint.toString()}`);

  // verify the wallet's associated token account exists and has the expected balance
  const walletTokenAddress = await getAssociatedTokenAddress(
    tokenAMint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  console.log(`Wallet token account: ${walletTokenAddress.toString()}`);

  try {
    const walletTokenAccount = await getAccount(
      connection,
      walletTokenAddress,
      "confirmed",
      TOKEN_PROGRAM_ID
    );
    console.log(
      `Wallet token balance: ${walletTokenAccount.amount.toString()}`
    );
  } catch (error) {
    console.error("Failed to get wallet token account:", error);
    throw new Error(
      "Wallet token account not found. Token creation may have failed."
    );
  }

  const currentSlot = await connection.getSlot();
  const currentBlockTime = await connection.getBlockTime(currentSlot);

  if (currentBlockTime === null) {
    throw new Error("Unable to fetch current block time");
  }

  const activationTime = new BN(currentBlockTime).add(new BN(600));
  console.log(`Activation time: ${activationTime.toString()}`);

  // strategic seed sale -> 20% jup lock // immediate vest // 2,000,000 tokens
  const strategicSeedCliffTime = activationTime.add(new BN(0));
  const strategicSeedCliffUnlockAmount = getAmountInLamports(2000000, 6);
  const strategicSeedAmountPerPeriod = new BN(0);
  const strategicSeedVestingFrequency = new BN(0);
  const strategicSeedNumberOfPeriod = new BN(0);

  await createVestingEscrowV2(
    connection,
    wallet,
    strategicSeedRecipient,
    tokenAMint,
    false,
    activationTime,
    strategicSeedCliffTime,
    strategicSeedCliffUnlockAmount,
    strategicSeedAmountPerPeriod,
    strategicSeedVestingFrequency,
    strategicSeedNumberOfPeriod,
    UpdateRecipientMode.CREATOR_ONLY,
    CancelMode.CREATOR_ONLY,
    TOKEN_PROGRAM_ID
  );

  // potential utility -> 20% jup lock // 6 months cliff, over 30 months // 2,000,000 tokens
  const potentialUtilityCliffTime = activationTime.add(
    new BN(6 * 30 * 24 * 60 * 60)
  ); // 6 months
  const potentialUtilityCliffUnlockAmount = getAmountInLamports(
    333333.333333,
    6
  );
  const potentialUtilityAmountPerPeriod = getAmountInLamports(55555.555555, 6);
  const potentialUtilityVestingFrequency = new BN(2626560); // 1 month interval
  const potentialUtilityNumberOfPeriod = new BN(30); // 30 months

  await createVestingEscrowV2(
    connection,
    wallet,
    potentialUtilityRecipient,
    tokenAMint,
    false,
    activationTime,
    potentialUtilityCliffTime,
    potentialUtilityCliffUnlockAmount,
    potentialUtilityAmountPerPeriod,
    potentialUtilityVestingFrequency,
    potentialUtilityNumberOfPeriod,
    UpdateRecipientMode.CREATOR_ONLY,
    CancelMode.CREATOR_ONLY,
    TOKEN_PROGRAM_ID
  );

  // marketing -> 15% jup lock // 20% on TGE, linear over 12 months // 1,500,000 tokens
  const marketingCliffTime = activationTime.add(new BN(0)); // immediate vest
  const marketingCliffUnlockAmount = getAmountInLamports(300000, 6);
  const marketingAmountPerPeriod = getAmountInLamports(100000, 6);
  const marketingVestingFrequency = new BN(2626560); // 1 month interval
  const marketingNumberOfPeriod = new BN(12); // 12 months

  await createVestingEscrowV2(
    connection,
    wallet,
    marketingRecipient,
    tokenAMint,
    false,
    activationTime,
    marketingCliffTime,
    marketingCliffUnlockAmount,
    marketingAmountPerPeriod,
    marketingVestingFrequency,
    marketingNumberOfPeriod,
    UpdateRecipientMode.CREATOR_ONLY,
    CancelMode.CREATOR_ONLY,
    TOKEN_PROGRAM_ID
  );

  // team -> 10% jup lock // 12 months cliff, linear over 24 months // 1,000,000 tokens
  const teamCliffTime = activationTime.add(new BN(12 * 30 * 24 * 60 * 60)); // 12 months
  const teamCliffUnlockAmount = getAmountInLamports(333333.333333, 6);
  const teamAmountPerPeriod = getAmountInLamports(27777.777777, 6);
  const teamVestingFrequency = new BN(2626560); // 1 month interval
  const teamNumberOfPeriod = new BN(24); // 24 months

  await createVestingEscrowV2(
    connection,
    wallet,
    teamRecipient,
    tokenAMint,
    false,
    activationTime,
    teamCliffTime,
    teamCliffUnlockAmount,
    teamAmountPerPeriod,
    teamVestingFrequency,
    teamNumberOfPeriod,
    UpdateRecipientMode.CREATOR_ONLY,
    CancelMode.CREATOR_ONLY,
    TOKEN_PROGRAM_ID
  );

  // future activation -> 10% jup lock // 3 months cliff, linear over 33 months // 1,000,000 tokens
  const futureActivationCliffTime = activationTime.add(
    new BN(3 * 30 * 24 * 60 * 60)
  ); // 3 months
  const futureActivationCliffUnlockAmount = getAmountInLamports(
    83333.333333,
    6
  );
  const futureActivationAmountPerPeriod = getAmountInLamports(27777.777777, 6);
  const futureActivationVestingFrequency = new BN(2626560); // 1 month interval
  const futureActivationNumberOfPeriod = new BN(33); // 33 months

  await createVestingEscrowV2(
    connection,
    wallet,
    futureActivationRecipient,
    tokenAMint,
    false,
    activationTime,
    futureActivationCliffTime,
    futureActivationCliffUnlockAmount,
    futureActivationAmountPerPeriod,
    futureActivationVestingFrequency,
    futureActivationNumberOfPeriod,
    UpdateRecipientMode.CREATOR_ONLY,
    CancelMode.CREATOR_ONLY,
    TOKEN_PROGRAM_ID
  );

  // CEX -> 10% jup lock // unlocked // 1,000,000 tokens
  const cexCliffTime = activationTime.add(new BN(0)); // immediate vest
  const cexCliffUnlockAmount = getAmountInLamports(1000000, 6);
  const cexAmountPerPeriod = getAmountInLamports(0, 6);
  const cexVestingFrequency = new BN(0);
  const cexNumberOfPeriod = new BN(0);

  await createVestingEscrowV2(
    connection,
    wallet,
    cexRecipient,
    tokenAMint,
    false,
    activationTime,
    cexCliffTime,
    cexCliffUnlockAmount,
    cexAmountPerPeriod,
    cexVestingFrequency,
    cexNumberOfPeriod,
    UpdateRecipientMode.CREATOR_ONLY,
    CancelMode.CREATOR_ONLY,
    TOKEN_PROGRAM_ID
  );

  // advisor -> 5% jup lock // 12 months cliff, linear over 24 months // 500,000 tokens
  const advisorCliffTime = activationTime.add(new BN(12 * 30 * 24 * 60 * 60)); // 12 months
  const advisorCliffUnlockAmount = getAmountInLamports(166666.666666, 6);
  const advisorAmountPerPeriod = getAmountInLamports(13888.888888, 6);
  const advisorVestingFrequency = new BN(2626560); // 1 month interval
  const advisorNumberOfPeriod = new BN(24); // 24 months

  await createVestingEscrowV2(
    connection,
    wallet,
    advisorRecipient,
    tokenAMint,
    false,
    activationTime,
    advisorCliffTime,
    advisorCliffUnlockAmount,
    advisorAmountPerPeriod,
    advisorVestingFrequency,
    advisorNumberOfPeriod,
    UpdateRecipientMode.CREATOR_ONLY,
    CancelMode.CREATOR_ONLY,
    TOKEN_PROGRAM_ID
  );

  // community -> 5% jup lock // 20% on TGE, linear over 12 months // 500,000 tokens
  const communityCliffTime = activationTime.add(new BN(0)); // immediate vest
  const communityCliffUnlockAmount = getAmountInLamports(100000, 6);
  const communityAmountPerPeriod = getAmountInLamports(33333.333333, 6);
  const communityVestingFrequency = new BN(2626560); // 1 month interval
  const communityNumberOfPeriod = new BN(12); // 12 months

  await createVestingEscrowV2(
    connection,
    wallet,
    communityRecipient,
    tokenAMint,
    false,
    activationTime,
    communityCliffTime,
    communityCliffUnlockAmount,
    communityAmountPerPeriod,
    communityVestingFrequency,
    communityNumberOfPeriod,
    UpdateRecipientMode.CREATOR_ONLY,
    CancelMode.CREATOR_ONLY,
    TOKEN_PROGRAM_ID
  );

  // DEX -> 5% in the LP
  // create damm v2 balanced pool
  const POOL_CONFIG: DammV2PoolConfig = {
    tokenAMint: tokenAMint,
    tokenBMint: USDC_MINT,
    tokenADecimals: 6,
    tokenBDecimals: 6,

    tokenAAmount: 500000, // 5% of total token supply
    tokenBAmount: 10, // USDC

    initialPrice: 0.00002, // 0.00002 USDC per tokenA

    maxBaseFeeBps: 5000,
    minBaseFeeBps: 100,
    useDynamicFee: true,
    feeSchedulerMode: FeeSchedulerMode.Linear,
    numberOfPeriod: 10,
    totalDuration: 1000,

    hasAlphaVault: false,
    activationType: 1, // timestamp
    collectFeeMode: 1, // 0: both tokens, 1: quote token only
    activationPoint: activationTime,
    isLockLiquidity: false,
  };

  try {
    const poolResult = await createDammV2BalancedPool(
      connection,
      wallet,
      POOL_CONFIG
    );

    console.log(`Pool created successfully!`);
    console.log(`Pool: ${poolResult.pool.toString()}`);
    console.log(`Position: ${poolResult.position.toString()}`);
    console.log(`Position NFT: ${poolResult.positionNft.toString()}`);
    console.log(`Transaction signature: ${poolResult.signature}`);
  } catch (error) {
    console.error("Failed to create pool:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
