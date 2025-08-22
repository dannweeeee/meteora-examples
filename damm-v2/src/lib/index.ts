import { BN, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  CpAmm,
  getBaseFeeParams,
  getDynamicFeeParams,
  getSqrtPriceFromPrice,
  getPriceFromSqrtPrice,
  MAX_SQRT_PRICE,
  PoolFeesParams,
  MIN_SQRT_PRICE,
} from "@meteora-ag/cp-amm-sdk";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAmountInLamports } from "../helpers/token";
import { DammV2PoolConfig, PoolCreationResult } from "../utils/types";

export async function createDammV2BalancedPool(
  connection: Connection,
  wallet: Wallet,
  config: DammV2PoolConfig
): Promise<PoolCreationResult> {
  try {
    const cpAmm = new CpAmm(connection);

    const tokenAAmountInLamports = getAmountInLamports(
      config.tokenAAmount,
      config.tokenADecimals
    );

    const tokenBAmountInLamports = getAmountInLamports(
      config.tokenBAmount,
      config.tokenBDecimals
    );

    const initSqrtPrice = getSqrtPriceFromPrice(
      config.initialPrice.toString(),
      config.tokenADecimals,
      config.tokenBDecimals
    );

    const liquidityDelta = cpAmm.getLiquidityDelta({
      maxAmountTokenA: tokenAAmountInLamports,
      maxAmountTokenB: tokenBAmountInLamports,
      sqrtPrice: initSqrtPrice,
      sqrtMinPrice: MIN_SQRT_PRICE,
      sqrtMaxPrice: MAX_SQRT_PRICE,
    });

    console.log(`Using base token amount: ${config.tokenAAmount} tokens`);
    console.log(
      `Initial price: ${getPriceFromSqrtPrice(
        initSqrtPrice,
        config.tokenADecimals,
        config.tokenBDecimals
      )}`
    );

    const baseFeeParams = getBaseFeeParams(
      config.maxBaseFeeBps,
      config.minBaseFeeBps,
      config.feeSchedulerMode,
      config.numberOfPeriod,
      config.totalDuration
    );

    const dynamicFeeParams = config.useDynamicFee
      ? getDynamicFeeParams(config.minBaseFeeBps)
      : null;

    const poolFees: PoolFeesParams = {
      baseFee: baseFeeParams,
      padding: [],
      dynamicFee: dynamicFeeParams,
    };

    const positionNft = Keypair.generate();

    const {
      tx: createPoolTx,
      pool,
      position,
    } = await cpAmm.createCustomPool({
      payer: wallet.publicKey,
      creator: wallet.publicKey,
      positionNft: positionNft.publicKey,
      tokenAMint: config.tokenAMint,
      tokenBMint: config.tokenBMint,
      tokenAAmount: tokenAAmountInLamports,
      tokenBAmount: tokenBAmountInLamports,
      sqrtMinPrice: MIN_SQRT_PRICE,
      sqrtMaxPrice: MAX_SQRT_PRICE,
      liquidityDelta: liquidityDelta,
      initSqrtPrice: initSqrtPrice,
      poolFees: poolFees,
      hasAlphaVault: config.hasAlphaVault,
      activationType: config.activationType,
      collectFeeMode: config.collectFeeMode,
      activationPoint: config.activationPoint,
      tokenAProgram: TOKEN_PROGRAM_ID,
      tokenBProgram: TOKEN_PROGRAM_ID,
      isLockLiquidity: config.isLockLiquidity,
    });

    console.log(`Pool address: ${pool.toString()}`);
    console.log(`Position address: ${position.toString()}`);

    console.log("\nSending create pool transaction...");
    const signature = await sendAndConfirmTransaction(
      connection,
      createPoolTx,
      [wallet.payer, positionNft],
      {
        commitment: "confirmed",
        skipPreflight: false,
      }
    );

    console.log(`Transaction signature: ${signature}`);
    console.log(`Pool: ${pool.toString()}`);
    console.log(`Position: ${position.toString()}`);
    console.log(`Position NFT: ${positionNft.publicKey.toString()}`);

    return {
      pool,
      position,
      positionNft: positionNft.publicKey,
      signature,
    };
  } catch (error) {
    console.error("Failed to create pool:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    throw error;
  }
}
