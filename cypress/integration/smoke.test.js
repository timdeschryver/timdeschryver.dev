/// <reference types="Cypress" />

describe('a11y', () => {
  describe('dark theme', () => {
    it('should be accessible', () => {
      cy.task('sitemapLocations').then(pages => {
        pages.forEach(page => {
          cy.visit(page, {
            onBeforeLoad(win) {
              cy.stub(win, 'matchMedia')
                .withArgs('(prefers-color-scheme: dark)')
                .returns({
                  matches: true,
                })
            },
          })
          testA11y()
        })
      })
    })
  })

  describe('light theme', () => {
    it('should be accessible', () => {
      cy.task('sitemapLocations').then(pages => {
        pages.forEach(page => {
          cy.visit(page, {
            onBeforeLoad(win) {
              cy.stub(win, 'matchMedia')
                .withArgs('(prefers-color-scheme: dark)')
                .returns({
                  matches: false,
                })
            },
          })
          testA11y()
        })
      })
    })
  })
})

function testA11y() {
  cy.injectAxe()
  ;[
    [1920, 1080],
    'macbook-15',
    'macbook-13',
    'macbook-11',
    'iphone-6',
    'iphone-6+',
    'ipad-mini',
  ].forEach(size => {
    if (Cypress._.isArray(size)) {
      cy.viewport(size[0], size[1])
    } else {
      cy.viewport(size)
    }
    cy.findAllByText('Tim Deschryver')
    cy.checkA11y(
      {
        exclude: ['.article-action'],
      },
      {
        rules: {
          'empty-heading': { enabled: false },
          'scrollable-region-focusable': { enabled: false },
        },
      },
    )
  })
}
