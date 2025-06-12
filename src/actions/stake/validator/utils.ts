import { PublicKey, Connection } from "@solana/web3.js";
import { Buffer } from "buffer";

/**
 * Derives the validator stake PDA address using the same logic as the Rust program
 * @param validatorVote The validator vote account public key
 * @param config The stake config account public key  
 * @param programId The stake program ID
 * @returns The PDA address and bump seed
 */
export function findValidatorStakePda(
  validatorVote: PublicKey,
  config: PublicKey, 
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("validator_stake"),
      validatorVote.toBuffer(),
      config.toBuffer()
    ],
    programId
  );
}

/**
 * Gets the vote account public key for a given validator identity
 * @param connection Solana connection instance
 * @param validatorIdentity The validator's identity public key
 * @returns The validator's vote account public key, or null if not found
 */
export async function getValidatorVoteAccount(
  connection: Connection,
  validatorIdentity: PublicKey | string
): Promise<PublicKey | null> {
  const identityPubkey = typeof validatorIdentity === 'string' 
    ? new PublicKey(validatorIdentity) 
    : validatorIdentity;
  
  try {
    // Get all vote accounts from the cluster
    const voteAccounts = await connection.getVoteAccounts();
    
    // Search in both current and delinquent validators
    const allValidators = [...voteAccounts.current, ...voteAccounts.delinquent];
    
    // Find the validator with matching identity
    const validator = allValidators.find(
      validator => validator.nodePubkey === identityPubkey.toBase58()
    );
    
    if (validator) {
      return new PublicKey(validator.votePubkey);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching vote accounts:', error);
    throw new Error(`Failed to get vote account for validator ${identityPubkey.toBase58()}: ${error}`);
  }
}

/**
 * Gets both the vote account and withdraw authority for a given validator identity
 * @param connection Solana connection instance
 * @param validatorIdentity The validator's identity public key
 * @returns Object containing vote account pubkey and withdraw authority, or null if not found
 */
export async function getValidatorVoteAccountWithAuthority(
  connection: Connection,
  validatorIdentity: PublicKey | string
): Promise<{ voteAccount: PublicKey; withdrawAuthority: PublicKey } | null> {
  const voteAccountPubkey = await getValidatorVoteAccount(connection, validatorIdentity);
  
  if (!voteAccountPubkey) {
    return null;
  }
  
  try {
    // Fetch the vote account data to extract withdraw authority
    const accountInfo = await connection.getAccountInfo(voteAccountPubkey);
    
    if (!accountInfo || !accountInfo.data) {
      throw new Error('Vote account data not found');
    }
    
    // Extract withdraw authority from byte offset 36 (32 bytes for pubkey)
    const withdrawAuthorityBytes = accountInfo.data.slice(36, 68);
    const withdrawAuthority = new PublicKey(withdrawAuthorityBytes);
    
    return {
      voteAccount: voteAccountPubkey,
      withdrawAuthority
    };
  } catch (error) {
    const identityStr = typeof validatorIdentity === 'string' 
      ? validatorIdentity 
      : validatorIdentity.toBase58();
    console.error('Error fetching vote account data:', error);
    throw new Error(`Failed to get withdraw authority for validator ${identityStr}: ${error}`);
  }
}