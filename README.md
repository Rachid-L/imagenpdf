# ImagEnPDF

ImagEnPDF est une application web statique qui transforme plusieurs images en un seul fichier PDF. Tout le traitement se fait dans le navigateur : aucune image n'est envoyée vers un serveur.

## Fonctionnalites V1

- Import multiple d'images JPG, JPEG, PNG et WEBP.
- Import par bouton de sélection ou glisser-déposer.
- Rejet clair des fichiers non supportes.
- Aperçu des images avec nom, poids et dimensions.
- Réorganisation des pages par drag & drop avec Angular CDK.
- Boutons monter/descendre pour une utilisation plus confortable sur mobile.
- Suppression d'une image ou suppression complète.
- Parametres PDF : orientation portrait/paysage et format A4/taille image.
- Génération d'un PDF unique avec une image par page dans l'ordre choisi.
- Téléchargement local sous le nom `imagenpdf.pdf`.
- État de chargement, protection contre les doubles clics et messages utilisateur.
- Interface responsive desktop et mobile.

## Confidentialite

ImagEnPDF est 100% front-end. Les images restent sur l'appareil de l'utilisateur et ne quittent jamais le navigateur. Le projet n'utilise pas de backend, pas de base de données, pas de stockage serveur, pas d'API externe et pas de tracking.

## Stack technique

- Angular avec composant standalone.
- TypeScript.
- Angular CDK Drag & Drop.
- jsPDF.
- SCSS.

## Installation

```bash
npm install
```

## Lancement local

```bash
npm start
```

L'application est ensuite disponible sur `http://localhost:4200`.

## Build production

```bash
npm run build
```

Le build de cette configuration Angular est genere dans :

```text
dist/imagenpdf
```

## Déploiement sur Cloudflare Pages

Dans Cloudflare Pages, créez un projet connecté au repository GitHub `imagenpdf`, puis utilisez les paramètres suivants :

- Framework preset : Angular
- Build command : `npm run build`
- Output directory : `dist/imagenpdf`
- Environment variable recommandée : `NODE_VERSION=16.20.2`

Important : les versions récentes d'Angular peuvent parfois produire un dossier `dist/imagenpdf/browser`. Cette configuration du projet génère `dist/imagenpdf`, vérifié après `npm run build`.

## Création du repository GitHub

Si le repository n'existe pas encore, créez un repository GitHub nommé `imagenpdf`, puis poussez le projet local :

```bash
git init
git branch -M main
git remote add origin https://github.com/VOTRE_COMPTE/imagenpdf.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

Remplacez `VOTRE_COMPTE` par votre nom d'utilisateur ou organisation GitHub.

## Roadmap V2

- Compression des images.
- Fusion de plusieurs PDF et images.
- Marge personnalisée.
- Conversion WebP / PNG / JPG.
- Historique local.
- Mode mobile amélioré.
