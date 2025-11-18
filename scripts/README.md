# Scripts Directory

## Cypress Installation in CI

If you encounter Cypress binary download failures in CI environments (500 errors from Cypress CDN), you need to set the `CYPRESS_INSTALL_BINARY=0` environment variable **before** running `npm install` or `npm ci`.

### Option 1: Use the Helper Script (Recommended)

**Linux/macOS:**

```bash
chmod +x scripts/ci-install.sh
./scripts/ci-install.sh ci
```

**Windows (PowerShell):**

```powershell
.\scripts\ci-install.ps1 ci
```

### Option 2: Set Environment Variable Manually

**Bash/Shell:**

```bash
export CYPRESS_INSTALL_BINARY=0
npm ci
```

**PowerShell:**

```powershell
$env:CYPRESS_INSTALL_BINARY = "0"
npm ci
```

### Option 3: Set in CI Configuration

**GitHub Actions:**

```yaml
- name: Install dependencies
  env:
    CYPRESS_INSTALL_BINARY: 0
  run: npm ci
```

**GitLab CI:**

```yaml
install:
  variables:
    CYPRESS_INSTALL_BINARY: '0'
  script:
    - npm ci
```

**CircleCI:**

```yaml
- run:
    name: Install dependencies
    environment:
      CYPRESS_INSTALL_BINARY: 0
    command: npm ci
```

### Important Notes

- The environment variable **must** be set before running `npm install` or `npm ci`
- Setting it in a Node.js script (like `preinstall.js`) won't work because it can't modify the parent npm process
- This will skip the Cypress binary download during installation
- The binary can be installed later if needed with: `npx cypress install`

## Scripts

- `preinstall.js` - Detects CI environment and provides helpful warnings
- `postinstall.js` - Provides post-installation information
- `ci-install.sh` - Helper script for Linux/macOS CI environments
- `ci-install.ps1` - Helper script for Windows/PowerShell CI environments
