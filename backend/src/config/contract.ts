import { ethers } from 'ethers'
import VotingSystemABI from '../abi/VotingSystem.json'

let contractInstance: ethers.Contract | null = null

if (
  process.env.CONTRACT_ADDRESS &&
  process.env.RPC_URL &&
  process.env.PRIVATE_KEY
) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    const wallet = new ethers.NonceManager(
      new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    )
    contractInstance = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      VotingSystemABI as ethers.InterfaceAbi,
      wallet
    )
  } catch {
    contractInstance = null
  }
}

export function getContract(): ethers.Contract | null {
  return contractInstance
}
