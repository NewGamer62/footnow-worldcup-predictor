import { Router } from 'express'
import type { Request, Response } from 'express'
import { prisma } from './client.js'

const router = Router()

/**
 * GET /api/equipes
 * Retourne le classement des équipes (nom, classement, points FIFA)
 */
router.get('/equipes', async (_req: Request, res: Response) => {
  try {
    const equipes = await prisma.equipe.findMany({
      orderBy: [
        { classement: 'asc' },
        { points_fifa: 'desc' }
      ],
      select: {
        nom: true,
        classement: true,
        points_fifa: true
      }
    })

    res.json({
      total: equipes.length,
      equipes: equipes.map((equipe: any, index: number) => ({
        nom: equipe.nom,
        classement: equipe.classement ?? index + 1,
        points_fifa: equipe.points_fifa
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des équipes:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des équipes',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/matchs-historique
 * Retourne les derniers matchs historiques
 */
router.get('/matchs-historique', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [matchs, total] = await prisma.$transaction([
      prisma.matchHistorique.findMany({
        orderBy: [
          { date_match: 'desc' },
          { id_match: 'desc' }
        ],
        skip,
        take: limit,
        select: {
          date_match: true,
          equipe1: true,
          equipe2: true,
          score1: true,
          score2: true,
          tournoi: true,
          pays: true
        }
      }),
      prisma.matchHistorique.count()
    ]);

    res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      matchs
    })
  } catch (error) {
    console.error('Erreur matchs historiques:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * GET /api/matchs-cdm2026
 * Tous les matchs CDM 2026
 */
router.get('/matchs-cdm2026', async (req: Request, res: Response) => {
  try {
    const matchs = await prisma.matchCdm2026.findMany({
      include: {
        groupe: true,
        predictions: true
      },
      orderBy: { numero: 'asc' }
    })

    res.json({
      total: matchs.length,
      matchs
    })
  } catch (error) {
    console.error('Erreur matchs CDM:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

/**
 * GET /api/groupes
 * Retourne la liste des groupes
 */
router.get('/groupes', async (_req: Request, res: Response) => {
  try {
    const groupes = await prisma.groupe.findMany({
      orderBy: { nom: 'asc' },
      select: {
        id_groupe: true,
        nom: true
      }
    })

    res.json({
      total: groupes.length,
      groupes
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des groupes',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/probabilites-2026
 * Estime les probabilités de titre pour 2026 via les points FIFA
 */
router.get('/probabilites-2026', async (_req: Request, res: Response) => {
  try {
    const equipes = await prisma.equipe.findMany({
      where: { points_fifa: { not: null } },
      orderBy: { points_fifa: 'desc' },
      take: 20,
      select: {
        nom: true,
        points_fifa: true,
        classement: true
      }
    })

    const totalPoints = equipes.reduce((acc: number, team: any) => {
      const points = Number(team.points_fifa) || 0
      return acc + points
    }, 0)

    const favoris = equipes.map((team: any, index: number) => {
      const points = Number(team.points_fifa) || 0
      const probabilite = totalPoints > 0 ? (points / totalPoints) * 100 : 0

      return {
        classement: team.classement ?? index + 1,
        equipe: team.nom,
        points_fifa: points,
        probabilite_titulo: Number(probabilite.toFixed(2))
      }
    })

    res.json({
      total: favoris.length,
      favoris
    })
  } catch (error) {
    console.error('Erreur lors du calcul des probabilités 2026:', error)
    res.status(500).json({
      error: 'Erreur lors du calcul des probabilités 2026',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/scores/fifa/:equipe
 * Obtient le score FIFA normalisé (0-1) pour une équipe
 */
router.get('/scores/fifa/:equipe', async (req: Request, res: Response) => {
  try {
    const { equipe } = req.params
    
    const result = await prisma.$queryRaw<Array<{ get_score_fifa: number }>>`
      SELECT get_score_fifa(${equipe}) as get_score_fifa
    `
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        error: 'Équipe non trouvée',
        equipe
      })
    }

    res.json({
      equipe,
      score_fifa: result[0].get_score_fifa,
      description: 'Score FIFA normalisé entre 0 et 1'
    })
  } catch (error) {
    console.error('Erreur lors du calcul du score FIFA:', error)
    res.status(500).json({
      error: 'Erreur lors du calcul du score FIFA',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/scores/h2h/:equipe1/:equipe2
 * Obtient le score face-à-face (0-1) entre deux équipes
 */
router.get('/scores/h2h/:equipe1/:equipe2', async (req: Request, res: Response) => {
  try {
    const { equipe1, equipe2 } = req.params
    
    const result = await prisma.$queryRaw<Array<{ get_score_h2h: number }>>`
      SELECT get_score_h2h(${equipe1}, ${equipe2}) as get_score_h2h
    `
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        error: 'Erreur lors du calcul du score face-à-face',
        equipe1,
        equipe2
      })
    }

    const scoreEq1 = result[0].get_score_h2h
    const scoreEq2 = 1 - scoreEq1

    res.json({
      equipe1,
      equipe2,
      score_h2h_equipe1: scoreEq1,
      score_h2h_equipe2: scoreEq2,
      description: 'Score face-à-face: probabilité de victoire pour chaque équipe basée sur l\'historique'
    })
  } catch (error) {
    console.error('Erreur lors du calcul du score H2H:', error)
    res.status(500).json({
      error: 'Erreur lors du calcul du score H2H',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/scores/forme/:equipe
 * Obtient la forme récente (0-1) d'une équipe basée sur les 10 derniers matchs
 */
router.get('/scores/forme/:equipe', async (req: Request, res: Response) => {
  try {
    const { equipe } = req.params
    
    const result = await prisma.$queryRaw<Array<{ get_forme_recente: number }>>`
      SELECT get_forme_recente(${equipe}) as get_forme_recente
    `
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        error: 'Équipe non trouvée',
        equipe
      })
    }

    res.json({
      equipe,
      forme_recente: result[0].get_forme_recente,
      description: 'Forme récente entre 0 et 1, basée sur les 10 derniers matchs'
    })
  } catch (error) {
    console.error('Erreur lors du calcul de la forme récente:', error)
    res.status(500).json({
      error: 'Erreur lors du calcul de la forme récente',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * POST /api/predictions/calcul/:matchId
 * Calcule la prédiction pour un match spécifique
 */
router.post('/predictions/calcul/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params
    if (!matchId || Array.isArray(matchId)) {
      return res.status(400).json({ error: 'ID de match invalide' })
    }
    const id = parseInt(matchId, 10)

    // Vérifie que le match existe
    const match = await prisma.matchCdm2026.findUnique({
      where: { id_match_wc: id }
    })

    if (!match) {
      return res.status(404).json({
        error: 'Match non trouvé',
        id_match_wc: id
      })
    }

    // Exécute la fonction de calcul
    await prisma.$queryRaw`
      SELECT calculer_prediction(${id})
    `

    // Récupère la prédiction calculée
    const prediction = await prisma.prediction.findUnique({
      where: { id_match_wc: id },
      include: {
        match: true
      }
    })

    res.json({
      success: true,
      message: 'Prédiction calculée avec succès',
      prediction: {
        id_match_wc: prediction?.id_match_wc,
        equipe_dom: prediction?.match.equipe_dom,
        equipe_ext: prediction?.match.equipe_ext,
        proba_dom: prediction?.proba_dom,
        proba_nul: prediction?.proba_nul,
        proba_ext: prediction?.proba_ext,
        date_calcul: prediction?.date_calcul
      }
    })
  } catch (error) {
    console.error('Erreur lors du calcul de la prédiction:', error)
    res.status(500).json({
      error: 'Erreur lors du calcul de la prédiction',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * POST /api/predictions/calcul-tous
 * Calcule toutes les prédictions pour tous les matchs
 */
router.post('/predictions/calcul-tous', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now()

    // Exécute la fonction de calcul de toutes les prédictions
    await prisma.$queryRaw`
      SELECT calculer_toutes_predictions()
    `

    const duration = Date.now() - startTime

    // Compte les prédictions calculées
    const count = await prisma.prediction.count()

    res.json({
      success: true,
      message: 'Toutes les prédictions ont été calculées',
      predictions_count: count,
      duration_ms: duration
    })
  } catch (error) {
    console.error('Erreur lors du calcul de toutes les prédictions:', error)
    res.status(500).json({
      error: 'Erreur lors du calcul de toutes les prédictions',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/predictions/:matchId
 * Obtient la prédiction d'un match spécifique
 */
router.get('/predictions/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params
    if (!matchId || Array.isArray(matchId)) {
      return res.status(400).json({ error: 'ID de match invalide' })
    }
    const id = parseInt(matchId, 10)

    const prediction = await prisma.prediction.findUnique({
      where: { id_match_wc: id },
      include: {
        match: true
      }
    })

    if (!prediction) {
      return res.status(404).json({
        error: 'Prédiction non trouvée',
        id_match_wc: id
      })
    }

    res.json({
      id_match_wc: prediction.id_match_wc,
      equipe_dom: prediction.match.equipe_dom,
      equipe_ext: prediction.match.equipe_ext,
      proba_dom: prediction.proba_dom,
      proba_nul: prediction.proba_nul,
      proba_ext: prediction.proba_ext,
      date_calcul: prediction.date_calcul,
      phase: prediction.match.phase,
      numero: prediction.match.numero
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de la prédiction:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération de la prédiction',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/predictions
 * Obtient toutes les prédictions avec filtrage optionnel
 */
router.get('/predictions', async (req: Request, res: Response) => {
  try {
    const predictions = await prisma.prediction.findMany({
      include: {
        match: true
      },
      orderBy: {
        id_match_wc: 'asc'
      }
    })

    res.json({
      total: predictions.length,
      predictions: predictions.map((p: any) => ({
        id_match_wc: p.id_match_wc,
        equipe_dom: p.match.equipe_dom,
        equipe_ext: p.match.equipe_ext,
        proba_dom: p.proba_dom,
        proba_nul: p.proba_nul,
        proba_ext: p.proba_ext,
        date_calcul: p.date_calcul,
        phase: p.match.phase,
        numero: p.match.numero
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des prédictions:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des prédictions',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/scores/analyse/:matchId
 * Obtient une analyse complète avec tous les scores pour un match
 */
router.get('/scores/analyse/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params
    if (!matchId || Array.isArray(matchId)) {
      return res.status(400).json({ error: 'ID de match invalide' })
    }
    const id = parseInt(matchId, 10)

    // Récupère le match
    const match = await prisma.matchCdm2026.findUnique({
      where: { id_match_wc: id }
    })

    if (!match || !match.equipe_dom || !match.equipe_ext) {
      return res.status(404).json({
        error: 'Match non trouvé ou équipes non disponibles',
        id_match_wc: id
      })
    }

    // Récupère tous les scores
    const scoresFifaResult = await prisma.$queryRaw<Array<{ get_score_fifa: number }>>`
      SELECT get_score_fifa(${match.equipe_dom}) as get_score_fifa
    `
    const scoreFifaDom = scoresFifaResult[0].get_score_fifa

    const scoresFifaExtResult = await prisma.$queryRaw<Array<{ get_score_fifa: number }>>`
      SELECT get_score_fifa(${match.equipe_ext}) as get_score_fifa
    `
    const scoreFifaExt = scoresFifaExtResult[0].get_score_fifa

    const scoreH2hResult = await prisma.$queryRaw<Array<{ get_score_h2h: number }>>`
      SELECT get_score_h2h(${match.equipe_dom}, ${match.equipe_ext}) as get_score_h2h
    `
    const scoreH2h = scoreH2hResult[0].get_score_h2h

    const formeResult = await prisma.$queryRaw<Array<{ get_forme_recente: number }>>`
      SELECT get_forme_recente(${match.equipe_dom}) as get_forme_recente
    `
    const formeDom = formeResult[0].get_forme_recente

    const formeExtResult = await prisma.$queryRaw<Array<{ get_forme_recente: number }>>`
      SELECT get_forme_recente(${match.equipe_ext}) as get_forme_recente
    `
    const formeExt = formeExtResult[0].get_forme_recente

    // Récupère la prédiction
    const prediction = await prisma.prediction.findUnique({
      where: { id_match_wc: id }
    })

    res.json({
      id_match_wc: id,
      phase: match.phase,
      numero: match.numero,
      equipe_dom: match.equipe_dom,
      equipe_ext: match.equipe_ext,
      analyse: {
        score_fifa: {
          equipe_dom: scoreFifaDom,
          equipe_ext: scoreFifaExt
        },
        score_h2h: {
          equipe_dom: scoreH2h,
          equipe_ext: 1 - scoreH2h
        },
        forme_recente: {
          equipe_dom: formeDom,
          equipe_ext: formeExt
        }
      },
      prediction: prediction ? {
        proba_dom: prediction.proba_dom,
        proba_nul: prediction.proba_nul,
        proba_ext: prediction.proba_ext,
        date_calcul: prediction.date_calcul
      } : null
    })
  } catch (error) {
    console.error('Erreur lors de l\'analyse du match:', error)
    res.status(500).json({
      error: 'Erreur lors de l\'analyse du match',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/stats/equipe/:equipe
 * Obtient les statistiques détaillées d'une équipe
 */
router.get('/stats/equipe/:equipe', async (req: Request, res: Response) => {
  try {
    const { equipe } = req.params

    const result = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM get_stats_equipe(${equipe})
    `

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: 'Équipe non trouvée ou aucune statistique disponible',
        equipe
      })
    }

    res.json(result[0])
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/stats/comparaison/:equipe1/:equipe2
 * Compare deux équipes
 */
router.get('/stats/comparaison/:equipe1/:equipe2', async (req: Request, res: Response) => {
  try {
    const { equipe1, equipe2 } = req.params

    const result = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM comparer_equipes(${equipe1}, ${equipe2})
    `

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: 'Erreur lors de la comparaison des équipes',
        equipe1,
        equipe2
      })
    }

    res.json(result[0])
  } catch (error) {
    console.error('Erreur lors de la comparaison:', error)
    res.status(500).json({
      error: 'Erreur lors de la comparaison',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/groupe/:groupId/analyse
 * Analyse la force des équipes d'un groupe
 */
router.get('/groupe/:groupId/analyse', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params
    if (!groupId || Array.isArray(groupId)) {
      return res.status(400).json({ error: 'ID de groupe invalide' })
    }
    const id = parseInt(groupId, 10)

    const result = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM analyser_groupe(${id})
    `

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: 'Groupe non trouvé ou vide',
        id_groupe: id
      })
    }

    res.json({
      id_groupe: id,
      equipes: result,
      total: result.length
    })
  } catch (error) {
    console.error('Erreur lors de l\'analyse du groupe:', error)
    res.status(500).json({
      error: 'Erreur lors de l\'analyse du groupe',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/groupe/:groupId/qualification
 * Calcule les probabilités de qualification pour un groupe
 */
router.get('/groupe/:groupId/qualification', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params
    if (!groupId || Array.isArray(groupId)) {
      return res.status(400).json({ error: 'ID de groupe invalide' })
    }
    const id = parseInt(groupId, 10)

    const result = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM analyser_qualification_groupe(${id})
    `

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: 'Groupe non trouvé ou vide',
        id_groupe: id
      })
    }

    res.json({
      id_groupe: id,
      equipes: result.map((e: any) => ({
        equipe: e.equipe,
        score_force: e.score_force,
        proba_qualification: e.proba_qualification,
        place_estimee: e.place_estimee
      })),
      total: result.length
    })
  } catch (error) {
    console.error('Erreur lors de l\'analyse de qualification:', error)
    res.status(500).json({
      error: 'Erreur lors de l\'analyse de qualification',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

/**
 * GET /api/favoris
 * Obtient le classement des favoris du tournoi
 */
router.get('/favoris', async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM get_favoris_tournoi()
    `

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: 'Impossible de récupérer les favoris'
      })
    }

    res.json({
      total: result.length,
      favoris: result.map((equipe: any, index: number) => ({
        classement: index + 1,
        equipe: equipe.equipe,
        points_fifa: equipe.points_fifa,
        score_force: equipe.score_force,
        probabilite_titulo: equipe.probabilite_titulo
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des favoris',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
})

export default router
