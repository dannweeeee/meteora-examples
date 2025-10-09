import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Connection, PublicKey } from "@solana/web3.js";

async function main() {
  const referralProvider = new ReferralProvider(
    new Connection(
      "https://meteora-backend.rpcpool.com/f88bad7f-1d57-4bdc-8039-009f4e17997d"
    )
  );

  const referralPubkey = new PublicKey(
    "B576r2sCbA1qu1cHgyqmQCAoQ1MdgzwLVCD9AHnBmviX"
  );

  const tokenList =
    await referralProvider.getReferralTokenAccountsWithStrategyV2(
      referralPubkey.toString(),
      { type: "token-list" }
    );

  console.log(tokenList);
}

main();
