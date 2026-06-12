# Federation Wizards (fwiz)

Federation Wizards (fwiz) is an open-source toolkit for **Module Federation** and **micro-frontend workflows**. This repo is an **Nx monorepo** containing a Node.js CLI plus a React dashboard.

<!-- Badges placeholders (enable once CI + releases are wired) -->
<!-- - CI: [![CI](...)](...) -->
<!-- - npm: [![npm version](...)](...) -->
<!-- - license: [![MIT](...)](...) -->

## What’s in this repo

- **CLI**: `apps/cli` — Node.js CLI (the “wizard”), published as `@federation-wizards/fwiz`
- **Dashboard**: `apps/dashboard` — React + Vite UI
- **Libraries**:
  - `libs/core`
  - `libs/mf-plugins`
  - `libs/utils`
- **Examples**: `examples/` (future demos)

## Quick start

### Prerequisites

- Node.js 20+

### Install the CLI

```bash
# Global install
npm install -g @federation-wizards/fwiz

# Or run without installing
npx @federation-wizards/fwiz
```

### Development (monorepo)

Requires [pnpm](https://pnpm.io/).

```bash
pnpm install
```

```bash
# Dashboard (dev)
pnpm nx dev @federation-wizards/dashboard

# CLI (build publishable output)
pnpm build:cli
```

### Test / lint / build

```bash
pnpm nx lint @federation-wizards/fwiz
pnpm nx test @federation-wizards/fwiz

pnpm nx test @federation-wizards/dashboard
pnpm nx build @federation-wizards/dashboard

pnpm nx test @federation-wizards/core
pnpm nx build @federation-wizards/core
```

## Contributing

See `CONTRIBUTING.md`.

## License

MIT — see `LICENSE`.
