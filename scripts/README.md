# Scripts Directory

## Cypress Installation in CI

If you encounter Cypress binary download failures in CI environments, set the following environment variable before running `npm ci`:

```bash
export CYPRESS_INSTALL_BINARY=0
npm ci
```

Or in your CI workflow file (GitHub Actions example):

```yaml
- name: Install dependencies
  env:
    CYPRESS_INSTALL_BINARY: 0
  run: npm ci
```

This will skip the Cypress binary download during installation. The binary can be installed later if needed with:

```bash
npx cypress install
```

## Scripts

- `preinstall.js` - Detects CI environment and logs information
- `postinstall.js` - Provides post-installation information
