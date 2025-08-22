import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import {
  LockClient,
  UpdateRecipientMode,
  CancelMode,
} from "@meteora-ag/met-lock-sdk";
import BN from "bn.js";
import { Wallet } from "@coral-xyz/anchor";

export async function createVestingEscrowV2(
  connection: Connection,
  wallet: Wallet,
  recipient: PublicKey,
  tokenMint: PublicKey,
  isSenderMultiSig: boolean,
  vestingStartTime: BN,
  cliffTime: BN,
  cliffUnlockAmount: BN,
  amountPerPeriod: BN,
  frequency: BN,
  numberOfPeriod: BN,
  updateRecipientMode: UpdateRecipientMode,
  cancelMode: CancelMode,
  tokenProgram: PublicKey
) {
  try {
    console.log("Starting vesting escrow creation...");
    console.log("Recipient:", recipient.toString());

    const client = new LockClient(connection, "confirmed");

    const base = Keypair.generate();

    const createVestingEscrowV2Param = {
      base: base.publicKey,
      sender: wallet.publicKey,
      isSenderMultiSig,
      payer: wallet.publicKey,
      tokenMint,
      vestingStartTime,
      cliffTime,
      frequency,
      cliffUnlockAmount,
      amountPerPeriod,
      numberOfPeriod,
      recipient,
      updateRecipientMode,
      cancelMode,
      tokenProgram,
    };

    console.log("Creating vesting escrow transaction...");
    const transaction = await client.createVestingEscrowV2(
      createVestingEscrowV2Param
    );
    console.log("Transaction created successfully");

    console.log("Sending and confirming transaction...");
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.payer, base],
      {
        commitment: "confirmed",
        skipPreflight: false,
        maxRetries: 3,
      }
    );
    console.log("Transaction confirmed!");
    console.log(
      `Vesting escrow created: https://solscan.io/tx/${signature}?cluster=devnet`
    );
    console.log("Vesting escrow creation completed successfully");
  } catch (error) {
    console.error("Failed to create vesting escrow:", error);
    console.log("Error details:", JSON.stringify(error, null, 2));
  }
}
