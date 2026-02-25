# Documentation Métier - Application de Suivi de Mangathèque

## 1. Description du Projet
Une application "mobile-first" (également disponible sur ordinateur), destinée aux collectionneurs de mangas. Elle permet à un utilisateur de gérer sa collection physique, d'identifier les tomes manquants (ses "trous"), de suivre sa progression de lecture, de lister ses prêts en cours, et de maintenir une liste de souhaits.

L'application s'appuie sur une API externe (ex: OpenLibrary, Google Books, MangaDex) pour récupérer les métadonnées des œuvres (titres, images, codes-barres, nombre de tomes) afin de ne stocker que les données liées à l'utilisateur, ce qui allège considérablement notre base de données.

## 2. Acteurs (Utilisateurs)
*   **Visiteur (Non connecté) :** Peut consulter les profils et collections publiques des autres utilisateurs (selon leurs paramètres de confidentialité).
*   **Utilisateur Connecté :** Possède un compte (Inscription, Connexion, Mot de passe oublié). Il peut gérer l'intégralité de sa mangathèque, de ses prêts et de ses paramètres.

## 3. Entités et Concepts Métiers
*   **Manga (Série) / Œuvre :** Identifié via la recherche. Possède un titre générique, un statut (En cours / Terminé) et une image de couverture globale.
*   **Édition :** Un manga peut posséder plusieurs éditions (ex: Standard, Perfect, Double, etc.).
*   **Tome :** Appartient à une Édition. Est identifié de manière unique (souvent par un code-barres EAN-13/ISBN).
*   **Tome Possédé :** Tome physique appartenant à l'utilisateur. 
*   **Tome Lu :** Propriété temporelle (Date de lecture). Peut s'appliquer à un ou plusieurs tomes.
*   **Tome Prêté :** Tome actuellement chez un ami.
*   **Souhait :** Une œuvre complète que l'utilisateur souhaite acquérir.
*   **Avis/Note :** Une appréciation globale donnée à l'œuvre complète (et non au tome).

## 4. Fonctionnalités Clés et Parcours Utilisateur

### 4.1. Ajout et Gestion des Mangas
*   **Scan de Code-barres :** Mode d'ajout rapide (orienté mobile). L'utilisateur peut scanner plusieurs codes-barres à la chaîne (ex: 3 tomes consécutifs). L'application retrouve automatiquement l'Édition exacte. L'utilisateur valide ensuite l'ajout groupé en un clic.
*   **Recherche Manuelle :** Barre de recherche textuelle. Les résultats affichent l'Œuvre. Au clic de l'Œuvre, l'utilisateur voit les Éditions existantes. Il peut alors très facilement ajouter l'intégralité d'une série ou sélectionner certains tomes spécifiques à l'aide de cases à cocher (checkboxes).
*   **Vue Collection (Séries) :** La vue principale affiche les Mangas (Séries). C'est le point d'entrée de la mangathèque de l'utilisateur.
*   **Vue Détail Série :** Au clic sur une série depuis la collection, la vue s'ouvre pour montrer les Éditions possédées. Un indicateur de complétion avec barre de progression et chiffres ("Possédé : 45 / 65") est affiché. Un bouton permet d'ajouter tous les tomes d'une édition d'un seul coup.
*   **Vue Détail Édition :** Au clic sur une édition, on affiche tous les volumes (tomes) correspondants. Les tomes manquants sont rendus très identifiables par leur image de couverture en Noir & Blanc. Un mode de sélection multiple (multisélection) permet de cocher facilement les tomes nouvellement acquis pour les rajouter à la collection.

### 4.2. Suivi de Lecture et Notation
*   **Marquer comme "Lu" :** Validation unitaire (tome par tome) ou globale (marquer toute la série comme lue). Applique la date du jour.
*   **Annuler la lecture :** Bouton de réinitialisation simple (unitaire ou sur série complète) pour passer en statut "Non Lu".
*   **Donner son avis :** Sur la fiche du Manga, l'utilisateur peut laisser une Note (ex: sur 10) et un Commentaire textuel global pour la série.

### 4.3. Gestion des Prêts
*   **Interface Prêts :** Un onglet dédié permet de voir *qui* a *quoi*.
*   **Déclarer un prêt :** Sélection depuis la collection d'un tome possédé, puis saisie libre du nom de la personne (ex: "Alexandre") via un simple champ texte.
*   **Retour de prêt :** L'utilisateur clique sur "Rendu". Le prêt disparaît (il n'y a pas d'historique conservé dans l'affichage).
*   *Note métier :* Le statut "Prêté" n'empêche pas le statut "Lu". Un tome peut être prêté mais marqué comme lu.

### 4.4. Liste de Souhaits (Wishlist)
*   Ajout de la série complète uniquement. Il n'est pas possible de mettre seulement "Tome 3 de One Piece" en souhait ; on y met "One Piece".

### 4.5. Profil Public et Confidentialité (Privacy)
Chaque utilisateur dispose d'une page profil "Publique".
Depuis ses paramètres de compte, il gère 3 interrupteurs (Toggles) de visibilité :
1.  **Ma Mangathèque :** Afficher / Cacher ses tomes possédés et manquants.
2.  **Ma Liste de Souhaits :** Afficher / Cacher ses souhaits d'acquisition.
3.  **Mes Avis :** Afficher / Cacher les notes et commentaires donnés sur les œuvres.
*Règle stricte :* L'onglet et les informations de "Prêts" restent **toujours** cachés du public.

## 5. Détails d'Implémentation et Tests

Afin de garantir une implémentation robuste de ces parcours métiers, les développements doivent inclure des choix techniques précis et une couverture de tests systématique, notamment pour la navigation dans la Collection.

### 5.1. Implémentation Backend (API)
*   **Architecture Endpoints :** Prévoir des routes séparant clairement la hiérarchie : liste des séries, détails/éditions d'une série, liste des volumes d'une édition.
*   **Données Enrichies :** Les réponses API (Resources) doivent inclure un booléen `is_owned` pour chaque volume, ainsi que le calcul de complétion de l'édition (nombre possédé vs nombre total) pour la barre de progression.
*   **Actions DDD Groupées :** Mettre en place des actions (Application Layer) gérant l'ajout multiple en une seule transaction : ajout d'une édition complète, ou ajout d'un tableau d'IDs de volumes.

### 5.2. Implémentation Frontend (PWA)
*   **Routage :** Les vues doivent disposer de leurs propres routes pour permettre le retour en arrière (ex: `/collection/series/[id]` et `/collection/editions/[id]`).
*   **UI/UX :** L'effet Noir & Blanc pour les tomes manquants sera géré simplement via la propriété CSS `filter: grayscale(100%)`.
*   **Interactivité :** Lors d'ajouts multiples via le système de cases à cocher, le state (ou le cache API) doit être mis à jour instantanément pour que la barre de progression de la série parente soit actualisée.

### 5.3. Tests d'Intégration Systématiques
Aucune nouvelle vue ou règle d'affichage ne doit être développée sans tests associés :
*   **PestPHP (Backend) :** Tests d'intégration de bout en bout pour s'assurer que l'ajout en masse met bien à jour toutes les tables pivots et les événements métiers, et que l'API renvoie le bon ratio de complétion.
*   **Tests Unitaires et Intégration :** Chaque fonctionnalité critique doit être couverte par des tests unitaires (Backend via PestPHP) et validée manuellement ou via des tests de composants (Frontend).
