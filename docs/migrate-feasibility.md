# Module Federation Migration Feasibility Report

> **Issue:** [#8](https://github.com/federation-wizards/fwiz/issues/8) | **Prototype:** `tools/migrate-analyzer/`

## Executive Summary

**`fwiz migrate` is feasible as a guided semi-automatic wizard** (analyze → suggest → apply). Full automation is **not recommended** due to dynamic imports, shared state, CSS/assets, and framework differences.

| Approach | Feasibility |
|----------|-------------|
| Full auto | Low |
| Semi-auto | High |
| Guided wizard | Highest (MVP default) |

**MVP estimate:** 6–8 weeks (React/Vite + Nx).

## Tool Evaluation

### ts-morph
Type-aware AST for **apply-phase** import rewrites and moves. Requires tsconfig; no MF runtime awareness.

### jscodeshift
Codemods with formatting preservation. Good for route → `loadRemoteModule` transforms.

### Nx (`@nx/workspace:move`, MF generators)
Structural scaffolding and remote creation. Known gaps with TS-project-references-only workspaces ([nx#31766](https://github.com/nrwl/nx/issues/31766)). Consumer/provider terminology in Nx 22+ ([nx#35825](https://github.com/nrwl/nx/pull/35825)).

### Angular-Architects Native Federation
Setup/migration schematics for Angular MF. Does not propose monolith splits — integrate during apply phase.

## Heuristic Strategies

1. **Route-based** — `/checkout/*` → checkout remote
2. **Folder-based** — `features/<name>/` grouping
3. **Import graph** — coupling, shared kernels, cycle detection
4. **Component frequency** — high reuse → shared lib

Prototype combines folder + route + import graph; emits confidence scores and warnings.

## Risks

- Dynamic imports / lazy loading (static analysis blind spot)
- Redux, Zustand, React Context across remotes
- Global CSS, assets, Tailwind tokens
- Multi-framework monorepos (out of MVP)
- SSR/RSC + MF fragility
- Test/CI target updates per remote

## Recommendation

**Default:** guided wizard with interactive plan review.
**Apply:** semi-automatic, one remote at a time with dry-run and CI validation.
**Avoid:** unattended full migration.

## Phased Roadmap

| Phase | Scope |
|-------|-------|
| 1 Analyze | Import graph, heuristics, JSON report (this spike) |
| 2 Suggest | Interactive CLI, plan editing |
| 3 Apply | Nx remote gen, ts-morph, federation manifest |
| 4 Validate | Build/test, rollback |

## Prototype

```bash
pnpm --filter @federation-wizards/migrate-analyzer test
pnpm --filter @federation-wizards/migrate-analyzer analyze
```

Fixture proposes remotes: `admin`, `checkout`, `home`; detects shared `Button` and `formatCurrency`.

## References

- [ts-morph](https://github.com/dsherret/ts-morph) · [jscodeshift](https://github.com/facebook/jscodeshift)
- [Nx move](https://nx.dev/nx-api/workspace/generators/move)
- [Angular-Architects migration](https://github.com/angular-architects/module-federation-plugin/blob/main/libs/native-federation/docs/migrate.md)
