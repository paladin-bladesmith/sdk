import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';

/**
 * Interface for wallet adapter like objects that can send transactions
 */
export interface WalletAdapter {
  publicKey: PublicKey | null;
  sendTransaction: (
    transaction: VersionedTransaction,
    connection: Connection,
    options?: any
  ) => Promise<string>;
}

export * from './lockup';
export * from './stake';
