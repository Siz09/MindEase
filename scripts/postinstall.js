#!/usr/bin/env node

/**
 * Postinstall script - runs after npm install completes
 * Provides helpful information about Cypress installation
 */

const isCI =
  process.env.CI === 'true' ||
  process.env.CONTINUOUS_INTEGRATION === 'true' ||
  process.env.GITHUB_ACTIONS === 'true' ||
  process.env.GITLAB_CI === 'true' ||
  process.env.CIRCLECI === 'true' ||
  process.env.TRAVIS === 'true' ||
  process.env.JENKINS_URL !== undefined;

if (isCI && process.env.CYPRESS_INSTALL_BINARY === '0') {
  console.log('✅ Cypress binary installation skipped (CI environment)');
  console.log('   To install Cypress binary later, run: npx cypress install');
}

// Exit successfully
process.exit(0);
