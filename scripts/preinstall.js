#!/usr/bin/env node

/**
 * Preinstall script - provides information about Cypress installation
 * Note: This script cannot modify the parent npm process environment.
 * To skip Cypress binary installation, set CYPRESS_INSTALL_BINARY=0
 * before running npm install/ci in your CI configuration.
 */

const isCI =
  process.env.CI === 'true' ||
  process.env.CONTINUOUS_INTEGRATION === 'true' ||
  process.env.GITHUB_ACTIONS === 'true' ||
  process.env.GITLAB_CI === 'true' ||
  process.env.CIRCLECI === 'true' ||
  process.env.TRAVIS === 'true' ||
  process.env.JENKINS_URL !== undefined;

if (isCI && process.env.CYPRESS_INSTALL_BINARY !== '0') {
  console.log('⚠️  CI environment detected');
  console.log('   To skip Cypress binary installation, set CYPRESS_INSTALL_BINARY=0');
  console.log('   before running npm install/ci in your CI configuration.');
  console.log('   See scripts/README.md for details.');
}

// Exit successfully
process.exit(0);
