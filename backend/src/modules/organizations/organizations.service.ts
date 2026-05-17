import prisma from '../../config/db'

export const organizationsService = {
  async list() {
    const items = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, createdAt: true },
    })
    if (items.length > 0) return items
    const fallback = await prisma.organization.create({
      data: { name: 'General' },
      select: { id: true, name: true, createdAt: true },
    })
    return [fallback]
  },

  async create(name: string) {
    const normalized = name.trim()
    if (!normalized) throw new Error('Organization name is required')
    try {
      return await prisma.organization.create({
        data: { name: normalized },
        select: { id: true, name: true, createdAt: true },
      })
    } catch (error) {
      const message = String((error as { code?: string }).code ?? '')
      if (message === 'P2002') throw new Error('Organization already exists')
      throw error
    }
  },
}
