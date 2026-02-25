# Rapport d'Analyse de Qualité — Laravel API (`mangastore`)

> Généré le : 2026-02-25  
> Scope : `laravel-api/app/`, `routes/`, `tests/`  
> Standards de référence : [`AGENTS.md`](../AGENTS.md) (DDD, PHPStan L9, PestPHP, Laravel 12)

---

## Légende des priorités

| Symbole | Signification |
|---------|---------------|
| 🔴 | Critique — À corriger immédiatement (bug potentiel, violation DDD majeure) |
| 🟠 | Important — Mauvaise pratique impactant la maintenabilité |
| 🟡 | Amélioration — Refactor recommandé ou dette technique |
| 🟢 | Mineur — Nit, style, documentation |

---

## 1. Violations DDD / Architecture

### 1.1. Interface `MangaLookupServiceInterface` mal placée

- [x] 🔴 **`MangaLookupServiceInterface` est dans `Domain/Repositories/`** alors qu'il s'agit d'un **service** externe (lookup vers une API tierce), pas d'un repository de domaine.  
  Un service externe ne représente pas un accès à un store de données du domaine — il doit vivre dans `Domain/Services/` ou être déclaré via une interface dans `Domain/Services/` et implémenté dans `Infrastructure/Services/`.

  **Fix proposé :**
  ```text
  Créer : app/Manga/Domain/Services/MangaLookupServiceInterface.php
  Déplacer et mettre à jour les imports dans :
    - AddScannedMangaAction.php
    - AddMangaAction.php
    - AddScannedMangaToWishlistAction.php
    - SearchMangaAction.php
    - AppServiceProvider.php
  ```

### 1.2. `VolumeRepositoryInterface` avec des méthodes Wishlist

- [x] 🟠 **`VolumeRepositoryInterface` contient des méthodes liées à la wishlist** (`addWishlistToUser`, `removeWishlistFromUser`, `isWishlistedByUser`, `findWishlistByUserId`).  
  La wishlist est une relation utilisateur distincte — elle devrait être dans un `WishlistRepositoryInterface` dédié ou dans le bounded context `User/`.  
  Cela viole le **Principe de Ségrégation des Interfaces (ISP)** et pollue le contrat du contexte `Manga`.

  **Fix proposé :**
  ```text
  Créer : app/Manga/Domain/Repositories/WishlistRepositoryInterface.php
  Implémenter : app/Manga/Infrastructure/Repositories/EloquentWishlistRepository.php
  Extraire les méthodes concernées de EloquentVolumeRepository vers ce nouveau repo
  Mettre à jour l'injection dans les actions Wishlist et AppServiceProvider
  ```

### 1.3. Duplication massive de logique dans les Actions `AddScannedMangaAction` et `AddScannedMangaToWishlistAction`

- [x] 🔴 **Les actions `AddScannedMangaAction` et `AddScannedMangaToWishlistAction` partagent ~80% du même code** (résolution de série, d'édition, extraction du volume via ISBN, création du volume).  
  Cette duplication est une violation directe du principe **DRY** et crée un risque de désynchronisation entre les deux flows.

  **Fix proposé :**
  ```text
  Extraire la logique commune dans un service applicatif :
    app/Manga/Application/Services/VolumeResolverService.php
  
  Injection de ce service dans les deux actions.
  Le service VolumeResolverService encapsule :
    - findByIsbn ou findByApiId
    - Lookup via MangaLookupServiceInterface si absent
    - Création de la Series si absente
    - Création de l'Edition si absente
    - Création du Volume dans le repository
    - Retourne le Volume prêt à être attaché
  ```

### 1.4. Idem pour `AddMangaAction` vs `AddScannedMangaAction`

- [x] 🟠 **`AddMangaAction` (via `api_id`) duplique aussi la même logique** de résolution Series/Edition/Volume que `AddScannedMangaAction` (via `isbn`). Le pattern est identique à ~90%.

  **Fix :** Même `VolumeResolverService` que ci-dessus, avec deux méthodes : `resolveByIsbn()` et `resolveByApiId()`.

### 1.5. Pas de couche de Domain Exceptions pour les domaines `Manga` et `Borrowing`

- [ ] 🟠 **Aucun dossier `Domain/Exceptions/` n'existe dans `Manga/` ni `Borrowing/`**.  
  Selon l'AGENTS.md, des exceptions métier spécifiques (`MangaNotFoundException`, `AlreadyLoanedException`, etc.) doivent être créées dans la couche Domain.  
  À la place, le code lance des `\Exception` génériques ou des exceptions Symfony HTTP (`NotFoundHttpException`, `BadRequestHttpException`) directement depuis la couche Application.

  **Fix proposé :**
  ```php
  // app/Manga/Domain/Exceptions/MangaNotFoundException.php
  class MangaNotFoundException extends \DomainException {}
  
  // app/Manga/Domain/Exceptions/EditionNotFoundException.php
  class EditionNotFoundException extends \DomainException {}
  
  // app/Borrowing/Domain/Exceptions/AlreadyLoanedException.php
  class AlreadyLoanedException extends \DomainException {}
  
  // app/Borrowing/Domain/Exceptions/LoanNotFoundException.php
  class LoanNotFoundException extends \DomainException {}
  ```
  Puis, mapper ces exceptions dans un `Handler` ou un middleware global vers les codes HTTP appropriés.

### 1.6. `LoanController::index` accède au repository directement, en bypassant la couche Application

- [x] 🟠 **`LoanController::index` injecte `LoanRepositoryInterface` directement dans le contrôleur** au lieu de passer par une Action dédiée.  
  Cela viole la règle architecturale : les contrôleurs ne doivent **jamais** accéder à la couche Infrastructure directement.

  **Fix proposé :**
  ```php
  // Créer : app/Borrowing/Application/Actions/ListLoansAction.php
  class ListLoansAction {
      public function __construct(private readonly LoanRepositoryInterface $loanRepository) {}
      public function execute(int $userId): array {
          return $this->loanRepository->findAllByUserId($userId);
      }
  }
  
  // Mettre à jour LoanController::index pour injecter ListLoansAction
  ```

### 1.7. `MangaHierarchyController` injecte des repositories directement (sans Actions)

- [x] 🟠 **`MangaHierarchyController` injecte `SeriesRepositoryInterface`, `EditionRepositoryInterface` et `VolumeRepositoryInterface` directement** dans son constructeur.  
  Il manque des Actions intermédiaires (`GetSeriesAction`, `ListEditionsAction`, `ListVolumesAction`).

  **Fix proposé :**
  ```text
  Créer :
    app/Manga/Application/Actions/GetSeriesAction.php
    app/Manga/Application/Actions/ListEditionsAction.php
    app/Manga/Application/Actions/ListVolumesByEditionAction.php
  MangaHierarchyController injecte ces Actions.
  ```

### 1.8. L'event `VolumeAddedToCollection` utilise `SerializesModels` (Eloquent) dans la couche Domain

- [ ] 🟡 **`VolumeAddedToCollection` dans `Domain/Events/` utilise le trait `SerializesModels`** de Laravel/Queue, qui est un détail d'infrastructure.  
  De plus, cet event contient un **Domain Model pur** (`Volume`) — si cet event est traité en asynchrone via une queue, la sérialisation/désérialisation ne sera pas triviale avec un POPO.

  **Fix proposé :**  
  - Si l'event est uniquement synchrone : retirer `SerializesModels` (il est inutile pour des POPOs).
  - Si l'event doit être asynchrone : créer un DTO de sérialisation dans l'Infrastructure ou transporter uniquement des IDs.

### 1.9. `AuthController::logout` reconstruit manuellement un objet `User` Domain

- [ ] 🟡 **Dans `AuthController::logout`** (lignes 57-62), le contrôleur reconstruit manuellement un objet `User` Domain depuis l'Eloquent User.  
  Cette conversion est déjà faite (et testée) dans `EloquentUserRepository` → elle doit y rester. Le contrôleur devrait appeler un service ou repository.

  **Fix proposé :**
  ```php
  // Ajouter dans UserRepositoryInterface
  public function findById(int $id): ?User;
  // (déjà implémenté dans EloquentUserRepository, juste l'utiliser)
  
  // Dans LogoutAction, passer directement l'ID et récupérer le domain User
  ```

### 1.10. `AuthController::resetPassword` contient de la logique métier dans le Controller

- [ ] 🟡 La méthode `resetPassword` manipule directement `$user->forceFill()` et `Str::random()` dans un callback du contrôleur. Cette logique doit être encapsulée dans une `ResetPasswordAction`.

---

## 2. Qualité de Code

### 2.1. `MangaResource` fait des requêtes N+1 par Resource

- [x] 🔴 **`MangaResource::toArray` exécute 2 requêtes SQL à chaque sérialisation d'un volume** (lignes 30-32) :
  ```php
  // Ligne 30 — 1 requête par volume
  $request->user()->volumes()->where('volume_id', ...)->exists()
  // Ligne 31 — 1 requête par volume
  Loan::where(...)->whereNull('returned_at')->exists()
  // Ligne 32 — 1 requête par volume
  Loan::where(...)->whereNull('returned_at')->value('borrower_name')
  ```
  Pour une collection de N volumes, cela génère **3N requêtes SQL supplémentaires**.

  **Fix proposé :**
  - Charger les relations `user_volumes` et `manga_loans` en `with()` dans le repository avant de retourner la collection.
  - Ou mieux : enrichir le Domain Model `Volume` avec des champs `isOwned`, `isLoaned`, `loanedTo` peuplés par le repository lors du `findByUserId()`.

### 2.2. `MangaResource` importe une classe Eloquent `Loan` directement (violation DDD)

- [x] 🟠 **Ligne 31-32 dans `MangaResource`** : usage direct de `\App\Borrowing\Infrastructure\EloquentModels\Loan`.  
  La couche Présentation accède à l'Infrastructure directement, cassant l'isolation des bounded contexts.

  **Fix :** Supprimer ces requêtes inline (voir point 2.1) et enrichir le Domain Model.

### 2.3. `EloquentLoanRepository::toDomain` duplique la logique de mapping `Volume`

- [x] 🟠 **`EloquentLoanRepository::toDomain`** (lignes 61-106) duplique entièrement la logique de conversion `Eloquent -> Domain` pour `Volume`, `Edition`, et `Series`.  
  Cette même logique existe dans `EloquentVolumeRepository::toDomain`.

  **Fix proposé :**
  ```text
  Extraire dans un mapper partagé :
    app/Manga/Infrastructure/Mappers/VolumeMapper.php
    app/Manga/Infrastructure/Mappers/EditionMapper.php
    app/Manga/Infrastructure/Mappers/SeriesMapper.php
  
  Exemple d'usage :
    VolumeMapper::toDomain(EloquentVolume $eloquent): Volume
  ```

### 2.4. DTOs avec propriétés en `snake_case` (convention PHP non respectée)

- [ ] 🟡 **`AddMangaDTO::$api_id` et les propriétés des Domain Models** (`edition_id`, `api_id`, `cover_url`, `published_date`, etc.) utilisent le `snake_case` pour des propriétés PHP.  
  PHP/PSR-1 recommande le `camelCase` pour les propriétés de classe.

  **Fix :**
  ```php
  // Avant
  public readonly string $api_id;
  
  // Après
  public readonly string $apiId;
  ```
  Mettre à jour tous les constructeurs et getters en conséquence.

### 2.5. `AddBulkScannedMangasAction` : transaction englobante cassée

- [ ] 🟡 **`AddBulkScannedMangasAction`** crée une transaction globale (`DB::transaction`) mais appelle `AddScannedMangaAction::execute` qui crée elle-même **une transaction imbriquée** avec `DB::transaction`.  
  Bien que PostgreSQL supporte les savepoints, ce pattern peut masquer des comportements inattendus et alourdit la lecture du code.

  **Fix proposé :**  
  Extraire la logique interne de `AddScannedMangaAction::execute` dans une méthode privée non-transactionnelle, et gérer la transaction uniquement au niveau Bulk.

### 2.6. `OpenLibraryLookupService::findByApiId` — implémentation incorrecte

- [x] 🟠 **`findByApiId` dans `OpenLibraryLookupService` appelle `findByIsbn`** (ligne 93) avec l'API ID.  
  Or, l'API ID d'OpenLibrary est une clé de type `/works/OLxxxxxW` ou `/books/OLxxxxxM`, pas un ISBN. Ce fallback est silencieusement incorrect et peut retourner `null` systématiquement en production.

  **Fix :** Implémenter correctement la recherche par ID OpenLibrary ou documenter clairement la limitation avec un log d'avertissement.

### 2.7. `MangaCollectionController` avec des FQCNs inline

- [x] 🟢 **Les méthodes `scanBulk`, `bulkAdd`, `removeVolume`, `removeSeries`** utilisent des FQCNs dans la signature de méthode au lieu d'imports `use` en haut du fichier.  
  C'est une violation du style PSR-12 et de la convention du projet.

  **Fix :** Déplacer tous les FQCNs en imports `use` au top du fichier.

### 2.8. `User` Domain Model n'est pas immuable (propriétés mutables)

- [ ] 🟡 **Le Domain Model `User`** utilise des propriétés privées avec des setters implicites via le constructeur, mais declare ses propriétés avec `private` (mutable par réflexion). Pour un vrai Domain Model en DDD, les propriétés devraient être `private readonly`.

  **Fix :**
  ```php
  public function __construct(
      private readonly string $name,
      private readonly string $email,
      private readonly string $password,
      private readonly ?int $id = null,
      private readonly ?string $username = null,
      private readonly bool $isPublic = false
  ) {}
  ```

---

## 3. Sécurité

### 3.1. `authorize()` retourne toujours `true` dans toutes les FormRequests

- [x] 🟠 **Toutes les `FormRequest` du projet retournent `return true` dans `authorize()`** sans vérification réelle.  
  La protection repose uniquement sur le middleware `auth:sanctum` au niveau de la route, sans aucune vérification d'autorisation granulaire.

  **Fix proposé :** Pour les actions sensibles (prêt, modification, suppression), ajouter des *Policies* Laravel et les référencer dans `authorize()` :
  ```php
  public function authorize(): bool
  {
      return $this->user()->can('loan', Volume::find($this->input('volume_id')));
  }
  ```

### 3.2. Route `/user` expose directement le modèle Eloquent en JSON

- [x] 🟠 **La route `GET /user`** (ligne 8-10 de `api.php`) retourne directement `$request->user()` — le modèle Eloquent brut — sans passer par une `UserResource`.  
  Cela peut exposer des champs sensibles si `$hidden` n'est pas exhaustif.

  **Fix :**
  ```php
  Route::get('/user', fn(Request $request) => new UserResource($request->user()))
      ->middleware('auth:sanctum');
  ```

### 3.3. `LoanController::index` utilise `auth()->user()` au lieu de `$request->user()`

- [x] 🟡 **`LoanController::index`** (ligne 22) utilise `auth()->user()` (façade globale) au lieu d'injecter `Request $request` et d'utiliser `$request->user()`.  
  Cela crée une dépendance implicite sur la façade `Auth`, rendant le code moins testable.

  **Fix :** Utiliser `$request->user()` comme dans les autres contrôleurs. (Sera résolu par la création de `ListLoansAction` en point 1.6)

---

## 4. Design Patterns manquants / opportunités

### 4.1. Pattern `Mapper` absent — mapping Eloquent → Domain dupliqué

- [ ] 🟠 Le code de conversion `Eloquent → Domain` est copié-collé dans `EloquentVolumeRepository::toDomain` et `EloquentLoanRepository::toDomain` (et partiellement dans `EloquentSeriesRepository::toDomain` et `EloquentEditionRepository::toDomain`).  
  Le pattern **Mapper/Assembler** s'impose pour centraliser cette logique.

  _Voir aussi point 2.3._

### 4.2. Pattern `Factory` manquant pour la création de Domain Models

- [ ] 🟡 La création des Domain Models (`Loan`, `Volume`, etc.) depuis les repositories se fait via des constructeurs nommés directement. Envisager des **factory methods statiques** sur les Domain Models pour des cas d'usage courants :
  ```php
  // Domain/Models/Loan.php
  public static function create(int $userId, int $volumeId, string $borrowerName, ?string $notes): self
  {
      return new self(
          id: null,
          userId: $userId,
          volumeId: $volumeId,
          borrowerName: $borrowerName,
          loanedAt: new DateTimeImmutable(),
          notes: $notes
      );
  }
  ```

### 4.3. `Repository::create(array $data)` — interface non-typesafe

- [x] 🟠 **Les interfaces de repository** (`SeriesRepositoryInterface::create`, `VolumeRepositoryInterface::create`, `EditionRepositoryInterface::create`) prennent un `array<string, mixed>` non typé.  
  Cela contourne l'avantage des DTOs et perd toute validation statique. PHPStan Level 9 ne peut pas vérifier la structure.

  **Fix :** Utiliser les DTOs existants ou en créer de nouveaux pour les créations :
  ```php
  // Interface typesafe
  public function create(CreateVolumeDTO $dto): Volume;
  ```

### 4.4. Pattern `Value Object` manquant pour ISBN

- [ ] 🟡 L'ISBN est manipulé comme une simple `string` partout (`ScanMangaDTO`, `VolumeRepositoryInterface`, `MangaLookupServiceInterface`). Un **Value Object** dédié encapsulerait la validation et la normalisation de format (ISBN-10 vs ISBN-13).

  ```php
  // app/Manga/Domain/ValueObjects/Isbn.php
  class Isbn {
      private string $value;
      public function __construct(string $value) {
          if (!preg_match('/^[0-9]{10,13}$/', preg_replace('/[^0-9X]/i', '', $value))) {
              throw new \InvalidArgumentException("Invalid ISBN: $value");
          }
          $this->value = $value;
      }
      public function toString(): string { return $this->value; }
  }
  ```

---

## 5. Tests manquants (relevés par PHPStan + `phpstan_errors.json`)

Les violations suivantes sont confirmées par `phpstan_errors.json` et les règles custom `ActionHasTestRule` / `RepositoryHasTestRule` :

### 5.1. Actions sans tests unitaires

- [x] 🟠 `AddLocalVolumesToEditionAction` — manque `tests/Unit/Manga/Application/Actions/AddLocalVolumesToEditionActionTest.php`
- [x] 🟠 `AddMangaAction` — manque `tests/Unit/Manga/Application/Actions/AddMangaActionTest.php`
- [x] 🟠 `AddScannedMangaAction` — manque `tests/Unit/Manga/Application/Actions/AddScannedMangaActionTest.php`
- [x] 🟠 `ListUserMangasAction` — manque `tests/Unit/Manga/Application/Actions/ListUserMangasActionTest.php`
- [x] 🟠 `RemoveSeriesFromCollectionAction` — manque `tests/Unit/Manga/Application/Actions/RemoveSeriesFromCollectionActionTest.php`
- [x] 🟠 `RemoveVolumeFromCollectionAction` — manque `tests/Unit/Manga/Application/Actions/RemoveVolumeFromCollectionActionTest.php`
- [x] 🟠 `SearchMangaAction` — manque `tests/Unit/Manga/Application/Actions/SearchMangaActionTest.php`

### 5.2. Repositories sans tests unitaires

- [x] 🟠 `EloquentEditionRepository` — manque `tests/Unit/Manga/Infrastructure/Repositories/EloquentEditionRepositoryTest.php`
- [x] 🟠 `EloquentSeriesRepository` — manque `tests/Unit/Manga/Infrastructure/Repositories/EloquentSeriesRepositoryTest.php`
- [x] 🟠 `EloquentVolumeRepository` — manque `tests/Unit/Manga/Infrastructure/Repositories/EloquentVolumeRepositoryTest.php`
- [x] 🟠 `EloquentUserRepository` — manque `tests/Unit/User/Infrastructure/Repositories/EloquentUserRepositoryTest.php`

### 5.3. Tests d'Architecture incomplets (`Arch.php`)

- [ ] 🟡 **Le test arch `domain models should be isolated`** liste `App\*\Domain\Events` comme dépendance autorisée, mais `VolumeAddedToCollection` importe `Illuminate\Foundation\Events\Dispatchable` et `Illuminate\Queue\SerializesModels` (couche Infrastructure/Framework).  
  Le test arch **ne détecte pas** cette violation car le glob `App\*\Domain\Events` est dans la whitelist.

  **Fix :** Ajouter un test arch explicite :
  ```php
  arch('domain events should not depend on infrastructure')
      ->expect('App\*\Domain\Events')
      ->not->toUse(['Illuminate\Queue\SerializesModels']);
  ```

- [ ] 🟡 **Aucun test arch pour la couche `Infrastructure`** (ex : les repositories Eloquent doivent implémenter une interface du Domain, les Services doivent être dans `Infrastructure\Services`).

- [ ] 🟡 **Aucun test arch pour les `Controllers`** (ils ne doivent pas importer de classes `Infrastructure` directement).

---

## 6. Qualité des routes

### 6.1. Routes non RESTful pour le retour de prêt

- [ ] 🟡 **Les routes de retour de prêt** (`POST /loans/return`, `POST /loans/return/bulk`) devraient utiliser `PATCH` (modification d'un état) et s'appuyer sur l'ID de la ressource :
  ```
  PATCH /loans/{id}/return      // retour d'un prêt
  POST  /loans/bulk-return       // retour bulk (acceptable car action spéciale)
  ```

### 6.2. La route `/mangas/search` est hors du groupe `auth:sanctum` sans raison documentée

- [ ] 🟢 **`GET /mangas/search`** (ligne 49) est en dehors du groupe `auth:sanctum`. Si c'est intentionnel (recherche publique), ajouter un commentaire explicite. Sinon, la remettre dans le groupe protégé.

### 6.3. Route `GET /series/{id}` et `DELETE /series/{seriesId}` — conflit de paramètre et méthode différente

- [ ] 🟢 `GET /series/{id}` (ligne 33) et `DELETE /series/{seriesId}` (ligne 31) utilisent des noms de paramètres différents (`id` vs `seriesId`) pour la même ressource. Harmoniser en `seriesId`.

---

## 7. Qualité générale & bonnes pratiques

### 7.1. `AuthController::resetPassword` — callback avec mutation Eloquent directe

- [ ] 🟠 Le callback dans `Password::reset()` (lignes 87-92) manipule `$user->forceFill()` et `->save()` directement. Ce code doit être extrait dans `ResetPasswordAction` ou via un `Listener` sur l'event `PasswordReset` de Laravel.

### 7.2. Absence de gestion d'erreur HTTP sur les lookups API dans les Actions

- [ ] 🟡 Si `MangaLookupServiceInterface::findByIsbn` retourne `null`, `AddScannedMangaAction` lance une `\Exception` générique (ligne 33). Cette exception ne sera pas capturée proprement par Laravel et renverra une 500 au client.  
  Utiliser les Domain Exceptions (point 1.5) et configurer le `Handler` pour les mapper en `404` ou `422`.

### 7.3. `seriesTitle` extraction par regex — logique métier orpheline

- [ ] 🟡 La regex d'extraction du titre de série à partir du titre du volume (`preg_replace('/[,]?\s?[-]?\s?(vol|volume|tome|t|#)...`, présente dans 2 actions) est une règle métier qui devrait vivre dans le Domain (Value Object ou méthode de factory sur `Volume`/`Series`).

### 7.4. `EloquentVolumeRepository::findByUserId` — contournement du domaine `User`

- [ ] 🟢 `EloquentVolumeRepository::findByUserId` (ligne 98) fait un `EloquentUser::findOrFail($userId)` pour accéder aux volumes via la relation. Cela signifie que le repository `Manga` dépend du modèle Eloquent du contexte `User` — c'est un couplage inter-contextes acceptable mais qui mériterait une note de documentation.

### 7.5. `User::getId()` retourne `?int` — risque de null non géré

- [ ] 🟡 **`User::getId()` peut retourner `null`** (utilisateur non encore persisté), et plusieurs endroits du code font `(int) $user->getId()` ou `$user->getId()` sans null-check.  
  Dans `PublicProfileController::showCollection` (lignes 32-35), un null-check est en place mais retourne une 404 peu explicite — envisager une exception métier.

### 7.6. Commentaire en français dans le code source

- [ ] 🟢 Le `AuthController` (lignes 100-105) et `ReadBearerTokenFromCookie` (lignes 10-15) contiennent des **commentaires en français**, ce qui est en contradiction avec la règle de l'AGENTS.md qui stipule que **le code sera écrit en anglais uniquement**.

  **Fix :** Traduire les commentaires en anglais.

### 7.7. Makefile — commandes utiles mais non documentées dans README

- [ ] 🟢 Le `Makefile` existe mais son contenu n'est pas référencé dans le `README.md` du projet. Ajouter une section "Development Commands" au README.

---

## Récapitulatif des actions par priorité

### 🔴 Critique
- [x] 1.3 — Dédupliquer `AddScannedMangaAction` / `AddScannedMangaToWishlistAction` via `VolumeResolverService`
- [x] 1.5 — Créer les Domain Exceptions (`MangaNotFoundException`, `AlreadyLoanedException`, etc.)
- [x] 2.1 — Corriger le problème de N+1 dans `MangaResource`
- [x] 2.6 — Corriger `OpenLibraryLookupService::findByApiId`

### 🟠 Important
- [x] 1.1 — Déplacer `MangaLookupServiceInterface` vers `Domain/Services/`
- [x] 1.2 — Créer `WishlistRepositoryInterface` pour la ségrégation d'interface
- [x] 1.4 — Dédupliquer `AddMangaAction` via `VolumeResolverService`
- [x] 1.6 — Créer `ListLoansAction` (ne pas injecter le repo dans le Controller)
- [x] 1.7 — Créer `GetSeriesAction`, `ListEditionsAction`, `ListVolumesByEditionAction`
- [x] 2.2 — Retirer l'import Eloquent `Loan` de `MangaResource`
- [x] 2.3 — Extraire les Mappers (`VolumeMapper`, `EditionMapper`, `SeriesMapper`)
- [x] 2.7 — Corriger `AuthController::resetPassword` (déplacer dans une Action)
- [x] 3.1 — Ajouter des Policies pour l'autorisation granulaire
- [x] 3.2 — Protéger la route `GET /user` avec `UserResource`
- [x] 4.3 — Typer les méthodes `create` des repositories avec des DTOs
- [x] 5.1 — Créer les 7 tests d'Actions manquants
- [x] 5.2 — Créer les 4 tests de Repositories manquants

### 🟡 Amélioration
- [ ] 1.8 — Retirer `SerializesModels` de l'event Domain
- [ ] 1.9 — Refactorer `AuthController::logout` pour utiliser le repository User
- [ ] 1.10 — Extraire `resetPassword` dans une Action
- [ ] 2.4 — Renommer les propriétés en `camelCase` dans DTOs et Domain Models
- [ ] 2.5 — Refactorer la transaction imbriquée dans `AddBulkScannedMangasAction`
- [ ] 2.8 — Rendre `User` Domain Model immuable (`private readonly`)
- [x] 3.3 — Remplacer `auth()->user()` par `$request->user()` dans `LoanController`
- [ ] 4.2 — Ajouter des factory methods statiques sur les Domain Models
- [ ] 4.4 — Créer le Value Object `Isbn`
- [ ] 5.3 — Renforcer les tests arch (`Arch.php`)
- [ ] 6.1 — Corriger les verbes HTTP pour les routes de retour de prêt
- [ ] 7.2 — Mapper les Domain Exceptions → codes HTTP dans le Handler
- [ ] 7.3 — Déplacer la regex d'extraction du titre de série dans le Domain
- [ ] 7.5 — Gérer `User::getId() === null` de manière explicite

### 🟢 Mineur
- [x] 2.7 — Déplacer les FQCNs inline vers des imports `use` dans `MangaCollectionController`
- [ ] 6.2 — Documenter l'aspect public de la route `/mangas/search`
- [ ] 6.3 — Harmoniser les noms de paramètres de routes (`id` vs `seriesId`)
- [ ] 7.6 — Traduire les commentaires français en anglais dans `AuthController` et `ReadBearerTokenFromCookie`
- [ ] 7.7 — Documenter les commandes `Makefile` dans le README
