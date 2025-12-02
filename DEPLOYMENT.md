Déploiement et hébergement
=========================

Ce dépôt contient une application Express + Vite (client + API). Ici quelques options et instructions courtes pour l'hébergement.

1) Contrainte détectée localement
---------------------------------
Lors d'une tentative `npm install` sur votre machine, l'installation a échoué pour cause d'espace disque insuffisant (ENOSPC). Si vous voulez d'abord héberger depuis votre machine, libérez de l'espace disk puis relancez :

  # Vérifier espace libre
  df -h .

  # Trouver gros fichiers/dossiers (ex.: home)
  du -sh * | sort -hr | head -n 50

Après avoir libéré de l'espace, exécutez :

  npm install
  npm run dev

2) Hébergement recommandé (skip local build)
-------------------------------------------
Si vous préférez ne pas construire localement, hébergez sur une plateforme qui fait la build pour vous (Render, Fly, Railway, Render recommandée ici)

Exemple simple pour Render (Web Service):
  - Lier votre repo GitHub.
  - Build command: npm ci --legacy-peer-deps && npm run build
  - Start command: npm start
  - PORT: 5000 (ou Render peut fournir $PORT; le serveur écoute $PORT si défini)
  - Plan: Web Service (un Node service, non statique)

3) Déploiement par conteneur (Docker)
-------------------------------------
Le `Dockerfile` à la racine construit l'app puis expose le binaire Node en production.
Sur Render vous pouvez sélectionner "Docker" et Render construira l'image.

4) Variables d'environnement importantes
---------------------------------------
  - PORT (optionnel, défaut 5000)
  - DATABASE_URL / autres secrets (selon votre configuration)

5) Étapes suivantes proposées
-----------------------------
  - Option A: Vous voulez que j'essaie à nouveau l'installation locale (je peux l'exécuter) — il faudra d'abord libérer de l'espace.
  - Option B: Je vous guide pas-à-pas pour déployer sur Render avec votre repo GitHub (je fournis les réglages exacts et un fichier `render.yaml` si nécessaire).
  - Option C: Je crée un `render.yaml` / configuration CI pour un déploiement automatique.

Choisissez une option et je continue.
