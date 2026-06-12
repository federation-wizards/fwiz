# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs.

When you make a user-facing change to `@federation-wizards/fwiz`, run:

```bash
pnpm changeset
```

Follow the prompts, commit the generated file under `.changeset/`, and open a PR. When the PR merges to `main`, the release workflow opens a "Version Packages" PR. Merging that PR publishes to npm and creates a GitHub Release.
