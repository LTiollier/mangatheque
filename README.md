# Mangathèque

Une application de gestion de collection de mangas complète ("mobile-first"), permettant aux collectionneurs de mangas de gérer leur collection physique, suivre leur progression de lecture, lister les prêts en cours et maintenir une liste de souhaits.

## Architecture

Ce projet est découpé en deux parties principales :

- **Backend (`/laravel-api`) :** Une API RESTful robuste sous **Laravel 12** structurée selon les principes du **Domain-Driven Design (DDD)** et testée de bout en bout avec **PestPHP**.
- **Frontend (`/pwa-client`) :** Une application cliente développée en **Next.js** (React) avec **Tailwind CSS** et **shadcn/ui**. PWA-ready pour une utilisation mobile optimale (Scan de codes-barres, mode hors ligne).

## Documentation

- **[Documentation Métier (DOC_METIER.md)](DOC_METIER.md) :** Détaille les règles, les entités et les fonctionnalités clés de l'application.
- **[Règles d'Architecture (AGENTS.md)](AGENTS.md) :** Décrit la stack technique et les directives de développement strictes.
- **[Suivi des Tâches (TASKS.md)](TASKS.md) :** Suivi de l'avancement du projet phase par phase.

## Démarrage Rapide

L'environnement de développement complet est géré via **Docker Compose**. 

### 1. Cloner le dépôt et lancer les conteneurs

```bash
git clone git@github.com:LTiollier/mangatheque.git
cd mangatheque
docker compose up -d
```

### 2. Accéder à l'application

- L'API Backend (Laravel) est accessible sur : `http://localhost:8000/api`
- Le Client Frontend (Next.js) est accessible sur : `http://localhost:3000`

## Tests Intégrés

- **Backend :** Exécuter les tests via Pest.
  ```bash
  docker compose exec backend ./vendor/bin/pest
  ```
- **Frontend :** Les tests et le typage sont gérés via ESLint et TypeScript.
  ```bash
  npm run lint
  npm run typecheck
  ```
