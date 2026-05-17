# Blockvote Blockchain Workspace

This directory is reserved for smart contract source code, deployment scripts, and contract artifacts.

At the moment, the deployed contract ABI used by the backend lives in:

```txt
backend/src/abi/VotingSystem.json
```

The backend expects the deployed contract address through:

```txt
CONTRACT_ADDRESS=0x...
RPC_URL=https://...
PRIVATE_KEY=...
```

## Suggested Structure

If contract work is added here later, use a clear layout such as:

```txt
blockchain/
  contracts/
    VotingSystem.sol
  scripts/
    deploy.ts
  test/
    VotingSystem.test.ts
  artifacts/
  README.md
  hardhat.config.ts
  package.json
```

## Deployment Notes

After deploying or updating the voting contract:

1. Copy the deployed contract address into backend `CONTRACT_ADDRESS`.
2. Export the ABI and update `backend/src/abi/VotingSystem.json`.
3. Make sure backend `RPC_URL` points to the same network.
4. Fund the backend wallet with Sepolia ETH if using Sepolia.
5. Redeploy the backend.

## Current Runtime Relationship

The frontend reads:

```txt
VITE_CONTRACT_ADDRESS=0x...
```

The backend reads:

```txt
CONTRACT_ADDRESS=0x...
RPC_URL=https://...
PRIVATE_KEY=...
```

Keep the frontend and backend contract addresses aligned.
