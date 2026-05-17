import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { getCorsOrigin } from './config/cors'

let io: Server | null = null

export function initSocketServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: getCorsOrigin(),
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    socket.on('results:join', (electionId: string) => {
      socket.join(`election:${electionId}`)
    })

    socket.on('results:leave', (electionId: string) => {
      socket.leave(`election:${electionId}`)
    })
  })

  return io
}

export function emitElectionResults(
  electionId: string,
  payload: {
    candidates: { candidateId: string; name: string; voteCount: number }[]
    winner: { candidateId: string; name: string; voteCount: number } | null
    totalVotes: number
    published: boolean
    publishedAt: Date | null
    statistics: {
      candidateCount: number
      approvedVoterCount: number
      turnoutPercentage: number
    }
  }
) {
  io?.to(`election:${electionId}`).emit('results:update', {
    electionId,
    ...payload,
  })
}
