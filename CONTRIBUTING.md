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

# Build publishable CLI (dist output for npm)
pnpm build:cli

# Lint / test / build
pnpm nx lint @federation-wizards/fwiz
pnpm nx test @federation-wizards/fwiz
pnpm nx build @federation-wizards/fwiz
```

## Pull requests

- Create a branch from `main`.
- Keep PRs focused and small when possible.
- Include context: what changed, why, and how to test.
- Ensure CI is green (lint, tests, build).
- Add a [Changeset](https://github.com/changesets/changesets) when your PR includes user-facing changes to `@federation-wizards/fwiz`:

  ```bash
  pnpm changeset
  ```

## Releases

Releases are automated with [Changesets](https://github.com/changesets/changesets) and the `.github/workflows/release.yml` workflow.

### Maintainer setup (one-time)

1. Create an npm access token with **Publish** scope for the `@federation-wizards` scope.
2. Add it as the `NPM_TOKEN` repository secret in GitHub (**Settings → Secrets and variables → Actions**).

### Release flow

1. Contributors add changeset files in PRs (`pnpm changeset`).
2. When changes merge to `main`, the release workflow opens a **Version Packages** PR.
3. Merging that PR bumps versions, updates changelogs, publishes to npm, and creates a GitHub Release.

### First publish (`0.1.0-alpha.1`)

Before the automated pipeline runs for the first time:

1. Ensure the `@federation-wizards` npm organization exists and your npm user can publish to it.
2. Configure `NPM_TOKEN` in GitHub Actions secrets.
3. Merge this release infrastructure PR to `main`.
4. Optionally add an initial changeset, or publish manually:

   ```bash
   pnpm build:cli
   cd apps/cli/dist
   npm publish --access public --tag alpha
   ```

   For automated releases instead, add a changeset describing the initial alpha, merge to `main`, merge the Version Packages PR, and the workflow publishes on the next push.

### Dry-run locally

```bash
pnpm build:cli
npm pack --pack-destination /tmp apps/cli/dist
```

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
