import prisma from '../../config/db'
import { getContract } from '../../config/contract'
import { resultsService } from '../results/results.service'
import { emitElectionResults } from '../../socket'

async function isWalletApprovedOnChain(walletAddress: string) {
  const contract = getContract()
  if (!contract) throw new Error('Voting contract is not configured')

  try {
    const isApproved = await contract.getFunction('isVoterApproved')(walletAddress)
    return Boolean(isApproved)
  } catch {
    const voter = await contract.getFunction('voters')(walletAddress)
    if (Array.isArray(voter)) {
      return Boolean(voter[0])
    }
    if (typeof voter === 'object' && voter != null && 'isApproved' in voter) {
      return Boolean((voter as { isApproved?: boolean }).isApproved)
    }
    return false
  }
}

export const votesService = {
  async prepareVote(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    if (user.status !== 'APPROVED') throw new Error('Only approved voters can vote')
    if (!user.walletAddress) throw new Error('Wallet address is required to vote')

    const contract = getContract()
    if (!contract) throw new Error('Voting contract is not configured')

    const approvedOnChain = await isWalletApprovedOnChain(user.walletAddress)
    if (!approvedOnChain) {
      const tx = await contract.getFunction('approveVoter')(user.walletAddress)
      await tx.wait()
      return { walletAddress: user.walletAddress, approvedOnChain: true, repaired: true }
    }

    return { walletAddress: user.walletAddress, approvedOnChain: true, repaired: false }
  },

  async recordVote(userId: string, electionId: string, candidateId: string, txHash: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    if (user.status !== 'APPROVED') throw new Error('Only approved voters can vote')
    if (!user.walletAddress) throw new Error('Wallet address is required to vote')

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: { candidates: true },
    })
    if (!election) throw new Error('Election not found')
    if (election.scope === 'ORGANIZATION' && user.organizationId !== election.organizationId) {
      throw new Error('This election is restricted to another organization')
    }
    if (election.status !== 'ACTIVE') throw new Error('Election is not active')

    const candidate = election.candidates.find((c) => c.id === candidateId)
    if (!candidate) throw new Error('Candidate not found in this election')

    const existing = await prisma.vote.findUnique({
      where: { userId_electionId: { userId, electionId } },
    })
    if (existing) throw new Error('You have already voted in this election')

    const vote = await prisma.vote.create({
      data: {
        userId,
        electionId,
        candidateId,
        txHash,
      },
      include: {
        election: true,
        candidate: true,
        user: true,
      },
    })

    const latestResults = await resultsService.getElectionResults(electionId)
    emitElectionResults(electionId, latestResults)

    return vote
  },

  async getMyVotes(userId: string) {
    const votes = await prisma.vote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        election: {
          include: {
            group: true,
          },
        },
        candidate: true,
      },
    })
    return votes
  },

  async verify(txHash: string) {
    const vote = await prisma.vote.findUnique({
      where: { txHash },
      include: {
        election: true,
        candidate: true,
        user: true,
      },
    })
    if (!vote) {
      return { verified: false }
    }

    let receipt: unknown = null
    try {
      const contract = getContract()
      const provider = contract?.runner?.provider
      if (provider) {
        receipt = await provider.getTransactionReceipt(txHash)
      }
    } catch (e) {
      console.error('Failed to fetch transaction receipt:', e)
    }

    return {
      verified: true,
      vote,
      receipt,
    }
  },
}
