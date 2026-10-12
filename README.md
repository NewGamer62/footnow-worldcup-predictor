# ⚽ FootNow – World Cup Predictor & Analytics Platform

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-Node.js%20Express-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma%20ORM-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Multi--Container-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Frontend-PHP%20%2F%20Apache-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/Tests-Vitest%20(Coverage%20%3E%2090%25)-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
</p>

---

## 📌 Présentation

**FootNow** est une plateforme web et API full-stack conteneurisée dédiée à l'analyse sportive et à la prédiction des confrontations de la Coupe du Monde 2026.

L'application combine une architecture orientée services (micro-conteneurs Docker) :
- Une **API REST sécurisée** en TypeScript/Node.js propulsée par Express et documentée via Swagger/OpenAPI.
- Une couche de persistance relationnelle haute performance sur **PostgreSQL**, pilotée via l'ORM **Prisma** avec migrations versionnées et procédures de seeding automatisées.
- Un moteur de **calcul statistique de probabilités** basé sur l'historique des confrontations internationales, la forme récente et les métriques d'attaque/défense.
- Une **application web PHP** moderne consommant l'API en temps réel, intégrant gestion des sessions, authentification et administration des équipes et matchs.

---

## 🏛️ Architecture & Services Docker

Le projet est entièrement orchestré via Docker Compose en 3 services isolés et interconnectés sur un réseau privé :

```
footnow-worldcup-predictor/
├── api/                             # Service API REST
│   ├── src/                         # Contrôleurs, routes, middlewares & logique métier
│   ├── prisma/                      # Schéma Prisma, migrations SQL & seed data
│   ├── tests/                       # Suite de tests unitaires et intégration (Vitest)
│   ├── Dockerfile                   # Build multi-stage Node.js
│   └── swagger.json                 # Documentation OpenAPI
├── db/                              # Service Base de données PostgreSQL
│   └── init/                        # Scripts SQL d'initialisation
├── web/                             # Service Front-End Web
│   ├── src/                         # Vues, templates PHP & consommation API cURL
│   └── Dockerfile                   # Image Apache PHP optimisée
├── docker-compose.yml               # Orchestration locale
├── docker-compose.jrcandev.yml      # Profil d'orchestration pour déploiement serveur
├── deploy.sh                        # Script CI/CD d'automatisation des déploiements
└── README.md
```

---

## ✨ Fonctionnalités Clés

- **Moteur de Prédiction Statistique** :
  - Calcul explicable des probabilités de victoire (Équipe A / Nul / Équipe B) basé sur les séries de scores, la dynamique de victoire et les classements relatifs.
  - Déclenchement automatique des simulations lors de l'enregistrement de nouvelles rencontres.
- **API REST Robuste & Typée** :
  - Validation stricte des payloads, gestion centralisée des erreurs et codes HTTP normalisés.
  - Authentification par jetons et routes d'administration protégées.
  - Suite de tests avec **Vitest atteignant plus de 90% de couverture de code**.
- **Conteneurisation & Déploiement Continu** :
  - Variables d'environnement unifiées via `.env`.
  - Script `deploy.sh` automatisant la mise à jour des conteneurs, l'application des migrations Prisma et le redémarrage sans interruption.

---

## 👨‍💻 Rôle & Contributions Personnelles (Noa Gaillard)

Dans ce projet d'équipe :
- **Spécifications Techniques & Cadrage Fonctionnel** : Rédaction complète du cahier des charges et modélisation des besoins utilisateurs.
- **Design UI/UX & Prototypage** : Conception intégrale des maquettes de l'application sous Figma (`MaquetteFootNow.pdf`), établissant l'ensemble des parcours de navigation, des formulaires et des tableaux de bord statistiques.
- **Infra Docker & Scripts d'Entrée** : Conception des scripts d'entrypoint Docker et harmonisation de la configuration multi-plateforme (`.gitattributes`, gestion des fins de ligne LF/CRLF entre environnements Linux et Windows).
- **Intégration & Revue de Code** : Gestion des fusions de branches, harmonisation des variables d'environnement de production et validation des points de terminaison de l'API.

---

## 🚀 Démarrage Rapide

### Prérequis
- [Docker](https://www.docker.com/) & Docker Compose installés sur votre machine

### Lancement avec Docker Compose

```bash
# 1. Cloner le dépôt
git clone https://github.com/NewGamer62/footnow-worldcup-predictor.git
cd footnow-worldcup-predictor

# 2. Configurer les variables d'environnement
cp .env.example .env   # ou éditer le fichier .env

# 3. Lancer l'ensemble des conteneurs (DB, API, Web)
docker compose up --build -d
```

### Accès aux Services Locaux
- 🌍 **Interface Web PHP** : [http://localhost:8080](http://localhost:8080)
- 🔌 **API REST** : [http://localhost:3070/api](http://localhost:3070/api)
- 📖 **Documentation Swagger** : [http://localhost:3070/api/docs](http://localhost:3070/api/docs)
- ❤️ **Healthcheck** : [http://localhost:3070/api/health](http://localhost:3070/api/health)
