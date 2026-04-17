# Check BTP — Solution développée par le GROUPE ALPHA ISI

Plateforme numérique de contrôle qualité BTP. Digitalise les 25 fiches FICO d'autocontrôle, les 9 étapes du suivi incontournable, le pilotage de programmes immobiliers, et génère les rapports conformes.

## Déploiement en ligne (gratuit, 1 clic)

### Option 1 — Render (recommandé)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Alpha-wb/check-btp)

1. Cliquez sur le bouton ci-dessus
2. Connectez-vous avec GitHub
3. Cliquez "Apply" — Render détecte `render.yaml` et déploie tout
4. Attendez 5-10 min, votre URL sera `https://check-btp.onrender.com`

### Option 2 — Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?template=https://github.com/Alpha-wb/check-btp)

### Option 3 — Vercel (frontend seul, backend via serverless)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Alpha-wb/check-btp)

### Option 4 — Local (machine perso)

```bash
git clone https://github.com/Alpha-wb/check-btp.git
cd check-btp
npm install
npm run build
npm start
# → http://localhost:3001
```

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Super Admin** | `admin@alpha-isi.fr` | `demo2024` |
| Maître d'œuvre | `moe@alpha-isi.fr` | `demo2024` |
| Maître d'ouvrage | `moa@alpha-isi.fr` | `demo2024` |
| Entreprise | `entreprise@alpha-isi.fr` | `demo2024` |

Un chantier de démonstration **"Résidence Les Jardins de Montsouris"** est pré-configuré avec 3 bâtiments, 19 contrôles FICO, planning de référence sur 25 FICO et 14 alertes automatiques.

## Fonctionnalités

- **Tableau de bord type REPORTING** : avancement par bâtiment, dates clés, suivi financier, concessionnaires, certifications
- **25 fiches FICO** d'autocontrôle pré-paramétrées selon le modèle officiel
- **9 étapes du Suivi Incontournable** interactives (cases à cocher persistées)
- **Planning de référence** par FICO (dates prévues vs réelles)
- **Alertes automatiques** si FICO non fait vs avancement chantier
- **Upload de documents** (CR, planning, plans) par drag & drop
- **Rapports PDF** exportables par chantier
- **Module Administration** complet (gestion utilisateurs, programmes, stats globales)
- **3 rôles** : MOA, MOE, Entreprise + Super Admin

## Architecture

- **Frontend** : React 19 + Vite + TypeScript + TailwindCSS
- **Backend** : Express + TypeScript + JWT
- **Base de données** : SQLite (sql.js) avec auto-seed au démarrage
- **Mono-repo** : workspaces npm (`client/`, `server/`)

## Développement local

```bash
npm install
npm run dev
# Frontend : http://localhost:5173
# API : http://localhost:3001
```

## Licence

© 2025 GROUPE ALPHA ISI. Tous droits réservés.
