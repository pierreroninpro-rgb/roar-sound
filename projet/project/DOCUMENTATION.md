# Documentation du Projet ROAR

## Vue d'ensemble

Ce projet est une application React pour le studio ROAR, spécialisé dans la musique et le design sonore. L'application présente un portfolio de vidéos avec une interface moderne et responsive.

---

## Structure du Projet

### Pages (`src/pages/`)

#### 1. **Home.jsx** - Page d'accueil
**Fonctionnalités principales :**
- Affiche une vidéo Vimeo en arrière-plan en plein écran
- Gère le verrouillage de l'orientation en portrait sur mobile
- Système de chargement avec loader animé (5 points)
- Bouton "Enter" pour naviguer vers la page Projects
- Bouton de contrôle du son (mute/unmute) pour la vidéo
- Animation de fade-in/fade-out lors du chargement
- Responsive : adapté mobile et desktop

**Composants utilisés :**
- `Navbar` : Barre de navigation
- `VideoPlayer` : Lecteur vidéo Vimeo
- `LoaderHome` : Animation de chargement
- `EnterButton` : Bouton d'entrée
- `SoundButton` : Contrôle du son

**États :**
- `loading` : État de chargement de la vidéo
- `isLandscape` : Détection de l'orientation paysage

---

#### 2. **Projects.jsx** - Page des projets
**Fonctionnalités principales :**
- Affiche la liste complète des vidéos avec carrousel
- Preloader avec logo ROAR et animation de points
- Gestion du mode plein écran pour les vidéos
- Verrouillage de l'orientation en portrait (sauf en plein écran)
- Navigation avec navbar
- Fond gris clair (#F6F6F6)

**Composants utilisés :**
- `Navbar` : Barre de navigation
- `VideoList` : Liste principale des vidéos avec lecteur
- `Preloader` : Écran de chargement initial

**États :**
- `isFullscreen` : Mode plein écran actif/inactif
- `isLoading` : État de chargement (minimum 500ms)

---

#### 3. **About.jsx** - Page à propos
**Fonctionnalités principales :**
- Présentation du studio ROAR
- Informations de contact (email)
- Verrouillage de l'orientation en portrait sur mobile
- Design responsive avec versions mobile et desktop
- Fond gris clair (#F6F6F6)

**Contenu :**
- Description du studio
- Liste des clients passés (Converse, Ad Council, Giveon, Kansas City Chiefs)
- Coordonnées de contact (Pierre Ronin, Aristide Rosier)

---

### Composants (`src/components/`)

#### 1. **Navbar.jsx** - Barre de navigation
**Fonctionnalités principales :**
- Logo "ROAR music & sound." cliquable (redirige vers /Projects)
- Bouton "Info" cliquable (redirige vers /About)
- Marges horizontales fixes et responsives :
  - Mobile (≤820px) : 14px
  - Desktop (>820px) : 42.5px
- Typographie Helvetica Neue avec différentes tailles et poids
- Calcul automatique des marges selon la largeur d'écran

**Props :** Aucune

**États :**
- `horizontalMargin` : Marge horizontale calculée dynamiquement

---

#### 2. **VideoPlayer.jsx** - Lecteur vidéo Vimeo
**Fonctionnalités principales :**
- Intégration d'une vidéo Vimeo en plein écran
- Auto-play, loop, muted par défaut
- Qualité 360p pour performance
- Animation de fade-in au chargement
- Fond de couleur #F6F6F6 pour transition fluide
- Dimensions adaptatives pour couvrir tout l'écran

**Props :**
- `onVideoLoad` : Callback appelé quand la vidéo est chargée
- `videoRef` : Référence pour contrôler le lecteur depuis le parent

**Fonctionnalités techniques :**
- Utilise l'API Vimeo Player
- Dimensions calculées avec `max()` pour couvrir tout l'écran
- Transform pour centrer la vidéo

---

#### 3. **VideoList.jsx** - Liste principale des vidéos
**Fonctionnalités principales :**
- Affichage d'une vidéo sélectionnée avec lecteur Vimeo
- Carrousel interactif pour naviguer entre les vidéos
- Mode plein écran avec letterboxing
- Contrôles vidéo personnalisés :
  - Play/Pause
  - Barre de progression (draggable)
  - Contrôle du volume (mute/unmute)
  - Bouton plein écran
- Informations vidéo (titre, sous-titre, description)
- Calculs complexes de dimensions responsives :
  - Marges fixes (ne changent pas avec la taille)
  - Hauteur vidéo proportionnelle
  - Espacements adaptatifs selon la taille d'écran
- Gestion des breakpoints :
  - Mobile : ≤500px
  - Tablette : 500px - 1024px
  - Tablette large : 900px - 1100px (7 images dans le carrousel)
  - Desktop : ≥1024px
- Masquage automatique des contrôles après inactivité
- Support tactile pour la barre de progression

**Props :**
- `onFullscreenChange` : Callback pour notifier les changements de mode plein écran

**États principaux :**
- `selectedVideo` : Vidéo actuellement sélectionnée
- `isPlaying` : État de lecture
- `progress` : Progression de la vidéo (0-100)
- `isFullscreen` : Mode plein écran
- `showControls` : Affichage des contrôles
- `isMuted` : État du son
- `spacing` : Dimensions et espacements calculés

**Fonctionnalités avancées :**
- Calcul adaptatif des hauteurs pour tenir dans 100vh
- Gestion du letterboxing en plein écran
- Drag & drop sur la barre de progression
- Throttling des mises à jour pendant le drag
- Prévention des double-seek (tactile + clic)

---

#### 4. **Carrousel.jsx** - Carrousel principal (utilisé dans VideoList)
**Fonctionnalités principales :**
- Carrousel infini avec défilement horizontal
- Contrôle par souris : vitesse progressive selon la distance du curseur au centre
- Contrôle tactile : swipe pour faire défiler
- Auto-centrage au clic sur une image
- Dimensions responsives :
  - Mobile (≤820px) : 3 images visibles, padding 20px
  - Tablette (820px - 1024px) : 5 images visibles
  - Tablette large (900px - 1024px) : 7 images visibles
  - Desktop (≥1024px) : 9 images visibles
- Calcul automatique des dimensions pour remplir la largeur
- Images uniformes (même largeur et hauteur)
- Titres sous chaque image avec bordure si sélectionné
- Animation fluide avec requestAnimationFrame
- Wrapping infini (boucle)

**Props :**
- `videos` : Liste des vidéos à afficher
- `onSelectVideo` : Callback lors de la sélection d'une vidéo
- `selectedVideo` : Vidéo actuellement sélectionnée
- `carouselBottomMargin` : Marge en bas (optionnel, défaut: 60)

**États :**
- `items` : Positions calculées des éléments
- `dimensions` : Dimensions des cartes (largeur, hauteur, gap)
- `isMobile` : Détection mobile
- `isTablet` : Détection tablette

**Fonctionnalités techniques :**
- Vitesse progressive : plus le curseur est éloigné du centre, plus c'est rapide
- Dead zone de 50px au centre (pas de mouvement)
- Vitesse maximale : 20px/frame
- Auto-centrage avec pause de 300ms après centrage
- Wrapping pour créer une boucle infinie

---

#### 5. **Carousel.jsx** - Carrousel alternatif (non utilisé actuellement)
**Fonctionnalités principales :**
- Version alternative du carrousel avec dimensions Figma exactes
- Sur mobile : dimensions précises depuis Figma (390×826)
  - Image centrale : 86px × 154px
  - Images latérales : 72px × 129px
- Sur desktop : dimensions Figma (1440×885)
- Animation progressive des dimensions (pas de scale, interpolation)
- Positions exactes calculées depuis Figma

**Note :** Ce composant semble être une version de développement/test avec des dimensions Figma précises.

---

#### 6. **EnterButton.jsx** - Bouton d'entrée
**Fonctionnalités principales :**
- Bouton "Enter" centré sur la page d'accueil
- Apparaît après le chargement de la vidéo
- Animation avec GSAP (opacity)
- Redirection vers /Projects au clic
- Style Helvetica Neue, couleur gris clair

**Props :**
- `show` : Boolean pour afficher/masquer le bouton

---

#### 7. **SoundButton.jsx** - Bouton de contrôle du son
**Fonctionnalités principales :**
- Bouton pour activer/désactiver le son de la vidéo
- Positionné en bas à droite
- Disparaît après le premier clic
- Animation avec GSAP
- Utilise l'API Vimeo Player pour contrôler le volume
- Support des safe areas (notch iPhone)

**Props :**
- `videoRef` : Référence vers l'iframe vidéo
- `show` : Boolean pour afficher/masquer le bouton

**États :**
- `isMuted` : État du son (muted/unmuted)
- `showSoundIcon` : Affichage de l'icône

---

#### 8. **Preloader.jsx** - Écran de chargement (page Projects)
**Fonctionnalités principales :**
- Logo ROAR avec animation de zoom (0.7 → 1.3)
- 5 points de chargement animés (stagger animation)
- Fond gris clair (#F6F6F6)
- Fade out après la durée spécifiée
- Animation infinie des points jusqu'au fade out

**Props :**
- `onComplete` : Callback appelé après le fade out
- `duration` : Durée avant le fade out (défaut: 500ms)

**Animations :**
- Logo : scale transition (0.35s)
- Points : scale + opacity avec stagger (0.6s, repeat infinite, yoyo)

---

#### 9. **LoaderHome.jsx** - Loader de la page d'accueil
**Fonctionnalités principales :**
- 5 points blancs animés
- Fond noir
- Animation GSAP avec stagger, yoyo, repeat infinite
- Utilisé pendant le chargement de la vidéo Vimeo

**Props :**
- `overlayRef` : Référence pour l'animation de fade out

---

#### 10. **VideoHome.jsx** - Composant vidéo d'accueil (non utilisé actuellement)
**Fonctionnalités principales :**
- Version alternative de la page d'accueil
- Intègre directement la vidéo Vimeo
- Loader intégré
- Boutons Enter et Sound intégrés

**Note :** Ce composant semble être une version de développement/test.

---

### Hooks (`src/hooks/`)

#### 1. **useOrientation.js** - Détection de l'orientation
**Fonctionnalités principales :**
- Détecte si l'écran est en mode paysage ou portrait
- Écoute les changements de taille de fenêtre
- Écoute les changements d'orientation (mobile)
- Support des anciens navigateurs (orientationchange)

**Retourne :**
- `isLandscape` : Boolean (true si paysage, false si portrait)

**Utilisation :**
Utilisé dans toutes les pages pour gérer le verrouillage d'orientation et les styles responsives.

---

## Fonctionnalités Globales

### Responsive Design
- **Mobile** : ≤820px (ou ≤500px selon le composant)
- **Tablette** : 820px - 1024px (ou 500px - 1024px)
- **Desktop** : ≥1024px

### Orientation
- Verrouillage automatique en portrait sur mobile
- Détection de l'orientation avec le hook `useOrientation`
- Gestion spéciale en mode plein écran (pas de verrouillage)

### Animations
- **GSAP** : Utilisé pour toutes les animations
- Animations de fade-in/fade-out
- Animations de scale
- Stagger animations pour les loaders

### Typographie
- **Helvetica Neue** : Police principale
- Poids disponibles : 100, 300, 400, 500, 700
- Tailles responsives selon les breakpoints

### Couleurs
- **Gris clair** : #F6F6F6 (fond)
- **Gris moyen** : #D1D1D1 (custom-grey)
- **Gris foncé** : #494949 (grey-dark)
- **Gris très foncé** : #272727 (grey-darker)
- **Noir** : #000000 (fond loader)

---

## Routes

- `/` : Page d'accueil (Home)
- `/Projects` : Page des projets (liste de vidéos)
- `/About` : Page à propos

---

## Technologies Utilisées

- **React** : Framework principal
- **React Router** : Navigation
- **GSAP** : Animations
- **Vimeo Player API** : Lecteur vidéo
- **Tailwind CSS** : Styles utilitaires
- **CSS personnalisé** : Styles spécifiques

---

## Fichiers de Configuration

### `index.css`
- Définition des polices Helvetica Neue (@font-face)
- Configuration Tailwind
- Variables CSS personnalisées
- Classes utilitaires (scrollbar-hide, no-scrollbar)
- Reset CSS minimal

### `App.jsx`
- Configuration du routeur
- Définition des routes principales

---

## Notes Techniques

### Performance
- Lazy loading des vidéos Vimeo
- Qualité vidéo réduite (360p) pour performance
- Throttling des mises à jour pendant les interactions
- Utilisation de `requestAnimationFrame` pour les animations fluides

### Accessibilité
- Attributs `alt` sur les images
- Titres sur les iframes
- Support du clavier (navigation)

### Compatibilité
- Support des safe areas (iPhone notch)
- Fallback pour les anciens navigateurs
- Gestion des erreurs de chargement vidéo

---

## Structure des Données

### Format des Vidéos
```javascript
{
  id: string,           // Identifiant unique
  title: string,        // Titre de la vidéo
  subtitle?: string,    // Sous-titre (optionnel)
  description?: string, // Description (optionnel)
  thumbnail: string,    // URL de la miniature
  url: string,          // URL Vimeo de la vidéo
  alt?: string          // Texte alternatif
}
```

---

## Points d'Attention

1. **Carrousel** : Deux versions existent (`Carrousel.jsx` et `Carousel.jsx`). `Carrousel.jsx` est celle utilisée actuellement.

2. **Breakpoints** : Les breakpoints peuvent varier légèrement selon les composants (820px vs 500px pour mobile).

3. **Marges fixes** : Les marges horizontales sont fixes et ne changent pas proportionnellement avec la taille d'écran.

4. **Orientation** : Le verrouillage d'orientation nécessite une interaction utilisateur sur certains navigateurs.

5. **Vimeo API** : Nécessite une clé API Vimeo pour certaines fonctionnalités avancées.

---

## Maintenance

### Ajouter une nouvelle vidéo
1. Ajouter l'entrée dans le fichier JSON des vidéos
2. Vérifier que l'URL Vimeo est valide
3. Ajouter une miniature si nécessaire

### Modifier les breakpoints
Les breakpoints sont définis dans chaque composant. Vérifier la cohérence entre les composants.

### Modifier les animations
Toutes les animations utilisent GSAP. Modifier les durées et easing dans les composants concernés.

---

*Dernière mise à jour : Janvier 2026*
