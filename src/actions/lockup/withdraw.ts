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
    LOCKUP_PROGRAM_ID, 
    TOKEN_MINT,
    EXTRA_ACCOUNT_METAS,
    HOLDER_REWARDS_POOL,
    RECIPIENT_REWARDS,
    REWARDS_PROGRAM_ID
  } from "../../utils/constants";
  import { 
    getHolderRewardsAddress,
    getLockupInstructionDetails 
  } from "../../utils/helpers";
  import { Buffer } from "buffer";
  
  /**
   * Creates a withdraw instruction for the lockup program
   * @param params The withdraw instruction parameters
   * @returns Transaction instruction for withdrawing tokens
   */
  export function getWithdrawInstruction({
    lockupAuthority,
    lockupAccount,
    lamportDestination,
    tokenDestination,
  }: {
    lockupAuthority: PublicKey;
    lockupAccount: PublicKey;
    lamportDestination: PublicKey;
    tokenDestination: PublicKey;
  }): TransactionInstruction {
    // Get instruction details from IDL
    const instruction = getLockupInstructionDetails("Withdraw");
    
    // Serialize instruction data - Withdraw only needs discriminant
    const data = Buffer.from([instruction.discriminant.value]);
  
    // Derive escrow authority PDA
    const [escrowAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_authority")],
      LOCKUP_PROGRAM_ID
    );
  
    // Get escrow token account
    const escrowTokenAccount = getAssociatedTokenAddressSync(
      TOKEN_MINT,
      escrowAuthority,
      true,
      TOKEN_2022_PROGRAM_ID
    );
  
    // Create account metas (instruction accounts)
    const keys = [
      // #1 Lockup Authority (Signer)
      {
        pubkey: lockupAuthority,
        isSigner: true,
        isWritable: false
      },
      // #2 Lamport Destination
      {
        pubkey: lamportDestination,
        isSigner: false,
        isWritable: true
      },
      // #3 Token Destination
      {
        pubkey: tokenDestination,
        isSigner: false,
        isWritable: true
      },
      // #4 Lockup account
      {
        pubkey: lockupAccount,
        isSigner: false,
        isWritable: true
      },
      // #5 Escrow Authority
      {
        pubkey: escrowAuthority,
        isSigner: false,
        isWritable: false
      },
      // #6 Escrow Token Account
      {
        pubkey: escrowTokenAccount,
        isSigner: false,
        isWritable: true
      },
      // #7 Token Mint
      {
        pubkey: TOKEN_MINT,
        isSigner: false,
        isWritable: false
      },
      // #8 Token Program
      {
        pubkey: TOKEN_2022_PROGRAM_ID,
        isSigner: false,
        isWritable: false
      },
      // #9-13 Extra accounts for token 22 transfer
      {
        pubkey: EXTRA_ACCOUNT_METAS,
        isSigner: false,
        isWritable: false
      },
      // #10 Holder Rewards Pool
      {
        pubkey: HOLDER_REWARDS_POOL,
        isSigner: false, 
        isWritable: true
      },
      // #11 Holder Rewards Account
      {
        pubkey: getHolderRewardsAddress(tokenDestination, REWARDS_PROGRAM_ID),
        isSigner: false, 
        isWritable: true,
      },
      // #12 Recipient Rewards
      {
        pubkey: RECIPIENT_REWARDS,
        isSigner: false,
        isWritable: true
      },
      // #13 Rewards Program
      {
        pubkey: REWARDS_PROGRAM_ID,
        isSigner: false,
        isWritable: false
      }
    ];
  
    return new TransactionInstruction({
      programId: LOCKUP_PROGRAM_ID,
      keys,
      data,
    });
  }
  
  /**
   * Creates a complete withdraw transaction that can be signed and sent
   * @param account The wallet public key or address string
   * @param lockupAccount The lockup account to withdraw from
   * @param connection Solana connection instance
   * @returns A versioned transaction ready for signing
   * 
   * NOTE: In the SDK we assume the wallet initiating the withdraw
   * is the lockup authority.
   */
  export async function makeWithdrawTransaction(
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
  
    // Get the token destination (ATA for the wallet)
    const tokenDestination = getAssociatedTokenAddressSync(
      TOKEN_MINT,
      pubkey,
      true,
      TOKEN_2022_PROGRAM_ID
    );
  
    // Get withdraw instruction
    const withdrawIx = getWithdrawInstruction({
      lockupAuthority: pubkey,
      lockupAccount: lockupAccountPubkey,
      lamportDestination: pubkey, // Send rent lamports back to the wallet
      tokenDestination
    });
  
    // Add compute budget instructions
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 600000, // Withdraw is more complex than unlock but less than lock
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
        withdrawIx
      ]
    }).compileToV0Message();
  
    // Create transaction
    const tx = new VersionedTransaction(messageV0);
    
    return tx;
}