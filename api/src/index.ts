import express from 'express'
import type {Request, Response} from 'express';
import crypto from 'node:crypto'
import { prisma } from './client.js'
import router from './routes.js'

const app = express()
app.use(express.json())

// Vérifie le statut de l'API et base de données
app.get('/api/health', async ( _req: Request, res: Response) => {
  try {
   
    await prisma.$queryRaw`SELECT 1`

    res.status(200).json({
      status: 'ok',
      api: 'up',
      database: 'up'
    })
  } catch (error) {
    console.error('Healthcheck failed:', error)

    res.status(503).json({
      status: 'error',
      api: 'up',
      database: 'down'
    })
  }
})

// Login, crypte le mot de passe er genère un token
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body ?? {}

    if (!login || !password) {
      return res.status(400).json({
        error: 'login et password requis'
      })
    }

    const user = await prisma.utilisateur.findUnique({
      where: { login }
    })

    if (!user || user.password !== password) {
      return res.status(401).json({
        error: 'Identifiants invalides'
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // avant expiration : 24h

    await prisma.tokenApi.create({
      data: {
        id_utilisateur: user.id_utilisateur,
        token,
        date_creation: now,
        date_expiration: expiresAt,
        actif: true
      }
    })

    return res.status(200).json({
      token,
      expires_at: expiresAt,
      user: {
        id_utilisateur: user.id_utilisateur,
        login: user.login,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Erreur login:', error)
    return res.status(500).json({
      error: 'Erreur lors du login'
    })
  }
})

app.use('/api', async (req: Request, res: Response, next) => {
  if (req.path === '/health' || req.path === '/login') {
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  const token = authHeader.slice('Bearer '.length).trim()

  const tokenRecord = await prisma.tokenApi.findUnique({
    where: { token }
  })

  if (!tokenRecord || tokenRecord.actif !== true) {
    return res.status(401).json({ error: 'Token invalide' })
  }

  if (tokenRecord.date_expiration && tokenRecord.date_expiration < new Date()) {
    return res.status(401).json({ error: 'Token expiré' })
  }

  return next()
})

// Routes des fonctions SQL via Prisma
app.use('/api', router)

const port = process.env.API_PORT || 3070
app.listen(port, () => {
    console.log(`API running on port ${port}`)
})