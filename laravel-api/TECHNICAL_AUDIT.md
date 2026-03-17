# Audit Technique — `laravel-api/`
> Analyse DDD & Choix techniques · Généré le 2026-03-17

---

## Légende des priorités

| Niveau | Signification |
|--------|--------------|
| 🔴 **Critique** | Violation directe de l'architecture définie ou bug potentiel |
| 🟠 **Haute** | Dette technique significative ou incohérence notable |
| 🟡 **Moyenne** | Amélioration recommandée, pas bloquant |
| 🟢 **Faible** | Suggestion de polish ou d'optimisation future |

---

## 1. Architecture DDD — Conformité des Bounded Contexts

### 1.1 Structure générale des contextes

- [x] 🟢 **Manga** — 3 couches Application / Domain / Infrastructure bien présentes
- [x] 🟢 **User** — 3 couches conformes
- [x] 🟢 **Borrowing** — 3 couches conformes
- [ ] 🟡 **Contexte manquant : `Auth`** — `LoginAction`, `LogoutAction`, `RegisterUserAction` vivent dans `User/Application/Actions/` alors que l'authentification est conceptuellement distincte de la gestion du profil utilisateur. Envisager un bounded context `Auth` séparé.
- [ ] 🟡 **Absence de contexte `Search`** — `SearchMangaAction`, `MangaDexLookupService`, `OpenLibraryLookupService` font de la recherche externe, qui pourrait mériter son propre contexte plutôt que d'être noyé dans `Manga/`.

---

### 1.2 Couche Domain

- [x] 🟢 Domain Models présents dans tous les contextes (`Volume`, `Series`, `Edition`, `Loan`, `User`…)
- [x] 🟢 Repository interfaces dans `Domain/Repositories/` pour tous les agrégats
- [x] 🟢 Domain Exceptions métier définies (`AlreadyLoanedException`, `VolumeNotInCollectionException`…)
- [ ] 🔴 **`Policies` dans `Domain/`** — `SeriesPolicy` et `VolumePolicy` se trouvent dans `app/Manga/Domain/Policies/`. Les Policies Laravel sont une préoccupation d'**infrastructure / présentation** (elles dépendent du modèle Eloquent `User` et de `Gate`). Elles doivent être déplacées vers `app/Http/` ou `app/Manga/Infrastructure/`.
- [ ] 🔴 **`MangaLookupServiceInterface` dans `Domain/Services/`** — Une interface de service d'appel à une API externe n'est pas de la logique métier pure. Elle doit être dans `Infrastructure/Services/` (avec son implémentation) ou à la rigueur dans `Application/Services/`. Le domaine ne devrait pas savoir qu'il existe une « API de lookup ».
- [ ] 🟠 **`VolumeAddedToCollection` est le seul Domain Event** — Le contexte `Borrowing` ne déclenche aucun événement (`LoanCreated`, `LoanReturned`). Toute intégration future (notifications, statistiques) ne pourra pas s'y accrocher proprement.
- [ ] 🟡 **Aucun `ValueObject`** — Des concepts comme `ISBN`, `BorrowerName`, `EditionType` (Standard/Perfect/Double) se retrouvent sous forme de `string` bruts dans les DTOs et les modèles. Des Value Objects renforceraient la validation à la frontière du domaine.

---

### 1.3 Couche Application

- [x] 🟢 Actions à responsabilité unique respectées (1 action = 1 cas d'usage)
- [x] 🟢 DTOs immutables (`readonly`) utilisés pour transporter les données
- [x] 🟢 `DB::transaction()` présent dans les actions critiques
- [ ] 🟠 **`VolumeResolverService` dans `Application/Services/`** — Ce service orchestre la résolution d'un volume (scan ISBN, lookup externe, création). Il est cependant appelé directement depuis l'Action qui contient aussi la transaction DB. Il serait plus propre de le garder en Application mais de bien séparer sa responsabilité : il ne doit pas appeler directement le repository, uniquement des services d'infra via interfaces.
- [ ] 🟡 **Actions de lecture sans transaction** — Les `ListUserMangasAction`, `ListLoansAction`, etc. n'ont pas besoin de transaction, c'est correct. Mais elles ne bénéficient pas de **read model** dédié ni de query optimization (pas de pagination native, voir §3).
- [ ] 🟡 **DTOs de création (`CreateSeriesDTO`, `CreateVolumeDTO`…) sans utilisation HTTP directe** — Ces DTOs sont construits en interne dans les Actions et non depuis des Requests HTTP. La convention devrait être documentée pour éviter la confusion avec les DTOs « entrants ».

---

### 1.4 Couche Infrastructure

- [x] 🟢 Eloquent Models séparés des Domain Models (pattern `EloquentModels/`)
- [x] 🟢 Mappers présents pour convertir Eloquent ↔ Domain (`VolumeMapper`, `SeriesMapper`…)
- [x] 🟢 Implémentations concrètes des repositories dans `Infrastructure/Repositories/`
- [x] 🟢 **`Console/Commands/` dans les bounded contexts** — `ScrapeMangaCollecCommand` a été déplacé dans `app/Manga/Infrastructure/Console/`.
- [ ] 🟡 **`MangaCollecScraperService` non derrière une interface** — Les autres services de lookup implémentent `MangaLookupServiceInterface`, mais `MangaCollecScraperService` est une classe concrète appelée directement. Incohérence de pattern.

---

## 2. Couche HTTP (Présentation)

- [x] 🟢 Controllers fins : ils construisent le DTO, appellent l'Action, retournent la Resource
- [x] 🟢 Form Requests pour la validation (séparation des responsabilités)
- [x] 🟢 API Resources utilisées systématiquement (pas de `->toArray()` brut)
- [ ] 🔴 **`auth()->id()` sans PHPDoc** — Plusieurs Controllers utilisent `auth()->id()` (retourne `int|null`) sans assertion de type. PHPStan niveau 9 l'exige. La règle AGENTS.md impose `/** @var int $userId */` avant l'usage. À auditer et corriger systématiquement.
- [ ] 🟠 **Route web dans le fichier API** — `GET /reset-password/{token}` est une route qui retourne une redirection ou une vue, elle n'est pas une ressource API REST. Elle devrait être dans `routes/web.php` ou supprimée si le reset est géré côté PWA.
- [ ] 🟡 **`PublicProfileController` sans action dédiée** — Le contrôleur gère directement la logique de récupération de profil public sans passer par une Action de l'Application layer. Rompt le flux Controller → Action → Resource.
- [ ] 🟡 **Absence de versioning API** — Pas de préfixe `/v1/` sur les routes. En cas d'évolution majeure, une migration sera plus complexe.
- [ ] 🟢 **Middleware `ReadBearerTokenFromCookie`** — Bonne pratique PWA pour lire le token Sanctum depuis un cookie HttpOnly. Bien documenté, pas de problème.

---

## 3. Performance & Scalabilité

- [ ] 🔴 **Absence de pagination** — `ListUserMangasAction`, `ListLoansAction`, `ListWishlistAction` retournent des collections entières. Pour un utilisateur avec 500+ volumes, cela peut être très lent et dépasser les limites mémoire. Implémenter `LengthAwarePaginator` ou cursor pagination.
- [ ] 🟠 **N+1 queries potentielles** — Les mappers (`VolumeMapper`, etc.) accèdent aux relations Eloquent une par une. Sans eager loading systématique dans les repositories, le risque de N+1 est élevé. À confirmer via Laravel Telescope sur les endpoints de listing.
- [ ] 🟡 **Absence de cache** — Les recherches externes (MangaDex, OpenLibrary) ne sont pas mises en cache. Un même ISBN appelé 10 fois = 10 appels HTTP. Implémenter un cache Redis/DB sur les résultats de lookup.
- [ ] 🟡 **`BulkLoanMangaAction` : transaction longue** — Le bulk loan itère sur chaque volume dans une transaction unique. Sur des lots importants, le lock DB peut être problématique. À surveiller.
- [ ] 🟢 **Pas de rate limiting sur les endpoints de recherche** — `GET /mangas/search` est public et non throttlé (au-delà du throttle Laravel global). Risque de scraping.

---

## 4. Qualité de code & Typage

- [x] 🟢 PHPStan niveau 9 configuré
- [x] 🟢 Laravel Pint configuré
- [x] 🟢 PHPCS + Slevomat Coding Standards
- [x] 🟢 Règles d'architecture PHPStan custom (`DomainHasTestRule`, `ActionHasTestRule`…)
- [ ] 🟠 **`phpstan_errors.json` présent à la racine** — Ce fichier suggère des erreurs PHPStan non résolues ou exportées pour analyse. À vider et corriger avant tout nouveau développement.
- [x] 🟠 **`toignore.md` à la racine** — Fichier de dette technique non intégré au workflow. Son contenu doit être transformé en issues trackées ou supprimé.
- [ ] 🟡 **Retours de type `mixed` potentiels dans les services de lookup** — Les services externes (`MangaDexLookupService`, `OpenLibraryLookupService`) manipulent des tableaux JSON non typés. Des DTO de réponse (`MangaLookupResultDTO`) renforceraient le typage de bout en bout.

---

## 5. Tests (PestPHP)

- [x] 🟢 Framework PestPHP configuré avec plugins Laravel et Architecture
- [x] 🟢 Règles d'architecture PHPStan garantissant la présence de tests pour chaque composant
- [x] 🟢 `phpunit.domain.xml` séparé pour les tests de domaine à 100%
- [x] 🔴 **Coverage réel non vérifié** — La cible est 95% global / 100% domain, mais sans un rapport de coverage récent dans le repo, il est impossible de confirmer que c'est atteint. `make coverage` doit passer sans exception.
- [ ] 🟠 **Absence de tests de contrat pour les services externes** — `MangaDexLookupService`, `OpenLibraryLookupService` et `MangaCollecScraperService` sont mockés, mais aucun test de contrat (consumer-driven contract) ne garantit que l'API externe n'a pas changé de format.
- [ ] 🟡 **Seeders de test non documentés** — La stratégie de seeding pour les tests est mentionnée dans `AGENTS.md` mais aucun seeder spécifique aux tests n'est visible dans `database/`. À confirmer que les factories couvrent tous les cas edge.

---

## 6. Sécurité

- [x] 🟢 Sanctum avec cookie HttpOnly pour l'authentification PWA
- [x] 🟢 Gate policies sur les opérations sensibles (loan, delete volume/series)
- [x] 🟢 Hash bcrypt/argon2 via le facade `Hash` de Laravel
- [ ] 🟠 **Pas de rate limiting explicite sur les routes d'auth** — Les routes `POST /auth/login` et `POST /auth/register` n'ont pas de throttle dédié visible dans les routes. Laravel applique un throttle global mais un throttle strict sur l'auth (ex: 5 tentatives / minute) est recommandé.
- [ ] 🟠 **`GET /users/{username}/collection` public sans protection de données** — Le profil public expose potentiellement des informations sensibles (quels volumes possède l'utilisateur). Vérifier que `is_public` est bien vérifié avant tout retour de données.
- [ ] 🟡 **Absence de validation de l'ISBN** — `ScanMangaRequest` valide la présence du champ `isbn` mais pas son format (EAN-13). Un `isbn` malformé provoque une erreur non métier dans le service de lookup plutôt qu'une validation HTTP 422 claire.

---

## 7. Configuration & DevOps

- [x] 🟢 Docker avec `docker-compose exec backend` comme golden rule
- [x] 🟢 Makefile avec `make all` couvrant pint + phpcs + stan + tests
- [x] 🟢 Laravel Telescope pour le debug local
- [x] 🟢 `.env.testing` et `.env.ci` séparés
- [ ] 🟠 **`Makefile` sans vérification du statut Docker** — Si Docker n'est pas démarré, `make all` échoue silencieusement avec une erreur Docker peu explicite. Ajouter une cible de pré-check.
- [ ] 🟡 **`vite.config.js` dans `laravel-api/`** — Vite est un outil frontend. Sa présence dans le backend Laravel est inhabituelle (peut-être pour les assets Laravel Mix/Vite par défaut). Si aucun asset frontend n'est compilé ici, ce fichier est un artefact à supprimer.

---

## 8. Récapitulatif par priorité

### 🔴 Critiques (5)
- [x] `Policies` dans `Domain/` → déplacer vers `Infrastructure/` ou `Http/`
- [x] `MangaLookupServiceInterface` dans `Domain/Services/` → déplacer vers `Application/` ou `Infrastructure/`
- [x] `Console/Commands/` hors bounded contexts → déplacer vers `Manga/Infrastructure/Console/`
- [x] `auth()->id()` sans PHPDoc dans les controllers → corriger pour PHPStan niveau 9
- [ ] Absence de pagination sur les endpoints de listing → risque mémoire en production
- [x] Coverage réel non confirmé → faire tourner `make coverage` et corriger les gaps

### 🟠 Hautes (7)
- [ ] Aucun Domain Event dans le contexte `Borrowing`
- [ ] `VolumeResolverService` : clarifier le rôle et les dépendances
- [ ] `MangaCollecScraperService` non derrière une interface
- [ ] `phpstan_errors.json` présent → erreurs non résolues
- [ ] Tests de contrat absents pour les services externes
- [ ] Pas de rate limiting dédié sur les routes d'auth
- [ ] `GET /users/{username}/collection` : vérifier le flag `is_public` systématiquement

### 🟡 Moyennes (10)
- [ ] Contexte `Auth` à séparer de `User`
- [ ] Absence de Value Objects (`ISBN`, `EditionType`…)
- [ ] DTOs de création internes : documenter la convention
- [ ] Route web dans `routes/api.php`
- [ ] `PublicProfileController` sans Action dédiée
- [ ] Absence de versioning API (`/v1/`)
- [ ] N+1 queries potentielles dans les mappers
- [ ] Absence de cache pour les lookups externes
- [ ] Validation du format ISBN manquante
- [x] `toignore.md` à traiter

### 🟢 Faibles (4)
- [ ] Contexte `Search` à extraire de `Manga/`
- [ ] Pas de rate limiting sur `GET /mangas/search` (endpoint public)
- [ ] `vite.config.js` à supprimer si inutilisé
- [ ] Seeders de test à documenter et localiser

---

*Total : 5 critiques · 7 hautes · 10 moyennes · 4 faibles = **26 points d'action***
