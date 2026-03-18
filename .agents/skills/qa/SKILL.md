---
name: qa
description: >
  Runs the full quality assurance pipeline for the Laravel DDD backend at
  /Users/leoelmy/Projects/mangastore/laravel-api: code style (Pint/PHPCS),
  static analysis (PHPStan level 9), and tests (Pest PHP) — auto-fixing all
  errors until the pipeline is fully green.

  Trigger whenever the user says: "lance les tests", "vérifie le code",
  "fix phpstan", "pipeline qualité", "make all", "qa", "erreurs phpstan",
  "run the tests", "check the code", or asks to run any part of the quality
  pipeline. Trigger even if only one step is mentioned (e.g. just "phpstan"
  or just "tests") — always run the full pipeline unless told otherwise.
---

# QA — Quality Pipeline

## Context

- **Project**: `/Users/leoelmy/Projects/mangastore/laravel-api`
- **All PHP commands**: via `docker-compose exec backend` — NEVER run `php` directly on the host
- **Makefile targets** (run from `laravel-api/`):
  - `make pint` — auto-fix code style (Laravel Pint)
  - `make phpcs` — check code style (PHP_CodeSniffer)
  - `make stan` — static analysis (PHPStan level 9)
  - `make test` — run test suite (Pest PHP)
  - `make all` — run all of the above in sequence
- **PHPStan level**: 9 — fix errors properly, never use `@phpstan-ignore`
- **Custom PHPStan rules**: every Action, Domain model, and Repository must have a test
- **Tests**: Pest PHP with Mockery

## Workflow

### Step 1 — Run the full pipeline

```bash
cd /Users/leoelmy/Projects/mangastore/laravel-api && make all
```

If everything passes, report green and stop.

### Step 2 — Fix code style (Pint / PHPCS)

1. Run `make pint` — rewrites files in place
2. Re-run `make phpcs` to verify no remaining violations
3. If phpcs still has issues, open the file and fix the specific lines manually

### Step 3 — Fix PHPStan errors

For each error:
1. Read the exact message and file path
2. Fix the root cause — missing types, wrong return types, nullable handling, missing `@param`/`@return`
3. If the error is a custom rule violation (missing test for an Action/Domain model/Repository): create a proper Pest PHP unit test with Mockery in the correct `tests/Unit/` directory
4. **Never** use `@phpstan-ignore` — always fix the actual issue

Re-run `make stan` to confirm zero errors.

### Step 4 — Fix test failures

For each failing test:
1. Read the failure (test name, assertion, diff)
2. Determine if the bug is in production code or the test expectation
3. Prefer fixing production code unless the expectation is clearly wrong
4. Check Mockery mock signatures match the actual method under test

Re-run `make test` to confirm all pass.

### Step 5 — Re-run the full pipeline

Always run `make all` after any fixes to confirm everything is green end-to-end.

### Step 6 — Report

Summarise: style fixes auto-applied, PHPStan errors resolved, test fixes made, final status.

## Constraints

- Always use `make` targets — never invoke binaries directly
- All commands run inside Docker via `docker-compose exec backend`
- Do not commit anything — only fix files
