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
  TOKEN_MINT,
} from "../../../utils/constants";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Buffer } from "buffer";
import { findSolStakerStakePda } from "./utils";
import { findVaultAuthorityPda } from "../utils";
import { getStakeInstructionDetails } from "../../../utils/helpers";

/**
 * Creates an unstake instruction for sol staker staking
 * @param params The unstake instruction parameters
 * @returns Transaction instruction for unstaking sol staker tokens
 */
function getSolStakerUnstakeInstruction({
  solStakerStakePubkey,
  stakeAuthority,
  destinationTokenAccount,
  amount,
}: {
  solStakerStakePubkey: PublicKey;
  stakeAuthority: PublicKey;
  destinationTokenAccount: PublicKey;
  amount: bigint;
}): TransactionInstruction {
  // Get instruction details from IDL
  const instruction = getStakeInstructionDetails("UnstakeTokens");
  
  // Create the instruction buffer with the discriminant value from IDL and amount
  const discriminantBuffer = Buffer.from([instruction.discriminant.value]);
  const amountBuffer = Buffer.allocUnsafe(8);
  amountBuffer.writeBigUInt64LE(amount);
  const data = Buffer.concat([discriminantBuffer, amountBuffer]);

  // Derive vault authority PDA
  const [vaultAuthority] = findVaultAuthorityPda(STAKE_VAULT, STAKE_PROGRAM_ID);

  // Define account metas based on IDL structure
  const keys = [
    { pubkey: STAKE_CONFIG, isSigner: false, isWritable: true }, // config
    { pubkey: solStakerStakePubkey, isSigner: false, isWritable: true }, // stake
    { pubkey: stakeAuthority, isSigner: true, isWritable: true }, // stakeAuthority
    { pubkey: STAKE_VAULT, isSigner: false, isWritable: true }, // vault
    { pubkey: vaultAuthority, isSigner: false, isWritable: true }, // vaultAuthority
    { pubkey: STAKE_VAULT_HOLDER_REWARDS, isSigner: false, isWritable: true }, // vaultHolderRewards
    { pubkey: TOKEN_MINT, isSigner: false, isWritable: false }, // mint
    { pubkey: destinationTokenAccount, isSigner: false, isWritable: true }, // destinationTokenAccount
    { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // tokenProgram
  ];

  return new TransactionInstruction({
    keys,
    programId: STAKE_PROGRAM_ID,
    data,
  });
}

/**
 * Creates a complete unstake transaction for sol staker staking
 * @param account The wallet public key or address string
 * @param solStakerStakeKey The SOL staker stake account public key
 * @param amount The amount of tokens to unstake
 * @param connection Solana connection instance
 * @returns A versioned transaction ready for signing
 */
export async function makeSolStakerUnstakeTransaction(
  account: PublicKey | string,
  solStakerStakeKey: PublicKey | string,
  amount: bigint,
  connection: Connection
): Promise<VersionedTransaction> {
  // Convert string to PublicKey if necessary
  const pubkey = typeof account === 'string' ? new PublicKey(account) : account;
  const solStakerStake = typeof solStakerStakeKey === 'string' 
    ? new PublicKey(solStakerStakeKey) 
    : solStakerStakeKey;
  
  // Derive the sol staker stake PDA using the same pattern as validator staking
  const [solStakerStakePda] = findSolStakerStakePda(
    solStakerStake,
    STAKE_CONFIG,
    STAKE_PROGRAM_ID
  );
  
  // Get the destination token account (PAL ATA for the user)
  const destinationTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    pubkey,
    true,
    TOKEN_2022_PROGRAM_ID
  );
  
  // Add compute budget instruction
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 300_000
  });

  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000,
  });
  
  // Get the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();

  const unstakeIx = getSolStakerUnstakeInstruction({
    solStakerStakePubkey: solStakerStakePda,
    stakeAuthority: pubkey,
    destinationTokenAccount,
    amount,
  });
  
  const instructions = [computeBudgetIx, addPriorityFee, unstakeIx];
  
  // Create a transaction message
  const messageV0 = new TransactionMessage({
    payerKey: pubkey,
    recentBlockhash: blockhash,
    instructions
  }).compileToV0Message();
  
  // Create the versioned transaction
  const tx = new VersionedTransaction(messageV0);
  
  return tx;
}