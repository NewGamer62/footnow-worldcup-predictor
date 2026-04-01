// Auteur : Ahmed Fikri, Selyan Mohammedi

import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/client.js'

const INVALID_TEXT_VALUES = new Set(['', 'NA', 'N/A', 'NULL', 'UNDEFINED'])

function cleanTextValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const text = String(value).trim()
  if (!text) {
    return null
  }

  return INVALID_TEXT_VALUES.has(text.toUpperCase()) ? null : text
}

function parseNullableScore(value: unknown): number | null {
  const cleaned = cleanTextValue(value)
  if (cleaned === null) {
    return null
  }

  const parsed = Number(cleaned)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

async function main() {
  console.log('Démarrage du seed...')

  // Détection du répertoire de données 
  const candidateDirs = [
    '/data',                       // dans le conteneur Docker (monté par compose)
    path.join(process.cwd(), '../db/data'), // local : depuis api/ => ../db/data
  ]
  const dataDir = candidateDirs.find(d => fs.existsSync(d)) ?? candidateDirs[1]
  console.log(`Répertoire de données : ${dataDir}`)

  // Nettoyage des tables 
console.log('Nettoyage des tables existantes...')
  // Skip delete if tables empty (seed safe)
  try { await prisma.prediction.deleteMany() } catch (e) { console.log('prediction skip') }
  try { await prisma.resultat.deleteMany() } catch (e) { console.log('resultat skip') }
  try { await prisma.classementGroupe.deleteMany() } catch (e) { console.log('classement skip') }
  try { await prisma.matchCdm2026.deleteMany() } catch (e) { console.log('matchCdm skip') }
  try { await prisma.matchHistorique.deleteMany() } catch (e) { console.log('historique skip') }
  try { await prisma.tokenApi.deleteMany() } catch (e) { console.log('token skip') }
  try { await prisma.utilisateur.deleteMany() } catch (e) { console.log('user skip') }
  try { await prisma.groupe.deleteMany() } catch (e) { console.log('groupe skip') }
  try { await prisma.equipe.deleteMany() } catch (e) { console.log('equipe skip') }
  console.log('Nettoyage terminé')

  // ========================
  // 1. ÉQUIPES + CLASSEMENT FIFA
  // ========================
  const rankingPath = path.join(dataDir, 'fifa_ranking_2026_complet.csv')
  if (!fs.existsSync(rankingPath)) throw new Error(`Fichier non trouvé : ${rankingPath}`)
  const rankingCsv = fs.readFileSync(rankingPath, 'utf8')
  const rankingData = parse(rankingCsv, { columns: true, skip_empty_lines: true })

  for (const row of rankingData) {
    await prisma.equipe.upsert({
      where: { nom: String(row.Team).trim() },
      update: {},
      create: {
        nom: String(row.Team).trim(),
        classement: parseInt(row.Ranking) || null,
        points_fifa: parseFloat(row['Points FIFA']) || null,
      },
    })
  }
  console.log(`-> ${rankingData.length} équipes + classement FIFA importés`)

  // ========================
  // 2. MATCHS HISTORIQUES
  // ========================
  const historyPath = path.join(dataDir, 'results.csv')
  if (!fs.existsSync(historyPath)) throw new Error(`Fichier non trouvé : ${historyPath}`)
  const historyCsv = fs.readFileSync(historyPath, 'utf8')
  const historyData = parse(historyCsv, { columns: true, skip_empty_lines: true })

  let historyCount = 0
  let skippedHistoryCount = 0
  for (const row of historyData) {
    const equipe1 = cleanTextValue(row.team1 || row.equipe1)
    const equipe2 = cleanTextValue(row.team2 || row.equipe2)
    const tournoi = cleanTextValue(row.tournament || row.tournoi)
    const pays = cleanTextValue(row.country || row.pays)
    const score1 = parseNullableScore(row.scoreteam1)
    const score2 = parseNullableScore(row.scoreteam2)

    if (!equipe1 || !equipe2 || !tournoi || !pays || score1 === null || score2 === null) {
      skippedHistoryCount++
      continue
    }

    const dateMatchRaw = cleanTextValue(row.date)
    const dateMatch = dateMatchRaw ? new Date(dateMatchRaw) : null
    const safeDateMatch = dateMatch && !Number.isNaN(dateMatch.getTime()) ? dateMatch : null

    await prisma.matchHistorique.create({
      data: {
        date_match: safeDateMatch,
        equipe1,
        equipe2,
        score1,
        score2,
        tournoi,
        pays,
      },
    })
    historyCount++
  }
  console.log(`-> ${historyCount} matchs historiques importés (${skippedHistoryCount} ignores car incomplets)`)

  // ========================
  // 3. MATCHS CDM 2026 & GROUPES
  // ========================
  const wcPath = path.join(dataDir, 'fifa-world-cup-2026-UTC.csv')
  if (!fs.existsSync(wcPath)) throw new Error(`Fichier non trouvé : ${wcPath}`)
  const wcCsv = fs.readFileSync(wcPath, 'utf8')
  const wcData = parse(wcCsv, { columns: true, skip_empty_lines: true })

  // Création des groupes à partir des noms uniques dans le CSV
  const groupNames = Array.from(
    new Set(
      wcData
        .map((row: any) => String(row.Group || '').trim())
        .filter((name: string) => name.length > 0)
    )
  )
  for (const groupName of groupNames) {
    await prisma.groupe.upsert({
      where: { nom: groupName },
      update: {},
      create: { nom: groupName },
    })
  }
  console.log(`-> ${groupNames.length} groupes créés`)

  const groupes = await prisma.groupe.findMany()
  const groupMap = new Map(groupes.map((g: { nom: string; id_groupe: number }) => [g.nom.toLowerCase().trim(), g.id_groupe]))

  let wcCount = 0
  for (const row of wcData) {
    const groupNom = String(row.Group || '').trim()
    const id_groupe = groupNom ? groupMap.get(groupNom.toLowerCase()) || null : null

    await prisma.matchCdm2026.create({
      data: {
        numero: parseInt(row['Match Number']) || null,
        phase: String(row['Round Number'] || row.phase || 'Group Stage').trim(),
        equipe_dom: String(row['Home Team'] || row.equipe_dom).trim(),
        equipe_ext: String(row['Away Team'] || row.equipe_ext).trim(),
        id_groupe,
      },
    })
    wcCount++
  }
  console.log(`-> ${wcCount} matchs Coupe du Monde 2026 importés`)

  // ========================
  // 4. FONCTIONS/TRIGGERS SQL
  // ========================
  // Ces scripts sont deja executes par PostgreSQL au demarrage
  // via /docker-entrypoint-initdb.d.
  console.log('Fonctions et triggers SQL deja initialises par la base')

 
  // 5. UTILISATEUR ADMIN
 
  const adminPassword = await bcrypt.hash('admin', 10)
  await prisma.utilisateur.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      password: adminPassword,
      role: 'admin',
    },
  })
  console.log('Utilisateur admin créé (login: admin, mot de passe: admin)')

  // ========================
  // 6. CALCUL DES PRÉDICTIONS INITIALES
  // ========================
  try {
    await prisma.$executeRaw`SELECT calculer_toutes_predictions()`
    console.log('Prédictions initiales calculées')
  } catch (_e) {
    console.log('calculer_toutes_predictions indisponible, etape ignoree')
  }

  console.log('Fin du traitement du seed.')
}

main()
  .catch(e => {
    console.error('Erreur pendant le seed :', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
