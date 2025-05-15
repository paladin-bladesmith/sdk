import { 
  PublicKey, 
  ComputeBudgetProgram, 
  TransactionInstruction, 
  Keypair, 
  SystemProgram, 
  VersionedTransaction, 
  TransactionMessage,
  Connection
} from "@solana/web3.js";
import { 
  TOKEN_2022_PROGRAM_ID, 
  getAssociatedTokenAddressSync 
} from "@solana/spl-token";
import { 
  PROGRAM_ID, 
  TOKEN_MINT, 
  LOCKUP_ACCOUNT_SIZE, 
  LOCKUP_RENT_EXEMPTION,
  LOCKUP_POOL,
  EXTRA_ACCOUNT_METAS,
  HOLDER_REWARDS_POOL,
  RECIPIENT_REWARDS,
  REWARDS_PROGRAM_ID
} from "../../utils/constants";
import { 
  getHolderRewardsAddress, 
  serializeInstructionData,
  getInstructionDetails 
} from "../../utils/helpers";

/**
 * Creates a lockup instruction
 * @param params The lockup instruction parameters
 * @returns Transaction instruction for locking up tokens
 */
export function getLockupInstruction({
  lockupAuthority,
  lockupForPubkey,
  lockupAccount,
  amount,
}: {
  lockupAuthority: PublicKey;
  lockupForPubkey: PublicKey;
  lockupAccount: PublicKey;
  amount: number;
}): TransactionInstruction {
  // Get instruction details from IDL
  const instruction = getInstructionDetails("Lockup");
  
  // Serialize instruction data
  const data = serializeInstructionData(
    instruction.discriminant.value, // Discriminator for Lockup instruction
    lockupForPubkey,
    BigInt(amount)
  );

  // Derive escrow authority PDA
  const [escrowAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_authority")],
    PROGRAM_ID
  );

  // Get associated token accounts
  const escrowTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    escrowAuthority,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  const depositorTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    lockupAuthority,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  // Create account metas (instruction accounts)
  const keys = [
    // #1 Lockup Authority
    {
      pubkey: lockupAuthority,
      isSigner: false,
      isWritable: false
    },
    // #2 Deployer (Signer, actually the same as lockupAuthority)
    {
      pubkey: lockupAuthority,
      isSigner: true,
      isWritable: true
    },
    // #3 Depositor's Token Account
    {
      pubkey: depositorTokenAccount, 
      isSigner: false,
      isWritable: true
    },
    // #4 Lockup Pool
    {
      pubkey: LOCKUP_POOL,
      isSigner: false,
      isWritable: true
    },
    // #5 Lockup account
    {
      pubkey: lockupAccount,
      isSigner: true,
      isWritable: true
    },
    // #6 Escrow Authority
    {
      pubkey: escrowAuthority,
      isSigner: false,
      isWritable: false
    },
    // #7 Escrow Token Account
    {
      pubkey: escrowTokenAccount,
      isSigner: false,
      isWritable: true
    },
    // #8 Token Mint
    {
      pubkey: TOKEN_MINT,
      isSigner: false,
      isWritable: false
    },
    // #9 Token Program
    {
      pubkey: TOKEN_2022_PROGRAM_ID,
      isSigner: false,
      isWritable: false
    },
    // #10 Extra accounts for token 22 transfer
    {
      pubkey: EXTRA_ACCOUNT_METAS,
      isSigner: false,
      isWritable: false
    },
    // #11 Holder Rewards Pool
    {
      pubkey: HOLDER_REWARDS_POOL,
      isSigner: false, 
      isWritable: true
    },
    // #12 Holder Rewards Account
    {
      pubkey: getHolderRewardsAddress(depositorTokenAccount, REWARDS_PROGRAM_ID),
      isSigner: false, 
      isWritable: true,
    },
    // #13 Recipient Rewards
    {
      pubkey: RECIPIENT_REWARDS,
      isSigner: false,
      isWritable: true
    },
    // #14 Rewards Program
    {
      pubkey: REWARDS_PROGRAM_ID,
      isSigner: false,
      isWritable: false
    }
  ];

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data,
  });
}

/**
 * Creates a complete lockup transaction that can be signed and sent
 * @param account The wallet public key or address string
 * @param amount The amount of tokens to lock up
 * @param connection Solana connection instance
 * @returns A versioned transaction ready for signing
 */
export async function makeLockupTransaction(
  account: PublicKey | string,
  amount: number,
  connection: Connection,
  lockupForPubkey: PublicKey | string
): Promise<VersionedTransaction> {
  // Convert string to PublicKey if needed
  const pubkey = typeof account === 'string' ? new PublicKey(account) : account;
  const lockupPubkey = typeof lockupForPubkey === 'string' ? new PublicKey(lockupForPubkey) : lockupForPubkey;

  if (!pubkey) throw new Error("Account is required");
  console.log("wallet pubkey:", pubkey.toBase58());

  // Generate a new keypair for the lockup account
  const lockupAccount = Keypair.generate();

  // Create account instruction
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: pubkey,
    newAccountPubkey: lockupAccount.publicKey,
    lamports: LOCKUP_RENT_EXEMPTION,
    space: LOCKUP_ACCOUNT_SIZE,
    programId: PROGRAM_ID
  });

  // Get lockup instruction
  const lockupIx = getLockupInstruction({
    lockupAuthority: pubkey,
    lockupForPubkey: lockupPubkey,
    lockupAccount: lockupAccount.publicKey,
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
      createAccountIx,
      lockupIx
    ]
  }).compileToV0Message();

  console.log("Message V0 (base64):", Buffer.from(messageV0.serialize()).toString('base64'));

  console.log("working on local");

  // Create and sign transaction
  const tx = new VersionedTransaction(messageV0);
  tx.sign([lockupAccount]);
  
  return tx;
} 