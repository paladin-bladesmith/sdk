import { 
  PublicKey, 
  ComputeBudgetProgram, 
  TransactionInstruction, 
  VersionedTransaction, 
  TransactionMessage, 
  Connection
} from "@solana/web3.js";
import { 
  TOKEN_2022_PROGRAM_ID, 
  getAssociatedTokenAddressSync 
} from "@solana/spl-token";
import { 
  STAKE_PROGRAM_ID, 
  STAKE_CONFIG, 
  STAKE_VAULT,
  STAKE_VAULT_HOLDER_REWARDS,
  TOKEN_MINT,
  EXTRA_ACCOUNT_METAS,
  HOLDER_REWARDS_POOL,
  REWARDS_PROGRAM_ID
} from "../../../utils/constants";
import { 
  getStakeInstructionDetails, 
  getHolderRewardsAddress 
} from "../../../utils/helpers";
import { findValidatorStakePda, getValidatorVoteAccountWithAuthority } from "./utils";
import { Buffer } from "buffer";

/**
 * Creates a stake instruction for validator staking
 * @param params The stake instruction parameters
 * @returns Transaction instruction for staking to a validator
 */
export function getValidatorStakeTokensInstruction({
  userAuthority,
  validatorStakePubkey,
  validatorStakeAuthority,
  sourceTokenAccount,
  amount,
}: {
  userAuthority: PublicKey;
  validatorStakePubkey: PublicKey;
  validatorStakeAuthority: PublicKey;
  sourceTokenAccount: PublicKey;
  amount: number;
}): TransactionInstruction {
  // Get instruction details from IDL
  const instruction = getStakeInstructionDetails("ValidatorStakeTokens");
  
  // Create the instruction data buffer
  // ValidatorStakeTokens has discriminant value 2 and takes a u64 amount argument
  const discriminatorBuffer = Buffer.from([instruction.discriminant.value]);
  
  // Convert amount to 8-byte buffer (little-endian u64)
  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(BigInt(amount));
  
  const data = Buffer.concat([discriminatorBuffer, amountBuffer]);

  // Define account metas based on IDL structure
  const keys = [
    { pubkey: STAKE_CONFIG, isSigner: false, isWritable: true }, // config
    { pubkey: validatorStakePubkey, isSigner: false, isWritable: true }, // validatorStake
    { pubkey: validatorStakeAuthority, isSigner: false, isWritable: true }, // validatorStakeAuthority 
    { pubkey: sourceTokenAccount, isSigner: false, isWritable: true }, // sourceTokenAccount
    { pubkey: userAuthority, isSigner: true, isWritable: false }, // sourceTokenAccountAuthority
    { pubkey: TOKEN_MINT, isSigner: false, isWritable: false }, // mint
    { pubkey: STAKE_VAULT, isSigner: false, isWritable: true }, // vault
    { pubkey: STAKE_VAULT_HOLDER_REWARDS, isSigner: false, isWritable: true }, // vaultHolderRewards
    { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // tokenProgram
    // #9-13 Extra accounts for token 22 transfer
    { pubkey: EXTRA_ACCOUNT_METAS, isSigner: false, isWritable: false },
    // #10 Holder Rewards Pool
    { pubkey: HOLDER_REWARDS_POOL, isSigner: false, isWritable: true },
    // #11 Source holder rewards account
    {
      pubkey: getHolderRewardsAddress(sourceTokenAccount, REWARDS_PROGRAM_ID),
      isSigner: false, 
      isWritable: true,
    },
    // #12 Destination holder rewards account
    { pubkey: STAKE_VAULT_HOLDER_REWARDS, isSigner: false, isWritable: true },
    // #13 Rewards Program
    { pubkey: REWARDS_PROGRAM_ID, isSigner: false, isWritable: false }
  ];

  return new TransactionInstruction({
    programId: STAKE_PROGRAM_ID,
    keys,
    data,
  });
}

/**
 * Creates a complete stake transaction for validator staking
 * @param account The wallet public key or address string
 * @param validatorIdentityKey The validator's identity public key
 * @param amount The amount to stake
 * @param connection Solana connection instance
 * @returns A versioned transaction ready for signing
 */
export async function makeValidatorStakeTokensTransaction(
  account: PublicKey | string,
  validatorIdentityKey: PublicKey | string,
  amount: number,
  connection: Connection
): Promise<VersionedTransaction> {
  // Convert string to PublicKey if needed
  const userPubkey = typeof account === 'string' ? new PublicKey(account) : account;
  const validatorIdentity = typeof validatorIdentityKey === 'string' 
    ? new PublicKey(validatorIdentityKey) 
    : validatorIdentityKey;
  
  if (!userPubkey) throw new Error("Account is required");
  
  // Get the vote account and withdraw authority from the validator identity
  const voteAccountInfo = await getValidatorVoteAccountWithAuthority(connection, validatorIdentity);
  if (!voteAccountInfo) {
    throw new Error(`Could not find vote account for validator identity: ${validatorIdentity.toBase58()}`);
  }
  
  const { voteAccount: validatorVotePubkey, withdrawAuthority } = voteAccountInfo;
  
  // Derive the validator stake PDA using the same seeds as the initializeValidatorStake
  const [validatorStakePda] = findValidatorStakePda(
    validatorVotePubkey,
    STAKE_CONFIG,
    STAKE_PROGRAM_ID
  );
  
  // Get the user's PAL token account
  const sourceTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    userPubkey,
    true,
    TOKEN_2022_PROGRAM_ID
  );
  
  // Create the stake instruction
  const stakeIx = getValidatorStakeTokensInstruction({
    userAuthority: userPubkey,
    validatorStakePubkey: validatorStakePda,
    validatorStakeAuthority: withdrawAuthority,
    sourceTokenAccount,
    amount,
  });
  
  // Add compute budget instructions
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 400_000
  });

  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000,
  });
  
  // Get the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  
  // Create a transaction message
  const messageV0 = new TransactionMessage({
    payerKey: userPubkey,
    recentBlockhash: blockhash,
    instructions: [computeBudgetIx, addPriorityFee, stakeIx]
  }).compileToV0Message();
  
  // Create the versioned transaction
  const tx = new VersionedTransaction(messageV0);
  
  return tx;
} 