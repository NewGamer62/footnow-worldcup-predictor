p# Correction Build API ESM ✅ TERMINÉ

## Étapes terminées
- [x] 1. Edit api/package.json (`"type": "module"`)
- [x] 2. Edit api/tsconfig.json (`module: ESNext`, `moduleResolution: bundler`)
- [x] 3. Edit api/src/index.ts (`import './client'`)
- [x] 4. Edit api/src/routes.ts (`import './client'`)
- [x] 5. `npm run build` → dist/ généré (index.js, routes.js, client.js)
- [x] 6. `docker compose build api` → Succès

## Prochaines étapes
1. **Push Git** → CD jrcandev relance build auto
2. Test API en prod

**Build Docker OK ! Prêt pour déploiement.** ⚽
