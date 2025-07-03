import { 
  PublicKey, 
  ComputeBudgetProgram, 
  TransactionInstruction, 
  VersionedTransaction, 
  TransactionMessage, 
  Connection,
} from "@solana/web3.js";
import { 
  STAKE_PROGRAM_ID, 
  STAKE_CONFIG, 
  STAKE_VAULT,
  STAKE_VAULT_HOLDER_REWARDS,
  STAKE_VAULT_AUTHORITY,
  TOKEN_MINT,
  EXTRA_ACCOUNT_METAS,
  HOLDER_REWARDS_POOL,
  REWARDS_PROGRAM_ID
} from "../../../utils/constants";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Buffer } from "buffer";
import { findValidatorStakePda, getValidatorVoteAccountWithAuthority } from "./utils";
import { getStakeInstructionDetails, getHolderRewardsAddress } from "../../../utils/helpers";

/**
 * Creates an unstake instruction for validator staking
 * @param params The unstake instruction parameters
 * @returns Transaction instruction for unstaking validator tokens
 */
function getValidatorUnstakeInstruction({
  validatorStakePubkey,
  stakeAuthority,
  destinationTokenAccount,
  amount,
}: {
  validatorStakePubkey: PublicKey;
  stakeAuthority: PublicKey;
  destinationTokenAccount: PublicKey;
  amount: number;
}): TransactionInstruction {
  // Get instruction details from IDL
  const instruction = getStakeInstructionDetails("UnstakeTokens");
  
  // Create the instruction data buffer
  // UnstakeTokens has discriminant value and takes a u64 amount argument
  const discriminatorBuffer = Buffer.from([instruction.discriminant.value]);

  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(BigInt(amount));

  const data = Buffer.concat([discriminatorBuffer, amountBuffer]);

  // Derive vault authority PDA
  // const [vaultAuthority] = findVaultAuthorityPda(STAKE_VAULT, STAKE_PROGRAM_ID);

  // Define account metas based on IDL structure
  const keys = [
    { pubkey: STAKE_CONFIG, isSigner: false, isWritable: true }, // config
    { pubkey: validatorStakePubkey, isSigner: false, isWritable: true }, // stake
    { pubkey: stakeAuthority, isSigner: true, isWritable: true }, // stakeAuthority
    { pubkey: STAKE_VAULT, isSigner: false, isWritable: true }, // vault
    { pubkey: STAKE_VAULT_AUTHORITY, isSigner: false, isWritable: true }, // vaultAuthority
    { pubkey: STAKE_VAULT_HOLDER_REWARDS, isSigner: false, isWritable: true }, // vaultHolderRewards
    { pubkey: TOKEN_MINT, isSigner: false, isWritable: false }, // mint
    { pubkey: destinationTokenAccount, isSigner: false, isWritable: true }, // destinationTokenAccount
    { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // tokenProgram
    // #9-13 Extra accounts for token 22 transfer
    { pubkey: EXTRA_ACCOUNT_METAS, isSigner: false, isWritable: false },
    // #10 Holder Rewards Pool
    { pubkey: HOLDER_REWARDS_POOL, isSigner: false, isWritable: true },
    // #11 Holder Rewards Account
    { pubkey: STAKE_VAULT_HOLDER_REWARDS, isSigner: false, isWritable: true },
    // #12 Destination holder rewards account
    {
      pubkey: getHolderRewardsAddress(destinationTokenAccount, REWARDS_PROGRAM_ID),
      isSigner: false, 
      isWritable: true,
    },
    // #13 Rewards Program
    { pubkey: REWARDS_PROGRAM_ID, isSigner: false, isWritable: false }
  ];

  return new TransactionInstruction({
    keys,
    programId: STAKE_PROGRAM_ID,
    data,
  });
}

/**
 * Creates a complete unstake transaction for validator staking
 * @param account The wallet public key or address string
 * @param validatorIdentityKey The validator's identity public key (will be used to lookup vote account)
 * @param amount The amount of tokens to unstake
 * @param connection Solana connection instance
 * @returns A versioned transaction ready for signing
 */
export async function makeValidatorUnstakeTransaction(
  account: PublicKey | string,
  validatorIdentityKey: PublicKey | string,
  amount: number,
  connection: Connection
): Promise<VersionedTransaction> {
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
  
  // Get the destination token account (PAL ATA for the user)
  const destinationTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    userPubkey,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  // Create the unstake instruction
  const unstakeIx = getValidatorUnstakeInstruction({
    validatorStakePubkey: validatorStakePda,
    stakeAuthority: withdrawAuthority,
    destinationTokenAccount,
    amount,
  });
  
  // Add compute budget instruction
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
    instructions: [computeBudgetIx, addPriorityFee, unstakeIx],
  }).compileToV0Message();
  
  // Create the versioned transaction
  const tx = new VersionedTransaction(messageV0);
  
  return tx;
}