import { PublicKey } from "@solana/web3.js";
import { SEED_PREFIX_HOLDER_REWARDS, REWARDS_PROGRAM_ID } from "./constants";
import lockupIdl from "../idls/lockup.json";
import stakeIdl from "../idls/stake.json";
import { Buffer } from "buffer";

/**
 * Retrieves instruction details from the program's IDL
 * @param name The instruction name to find
 * @returns The instruction details from the IDL
 */
export const getInstructionDetails = (name: string) => {
  const instruction = lockupIdl.instructions.find((ix: any) => ix.name === name);

  console.log("Instruction details:", instruction);

  if (!instruction) {
    throw new Error(`Instruction ${name} not found in IDL`);
  }
  return instruction;
};

/**
 * Retrieves stake instruction details from the stake program's IDL
 * @param name The instruction name to find
 * @returns The instruction details from the stake IDL
 */
export const getStakeInstructionDetails = (name: string) => {
  const instruction = stakeIdl.instructions.find((ix: any) => ix.name === name);

  console.log("Stake instruction details:", instruction);

  if (!instruction) {
    throw new Error(`Instruction ${name} not found in stake IDL`);
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
 * @param lockupForPubkey The pubkey to lock PAL for
 * @param amount The amount as bigint
 * @returns Buffer containing serialized instruction data
 */
export function serializeInstructionData(
  discriminator: number,
  lockupForPubkey: PublicKey,
  amount: bigint
): Buffer {
  // Create discriminator buffer
  const discriminatorBuffer = Buffer.from([discriminator]);
  
  const metadata = lockupForPubkey.toBuffer();
  
  // Convert amount to 8-byte little-endian buffer
  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(amount);

  return Buffer.concat([discriminatorBuffer, metadata, amountBuffer]);
} 