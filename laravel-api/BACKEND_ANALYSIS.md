# Analyse Backend Laravel — Mangastore

> Analyse réalisée le 2026-03-18. 143 fichiers PHP examinés.

---

## Table des matières

1. [Routes non utilisées](#1-routes-non-utilisées)
2. [Architecture Hexagonale & DDD](#2-architecture-hexagonale--ddd)
3. [Performance — Eager Loading](#3-performance--eager-loading)
4. [Laravel Resources](#4-laravel-resources)
5. [Code mort](#5-code-mort)
6. [Résumé & priorités](#6-résumé--priorités)

---

## 1. Routes non utilisées

### ❌ Route orpheline : `POST /auth/logout`

```php
// routes/api.php
Route::post('/auth/logout', [AuthController::class, 'logout']);
```

Le frontend ne l'appelle jamais (`auth.service.ts` n'a pas de méthode `logout`).
**Conséquence** : les tokens Sanctum ne sont jamais révoqués côté serveur — la déconnexion n'est qu'un oubli de cookie côté client.

### ⚠️ Route partiellement inutilisée : `POST /mangas/scan`

Le frontend utilise `/mangas/scan-bulk` mais jamais `/mangas/scan` seul. La route existe, le controller et l'action aussi.

### ✅ Toutes les autres routes sont utilisées

---

## 2. Architecture Hexagonale & DDD

### 🔴 Violation critique #1 — Eloquent Models dans un Controller

**Fichier** : `app/Http/Api/Controllers/WishlistController.php`

```php
// Ligne ~49 : requête Eloquent directe dans le controller
$edition = EloquentEdition::findOrFail((int) $request->input('edition_id'));

// Ligne ~65 : requête Eloquent directe dans la méthode privée
$volume = EloquentVolume::where('api_id', $apiId)->with('edition')->first();
$box    = EloquentBox::where('api_id', $apiId)->first();
```

Le controller touche directement la couche Infrastructure. La logique de `authorizeApiIdWishlist()` devrait vivre dans un **Action** ou un **Service** de la couche Application.

**Recommandation** : créer une `AuthorizeWishlistAddAction` ou intégrer la vérification dans `AddWishlistItemAction` via le repository (méthode `isOwnedByUser()`).

---

### 🔴 Violation critique #2 — Logique de dispatch dans le Controller

**Fichier** : `app/Http/Api/Controllers/WishlistController.php`

```php
if ($request->has('edition_id')) {
    $item = $editionAction->execute(...);
} else {
    $item = $action->execute($dto);
}
```

La décision de quel cas métier traiter appartient à la couche Application, pas à la couche Presentation. Le controller devrait appeler **une seule action** qui gère les deux cas internement.

---

### 🟡 Violation modérée #1 — Mappers dépendent du statut de chargement Eloquent

**Fichier** : `app/Manga/Infrastructure/Mappers/VolumeMapper.php`

```php
if ($eloquent->relationLoaded('edition') && $eloquent->edition) {
    $edition = EditionMapper::toDomain($eloquent->edition);
}
```

Si la relation n'est pas chargée, le mapper retourne silencieusement `null`. Cela crée des incohérences selon le contexte d'appel. **La responsabilité de charger les relations appartient au Repository**, pas au Mapper.

---

### 🟡 Violation modérée #2 — Condition illogique dans EditionMapper

**Fichier** : `app/Manga/Infrastructure/Mappers/EditionMapper.php`

```php
$volumes = $eloquent->relationLoaded('volumes') && $eloquent->volumes->first()?->title
    ? $eloquent->volumes->map(...)->all()
    : [];
```

Pourquoi vérifier `->title` ? Un volume sans titre est toujours un volume. Cette condition filtre silencieusement des données. Il faudrait uniquement `relationLoaded('volumes')`.

---

### ✅ Ce qui fonctionne bien

- Les Domain Models sont correctement anémiques (pas d'Eloquent, que des getters)
- Les interfaces de Repository sont bien définies et respectées
- Les Actions ne font pas de requêtes Eloquent directes (sauf WishlistController)
- Les namespaces sont cohérents
- Le MorphMap dans AppServiceProvider est bien configuré
- Les DTOs sont bien utilisés pour passer les données entre couches

---

## 3. Performance — Eager Loading

### 🔴 N+1 critique — `EloquentSeriesRepository::findById()`

**Fichier** : `app/Manga/Infrastructure/Repositories/EloquentSeriesRepository.php`

```php
->with([
    'editions' => function ($q) use ($userId) {
        $q->withCount(['volumes as possessed_volumes_count' => ...]);
        $q->withExists(['wishlistedBy as is_wishlisted' => ...]);
        $q->with('firstVolume');
        $q->with(['volumes' => function ($v) use ($userId) {
            $v->withExists(['users as is_owned' => ...]);
            $v->withExists(['wishlistedBy as is_wishlisted' => ...]);
        }]);
    },
    'box_sets' => function ($q) use ($userId) {
        $q->with(['boxes' => function ($b) use ($userId) {
            $b->withExists(['users as is_owned' => ...]);
            $b->withExists(['wishlistedBy as is_wishlisted' => ...]);
        }]);
    },
])
```

Cette requête produit **8 à 12 JOINs** avec des sous-requêtes corrélées. Elle charge TOUTES les éditions, TOUS les volumes, TOUS les coffrets d'une série en une seule passe. Pour une série avec 30 tomes × 3 éditions, cela représente 90+ objets hydratés en mémoire.

**Il n'y a aucune pagination.**

**Recommandation** : séparer les appels (charger les volumes à la demande quand l'utilisateur navigue vers une édition), ou au minimum utiliser `select()` pour limiter les colonnes.

---

### 🟠 Over-fetching haut — `EloquentWishlistRepository::findWishlistByUserId()`

**Fichier** : `app/Manga/Infrastructure/Repositories/EloquentWishlistRepository.php`

```php
$editions = $user->wishlistEditions()
    ->with(['series', 'firstVolume'])
    ->withCount([...])
    ->get(); // Pas de limit()

$boxes = $user->wishlistBoxes()
    ->with('boxSet.series')
    ->get(); // Pas de limit()
```

Aucune pagination. Un utilisateur avec 200 items en wishlist charge 200 objets + toutes leurs relations. **Risque de timeout et de consommation mémoire excessive.**

**Recommandation** : paginer ou limiter à 50 items par défaut.

---

### 🟠 Over-fetching modéré — `EloquentBoxRepository::findById()`

**Fichier** : `app/Manga/Infrastructure/Repositories/EloquentBoxRepository.php`

```php
$query->with(['volumes' => function ($q) use ($userId) {
    $q->withExists(['users as is_owned' => ...]);
    $q->withExists(['wishlistedBy as is_wishlisted' => ...]);
}]);
```

Charge TOUS les volumes d'un coffret sans limite. Un coffret peut contenir 50+ tomes.

---

### 🟡 Chargement redondant — `EloquentLoanRepository`

**Fichier** : `app/Borrowing/Infrastructure/Repositories/EloquentLoanRepository.php`

```php
$morphTo->morphWith([
    EloquentVolume::class => ['edition.series'],
    EloquentBox::class    => ['boxSet.series'],
]);
```

Charge systématiquement `edition.series` (2 niveaux de relation) pour chaque prêt. Si l'affichage n'a besoin que du titre du tome, `edition` seul suffirait.

---

## 4. Laravel Resources

### 🔴 Exposition de données sensibles — `UserResource`

**Fichier** : `app/Http/Api/Resources/UserResource.php`

```php
'email' => $this->resource->getEmail(),
```

`UserResource` est utilisée dans `PublicProfileController` pour les routes publiques `GET /users/{username}`. L'email est donc **visible par n'importe qui** sans être authentifié.

**Recommandation** : créer une `PublicUserResource` sans le champ `email`.

---

### 🟠 Relations chargées sans `whenLoaded` — `SeriesResource`

**Fichier** : `app/Http/Api/Resources/SeriesResource.php`

```php
'editions' => EditionResource::collection($this->resource->getEditions()),
'box_sets' => BoxSetResource::collection($this->resource->getBoxSets()),
```

Pas de conditional loading. Si le Domain Model retourne un tableau vide parce que la relation n'était pas chargée, la resource retourne `[]` sans erreur, masquant un problème de chargement.

Comparer avec `EditionResource` qui utilise correctement `$this->when(...)`.

---

### 🟡 Condition fragile dans `EditionResource`

**Fichier** : `app/Http/Api/Resources/EditionResource.php`

```php
'volumes' => MangaResource::collection(
    $this->when(
        $this->resource->getVolumes() !== [],
        $this->resource->getVolumes()
    )
),
```

La comparaison `!== []` est fragile : un array retourné par le Domain Model sera toujours `[]` si la relation n'était pas chargée (par design du Mapper), mais ce n'est pas garanti. Utiliser `$this->when(!empty(...))` ou gérer au niveau du Mapper.

---

### 🟡 Inconsistance entre Resources

| Resource | Utilise `when()` / `whenLoaded()` | Toujours inclus |
|---|---|---|
| `EditionResource` | ✅ Partiellement | `series`, `volumes` avec `when()` |
| `SeriesResource` | ❌ Non | `editions`, `box_sets` toujours inclus |
| `MangaResource` | ❌ Non | `series`, `edition` toujours inclus |
| `BoxResource` | ❌ Non | `volumes` toujours inclus |
| `BoxSetResource` | ❌ Non | `boxes` toujours inclus |

La convention devrait être uniforme : soit toujours charger, soit toujours utiliser `when()`.

---

## 5. Code mort

### ❌ Méthode jamais appelée — `EloquentSeriesRepository::findByTitle()`

**Fichier** : `app/Manga/Infrastructure/Repositories/EloquentSeriesRepository.php`

Aucun appel dans tout le codebase (actions, controllers, tests). Peut être supprimée.

### ❌ Route + Controller + Action jamais utilisés en prod — `/auth/logout`

Voir section 1.

### ✅ Aucune Action orpheline

Les 21 Actions sont toutes appelées depuis un Controller ou depuis une autre Action.

### ✅ Tous les DTOs sont utilisés (18/18)

---

## 6. Résumé & priorités

### 🔴 P0 — Critique (sécurité / correctness)

| # | Problème | Fichier |
|---|---|---|
| 1 | Email exposé sur profil public | `UserResource.php` |
| 2 | Eloquent Models dans le Controller | `WishlistController.php` |
| 3 | Tokens Sanctum jamais révoqués (logout absent) | `AuthController.php` / `auth.service.ts` |

### 🟠 P1 — Haut (performance)

| # | Problème | Fichier |
|---|---|---|
| 4 | Pas de pagination sur la wishlist | `EloquentWishlistRepository.php` |
| 5 | Requête série : 8-12 JOINs sans pagination | `EloquentSeriesRepository.php` |
| 6 | Volumes d'un coffret chargés sans limite | `EloquentBoxRepository.php` |

### 🟡 P2 — Modéré (qualité / cohérence)

| # | Problème | Fichier |
|---|---|---|
| 7 | Logique de dispatch métier dans Controller | `WishlistController.php` |
| 8 | `when()` / `whenLoaded()` non uniforme dans Resources | `SeriesResource`, `MangaResource`, `BoxResource`, `BoxSetResource` |
| 9 | Condition illogique dans EditionMapper (`->title`) | `EditionMapper.php` |
| 10 | Mappers dépendent de `relationLoaded()` sans garantie | `VolumeMapper.php`, `EditionMapper.php` |

### 🟢 P3 — Nice-to-have

| # | Problème | Fichier |
|---|---|---|
| 11 | Méthode morte `findByTitle()` | `EloquentSeriesRepository.php` |
| 12 | Route `/mangas/scan` inutilisée — documenter ou supprimer | `routes/api.php` |
