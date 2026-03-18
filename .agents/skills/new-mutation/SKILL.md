---
name: new-mutation
description: Generate a React Query useMutation hook with optimistic updates following the project's exact pattern in src/hooks/queries.ts. Use when the user asks to add a new React Query mutation hook, create an optimistic update, wire a service method to React Query, or wants a useMutation for any feature. Triggers: "nouveau hook", "mutation pour X", "ajoute le hook React Query", "hook useMutation", "optimistic update".
---

# New Mutation Hook

Generate a `useMutation` hook following the project's established pattern in `/Users/leoelmy/Projects/mangastore/pwa-client/src/hooks/queries.ts`.

## Project Pattern

The project uses `@tanstack/react-query` with `sonner` toasts. All mutations live in `src/hooks/queries.ts`. The standard optimistic-update pattern is:

```ts
export function useXxx() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: Variables) => someService.method(variables),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.xxx });
            const previous = queryClient.getQueryData<DataType[]>(queryKeys.xxx);
            if (previous) {
                queryClient.setQueryData<DataType[]>(queryKeys.xxx, /* transform */);
            }
            return { previous };
        },
        onError: (err, variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKeys.xxx, context.previous);
            }
            toast.error("Message d'erreur en français");
        },
        onSuccess: () => {
            toast.success("Message de succès en français");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.xxx });
        },
    });
}
```

## Information to Gather

Before generating, collect the following from the user (ask all at once if not provided):

1. **Hook name** — e.g. `useMarkAsRead`, `useDeleteVolume`
2. **Variables type** — TypeScript type/interface for mutation inputs (e.g. `{ id: number; type: 'volume' | 'box' }`)
3. **Service call** — which service and method, e.g. `loanService.markReturned(id, type)`
4. **Query key** — which `queryKeys.*` entry to optimistically update and invalidate (e.g. `queryKeys.loans`)
5. **Cache data type** — TypeScript type of the cached array/object (e.g. `Loan[]`)
6. **Optimistic transform** — how to update the cache data in `onMutate` (describe what field changes, or provide a `.map()` expression)
7. **Toast messages** — success and error messages in French

If the user doesn't supply some details, infer them from context or the existing codebase patterns, but confirm ambiguous points.

## Generation Steps

1. Read `src/hooks/queries.ts` to check for existing `queryKeys` entries and imports needed.
2. If a new `queryKeys` entry is needed, add it to the `queryKeys` object.
3. If a new service import is needed, add it at the top of the file.
4. Append the new hook function following the exact pattern below.
5. Confirm the generated code to the user.

## Code Template

```ts
/** <JSDoc comment describing the mutation in French> */
export function use<HookName>() {
    const queryClient = useQueryClient();
    return useMutation<ReturnType, Error, Variables, { previous: DataType[] | undefined }>({
        mutationFn: (<params>: Variables) => <service>.<method>(<params>),
        onMutate: async (<params>) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.<key> });
            const previous = queryClient.getQueryData<DataType[]>(queryKeys.<key>);
            if (previous) {
                queryClient.setQueryData<DataType[]>(
                    queryKeys.<key>,
                    <optimistic transform using previous>
                );
            }
            return { previous };
        },
        onError: (err, variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKeys.<key>, context.previous);
            }
            toast.error("<error message en français>");
        },
        onSuccess: () => {
            toast.success("<success message en français>");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.<key> });
        },
    });
}
```

## Rules

- **File**: always `src/hooks/queries.ts` (not `src/lib/queries.ts`).
- **Imports**: `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`; `toast` from `sonner`. Add new service imports alphabetically.
- **queryKeys**: use the existing key if one fits; add a new one only when the cache target is genuinely new.
- **Optimistic update**: always use the `onMutate` → snapshot → `setQueryData` → `return { previous }` pattern for mutations that modify existing cached data. For pure-add or pure-delete mutations where no optimistic transform is straightforward, use `onSuccess` invalidation only (like `useAddToCollection`).
- **Rollback**: always restore `context.previous` in `onError` when an optimistic update was applied.
- **Toast language**: always French.
- **TypeScript generics**: include them on `useMutation<TData, TError, TVariables, TContext>` when the context type is non-trivial.
- **JSDoc**: add a one-line French comment above each new function.
- Do not touch unrelated parts of the file.
