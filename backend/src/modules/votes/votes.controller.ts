import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { votesService } from './votes.service'

function maskWalletAddress(walletAddress?: string | null) {
  if (!walletAddress) return null
  if (walletAddress.length <= 12) return walletAddress
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
}

export const votesController = {
  async prepare(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
      const result = await votesService.prepareVote(userId)
      res.json(result)
    } catch (e) {
      res.status(400).json({ message: (e as Error).message })
    }
  },

  async cast(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      const { electionId, candidateId, txHash } = req.body as {
        electionId?: string
        candidateId?: string
        txHash?: string
      }
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
      if (!electionId || !candidateId || !txHash) {
        return res.status(400).json({ message: 'electionId, candidateId and txHash are required' })
      }
      const vote = await votesService.recordVote(userId, electionId, candidateId, txHash)
      res.status(201).json({
        message: 'Vote cast successfully',
        txHash: vote.txHash,
        election: {
          id: vote.election.id,
          title: vote.election.title,
        },
        candidate: {
          id: vote.candidate.id,
          name: vote.candidate.name,
        },
        wallet: vote.user.walletAddress,
      })
    } catch (e) {
      res.status(400).json({ message: (e as Error).message })
    }
  },

  async myVotes(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
      const votes = await votesService.getMyVotes(userId)
      res.json(
        votes.map((v) => ({
          id: v.id,
          txHash: v.txHash,
          createdAt: v.createdAt,
          election: {
            id: v.election.id,
            title: v.election.title,
          },
          candidate: {
            id: v.candidate.id,
            name: v.candidate.name,
          },
        }))
      )
    } catch (e) {
      res.status(500).json({ message: (e as Error).message })
    }
  },

  async verify(req: AuthRequest, res: Response) {
    try {
      const txHash = String(req.params.txHash ?? '')
      if (!txHash) {
        return res.status(400).json({ message: 'txHash is required' })
      }
      const result = await votesService.verify(txHash)
      if (!result.verified || !result.vote) {
        return res.status(404).json({ message: 'Vote not found' })
      }
      const vote = result.vote
      res.json({
        ...result,
        vote: {
          ...vote,
          user: {
            ...vote.user,
            walletAddress: maskWalletAddress(vote.user.walletAddress),
          },
        },
      })
    } catch (e) {
      res.status(500).json({ message: (e as Error).message })
    }
  },
}
