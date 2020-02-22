describe('a11y', () => {
  it('should be good', () => {
    cy.task('sitemapUrls').then(urls => {
      urls.forEach(url => {
        cy.visit(url)
        cy.injectAxe()
        cy.configureAxe({
          rules: [
            { id: 'empty-heading', enabled: false },
            { id: 'scrollable-region-focusable', enabled: false },
          ],
        })
        cy.checkA11y()
      })
    })
  })
})
