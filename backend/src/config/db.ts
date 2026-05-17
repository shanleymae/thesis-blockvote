import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const requiresSsl =
  process.env.DATABASE_SSL === 'true' ||
  connectionString.includes('sslmode=require') ||
  connectionString.includes('render.com')

const adapter = new PrismaPg({
  connectionString,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
})

const prisma = new PrismaClient({ adapter })

export default prisma
