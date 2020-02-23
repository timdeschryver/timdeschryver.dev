/// <reference types="Cypress" />

describe('a11y', () => {
  it('dark theme', () => {
    cy.task('sitemapUrls').then(urls => {
      urls.forEach(url => {
        cy.visit(url, {
          onBeforeLoad(win) {
            cy.stub(win, 'matchMedia')
              .withArgs('(prefers-color-scheme: dark)')
              .returns({
                matches: true,
              })
          },
        }).then(testA11y)
      })
    })
  })

  it('light theme', () => {
    cy.task('sitemapUrls').then(urls => {
      urls.forEach(url => {
        cy.visit(url, {
          onBeforeLoad(win) {
            cy.stub(win, 'matchMedia')
              .withArgs('(prefers-color-scheme: dark)')
              .returns({
                matches: false,
              })
          },
        }).then(testA11y)
      })
    })
  })
})

function testA11y() {
  cy.injectAxe()
  cy.configureAxe({
    rules: [
      { id: 'empty-heading', enabled: false },
      { id: 'scrollable-region-focusable', enabled: false },
    ],
  })
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
    cy.checkA11y({
      exclude: ['.article-action'],
    })
  })
}
