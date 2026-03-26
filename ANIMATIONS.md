# Propositions d'animations Three.js

Three.js est déjà installé et utilisé (`NekoLogoBounce` sur l'auth, `FirefliesBackground` sur les pages auth).
Philosophie : **retenue et intention** — chaque animation sert un moment UX précis sans alourdir.

---

## 1. Scan success — Célébration 3D

**Où :** `src/app/(app)/scan/`

**Déclencheur :** Volume scanné avec succès (réponse API OK)

**Quoi :** Burst de particules/confettis 3D qui sortent du point de scan pendant ~1.5s, avec une icône de livre qui "saute" vers le haut. C'est le moment le plus satisfaisant de l'app — récompenser ce geste a beaucoup de sens.

**Technique :**
- Overlay canvas WebGL par-dessus le scanner
- Additive blending pour l'éclat des particules
- Auto-destroy après la fin de l'animation

---

## 2. VolumeCard — Tilt 3D au hover

**Où :** `src/components/cards/VolumeCard.tsx` — desktop uniquement (`lg:`)

**Déclencheur :** `mousemove` sur une carte volume

**Quoi :** Effet parallax/tilt 3D sur les pochettes de manga — la couverture suit légèrement le curseur avec une inclinaison douce (style "tenir un vrai livre"). Très courant sur les sites premium de manga/BD.

**Technique :**
- `mousemove` → `CSS transform: perspective() rotateX() rotateY()`
- Peut se faire sans Three.js (CSS pur), ce qui est plus léger
- Retour au neutre avec transition `ease-out` au `mouseleave`

---

## 3. Série complétée — Fireworks

**Où :** `src/components/collection/` — au marquage du dernier volume d'une série

**Déclencheur :** Dernier volume marqué comme lu (100% completion)

**Quoi :** Feu d'artifice 3D discret (3–4 bursts) en overlay sur la carte de série pendant ~2s, puis disparaît. Moment émotionnel fort pour les collectionneurs.

**Technique :**
- Canvas WebGL temporaire monté en overlay
- Particles avec vélocités initiales et gravité simulée
- Auto-cleanup après l'animation

---

## 4. Page profil public — Fond de particules thématisé

**Où :** `src/app/(app)/user/[username]/` — hero de la page profil

**Déclencheur :** Chargement de la page

**Quoi :** Fond Three.js léger dans le hero qui reprend la couleur de palette de l'utilisateur. Renforce l'identité visuelle du profil public sans toucher aux stats.

**Technique :**
- Réutiliser l'architecture de `FirefliesBackground.tsx`
- Lire les CSS variables de palette pour la couleur des particules
- Densité réduite par rapport au fond auth

---

## Résumé

| Priorité | Endroit | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Scan success burst | Moyen | Très fort |
| 2 | VolumeCard tilt hover | Faible | Fort (desktop) |
| 3 | Série complétée fireworks | Moyen | Fort (émotionnel) |
| 4 | Profil public bg | Faible | Moyen |

## Ce qu'on évite

- Grilles de volumes — trop de nœuds DOM, risque de lag
- Transitions de pages — déjà gérées par Framer Motion
