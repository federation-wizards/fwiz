# Contributing to Federation Wizards (fwiz)

Thanks for your interest in contributing!

## Development setup

### Prerequisites

- Node.js 20+
- pnpm

### Install

```bash
pnpm install
```

### Useful commands

```bash
# List projects
pnpm nx show projects

# Run dashboard (dev)
pnpm nx dev @federation-wizards/dashboard

# Build CLI
pnpm nx build @federation-wizards/cli

# Lint / test / build
pnpm nx lint @federation-wizards/cli
pnpm nx test @federation-wizards/cli
pnpm nx build @federation-wizards/cli
```

## Pull requests

- Create a branch from `main`.
- Keep PRs focused and small when possible.
- Include context: what changed, why, and how to test.
- Ensure CI is green (lint, tests, build).

## Code style

- Format with Prettier (repo is configured).
- Lint with ESLint via Nx targets.

## Commit messages

We use Conventional Commits (examples):

- `feat(cli): add init command`
- `fix(core): handle missing remote entry`
- `chore(ci): tighten caching`

## Reporting issues

Please use GitHub Issues and follow the provided templates.


