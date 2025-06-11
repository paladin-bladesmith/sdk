import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

/**
 * Derives the sol staker stake PDA address
 * @param solStakerStake The sol staker stake account
 * @param config The stake config account public key  
 * @param programId The stake program ID
 * @returns The PDA address and bump seed
 */
export function findSolStakerStakePda(
  solStakerStake: PublicKey,
  config: PublicKey, 
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("sol_staker_stake"),
      solStakerStake.toBuffer(),
      config.toBuffer()
    ],
    programId
  );
} 