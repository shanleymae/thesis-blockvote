import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { candidatesService } from './candidates.service'
import type { UploadedPhotoFile } from '../../config/s3'

function clampByte(value: unknown): number | null {
  const n = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN
  if (!Number.isFinite(n)) return null
  const i = Math.round(n)
  if (i < 0 || i > 255) return null
  return i
}

/** Parses R,G,B from multipart body; all three keys must be present together or all omitted. */
function parseOptionalRgbTriplet(
  body: Record<string, unknown>,
  keys: [string, string, string]
): { r: number; g: number; b: number } | undefined {
  const [rk, gk, bk] = keys
  const rv = body[rk]
  const gv = body[gk]
  const bv = body[bk]
  const allAbsent = rv === undefined && gv === undefined && bv === undefined
  if (allAbsent) return undefined
  const r = clampByte(rv)
  const g = clampByte(gv)
  const b = clampByte(bv)
  if (r === null || g === null || b === null) {
    throw new Error('Invalid banner RGB; each channel must be an integer from 0 to 255')
  }
  return { r, g, b }
}

export const candidatesController = {
  async getList(req: AuthRequest, res: Response) {
    try {
      const electionId = String(req.params.electionId ?? '')
      const list = await candidatesService.getList(electionId)
      res.json(list)
    } catch (e) {
      if ((e as Error).message === 'Election not found') {
        return res.status(404).json({ message: 'Election not found' })
      }
      res.status(500).json({ message: (e as Error).message })
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const electionId = String(req.params.electionId ?? '')
      const body = req.body as Record<string, unknown>
      const { name, description, platform, credentials } = body
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'name is required' })
      }
      const bannerBg = parseOptionalRgbTriplet(body, ['bannerBgR', 'bannerBgG', 'bannerBgB'])
      const bannerAccent = parseOptionalRgbTriplet(body, ['bannerAccentR', 'bannerAccentG', 'bannerAccentB'])
      const candidate = await candidatesService.create(electionId, {
        name: name.trim(),
        description: description != null ? String(description) : undefined,
        platform: platform != null ? String(platform) : undefined,
        credentials: credentials != null ? String(credentials) : undefined,
        bannerBgR: bannerBg?.r ?? null,
        bannerBgG: bannerBg?.g ?? null,
        bannerBgB: bannerBg?.b ?? null,
        bannerAccentR: bannerAccent?.r ?? null,
        bannerAccentG: bannerAccent?.g ?? null,
        bannerAccentB: bannerAccent?.b ?? null,
        photoFile: (req as AuthRequest & { file?: UploadedPhotoFile }).file,
      })
      res.status(201).json(candidate)
    } catch (e) {
      if ((e as Error).message === 'Election not found') {
        return res.status(404).json({ message: 'Election not found' })
      }
      if ((e as Error).message === 'Candidates can only be added to elections with status UPCOMING') {
        return res.status(400).json({ message: (e as Error).message })
      }
      if ((e as Error).message === 'Election is not synced to contract. Re-sync election first.') {
        return res.status(400).json({ message: (e as Error).message })
      }
      if ((e as Error).message === 'Candidate was not confirmed on-chain. Try again.') {
        return res.status(502).json({ message: (e as Error).message })
      }
      if ((e as Error).message === 'Contract not configured on backend') {
        return res.status(503).json({ message: (e as Error).message })
      }
      if ((e as Error).message === 'S3 upload is not configured on the backend') {
        return res.status(500).json({ message: (e as Error).message })
      }
      if ((e as Error).message === 'Only JPG, PNG, WEBP, and GIF images are allowed') {
        return res.status(400).json({ message: (e as Error).message })
      }
      if ((e as Error).message.startsWith('Invalid banner RGB')) {
        return res.status(400).json({ message: (e as Error).message })
      }
      res.status(500).json({ message: (e as Error).message })
    }
  },

  async getPhoto(req: AuthRequest, res: Response) {
    try {
      const electionId = String(req.params.electionId ?? '')
      const candidateId = String(req.params.candidateId ?? '')
      const photo = await candidatesService.getPhoto(electionId, candidateId)
      res.setHeader('Content-Type', photo.contentType)
      res.setHeader('Cache-Control', 'public, max-age=3600')
      res.send(photo.buffer)
    } catch (e) {
      if (
        (e as Error).message === 'Candidate not found' ||
        (e as Error).message === 'Candidate photo not found'
      ) {
        return res.status(404).json({ message: (e as Error).message })
      }

      res.status(500).json({ message: (e as Error).message })
    }
  },
}
