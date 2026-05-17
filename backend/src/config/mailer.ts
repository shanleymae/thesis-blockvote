import nodemailer from 'nodemailer'
import dns from 'node:dns/promises'
import net from 'node:net'

const forceIpv4 =
  process.env.MAIL_FORCE_IPV4?.trim().toLowerCase() === 'true' ||
  process.env.MAIL_FORCE_IPV4 === '1'

let cached: nodemailer.Transporter | null = null
let creating: Promise<nodemailer.Transporter> | null = null

/**
 * Nodemailer does not honor top-level `family: 4` for SMTP; it may still pick a random
 * AAAA address. When MAIL_FORCE_IPV4 is set, resolve the hostname to an A record and
 * connect by IPv4, preserving the original host as `servername` for STARTTLS/SNI.
 */
async function createTransporter(): Promise<nodemailer.Transporter> {
  const originalHost = process.env.MAIL_HOST || 'localhost'
  const port = Number(process.env.MAIL_PORT)
  let host = originalHost
  let servername: string | undefined

  if (forceIpv4 && originalHost && !net.isIP(originalHost)) {
    try {
      const { address } = await dns.lookup(originalHost, { family: 4 })
      host = address
      servername = originalHost
      console.log('[mailer] transport:ipv4-resolved', {
        logicalHost: originalHost,
        connectHost: host,
        port,
        servername,
      })
    } catch (err) {
      console.warn('[mailer] MAIL_FORCE_IPV4: IPv4 lookup failed, using hostname', err)
    }
  }

  if (!(forceIpv4 && servername)) {
    console.log('[mailer] transport:config', {
      connectHost: host,
      port,
      forceIpv4,
      servername: servername ?? null,
      mailUserSet: Boolean(process.env.MAIL_USER?.trim()),
      mailPassSet: Boolean(process.env.MAIL_PASS?.trim()),
    })
  }

  return nodemailer.createTransport({
    host,
    port,
    connectionTimeout: 25_000,
    greetingTimeout: 20_000,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    ...(servername ? { servername } : {}),
  } as nodemailer.TransportOptions)
}

export async function getMailer(): Promise<nodemailer.Transporter> {
  if (cached) {
    return cached
  }
  if (!creating) {
    creating = createTransporter().then((t) => {
      cached = t
      creating = null
      return t
    })
  }
  return creating
}

export default getMailer
