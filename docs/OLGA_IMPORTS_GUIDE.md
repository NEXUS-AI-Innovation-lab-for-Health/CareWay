# Olga Imports Guide

Ce guide explique comment utiliser les nouveaux dossiers ajoutes dans `olga/`.

## 1) Ce que tu as ajoute

- `olga/olga-metier/olga-metier-master`:
  Frontend metier React/Vite (separe de CareWay).
- `olga/config/olga-designer-admin-backend/olga-designer-admin-backend`:
  Snapshot de reference Docker (compose + .env + Dockerfiles) pour Olga.

## 2) Usage recommande dans CareWay

Pour eviter les conflits de ports et garder la config deja corrigee:

- Stack Olga complet (backend + mysql + designer + admin):
  utilise `docker/docker-compose.olga-full.yml`
- Front metier:
  lance le projet `olga-metier` en dev a part, si tu veux tester ce front specifique.

## 3) Commandes utiles

Depuis la racine de CareWay:

```bash
npm run olga:full:start
npm run olga:full:logs
npm run olga:full:stop
```

Puis:

- Designer: http://localhost:8082
- Admin: http://localhost:8083
- API: http://localhost:9091

Pour le front metier:

```bash
npm run olga:metier:install
npm run olga:metier:dev
```

## 4) Note importante

Le dossier `olga/config/olga-designer-admin-backend/olga-designer-admin-backend/.git` contient un depot git imbrique.
Garde-le comme archive de reference, mais evite de le versionner tel quel dans le repo principal.
