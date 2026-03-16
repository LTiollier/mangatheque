# Rapport d'Analyse Design et Ergonomie - Mangathèque

## 1. État des lieux (Analyse de l'existant)

Le site actuel présente une structure de type "Tableau de Bord" (Dashboard) classique, très orientée gestion administrative. Bien que fonctionnel, il manque d'une identité visuelle forte liée à l'univers du manga et souffre de quelques lacunes ergonomiques.

### Points Forts
- **Navigation claire** : Le menu latéral permet d'accéder rapidement aux fonctionnalités principales.
- **Réactivité** : L'interface est fluide et les pages se chargent rapidement.
- **Fonctionnalités clés présentes** : Scan, Recherche, Collection, Prêts, Wishlist.

### Points Faibles & Problèmes Ergonomiques
- **Esthétique générique** : Le thème sombre violet/bleu est très "SaaS/Admin" et ne reflète pas la passion de la collection de mangas.
- **Optimisation PWA limitée** : La barre latérale sur grand écran est encombrante, et sur mobile, elle oblige à passer par un menu burger, ce qui ralentit la navigation.
- **Hiérarchie visuelle** : Les informations importantes (nombre de tomes manquants, progression de lecture) ne sautent pas aux yeux.
- **Pages vides** : La page de recherche est trop dépouillée avant la première saisie.
- **Manque de "visuel"** : Pour un média aussi graphique que le manga, les couvertures ne sont pas assez mises en valeur.

---

## 2. Propositions d'Amélioration (Design & Ergonomie)

L'objectif est de transformer l'application d'un simple "outil de gestion" en un "compagnon de collection" immersif et moderne.

### A. Identité Visuelle (Le "Manga Feel")
- **Typographie** : Utiliser des polices plus dynamiques et modernes (type *Inter* pour le corps, et une police plus stylisée pour les titres).
- **Style Graphique** :
    - Introduire des éléments subtils rappelant le manga (trames de fond, bordures de cases, onomatopées stylisées en arrière-plan).
    - Passer d'un violet uniforme à des couleurs d'accentuation plus vibrantes selon les genres (ex: Rouge/Orange pour le Shonen, Rose/Mauve pour le Shojo).
- **Mode Sombre / Clair** : Proposer un mode clair bien fini, car beaucoup de lecteurs préfèrent lire sur fond blanc (comme le papier).

### B. Ergonomie & Navigation (Mobile First)
- **Barre de Navigation Inférieure (Bottom Nav)** : Pour la version PWA (mobile), remplacer le menu burger par une barre de navigation en bas (Accueil, Collection, Scan, Profil).
- **Bouton d'Action Flottant (FAB)** : Ajouter un bouton "+" persistant pour accéder instantanément au scanner, quelle que soit la page.
- **Dashboard Dynamique** :
    - Remplacer les cartes statiques par des widgets plus informatifs.
    - Ajouter une section "À lire ensuite" ou "Prochaines sorties".
- **Collection Interactive** :
    - Proposer plusieurs vues : Grille de couvertures (très visuel), Liste compacte (gestion), et par Éditeur.
    - Ajouter des filtres rapides (Genre, Statut, Possédé/Manquant).

### C. Expérience Utilisateur (UX)
- **Recherche Enrichie** : Afficher les mangas populaires ou les dernières recherches dès que l'utilisateur clique sur la barre de recherche.
- **Détails de Série** :
    - Mettre l'accent sur la couverture en grand format.
    - Afficher une barre de progression visuelle (ex: "45% de la série complétée").
    - Ajouter des raccourcis pour marquer un tome comme "lu" ou "prêté" directement depuis la liste.
- **Wishlist** : Rendre la wishlist plus attractive avec des alertes de prix ou des liens vers des sites d'achat (si possible).

---

## 3. Plan d'Action Recommandé

1.  **Refonte de la Navigation** : Implémenter la Bottom Nav pour mobile et affiner la Sidebar pour desktop. (Terminé)
2.  **Mise à jour de la Charte Graphique** : Définir une palette de couleurs plus dynamique et choisir de nouvelles polices. (Terminé)
3.  **Refonte du Dashboard** : Créer une page d'accueil plus accueillante avec des statistiques visuelles de la collection. (Terminé)
4.  **Optimisation de la Vue Collection** : Améliorer les cartes de mangas pour mettre les couvertures au centre de l'expérience. ✅
5.  **Polissage des Interactions** : Ajouter des micro-animations (transitions de pages, feedback de scan) pour renforcer l'aspect "App Premium". ✅
