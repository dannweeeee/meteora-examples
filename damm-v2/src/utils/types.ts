import { ActivationType, FeeSchedulerMode } from "@meteora-ag/cp-amm-sdk";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export interface CreateTokenMintOptions {
  mintTokenAmount: string | number;
  decimals: number;
  computeUnitPriceMicroLamports: number;
}

export interface DammV2PoolConfig {
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  tokenADecimals: number;
  tokenBDecimals: number;
  tokenAAmount: number;
  tokenBAmount: number;
  initialPrice: number;
  maxBaseFeeBps: number;
  minBaseFeeBps: number;
  useDynamicFee: boolean;
  feeSchedulerMode: FeeSchedulerMode;
  numberOfPeriod: number;
  totalDuration: number;
  hasAlphaVault: boolean;
  activationType: ActivationType;
  collectFeeMode: number;
  activationPoint: BN;
  isLockLiquidity: boolean;
}

export interface PoolCreationResult {
  pool: PublicKey;
  position: PublicKey;
  positionNft: PublicKey;
  signature: string;
}
