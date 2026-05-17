import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import crypto from 'crypto'

export type UploadedPhotoFile = {
  originalname: string
  mimetype: string
  buffer: Uint8Array
}

const region = process.env.AWS_REGION
const bucket = process.env.AWS_S3_BUCKET
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3Client =
  region && bucket && accessKeyId && secretAccessKey
    ? new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    : null

function getPublicUrl(key: string) {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

function getKeyPrefix() {
  return `https://${bucket}.s3.${region}.amazonaws.com/`
}

export function extractS3KeyFromUrl(url: string) {
  const prefix = getKeyPrefix()
  if (!url.startsWith(prefix)) {
    throw new Error('Unsupported S3 photo URL format')
  }

  return decodeURIComponent(url.slice(prefix.length))
}

export async function uploadCandidatePhoto(file: UploadedPhotoFile) {
  if (!s3Client || !bucket || !region) {
    throw new Error('S3 upload is not configured on the backend')
  }

  const extension = file.originalname.includes('.')
    ? file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()
    : ''
  const key = `candidates/${Date.now()}-${crypto.randomUUID()}${extension}`

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  )

  return {
    key,
    url: getPublicUrl(key),
  }
}

export async function getCandidatePhotoBuffer(photoUrl: string) {
  if (!s3Client || !bucket) {
    throw new Error('S3 upload is not configured on the backend')
  }

  const key = extractS3KeyFromUrl(photoUrl)
  const result = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )

  const bytes = await result.Body?.transformToByteArray()
  if (!bytes) {
    throw new Error('Candidate photo not found')
  }

  return {
    contentType: result.ContentType || 'application/octet-stream',
    buffer: Buffer.from(bytes),
  }
}
