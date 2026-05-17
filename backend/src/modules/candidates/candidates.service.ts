import prisma from '../../config/db'
import { getContract } from '../../config/contract'
import {
  getCandidatePhotoBuffer,
  type UploadedPhotoFile,
  uploadCandidatePhoto,
} from '../../config/s3'

export const candidatesService = {
  async getList(electionId: string) {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { id: true },
    })
    if (!election) throw new Error('Election not found')
    return prisma.candidate.findMany({
      where: { electionId },
      orderBy: { createdAt: 'asc' },
    })
  },

  async create(
    electionId: string,
    data: {
      name: string
      description?: string | null
      platform?: string | null
      credentials?: string | null
      bannerBgR?: number | null
      bannerBgG?: number | null
      bannerBgB?: number | null
      bannerAccentR?: number | null
      bannerAccentG?: number | null
      bannerAccentB?: number | null
      photoFile?: UploadedPhotoFile
    }
  ) {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    })
    if (!election) throw new Error('Election not found')
    if (election.status !== 'UPCOMING') {
      throw new Error('Candidates can only be added to elections with status UPCOMING')
    }
    const contract = getContract()
    const contractElectionId = election.contractElectionId
    if (!contract) {
      throw new Error('Contract not configured on backend')
    }
    if (contractElectionId == null) {
      throw new Error('Election is not synced to contract. Re-sync election first.')
    }

    const uploadedPhotoPromise = data.photoFile
      ? uploadCandidatePhoto(data.photoFile).then(
          (photo) => ({ photo, error: null }),
          (error: unknown) => ({ photo: null, error })
        )
      : Promise.resolve({ photo: null, error: null })
    const addCandidate = contract.getFunction('addCandidate')
    const tx = await addCandidate(
      contractElectionId,
      data.name.trim(),
      data.description?.trim() ?? ''
    )
    const receipt = await tx.wait()
    const allLogs = receipt?.logs ?? []
    const contractAddress = (contract.target as string).toLowerCase()
    const ourLogs = allLogs.filter(
      (log: { address?: string }) => String(log?.address ?? '').toLowerCase() === contractAddress
    )
    const iface = contract.interface
    const logsToTry = ourLogs.length > 0 ? ourLogs : allLogs

    let contractCandidateId: number | null = null
    for (const log of logsToTry) {
      try {
        const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data })
        if (parsed?.name === 'CandidateAdded' && Number(parsed.args.electionId) === contractElectionId) {
          const id = parsed.args.candidateId
          contractCandidateId = id != null ? Number(id) : null
          break
        }
      } catch {
        // skip
      }
    }

    if (contractCandidateId == null) {
      throw new Error('Candidate was not confirmed on-chain. Try again.')
    }

    const uploadedPhotoResult = await uploadedPhotoPromise
    if (uploadedPhotoResult.error) throw uploadedPhotoResult.error
    const uploadedPhoto = uploadedPhotoResult.photo
    return prisma.candidate.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        platform: data.platform?.trim() || null,
        credentials: data.credentials?.trim() || null,
        bannerBgR: data.bannerBgR ?? null,
        bannerBgG: data.bannerBgG ?? null,
        bannerBgB: data.bannerBgB ?? null,
        bannerAccentR: data.bannerAccentR ?? null,
        bannerAccentG: data.bannerAccentG ?? null,
        bannerAccentB: data.bannerAccentB ?? null,
        photoUrl: uploadedPhoto?.url || null,
        electionId,
        contractCandidateId,
      },
    })
  },

  async getPhoto(electionId: string, candidateId: string) {
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        electionId,
      },
      select: {
        photoUrl: true,
      },
    })

    if (!candidate) throw new Error('Candidate not found')
    if (!candidate.photoUrl) throw new Error('Candidate photo not found')

    return getCandidatePhotoBuffer(candidate.photoUrl)
  },
}
