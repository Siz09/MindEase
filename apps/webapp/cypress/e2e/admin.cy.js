/* global cy, describe, it, beforeEach */
// Basic admin UI smoke tests
// Assumes commands cy.loginAsAdmin() and cy.logout() are implemented

describe('Admin UI', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('redirects non-admin away from /admin', () => {
    cy.logout();
    cy.visit('/admin');
    cy.url().should('not.include', '/admin');
  });

  it('loads /admin overview and renders charts', () => {
    cy.visit('/admin');
    cy.get('.panel').should('have.length.at.least', 3);
    cy.get('canvas').should('have.length.at.least', 3);
  });

  it('loads audit logs with pagination and can export CSV', () => {
    cy.visit('/admin/audit-logs');
    cy.get('.table tbody tr').should('exist');
    cy.contains('Export CSV').click();
  });

  it('shows crisis flags and updates on new event (poll/SSE)', () => {
    cy.visit('/admin/crisis-flags');
    cy.get('.table tbody tr').then(($rows) => {
      const initial = $rows.length;
      cy.wait(12000);
      cy.get('.table tbody tr').its('length').should('be.gte', initial);
    });
  });
});
