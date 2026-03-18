---
name: new-service
description: Generates a complete API service method with its Zod schema and TypeScript interface for the Next.js frontend. Use this skill whenever the user says "nouveau service", "ajoute l'appel API", "crée le service pour X", "nouvelle méthode API", or asks to connect the frontend to a new backend endpoint. Even if the user doesn't say "service" explicitly, trigger this skill when they describe a new API call that needs to be wired up to the frontend.
---

# New Service Generator

Generates three things in one go: a TypeScript interface, a Zod validation schema, and a service method — all wired together following the project's established patterns.

## Step 1 — Gather information

Ask the user for these three things if not already provided:

1. **Endpoint**: HTTP method + path (e.g., `GET /stats`, `POST /loans/bulk`)
2. **Response shape**: The fields and their types returned by the backend (ask them to paste a JSON example or describe the fields)
3. **Paginated?**: Does the response use the standard paginated envelope (`{ data: [...], meta: { current_page, last_page, per_page, total } }`)?

If the user gives partial info, infer what you can from context and ask only for the missing pieces.

## Step 2 — Identify the right files

Choose the target files based on the domain of the new resource:

- **Type file**: `src/types/manga.ts` for manga/series/edition/box/loan/wishlist domains. If the resource is clearly unrelated (e.g., user profile, auth), use or create the appropriate file (e.g., `src/types/user.ts`).
- **Schema file**: `src/schemas/manga.ts` (or the matching domain schema file).
- **Service file**: Pick the most relevant existing service (`manga.service.ts`, `loan.service.ts`, `wishlist.service.ts`, `user.service.ts`, `auth.service.ts`) or propose a new one if none fits.

## Step 3 — Generate in parallel

Generate all three artifacts simultaneously.

### 3a. TypeScript interface → `src/types/*.ts`

Follow the existing interface style:
- Use `interface` (not `type`) for object shapes
- Optional fields use `?`, nullable fields use `| null`
- Arrays of nullable items: `string[] | null`
- Nested relations are optional: `series?: Series | null`

Example shape for a simple resource:
```ts
export interface MyResource {
    id: number;
    name: string;
    description: string | null;
    cover_url: string | null;
    is_active: boolean;
    related?: OtherType | null;
}
```

For paginated responses, reuse the existing `PaginatedSearchResult` pattern — no new interface needed unless the item shape is new:
```ts
export interface PaginatedMyResource {
    data: MyResource[];
    meta: PaginationMeta;
}
```

### 3b. Zod schema → `src/schemas/*.ts`

Follow the anti-corruption layer philosophy: use `.nullable().default(null)` broadly to avoid blocking the UI on partial backend data.

Rules:
- `id: z.number()` — never nullable
- Required strings: `z.string()`
- Optional/nullable strings: `z.string().nullable().default(null)`
- Booleans with a safe default: `z.boolean().default(false)`
- Nullable booleans: `z.boolean().nullable().default(null)`
- Optional arrays: `z.array(...).optional().default([])`
- Nullable arrays: `z.array(...).nullable().default([])`
- Nested objects: `.optional().nullable().default(null)`
- Use `z.lazy(() => OtherSchema)` for circular or forward references
- Use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + `z.ZodType<any>` only when circular references force it

For paginated schemas, follow the `PaginatedSearchResultSchema` pattern exactly:
```ts
export const PaginatedMyResourceSchema = z.object({
    data: z.array(MyResourceSchema),
    meta: PaginationMetaSchema,
});
```

### 3c. Service method → `src/services/*.ts`

**Simple (non-paginated) GET:**
```ts
/** JSDoc describing what this does */
getMyResource: (id: number) =>
    api.get<ApiResponse<MyResource>>(`/my-resources/${id}`).then(r => {
        try {
            return MyResourceSchema.parse(r.data.data);
        } catch (error) {
            console.error("MyResource validation failed:", error);
            return r.data.data as unknown as MyResource;
        }
    }),
```

**Array GET:**
```ts
getAll: () =>
    api.get<ApiResponse<MyResource[]>>('/my-resources').then(r => {
        try {
            return z.array(MyResourceSchema).parse(r.data.data);
        } catch (error) {
            console.error("MyResource list validation failed:", error);
            return r.data.data as unknown as MyResource[];
        }
    }),
```

**Paginated GET** — note: `r.data` directly (no `.data.data`), because the paginated envelope IS the response body:
```ts
search: (query: string, page = 1) =>
    api.get<PaginatedMyResource>(`/my-resources?query=${encodeURIComponent(query)}&page=${page}`).then(r => {
        try {
            return PaginatedMyResourceSchema.parse(r.data);
        } catch (error) {
            console.error("MyResource search validation failed:", error);
            return r.data as unknown as PaginatedMyResource;
        }
    }),
```

**POST (fire-and-forget, no schema needed):**
```ts
create: (payload: CreateMyResourcePayload) =>
    api.post('/my-resources', payload),
```

**POST with response:**
```ts
create: (payload: CreateMyResourcePayload) =>
    api.post<ApiResponse<MyResource>>('/my-resources', payload).then(r => {
        try {
            return MyResourceSchema.parse(r.data.data);
        } catch (error) {
            console.error("MyResource create validation failed:", error);
            return r.data.data as unknown as MyResource;
        }
    }),
```

## Step 4 — Output

Show the three code blocks clearly labeled:

1. **`src/types/[domain].ts` — add this interface**
2. **`src/schemas/[domain].ts` — add this schema**
3. **`src/services/[domain].service.ts` — add this method**

Then ask: "Do you want me to apply these changes to the files directly?"

If yes, apply all three edits in parallel using the Edit tool — append each new export to the appropriate file, placed logically near related items.

## Key rules to remember

- `ApiResponse<T> = { data: T }` — always unwrap with `r.data.data` for simple responses
- Paginated responses use `r.data` directly — the Laravel paginator response IS the envelope
- Always add a JSDoc comment (`/** ... */`) to each service method
- Never use `as any` — use `as unknown as T` for fallback casts
- Import new types/schemas in the service file if they aren't already imported
- `z` is already imported in schema files — don't add a duplicate import
