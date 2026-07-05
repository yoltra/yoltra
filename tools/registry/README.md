# tools/registry — local npm registry (Verdaccio)

A [Verdaccio](https://verdaccio.org/) instance for **dry-run publishing** and local
end-to-end testing of the `@yoltra/*` packages, without touching the real npm registry.

This directory is **not** an npm package — it holds only the container config.

## Usage

```sh
# Start the registry (http://localhost:4873)
docker compose -f tools/registry/docker-compose.yml up -d

# Health check
curl http://localhost:4873/-/ping

# Publish a dry run against it (see docs/en/RELEASE_GUIDE.md)
rush publish --publish --registry http://localhost:4873 --version-policy yoltra

# Stop it
docker compose -f tools/registry/docker-compose.yml down
```

- `docker-compose.yml` — the Verdaccio service (port `4873`, named volumes for storage/config).
- `config.yaml` — Verdaccio config (uplinks, storage, auth).

The real-publish npmrc (`common/config/rush/.npmrc-publish`) points at npm; use
`--registry http://localhost:4873` explicitly to target this local registry instead.
