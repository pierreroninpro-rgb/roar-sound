# 📖 Guide Client - Gestion du Contenu ROAR

Ce guide vous explique comment ajouter, modifier et organiser les vidéos de votre site ROAR.

---

## 📋 Table des matières

1. [Ajouter une nouvelle vidéo dans le carrousel](#ajouter-une-nouvelle-vidéo)
2. [Modifier l'ordre des vidéos](#modifier-lordre-des-vidéos)
3. [Modifier la vidéo d'entrée (page d'accueil)](#modifier-la-vidéo-dentrée)
4. [Format des données](#format-des-données)
5. [Exemples pratiques](#exemples-pratiques)

---

## 🎬 Ajouter une nouvelle vidéo

### Étape 1 : Préparer votre vidéo Vimeo

1. **Uploadez votre vidéo sur Vimeo**
   - Connectez-vous à votre compte Vimeo
   - Uploadez la vidéo
   - Une fois l'upload terminé, copiez l'URL de la vidéo
   - Exemple : `https://vimeo.com/1151599838`

2. **Préparez une miniature (thumbnail)**
   - Créez une image PNG pour la miniature
   - Dimensions recommandées : 1024x576px (ratio 16:9)
   - Nommez l'image de manière claire (ex: `MonProjet.png`)
   - Placez l'image dans le dossier : `public/images/`

### Étape 2 : Ouvrir le fichier videos.json

1. Ouvrez le fichier : `public/videos.json`
2. Vous verrez une liste de vidéos entre crochets `[ ]`

### Étape 3 : Ajouter votre nouvelle vidéo

1. **Trouvez la dernière vidéo** dans la liste (celle avec le plus grand `id`)
2. **Ajoutez une virgule** `,` après la dernière vidéo
3. **Ajoutez votre nouvelle vidéo** en suivant ce format :

```json
{
  "id": 11,
  "title": "Nom de votre projet",
  "url": "https://vimeo.com/VOTRE_ID_VIDEO",
  "thumbnail": "/images/VotreImage.png",
  "soustitre": "Sous-titre du projet",
  "description": "Description du projet"
}
```

**⚠️ Important :**
- L'`id` doit être unique et supérieur au dernier id existant
- L'`url` doit être l'URL complète de Vimeo
- Le `thumbnail` doit commencer par `/images/` suivi du nom de votre fichier
- Utilisez des guillemets doubles `"` pour tous les textes
- N'oubliez pas la virgule `,` entre chaque vidéo (sauf la dernière)

### Exemple complet :

```json
[
  {
    "id": 1,
    "title": "Armour X",
    "url": "https://vimeo.com/1151599838",
    "thumbnail": "/images/ArmourX.png",
    "soustitre": "AX HQ Room",
    "description": "Original composition, sound design, audio mix "
  },
  {
    "id": 11,
    "title": "Mon Nouveau Projet",
    "url": "https://vimeo.com/1234567890",
    "thumbnail": "/images/MonNouveauProjet.png",
    "soustitre": "Campagne 2025",
    "description": "Original composition, sound design, audio mix"
  }
]
```

### Étape 4 : Vérifier la syntaxe

⚠️ **Erreurs courantes à éviter :**
- ❌ Oublier une virgule entre deux vidéos
- ❌ Oublier les guillemets autour des textes
- ❌ Utiliser un `id` déjà existant
- ❌ Oublier de fermer les accolades `}`
- ❌ Mettre une virgule après la dernière vidéo

✅ **Vérification rapide :**
- Toutes les vidéos sont entre `[` et `]`
- Chaque vidéo est entre `{` et `}`
- Chaque propriété a des guillemets autour de la valeur
- Il y a une virgule entre chaque vidéo (sauf la dernière)

---

## 🔄 Modifier l'ordre des vidéos

L'ordre d'affichage dans le carrousel correspond à l'ordre dans le fichier `videos.json`.

### Pour changer l'ordre :

1. **Ouvrez** `public/videos.json`
2. **Coupez** la vidéo que vous voulez déplacer (sélectionnez tout le bloc `{...}`)
3. **Collez-la** à la position souhaitée
4. **Vérifiez** que :
   - Les virgules sont correctes entre chaque vidéo
   - Il n'y a pas de virgule après la dernière vidéo
   - Toutes les accolades sont fermées

### Exemple : Déplacer une vidéo en première position

**Avant :**
```json
[
  {
    "id": 1,
    "title": "Vidéo A",
    ...
  },
  {
    "id": 2,
    "title": "Vidéo B",
    ...
  }
]
```

**Après (Vidéo B en première position) :**
```json
[
  {
    "id": 2,
    "title": "Vidéo B",
    ...
  },
  {
    "id": 1,
    "title": "Vidéo A",
    ...
  }
]
```

**💡 Astuce :** Vous pouvez garder les mêmes `id`, seul l'ordre dans le fichier compte pour l'affichage.

---

## 🎥 Modifier la vidéo d'entrée (page d'accueil)

La vidéo qui s'affiche en arrière-plan sur la page d'accueil est définie dans un fichier de code.

### Étape 1 : Localiser le fichier

Ouvrez le fichier : `src/components/VideoPlayer.jsx`

### Étape 2 : Trouver l'URL de la vidéo

Cherchez la ligne qui contient :
```javascript
src="https://player.vimeo.com/video/1128797324?autoplay=1&loop=1&muted=1&background=1&quality=360p"
```

### Étape 3 : Remplacer l'ID de la vidéo

1. **Récupérez l'ID de votre nouvelle vidéo Vimeo**
   - Exemple : Si l'URL est `https://vimeo.com/1234567890`
   - L'ID est : `1234567890`

2. **Remplacez l'ID dans l'URL**
   - Ancien : `.../video/1128797324?...`
   - Nouveau : `.../video/1234567890?...`

### Exemple complet :

**Avant :**
```javascript
src="https://player.vimeo.com/video/1128797324?autoplay=1&loop=1&muted=1&background=1&quality=360p"
```

**Après :**
```javascript
src="https://player.vimeo.com/video/1234567890?autoplay=1&loop=1&muted=1&background=1&quality=360p"
```

**⚠️ Important :**
- Ne modifiez QUE le numéro après `/video/`
- Gardez tout le reste de l'URL identique (`?autoplay=1&loop=1&muted=1&background=1&quality=360p`)
- Ne supprimez pas les guillemets `"`

---

## 📝 Format des données

### Structure d'une vidéo dans videos.json

```json
{
  "id": 1,                              // Numéro unique (entier)
  "title": "Titre du projet",           // Titre principal (texte)
  "url": "https://vimeo.com/1234567890", // URL complète Vimeo (texte)
  "thumbnail": "/images/Image.png",     // Chemin de l'image (texte)
  "soustitre": "Sous-titre",            // Sous-titre (texte)
  "description": "Description"          // Description (texte)
}
```

### Champs obligatoires

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `id` | Nombre | Identifiant unique | `1`, `2`, `11` |
| `title` | Texte | Titre du projet | `"Nike"` |
| `url` | Texte | URL Vimeo complète | `"https://vimeo.com/1151599838"` |
| `thumbnail` | Texte | Chemin de l'image | `"/images/Nike2.png"` |
| `soustitre` | Texte | Sous-titre | `"Air Mercurial"` |
| `description` | Texte | Description | `"Original composition"` |

### Règles importantes

✅ **À faire :**
- Utiliser des guillemets doubles `"` pour tous les textes
- Mettre une virgule `,` entre chaque vidéo
- Utiliser des `id` uniques
- Vérifier que les images existent dans `public/images/`

❌ **À éviter :**
- Oublier les guillemets
- Mettre une virgule après la dernière vidéo
- Utiliser le même `id` deux fois
- Oublier de fermer les accolades `}`

---

## 💡 Exemples pratiques

### Exemple 1 : Ajouter une vidéo pour "Apple"

**1. Préparer l'image :**
- Nom : `Apple.png`
- Placer dans : `public/images/Apple.png`

**2. Ajouter dans videos.json :**
```json
{
  "id": 11,
  "title": "Apple",
  "url": "https://vimeo.com/9876543210",
  "thumbnail": "/images/Apple.png",
  "soustitre": "iPhone 15 Pro",
  "description": "Original composition, sound design, audio mix"
}
```

### Exemple 2 : Mettre "Kansas City Chiefs" en première position

**1. Ouvrir videos.json**
**2. Couper le bloc de "Kansas City Chiefs" (id: 9)**
**3. Le coller en première position (après le `[`)**
**4. Vérifier les virgules**

### Exemple 3 : Changer la vidéo d'entrée

**1. Ouvrir `src/components/VideoPlayer.jsx`**
**2. Trouver la ligne avec `/video/1128797324`**
**3. Remplacer `1128797324` par votre nouvel ID Vimeo**
**4. Sauvegarder**

---

## ❓ Questions fréquentes

### Q : Mon image ne s'affiche pas
**R :** Vérifiez que :
- Le fichier est bien dans `public/images/`
- Le nom dans `thumbnail` correspond exactement au nom du fichier (sensible à la casse)
- Le chemin commence par `/images/`

### Q : Ma vidéo ne se charge pas
**R :** Vérifiez que :
- L'URL Vimeo est complète et correcte
- La vidéo est publique sur Vimeo (ou que vous avez les droits)
- L'ID de la vidéo est correct

### Q : J'ai une erreur de syntaxe
**R :** Utilisez un validateur JSON en ligne (comme jsonlint.com) pour vérifier votre fichier. Les erreurs courantes sont :
- Virgule manquante
- Guillemets manquants
- Accolade non fermée

### Q : Comment tester mes modifications ?
**R :** Après avoir modifié les fichiers :
1. Sauvegardez tous les fichiers
2. Suivez les instructions du README.md pour lancer le site
3. Vérifiez que tout fonctionne correctement

---

## 📞 Besoin d'aide ?

Si vous rencontrez des difficultés :
1. Vérifiez que vous avez bien suivi toutes les étapes
2. Vérifiez la syntaxe JSON avec un validateur en ligne
3. Demander de l'aide à une IA

---

*Dernière mise à jour : Janvier 2026*
