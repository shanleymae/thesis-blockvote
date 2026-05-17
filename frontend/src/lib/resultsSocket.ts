import { io, type Socket } from 'socket.io-client'

const API_BASE = import.meta.env.VITE_API_URL || ''
const SOCKET_BASE = API_BASE.replace(/\/api\/?$/, '')

type ResultsPayload = {
  electionId: string
  candidates: { candidateId: string; name: string; voteCount: number }[]
  winner: { candidateId: string; name: string; voteCount: number } | null
  totalVotes: number
  published: boolean
  publishedAt: string | null
  statistics: {
    candidateCount: number
    approvedVoterCount: number
    turnoutPercentage: number
  }
}

let socket: Socket | null = null

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_BASE || window.location.origin, {
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

export function subscribeToElectionResults(
  electionId: string,
  onUpdate: (payload: ResultsPayload) => void
) {
  const activeSocket = getSocket()

  const handleResults = (payload: ResultsPayload) => {
    if (payload.electionId === electionId) {
      onUpdate(payload)
    }
  }

  activeSocket.emit('results:join', electionId)
  activeSocket.on('results:update', handleResults)

  return () => {
    activeSocket.emit('results:leave', electionId)
    activeSocket.off('results:update', handleResults)
  }
}
