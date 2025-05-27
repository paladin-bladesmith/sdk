import { 
  PublicKey, 
  ComputeBudgetProgram, 
  TransactionInstruction, 
  VersionedTransaction, 
  TransactionMessage,
  Connection
} from "@solana/web3.js";
import { 
  PROGRAM_ID, 
  LOCKUP_POOL
} from "../../utils/constants";
import { 
  getInstructionDetails 
} from "../../utils/helpers";
import { Buffer } from "buffer";

/**
 * Creates an unlock instruction
 * @param params The unlock instruction parameters
 * @returns Transaction instruction for unlocking tokens
 */
export function getUnlockInstruction({
  lockupAuthority,
  lockupAccount,
  lockupPool,
}: {
  lockupAuthority: PublicKey;
  lockupAccount: PublicKey;
  lockupPool: PublicKey;
}): TransactionInstruction {
  // Get instruction details from IDL
  const instruction = getInstructionDetails("Unlock");
  
  // Serialize instruction data
  const data = Buffer.from([instruction.discriminant.value]);

  // Create account metas (instruction accounts)
  const keys = [
    // #1 Lockup Authority (Signer)
    {
      pubkey: lockupAuthority,
      isSigner: true,
      isWritable: false
    },
    // #2 Lockup Pool
    {
      pubkey: lockupPool,
      isSigner: false,
      isWritable: true
    },
    // #3 Lockup account
    {
      pubkey: lockupAccount,
      isSigner: false,
      isWritable: true
    }
  ];

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data,
  });
}

/**
 * Creates a complete unlock transaction that can be signed and sent
 * @param account The wallet public key or address string
 * @param lockupAccount The lockup account to unlock
 * @param connection Solana connection instance
 * @returns A versioned transaction ready for signing
 */
export async function makeUnlockTransaction(
  account: PublicKey | string,
  lockupAccount: PublicKey | string,
  connection: Connection
): Promise<VersionedTransaction> {
  // Convert string to PublicKey if needed
  const pubkey = typeof account === 'string' ? new PublicKey(account) : account;
  const lockupAccountPubkey = typeof lockupAccount === 'string' ? new PublicKey(lockupAccount) : lockupAccount;

  if (!pubkey) throw new Error("Account is required");
  if (!lockupAccountPubkey) throw new Error("Lockup account is required");
  
  console.log("Wallet pubkey:", pubkey.toBase58());
  console.log("Lockup account:", lockupAccountPubkey.toBase58());

  // Get unlock instruction
  const unlockIx = getUnlockInstruction({
    lockupAuthority: pubkey,
    lockupAccount: lockupAccountPubkey,
    lockupPool: LOCKUP_POOL,
  });

  // Add compute budget instructions
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 400000, // Lower than lockup as unlock is simpler
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
      unlockIx
    ]
  }).compileToV0Message();

  // Create transaction
  const tx = new VersionedTransaction(messageV0);
  
  return tx;
} 