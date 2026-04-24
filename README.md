# 🌸 Journal Bien-être — Guide de déploiement

## Déploiement sur Vercel (gratuit, 5 minutes)

### Étape 1 — Créer un compte GitHub
1. Va sur **github.com** et crée un compte gratuit
2. Clique sur **"New repository"**
3. Nomme-le `journal-bien-etre`
4. Clique **"Create repository"**

### Étape 2 — Uploader les fichiers
1. Dans ton nouveau dépôt, clique **"uploading an existing file"**
2. Glisse-dépose **tout le contenu** de ce dossier `wellness-journal`
3. Clique **"Commit changes"**

### Étape 3 — Déployer sur Vercel
1. Va sur **vercel.com** et clique **"Sign up"**
2. Choisis **"Continue with GitHub"**
3. Clique **"Add New Project"**
4. Sélectionne ton dépôt `journal-bien-etre`
5. Clique **"Deploy"** — c'est tout !

### Étape 4 — Obtenir ton lien
- Vercel te donne une URL du type : `journal-bien-etre.vercel.app`
- Tu peux personnaliser ce nom dans les réglages Vercel
- **Partage ce lien** à tes clientes !

---

## Personnaliser le nom de domaine (optionnel)
Dans Vercel > Settings > Domains, tu peux ajouter ton propre domaine
ex : `journal.tonsite.fr`

## Informations importantes
- Chaque cliente a ses données stockées dans **son propre navigateur**
- Les données ne sont **pas partagées** entre les clientes
- L'app fonctionne aussi **hors connexion** une fois chargée
- Tes clientes peuvent l'**installer sur leur téléphone** (bouton "Ajouter à l'écran d'accueil")

## Structure du projet
```
wellness-journal/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── index.js
│   └── App.jsx        ← Le cœur de l'application
├── package.json
└── vercel.json
```
