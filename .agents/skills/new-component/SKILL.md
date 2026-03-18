---
name: new-component
description: Generate a new React component following the mangastore design system. Trigger on phrases like "nouveau composant", "crée le composant X", "ajoute un composant", "génère le composant", "create component", "new component".
---

# New Component Skill

Generate a new React/Next.js component that follows the exact design system used in the mangastore PWA.

## Design System Reference

All components in this project share the following conventions:

**Dark slate palette:**
- Container backgrounds: `bg-slate-900/30`
- Borders: `border-slate-800`
- Rounded corners: `rounded-2xl` (cards), `rounded-3xl` (section wrappers)
- Body text: `text-slate-400` / `text-slate-500`
- Headings: `text-slate-200`

**Card variants:**
- Aspect ratio: `aspect-[2/3]`
- Gradient overlay: `bg-gradient-to-t from-black/95 via-black/20 to-black/10`
- Hover opacity reveal: `opacity-0 group-hover:opacity-100 transition-opacity duration-300`
- Scale on hover: `hover:scale-[1.02] hover:-translate-y-1`
- Parent must have `group` class: `<div className="group relative block">`
- Hover slide-in for actions: `translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300`
- Slide-up for bottom info: `translate-y-2 group-hover:translate-y-0 transition-transform duration-300`

**Icons:** Always import from `lucide-react`. Use `Loader2` with `animate-spin` for loading states.

**Loading / disabled states:**
- Button: `disabled={isLoading}` + `{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon />}`
- Form submit: `disabled={isLoading || !isFormValid}`

**Client components:** Add `"use client";` at the top when using hooks (`useState`, `useEffect`, context) or event handlers.

**Utility:** Use `cn()` from `@/lib/utils` for conditional class merging.

**File location:** `src/components/<category>/<component-name>.tsx` using kebab-case.

**Export style:** Named export — `export function ComponentName(...)`.

## Process

1. **Gather information** — Ask the user for:
   - Component name (PascalCase)
   - Component type: `card` | `form` | `display` | `interactive`
   - Props needed (names, types, whether optional)
   - Whether it needs client-side interactivity (`"use client"`)
   - Target subdirectory under `src/components/` (e.g. `manga`, `collection`, `ui`)

   If the user's message already contains this information, skip asking and proceed directly.

2. **Generate the component** following the templates below.

---

## Templates

### Card component

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Loader2, /* other icons */ } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ${ComponentName}Props {
  // required props
  href?: string;
  isLoading?: boolean;
  className?: string;
}

export function ${ComponentName}({
  href,
  isLoading,
  className,
}: ${ComponentName}Props) {
  const CardContent = (
    <div
      className={cn(
        "relative aspect-[2/3] w-full bg-card rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-2xl",
        href && "cursor-pointer",
        className
      )}
    >
      {/* Cover image goes here */}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/10 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Hover actions — top right */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
        <Button
          size="icon"
          className="h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg border-2 border-background"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* handler */ }}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : </* Icon */ className="h-5 w-5" />}
        </Button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="space-y-0.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white font-display font-black text-base leading-tight line-clamp-2 uppercase tracking-tight drop-shadow-2xl">
            {/* title */}
          </h3>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group relative block">
        {CardContent}
      </Link>
    );
  }

  return <div className="group relative block">{CardContent}</div>;
}
```

### Form component

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, /* other icons */ } from "lucide-react";

interface ${ComponentName}Props {
  onSubmit: (value: string) => void;
  isLoading?: boolean;
}

export function ${ComponentName}({ onSubmit, isLoading = false }: ${ComponentName}Props) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <div className="relative flex-1">
        {/* Optional leading icon */}
        <Input
          type="text"
          placeholder="..."
          className="pl-9"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isLoading || !value.trim()}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {isLoading ? "Chargement..." : "Valider"}
      </Button>
    </form>
  );
}
```

### Display component (no interactivity)

```tsx
import { cn } from "@/lib/utils";
import { /* Icon */ } from "lucide-react";

interface ${ComponentName}Props {
  // data props
  className?: string;
}

export function ${ComponentName}({ className }: ${ComponentName}Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 bg-slate-900/30 border border-slate-800 rounded-2xl text-center space-y-3",
        className
      )}
    >
      <div className="p-3 bg-slate-900 rounded-2xl">
        {/* Icon */}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-200">{/* title */}</h3>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">{/* description */}</p>
      </div>
    </div>
  );
}
```

### Interactive component (toggles, selectors, etc.)

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, /* other icons */ } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ${ComponentName}Props {
  // data and callback props
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ${ComponentName}({
  isLoading,
  disabled,
  className,
}: ${ComponentName}Props) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className={cn("rounded-2xl border border-slate-800 bg-slate-900/30 p-4", className)}>
      <Button
        onClick={() => setIsActive((prev) => !prev)}
        disabled={isLoading || disabled}
        className={cn(
          "w-full transition-colors duration-200",
          isActive ? "bg-primary text-primary-foreground" : "bg-slate-800 text-slate-400 hover:text-slate-200"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        {isActive ? "Actif" : "Inactif"}
      </Button>
    </div>
  );
}
```

---

## Output instructions

- Write the complete component file to the correct path under `src/components/`.
- After creating the file, confirm the path and briefly describe what was generated.
- Do NOT create an index barrel file or export the component from anywhere else unless the user explicitly asks.
- Do NOT add unit tests or Storybook stories unless asked.
- If the component needs data fetching, remind the user to create a React Query hook separately (do not inline fetch logic in the component).
