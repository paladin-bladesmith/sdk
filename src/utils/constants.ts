import { PublicKey } from "@solana/web3.js";

// Program IDs
export const PROGRAM_ID = new PublicKey("2fzrtg7ckXTFxjgsXbAWLLvXr4wJK9xfUjJJ69uZ7chb");
export const REWARDS_PROGRAM_ID = new PublicKey("7LdHk6jnrY4kJW79mVXshTzduvgn3yz4hZzHpzTbt7Ph");

// Program addresses
export const DEPLOYER = new PublicKey("CvgiX71JAvC1DjiwF2MmvXtcDtxKDgjzmqCGLg4vVQdk");
export const DEPLOYER_VAULT = new PublicKey("3tmajGkGtLxibY89VgjL7JTDHXfV9xXAayLtSHxMvVgD");
export const PAL_MINT = new PublicKey("HV9WocvHgRAkYAYmNzvBGHgCj2Vg2Z6N7VffouyiHJdu");
export const EXTRA_ACCOUNT_METAS = new PublicKey("B7HWKeRXgzHTfKdh3Ybf4NkizXWGq9UDmaMgXe6jKKW");
export const HOLDER_REWARDS_POOL = new PublicKey("9EeBEci7SovWiZpaLM7xzPQpYywa8DY865WmHYRC6vVD");
export const STAKE_CONFIG = new PublicKey("h4BWpb5mVFxabgskaEdsuDbkNdG3MpbELDdXPdNSkKH");
export const STAKE_VAULT = new PublicKey("319k4mx787DPAhfe6pssjsz3rLrSC9SxHYfuxbyuzuHo");
export const STAKE_VAULT_HOLDER_REWARDS = new PublicKey("62WN4pmhwbaA14uyVWzPayNQatasoraC7yjHSxBjM9zK");
export const FUNNEL = new PublicKey("6RfdhWwnNBKwchqPex7RPBw2c8Cku8y4QyUqjX71YoBq");
export const GOVERNANCE_CONFIG = new PublicKey("Gkv2FpDDPxWeua6N16NwoqryWzSc5izEn31PbRPtH4zV");
export const GOVERNANCE_TREASURY = new PublicKey("EULTQ2eLVqGZuwPjuqye3WK8cJFoFbHrdZkfPhoEoTLk");
export const SLASHING_CONFIG = new PublicKey("HDUkEh7iq7W2XjqqR12QLdEaT7GWYJ3YG9B4ojHyBN9Z");
export const SLASHING_TREASURY = new PublicKey("7JK6AGa3czK9RuvxMDXaGQYYfkm1RBBnnxdfK3AVfSCS");
export const AIRDROP = new PublicKey("5V6pEudHYZuv4G6uVV4C5AU4cyR4P1PtBWHGYNad5zfz");
export const AIRDROP_ATA = new PublicKey("B1wnVv6sGthzQkoqMg5SaR6kKBgwUoNCBz8kczBoVXMk");
export const LOCKUP_POOL = new PublicKey("EJi4Rj2u1VXiLpKtaqeQh3w4XxAGLFqnAG1jCorSvVmg");
export const RECIPIENT_REWARDS = new PublicKey("2d3Cb1fA9CcFgvcWtuP6n4rJNKk24rTqTxa1ywAxBUib");

// Token Mint
export const TOKEN_MINT = new PublicKey("HV9WocvHgRAkYAYmNzvBGHgCj2Vg2Z6N7VffouyiHJdu");

// Lockup account sizes
export const LOCKUP_ACCOUNT_SIZE = 160;
export const LOCKUP_RENT_EXEMPTION = 2_004_480;

// Constants for seed prefixes
export const SEED_PREFIX_HOLDER_REWARDS = Buffer.from('holder'); 