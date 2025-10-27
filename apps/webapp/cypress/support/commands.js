/* global Cypress */
// Placeholder auth helpers for Cypress
// Implement using Firebase emulator or by stubbing app auth state.

Cypress.Commands.add('loginAsAdmin', () => {
  // Example: set a dev JWT in localStorage
  // localStorage.setItem('token', 'DEV_JWT_WITH_ADMIN_ROLE');
});

Cypress.Commands.add('logout', () => {
  localStorage.removeItem('token');
});
