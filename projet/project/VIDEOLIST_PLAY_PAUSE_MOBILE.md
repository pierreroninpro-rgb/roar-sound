# Logique play/pause en mode normal (hors fullscreen) – VideoList

## 1. Qui déclenche play/pause ?

### A. Overlay transparent (sur la vidéo)
- **Position** : div en `position: absolute; inset: 0; z-index: 10` au-dessus de l’iframe, en dessous de la navbar (z-index 20).
- **Événements** :
  - `onClick` : si le clic est sur l’overlay (`e.target === e.currentTarget`) et pas sur la navbar / une image → `handlePlayPause()`.
  - `onTouchStart` : même condition → `handlePlayPause()`.
- **Problème** : l’overlay ne fait **pas** `e.stopPropagation()`, donc le clic/touch remonte au **conteneur vidéo**.

### B. Conteneur vidéo (videoContainerRef)
- **Événement** : `onClick={handleVideoClick}` sur tout le conteneur.
- **Effet** : dès qu’un clic/tap arrive au conteneur (après l’overlay), `handleVideoClick()` est aussi appelé.

### C. Bouton play/pause dans la navbar (mode normal)
- **Position** : dans la barre en bas, z-index 20, au-dessus de l’overlay.
- **Événements** : `onClick` et `onTouchStart` avec `e.stopPropagation()` puis `handlePlayPause()`.
- **Effet** : un seul appel à `handlePlayPause()`, pas de propagation au conteneur.

---

## 2. Conséquence sur mobile

Quand tu **tapes sur la vidéo** (sur l’overlay) :

1. **Overlay** : `onTouchStart` ou `onClick` → `handlePlayPause()` (premier toggle).
2. **Propagation** : l’événement remonte au conteneur.
3. **Conteneur** : `onClick` → `handleVideoClick()` (deuxième toggle).

Donc **deux toggles** pour un seul tap : la vidéo peut repasser en pause juste après avoir été lancée, ou l’inverse. Comportement instable = “ça ne fonctionne pas très bien” sur mobile.

Quand tu **tapes sur le bouton play/pause** de la navbar : un seul `handlePlayPause()` (stopPropagation), donc pas de double toggle.

---

## 3. Les deux handlers

- **handlePlayPause()** (overlay + bouton navbar)  
  - Affiche les contrôles, annule le timeout de masquage.  
  - Si lecture → pause.  
  - Si pause → sur mobile appelle `activateSoundOnMobile()` puis `play()`, puis timeout 3 s pour masquer les contrôles.

- **handleVideoClick()** (conteneur)  
  - Fait à peu près la même chose (affiche contrôles, toggle play/pause, `activateSoundOnMobile()` en play, timeout 3 s).  
  - Redondant avec l’overlay quand le tap est sur la vidéo.

---

## 4. Correction proposée

Dans l’overlay, quand on déclenche play/pause, **stopper la propagation** pour que le conteneur ne reçoive pas le clic/touch :

- Dans le `onClick` de l’overlay : après `e.preventDefault()`, appeler `e.stopPropagation()` avant `await handlePlayPause()`.
- Dans le `onTouchStart` de l’overlay : idem, `e.stopPropagation()` avant `await handlePlayPause()`.

Ainsi, un tap sur la vidéo ne déclenche qu’**une seule** fois le toggle (via l’overlay), et le comportement play/pause en mode normal sur mobile redevient cohérent.
