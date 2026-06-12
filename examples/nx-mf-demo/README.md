# Nx Module Federation Demo

Minimal Nx-style Module Federation workspace used to exercise `fwiz init`, `fwiz dev`, and `fwiz validate` in future work.

## Layout

- `apps/shell` — host application
- `apps/checkout` — remote application

## Usage

```bash
cd examples/nx-mf-demo
pnpm install
npx fwiz init
```

`fwiz init` generates `fwiz.config.yaml` and patches `nx.json` with host/remote project references.
