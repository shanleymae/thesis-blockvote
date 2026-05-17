import prisma from '../../config/db'

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10
}

export const resultsService = {
  async getElectionResults(electionId: string) {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        candidates: {
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
      },
    })
    if (!election) throw new Error('Election not found')

    const candidates = election.candidates.map((candidate) => ({
      candidateId: candidate.id,
      name: candidate.name,
      voteCount: candidate._count.votes,
    }))

    const winner = candidates.reduce<{
      candidateId: string
      name: string
      voteCount: number
    } | null>((currentWinner, candidate) => {
      if (candidate.voteCount === 0) return currentWinner
      if (!currentWinner || candidate.voteCount > currentWinner.voteCount) {
        return candidate
      }
      return currentWinner
    }, null)

    const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0)
    const approvedVoterCount = await prisma.user.count({
      where: {
        role: 'VOTER',
        status: 'APPROVED',
        isVerified: true,
      },
    })
    const turnoutPercentage =
      approvedVoterCount > 0 ? roundToSingleDecimal((totalVotes / approvedVoterCount) * 100) : 0

    return {
      candidates,
      winner,
      totalVotes,
      published: election.resultsPublished,
      publishedAt: election.resultsPublishedAt,
      statistics: {
        candidateCount: election.candidates.length,
        approvedVoterCount,
        turnoutPercentage,
      },
    }
  },

  async publishElectionResults(electionId: string) {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: {
        id: true,
        status: true,
        resultsPublished: true,
      },
    })

    if (!election) throw new Error('Election not found')
    if (election.status !== 'CLOSED') {
      throw new Error('Results can only be published after the election is closed')
    }

    if (!election.resultsPublished) {
      await prisma.election.update({
        where: { id: electionId },
        data: {
          resultsPublished: true,
          resultsPublishedAt: new Date(),
        },
      })
    }

    return this.getElectionResults(electionId)
  },

  async getElectionLogs(electionId: string) {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    })
    if (!election) throw new Error('Election not found')

    const votes = await prisma.vote.findMany({
      where: { electionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        txHash: true,
        createdAt: true,
        candidateId: true,
      },
    })

    return votes
  },
}

