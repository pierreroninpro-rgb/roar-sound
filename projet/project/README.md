# 🚀 ROAR - Site Portfolio

Site portfolio pour le studio ROAR, spécialisé dans la musique et le design sonore.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 18 ou supérieure)
  - Télécharger : [nodejs.org](https://nodejs.org/)
  - Vérifier l'installation : `node --version`
  
- **npm** (généralement inclus avec Node.js)
  - Vérifier l'installation : `npm --version`

- **Git** (pour la gestion de version)
  - Télécharger : [git-scm.com](https://git-scm.com/)
  - Vérifier l'installation : `git --version`

---

## 🛠️ Installation

### Étape 1 : Ouvrir le terminal

**Sur Mac :**
- Appuyez sur `Cmd + Espace` et tapez "Terminal"
- Ou allez dans Applications > Utilitaires > Terminal

**Sur Windows :**
- Appuyez sur `Windows + R` et tapez `cmd`
- Ou cherchez "Invite de commandes" dans le menu Démarrer

### Étape 2 : Se déplacer dans le dossier du projet

Dans le terminal, tapez :

```bash
cd /Users/malbag/Desktop/PIERREROAR/roarsound/projet/project
```

**💡 Astuce :** Vous pouvez aussi :
- Faire glisser le dossier `project` dans le terminal
- Ou utiliser `cd` suivi du chemin complet vers le dossier

**Vérifier que vous êtes au bon endroit :**
```bash
pwd
```
Vous devriez voir : `/Users/malbag/Desktop/PIERREROAR/roarsound/projet/project`

### Étape 3 : Installer les dépendances

```bash
npm install
```

Cette commande va :
- Lire le fichier `package.json`
- Télécharger toutes les bibliothèques nécessaires
- Créer un dossier `node_modules`

**⏱️ Temps estimé :** 2-5 minutes selon votre connexion

**✅ Quand c'est terminé :** Vous verrez un message de succès et un dossier `node_modules` sera créé.

---

## 🎮 Commandes disponibles

### Lancer le site en mode développement

```bash
npm run dev
```

**Ce que ça fait :**
- Démarre un serveur local
- Ouvre le site dans votre navigateur (généralement sur `http://localhost:5173`)
- Recharge automatiquement quand vous modifiez les fichiers

**Pour arrêter :** Appuyez sur `Ctrl + C` dans le terminal

### Construire le site pour la production

```bash
npm run build
```

**Ce que ça fait :**
- Compile et optimise tous les fichiers
- Crée un dossier `dist` avec les fichiers finaux
- Prêt à être déployé sur un serveur

### Prévisualiser la version de production

```bash
npm run preview
```

**Ce que ça fait :**
- Lance une version locale du site compilé
- Utile pour tester avant de déployer

### Vérifier le code (linting)

```bash
npm run lint
```

**Ce que ça fait :**
- Vérifie les erreurs de code
- Suggère des améliorations

---

## 📁 Structure du projet

```
project/
├── public/              # Fichiers publics (images, vidéos)
│   ├── images/         # Miniatures des vidéos
│   └── videos.json     # Liste des vidéos (à modifier)
├── src/
│   ├── components/     # Composants React
│   ├── pages/          # Pages de l'application
│   ├── hooks/          # Hooks personnalisés
│   └── ...
├── package.json        # Configuration npm
└── README.md           # Ce fichier
```

---

## 🔄 Workflow Git (Gestion de version)

### Configuration initiale (une seule fois)

Si c'est la première fois que vous utilisez Git sur ce projet :

```bash
# Vérifier que Git est installé
git --version

# Configurer votre nom (remplacez par votre nom)
git config --global user.name "Votre Nom"

# Configurer votre email (remplacez par votre email)
git config --global user.email "votre.email@example.com"
```

### Workflow quotidien

#### 1. Vérifier l'état des fichiers

```bash
git status
```

**Ce que ça fait :** Affiche les fichiers modifiés, ajoutés ou supprimés

#### 2. Se déplacer dans le bon dossier

**⚠️ Important :** Assurez-vous d'être dans le dossier `project` :

```bash
cd /Users/malbag/Desktop/PIERREROAR/roarsound/projet/project
```

**Vérifier :**
```bash
pwd
# Doit afficher : /Users/malbag/Desktop/PIERREROAR/roarsound/projet/project
```

#### 3. Voir les modifications

```bash
git diff
```

**Ce que ça fait :** Affiche les changements ligne par ligne

#### 4. Ajouter les fichiers modifiés

**Ajouter un fichier spécifique :**
```bash
git add public/videos.json
```

**Ajouter tous les fichiers modifiés :**
```bash
git add .
```

**💡 Astuce :** `git add .` ajoute tous les fichiers modifiés dans le dossier actuel

#### 5. Créer un commit (sauvegarde)

```bash
git commit -m "Description de vos modifications"
```

**Exemples de messages :**
```bash
git commit -m "Ajout de la vidéo Apple dans le carrousel"
git commit -m "Modification de la vidéo d'entrée"
git commit -m "Réorganisation de l'ordre des vidéos"
```

**⚠️ Important :** Le message doit être clair et décrire ce que vous avez fait

#### 6. Envoyer les modifications (push)

**Vérifier la branche actuelle :**
```bash
git branch
```

**Envoyer sur la branche principale (main) :**
```bash
git push origin main
```

**Si vous êtes sur une autre branche :**
```bash
git push origin nom-de-la-branche
```

**🔐 Si on vous demande des identifiants :**
- Entrez votre nom d'utilisateur GitHub
- Entrez votre mot de passe (ou token d'accès personnel)

---

## 📝 Exemple de workflow complet

Voici un exemple complet pour ajouter une vidéo et pousser les modifications :

```bash
# 1. Se déplacer dans le projet
cd /Users/malbag/Desktop/PIERREROAR/roarsound/projet/project

# 2. Vérifier l'état
git status

# 3. Modifier le fichier videos.json (avec votre éditeur de texte)

# 4. Vérifier les modifications
git diff public/videos.json

# 5. Ajouter le fichier modifié
git add public/videos.json

# 6. Créer un commit
git commit -m "Ajout de la nouvelle vidéo XYZ"

# 7. Envoyer les modifications
git push origin main
```

---

## 🐛 Résolution de problèmes

### Erreur : "npm: command not found"

**Solution :**
- Installez Node.js depuis [nodejs.org](https://nodejs.org/)
- Redémarrez le terminal après l'installation

### Erreur : "Cannot find module"

**Solution :**
```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller
npm install
```

### Erreur : "Port already in use"

**Solution :**
```bash
# Trouver le processus qui utilise le port
lsof -ti:5173

# Tuer le processus (remplacez PID par le numéro trouvé)
kill -9 PID

# Ou simplement utiliser un autre port
npm run dev -- --port 3000
```

### Erreur Git : "Permission denied"

**Solutions :**
1. Vérifiez que vous avez les droits sur le dépôt
2. Vérifiez votre configuration Git :
   ```bash
   git config --global user.name
   git config --global user.email
   ```
3. Vérifiez vos identifiants GitHub

### Erreur Git : "Your branch is ahead of 'origin/main'"

**Solution :** Vous avez des commits locaux non envoyés. Poussez-les :
```bash
git push origin main
```

### Erreur Git : "Updates were rejected"

**Solution :** Quelqu'un d'autre a poussé des modifications. Récupérez-les d'abord :
```bash
git pull origin main
# Résolvez les conflits si nécessaire
git push origin main
```

---

## 🚀 Déploiement

### Avant de déployer

1. **Tester localement :**
   ```bash
   npm run build
   npm run preview
   ```

2. **Vérifier que tout fonctionne :**
   - Toutes les vidéos se chargent
   - Les images s'affichent
   - La navigation fonctionne

3. **Créer un commit final :**
   ```bash
   git add .
   git commit -m "Version finale prête pour déploiement"
   git push origin main
   ```

### Options de déploiement

- **Vercel** : Connectez votre dépôt GitHub, déploiement automatique
- **Netlify** : Drag & drop du dossier `dist` ou connexion GitHub
- **GitHub Pages** : Configuration dans les paramètres du dépôt

---

## 📚 Ressources utiles

- **Documentation React** : [react.dev](https://react.dev)
- **Documentation Vite** : [vite.dev](https://vite.dev)
- **Documentation Git** : [git-scm.com/doc](https://git-scm.com/doc)
- **Guide Client** : Voir `GUIDE_CLIENT.md` pour modifier le contenu

---

## 🔐 Sécurité

⚠️ **Ne jamais commiter :**
- Fichiers `.env` avec des clés API
- Fichiers `node_modules/`
- Fichiers de configuration sensibles

✅ **Fichiers à toujours commiter :**
- `package.json`
- `videos.json`
- Code source dans `src/`

---

## 📞 Support

Pour toute question technique :
1. Consultez la documentation (`DOCUMENTATION.md`)
2. Consultez le guide client (`GUIDE_CLIENT.md`)
3. Contactez votre développeur

---

## 📝 Checklist avant de pousser

Avant de faire `git push`, vérifiez :

- [ ] J'ai testé le site localement (`npm run dev`)
- [ ] Toutes les vidéos fonctionnent
- [ ] Les images s'affichent correctement
- [ ] J'ai créé un commit avec un message clair
- [ ] Je suis dans le bon dossier (`pwd` affiche le bon chemin)
- [ ] Je suis sur la bonne branche (`git branch`)

---

*Dernière mise à jour : Janvier 2026*
