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
*   **Tableau de bord / Collection :** Vue liste ou grille des mangas possédés. Le niveau principal est "L'Œuvre" (ex: *Naruto*). Si l'utilisateur possède plusieurs éditions (Perfect et Standard), elles sont séparées visuellement.
*   **Visualisation des Manquants ("Trous") :** L'interface doit clairement mettre en valeur "Possédé : 45 / 65" et lister de façon évidente les tomes qui séparent le tome 10 du tome 15 (par exemple).

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
