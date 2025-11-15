import { Router, Request, Response } from 'express'
import { systemConfigRepository } from '../repositories/SystemConfigRepository'

const router = Router()

// Get contact configuration (public endpoint)
router.get('/contact', async (req: Request, res: Response) => {
  try {
    const configs = await systemConfigRepository.findByKeyPrefix('contact_')

    const contactConfig: any = {}
    configs.forEach(config => {
      const key = config.key.replace('contact_', '')
      contactConfig[key] = config.value
    })

    res.json(contactConfig)
  } catch (error) {
    console.error('Get contact config error:', error)
    res.status(500).json({ message: 'Failed to get contact configuration' })
  }
})

export default router
