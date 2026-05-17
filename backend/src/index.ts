import express from 'express'
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './modules/auth/auth.routes'
import usersRoutes from './modules/users/users.routes'
import electionsRoutes from './modules/elections/elections.routes'
import votesRoutes from './modules/votes/votes.routes'
import resultsRoutes from './modules/results/results.routes'
import organizationsRoutes from './modules/organizations/organizations.routes'
import electionGroupsRoutes from './modules/election-groups/election-groups.routes'
import { initSocketServer } from './socket'
import { ensureSuperAdmin } from './bootstrap/superadmin'
import { getCorsOrigin } from './config/cors'

dotenv.config()

const app = express()
const server = http.createServer(app)

app.use(cors({ origin: getCorsOrigin(), credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/elections', electionsRoutes)
app.use('/api/election-groups', electionGroupsRoutes)
app.use('/api/votes', votesRoutes)
app.use('/api/results', resultsRoutes)
app.use('/api/organizations', organizationsRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Blockvote API running' })
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000
initSocketServer(server)

async function start() {
  try {
    await ensureSuperAdmin()
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

void start()
