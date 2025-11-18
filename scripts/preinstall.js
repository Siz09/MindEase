#!/usr/bin/env node

/**
 * Preinstall script to configure Cypress for CI environments
 * Sets CYPRESS_INSTALL_BINARY=0 in CI to skip binary download
 */

const isCI =
  process.env.CI === 'true' ||
  process.env.CONTINUOUS_INTEGRATION === 'true' ||
  process.env.GITHUB_ACTIONS === 'true' ||
  process.env.GITLAB_CI === 'true' ||
  process.env.CIRCLECI === 'true' ||
  process.env.TRAVIS === 'true' ||
  process.env.JENKINS_URL !== undefined;

// If not explicitly set and we're in CI, skip Cypress binary installation
if (isCI && !process.env.CYPRESS_INSTALL_BINARY) {
  process.env.CYPRESS_INSTALL_BINARY = '0';
  console.log('🔧 CI environment detected: Skipping Cypress binary installation');
  console.log('   Set CYPRESS_INSTALL_BINARY=0 to install binary later if needed');
}

// Exit successfully
process.exit(0);
