import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

/**
 * Derives the vault authority PDA
 * @param vault The vault public key
 * @param programId The stake program ID
 * @returns The PDA address and bump seed
 */
export function findVaultAuthorityPda(
  vault: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("vault_authority"),
      vault.toBuffer()
    ],
    programId
  );
} 