# Paladin SDK

A React-focused SDK for interacting with Paladin solana programs. Designed to work seamlessly with React applications and the Solana wallet adapter.

## Installation

```bash
npm install @paladin-bladesmith/sdk @solana/wallet-adapter-react
# or
yarn add @paladin-bladesmith/sdk @solana/wallet-adapter-react
```

## Requirements

- React 16.8+ (for hooks support)
- Solana wallet adapter for React

## Usage

### React Hooks (Recommended)

Using our React hooks provides the simplest integration with your React application:

```typescript
import { useLockup } from "@paladin-bladesmith/sdk";

function LockupButton() {
  const { lock, isReady } = useLockup();
  
  const handleLock = async () => {
    try {
      // Amount in tokens (will be automatically converted to proper units)
      const amount = 1; 
      
      // Lock the tokens
      const { signature, confirm } = await lock(amount);
      console.log("Transaction sent:", signature);
      
      // Wait for confirmation
      await confirm();
      console.log("Transaction confirmed!");
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };
  
  return (
    <button onClick={handleLock} disabled={!isReady}>
      Lock Tokens
    </button>
  );
}
```

## API Reference

### React Hooks

#### `useLockup()`

A React hook for locking tokens using a connected wallet.

##### Returns

- `lock`: Function that takes an amount (in tokens) and returns a promise with the transaction signature and a confirmation helper
- `isReady`: Boolean indicating if the wallet is connected and ready

## License

Apache 2.0
