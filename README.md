# Federation Wizards (fwiz)

Federation Wizards (fwiz) is an open-source toolkit for **Module Federation** and **micro-frontend workflows**. This repo is an **Nx monorepo** containing a Node.js CLI plus a React dashboard.

<!-- Badges placeholders (enable once CI + releases are wired) -->
<!-- - CI: [![CI](...)](...) -->
<!-- - npm: [![npm version](...)](...) -->
<!-- - license: [![MIT](...)](...) -->

## What’s in this repo

- **CLI**: `apps/cli` — Node.js CLI (the “wizard”)
- **Dashboard**: `apps/dashboard` — React + Vite UI
- **Libraries**:
  - `libs/core`
  - `libs/mf-plugins`
  - `libs/utils`
- **Examples**: `examples/` (future demos)

## Quick start

### Prerequisites

- Node.js 20+
- pnpm

### Install

```bash
pnpm install
```

### Run

```bash
# Dashboard (dev)
pnpm nx dev @federation-wizards/dashboard

# CLI (build)
pnpm nx build @federation-wizards/cli
```

### Test / lint / build

```bash
pnpm nx lint @federation-wizards/cli
pnpm nx test @federation-wizards/cli

pnpm nx test @federation-wizards/dashboard
pnpm nx build @federation-wizards/dashboard

pnpm nx test @federation-wizards/core
pnpm nx build @federation-wizards/core
```

## Contributing

See `CONTRIBUTING.md`.

## License

MIT — see `LICENSE`.


