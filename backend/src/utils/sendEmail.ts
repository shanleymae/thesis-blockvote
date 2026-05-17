import { getMailer } from '../config/mailer'

function maskEmailForLog(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '[invalid]'
  if (local.length <= 2) return `${local[0] ?? '*'}*@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

/**
 * Resend requires `email@example.com` or `Name <email@example.com>`.
 * Fixes common env mistakes like `Blockvote ucblockvote@gmail.com` (missing brackets).
 */
function normalizeFromHeader(raw: string): string {
  const s = raw.trim()
  if (!s) return s

  // `Name <email@domain>`
  if (/^[\s\S]*<[^>\s]+@[^>\s]+>\s*$/.test(s)) return s.trim()

  // plain `email@domain`
  if (/^[^\s<>]+@[^\s<>]+$/.test(s)) return s

  // `Display words email@domain` → `Display words <email@domain>`
  const m = s.match(/^(.+?)\s+(\S+@\S+)$/)
  if (m?.[1] && m[2]) {
    const namePart = m[1].trim()
    const emailPart = m[2].trim()
    if (namePart && emailPart.includes('@')) {
      return `${namePart} <${emailPart}>`
    }
  }

  return s
}

function verificationHtml(verifyUrl: string) {
  return `
      <h2>Welcome to Blockvote</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${verifyUrl}" style="
        background:#00d4c8;
        color:black;
        padding:12px 24px;
        border-radius:8px;
        text-decoration:none;
        font-weight:bold;
      ">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `
}

/** HTTPS API — works on hosts that block outbound SMTP (e.g. Render free web services). */
async function sendVerificationViaResend(to: string, subject: string, html: string, maskedTo: string) {
  const apiKey = process.env.RESEND_API_KEY!.trim()
  const rawFrom = process.env.RESEND_FROM?.trim() || process.env.MAIL_FROM?.trim()
  if (!rawFrom) {
    console.error('[mail] resend:abort — set RESEND_FROM or MAIL_FROM for the sender address')
    throw new Error('RESEND_FROM or MAIL_FROM is required when using RESEND_API_KEY')
  }

  const from = normalizeFromHeader(rawFrom)
  if (from !== rawFrom) {
    console.log('[mail] from-header normalized for Resend (was missing <…> around address)')
  }

  console.log('[mail] verification:transport', { mode: 'resend-https', to: maskedTo })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    id?: string
    message?: string
    name?: string
    errors?: unknown
  }

  if (!res.ok) {
    console.error('[mail] resend:failed', {
      to: maskedTo,
      status: res.status,
      message: data.message ?? null,
      name: data.name ?? null,
      errors: data.errors ?? null,
    })
    const detail =
      typeof data.message === 'string'
        ? data.message
        : `Resend API error (${res.status})`
    throw new Error(detail)
  }

  console.log('[mail] verification:sent-resend', { to: maskedTo, id: data.id ?? null })
}

/** Structured logs for production — never logs passwords or full verification tokens. */
export const sendVerificationEmail = async (email: string, token: string) => {
  const trimmedEmail = email.trim()
  const maskedTo = maskEmailForLog(trimmedEmail)
  const hasFrontendUrl = Boolean(process.env.FRONTEND_URL?.trim())
  const useResend = Boolean(process.env.RESEND_API_KEY?.trim())

  const frontendUrl = process.env.FRONTEND_URL
  const verifyUrl = frontendUrl
    ? `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${token}`
    : `http://localhost:${process.env.PORT || 5000}/api/auth/verify-email?token=${token}`

  const subject = 'Verify your Blockvote account'
  const html = verificationHtml(verifyUrl)

  console.log('[mail] verification:start', {
    to: maskedTo,
    transport: useResend ? 'resend-https' : 'smtp',
    hasFrom: Boolean(process.env.MAIL_FROM?.trim() || process.env.RESEND_FROM?.trim()),
    hasFrontendUrl,
    verifyPath: hasFrontendUrl ? 'frontend /verify-email' : 'backend /api/auth/verify-email',
    tokenLen: token.length,
  })

  if (useResend) {
    await sendVerificationViaResend(trimmedEmail, subject, html, maskedTo)
    return
  }

  const from = process.env.MAIL_FROM
  if (!from?.trim()) {
    console.error('[mail] verification:abort — MAIL_FROM is missing or empty (SMTP mode)')
    throw new Error('MAIL_FROM is not configured')
  }

  console.log('[mail] verification:transport', { mode: 'smtp', to: maskedTo })

  const transporter = await getMailer()

  try {
    const info = await transporter.sendMail({
      from: normalizeFromHeader(from.trim()),
      to: trimmedEmail,
      subject,
      html,
    })

    console.log('[mail] verification:sent-smtp', {
      to: maskedTo,
      messageId: info.messageId ?? null,
      accepted: info.accepted ?? null,
      rejected: info.rejected ?? null,
      pending: info.pending ?? null,
      response: typeof info.response === 'string' ? info.response.slice(0, 300) : info.response ?? null,
    })
  } catch (err) {
    const e = err as Record<string, unknown> & {
      message?: string
      name?: string
      code?: string
      errno?: number
      syscall?: string
      command?: string
      response?: string
      responseCode?: number
    }
    console.error('[mail] verification:failed-smtp', {
      to: maskedTo,
      message: e.message,
      name: e.name,
      code: e.code,
      errno: e.errno,
      syscall: e.syscall,
      address: typeof e.address === 'string' ? e.address : undefined,
      port: typeof e.port === 'number' ? e.port : undefined,
      command: e.command,
      responseCode: e.responseCode,
      response:
        typeof e.response === 'string' ? e.response.slice(0, 500) : e.response ?? undefined,
      hint:
        e.code === 'ETIMEDOUT' && e.command === 'CONN'
          ? 'Outbound SMTP may be blocked (Render free tier blocks ports 25/465/587). Set RESEND_API_KEY or upgrade Render / use another email API.'
          : undefined,
    })
    throw err
  }
}
