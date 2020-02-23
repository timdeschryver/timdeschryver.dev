/// <reference types="Cypress" />

describe('a11y', () => {
  it('should be good', () => {
    cy.task('sitemapUrls').then(urls => {
      // 3 pages + latest article
      urls.slice(0, 4).forEach(url => {
        cy.visit(url).then(() => {
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
            cy.checkA11y()
          })
        })
      })
    })
  })
})
