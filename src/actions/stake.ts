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
  TOKEN_MINT,
  STAKE_PROGRAM_ID,
  STAKE_CONFIG,
  STAKE_VAULT,
  STAKE_VAULT_HOLDER_REWARDS
} from "../utils/constants";

/**
 * Get validator stake account PDA
 * @param validatorVote The validator vote account
 * @returns The validator stake account public key
 */
function getValidatorStakeAccount(validatorVote: PublicKey): PublicKey {
  // Placeholder - will need to implement actual derivation logic
//   return PublicKey.findProgramAddressSync(
//     [Buffer.from("validator_stake"), validatorVote.toBuffer()],
//     STAKE_PROGRAM_ID
//   )[0];
}

/**
 * Get validator stake authority PDA
 * @param validatorStake The validator stake account
 * @returns The validator stake authority public key
 */
function getValidatorStakeAuthority(validatorStake: PublicKey): PublicKey {
  // Placeholder - will need to implement actual derivation logic
//   return PublicKey.findProgramAddressSync(
//     [Buffer.from("validator_authority"), validatorStake.toBuffer()],
//     STAKE_PROGRAM_ID
//   )[0];
}

/**
 * Creates a validator stake instruction
 * @param params The stake instruction parameters
 * @returns Transaction instruction for staking tokens
 */
export function getValidatorStakeInstruction({
  sourceWallet,
  validatorVote,
  amount,
}: {
  sourceWallet: PublicKey;
  validatorVote: PublicKey;
  amount: number;
}): TransactionInstruction {
  // For ValidatorStakeTokens, we only need to serialize the discriminant (2) and amount
  const data = Buffer.alloc(9); // 1 byte for discriminant + 8 bytes for u64 amount
  
  // Write discriminant value (2 for ValidatorStakeTokens)
  data.writeUInt8(2, 0);
  
  // Write the amount as a little-endian u64
  const amountBigInt = BigInt(amount);
  data.writeBigUInt64LE(amountBigInt, 1);

  // Get validator stake account and authority
  const validatorStake = getValidatorStakeAccount(validatorVote);
  const validatorStakeAuthority = getValidatorStakeAuthority(validatorStake);

  // Get source token account
  const sourceTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    sourceWallet,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  // Create account metas (instruction accounts)
  const keys = [
    // #1 Stake config
    {
      pubkey: STAKE_CONFIG,
      isSigner: false,
      isWritable: true
    },
    // #2 Validator stake account
    {
      pubkey: validatorStake,
      isSigner: false,
      isWritable: true
    },
    // #3 Validator stake authority
    {
      pubkey: validatorStakeAuthority,
      isSigner: false,
      isWritable: true
    },
    // #4 Source token account
    {
      pubkey: sourceTokenAccount,
      isSigner: false,
      isWritable: true
    },
    // #5 Source token account authority (signer)
    {
      pubkey: sourceWallet,
      isSigner: true,
      isWritable: false
    },
    // #6 Token mint
    {
      pubkey: TOKEN_MINT,
      isSigner: false,
      isWritable: false
    },
    // #7 Stake vault
    {
      pubkey: STAKE_VAULT,
      isSigner: false,
      isWritable: true
    },
    // #8 Vault holder rewards
    {
      pubkey: STAKE_VAULT_HOLDER_REWARDS,
      isSigner: false,
      isWritable: true
    },
    // #9 Token program
    {
      pubkey: TOKEN_2022_PROGRAM_ID,
      isSigner: false,
      isWritable: false
    }
  ];

  return new TransactionInstruction({
    programId: STAKE_PROGRAM_ID,
    keys,
    data,
  });
}

/**
 * Creates a complete validator stake transaction that can be signed and sent
 * @param account The wallet public key or address string
 * @param amount The amount of tokens to stake
 * @param validatorVote The validator vote account
 * @param connection Solana connection instance
 * @returns A versioned transaction ready for signing
 */
export async function makeValidatorStakeTransaction(
  account: PublicKey | string,
  amount: number,
  validatorVote: PublicKey,
  connection: Connection
): Promise<VersionedTransaction> {
  // Convert string to PublicKey if needed
  const pubkey = typeof account === 'string' ? new PublicKey(account) : account;

  if (!pubkey) throw new Error("Account is required");
  if (!validatorVote) throw new Error("Validator vote account is required");
  console.log("wallet pubkey:", pubkey.toBase58());
  console.log("validator vote:", validatorVote.toBase58());

  // Get validator stake instruction
  const stakeIx = getValidatorStakeInstruction({
    sourceWallet: pubkey,
    validatorVote,
    amount,
  });

  // Add compute budget instructions
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 1400000,
  });
   
  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000,
  });

  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();

  // Create versioned transaction
  const messageV0 = new TransactionMessage({
    payerKey: pubkey,
    recentBlockhash: blockhash,
    instructions: [
      modifyComputeUnits,
      addPriorityFee,
      stakeIx
    ]
  }).compileToV0Message();

  // Create transaction
  const tx = new VersionedTransaction(messageV0);
  
  return tx;
} 