import { PublicKey } from "@solana/web3.js";
import { SEED_PREFIX_HOLDER_REWARDS, REWARDS_PROGRAM_ID } from "./constants";
import idl from "../idls/lockup.json";

/**
 * Retrieves instruction details from the program's IDL
 * @param name The instruction name to find
 * @returns The instruction details from the IDL
 */
export const getInstructionDetails = (name: string) => {
  const instruction = idl.instructions.find((ix: any) => ix.name === name);

  console.log("Instruction details:", instruction);

  if (!instruction) {
    throw new Error(`Instruction ${name} not found in IDL`);
  }
  return instruction;
};

/**
 * Function to derive the address of a holder rewards account
 * @param tokenAccountAddress The token account address
 * @param programId The program ID (defaults to REWARDS_PROGRAM_ID)
 * @returns The derived holder rewards address
 */
export function getHolderRewardsAddress(
  tokenAccountAddress: PublicKey, 
  programId: PublicKey = REWARDS_PROGRAM_ID
): PublicKey {
  const seeds = collectHolderRewardsSeeds(tokenAccountAddress);
  const [holderRewardsAddress] = PublicKey.findProgramAddressSync(seeds, programId);
  return holderRewardsAddress;
}

/**
 * Function to collect seeds for deriving the holder rewards address
 * @param tokenAccountAddress The token account address
 * @returns Array of buffers used as seeds
 */
export function collectHolderRewardsSeeds(tokenAccountAddress: PublicKey): Buffer[] {
  return [SEED_PREFIX_HOLDER_REWARDS, tokenAccountAddress.toBuffer()];
}

/**
 * Serializes instruction data with discriminator, metadata, and amount
 * @param discriminator The instruction discriminator
 * @param authority The authority public key
 * @param amount The amount as bigint
 * @returns Buffer containing serialized instruction data
 */
export function serializeInstructionData(
  discriminator: number,
  authority: PublicKey,
  amount: bigint
): Buffer {
  // Create discriminator buffer
  const discriminatorBuffer = Buffer.from([discriminator]);
  
  // Authority buffer (as metadata)
  // TODO: Right now, the tx sender who the tokens are being
  // locked on behalf of is constrained to being the authority
  // that's signing this transaction.
  // Determine if we need more flexibility here.
  const metadata = authority.toBuffer();
  
  // Convert amount to 8-byte little-endian buffer
  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(amount);

  return Buffer.concat([discriminatorBuffer, metadata, amountBuffer]);
} 