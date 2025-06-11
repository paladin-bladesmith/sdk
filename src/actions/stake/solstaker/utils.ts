import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

/**
 * Derives the sol staker stake PDA address
 * @param solStakerNativeStake The sol staker native stake account
 * @param config The stake config account public key  
 * @param programId The stake program ID
 * @returns The PDA address and bump seed
 */
export function findSolStakerStakePda(
  solStakerNativeStake: PublicKey,
  config: PublicKey, 
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("sol_staker_stake"),
      solStakerNativeStake.toBuffer(),
      config.toBuffer()
    ],
    programId
  );
} 