---
title: Cypress to Playwright converters
slug: cypress-to-playwright-converters
date: 2023-09-19
tags: Playwright
---

# Cypress to Playwright converters

Migrating from one test library to another can be a daunting task, but with the right tools, we can make it a smoother transition.

To help with this task I've encountered two similar tools that rewrite your Cypress code to its equivalent in Playwright.

The first of these tools is https://demo.playwright.dev/cy2pw/, and the second one https://ray.run/tools/cypress-to-playwright (you should also check out the blog on this website for more goodies!).

On the websites, you can simply paste your Cypress code, and you'll receive the test cases rewritten in Playwright ✨.
Just like that.

These tools can be used for a couple of reasons:

- trying out Playwright without wasting time
- quickly see what the Playwright equivalent is of a code block
- rewrite a specific piece of code (think of a test that you aren't able to write properly, or don't know where to start), or even rewrite entire files
- motivate your team to try/use Playwright
- hit the ground running from day one

In short, the mentioned tools help you with the transition from Cypress to Playwright.

Side note: if you have a GitHub Copilot license you can also prompt your Copilot to migrate a test or file for you.
In a small demo application, this worked out fine for me.

Here's a small example to give you an idea of a migration:

:::code-group

```ts:cypress.test.ts [title=Cypress]
describe('example to-do app', () => {
  beforeEach(() => {
    cy.visit('https://example.cypress.io/todo')
  })

  it('displays two todo items by default', () => {
    cy.get('.todo-list li').should('have.length', 2)
    cy.get('.todo-list li').first().should('have.text', 'Pay electric bill')
    cy.get('.todo-list li').last().should('have.text', 'Walk the dog')
  })

  it('can add new todo items', () => {
    const newItem = 'Feed the cat'
    cy.get('[data-test=new-todo]').type(`${newItem}{enter}`)
    cy.get('.todo-list li')
      .should('have.length', 3)
      .last()
      .should('have.text', newItem)
  })
})
```

```ts:playwright.test.ts [title=Playwright]
import { test, expect } from '@playwright/test';

test.describe('example to-do app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.cypress.io/todo');
  });

  test('displays two todo items by default', async ({ page }) => {
    await expect(page.locator('.todo-list li')).toHaveCount(2);
    await expect(page.locator('.todo-list li').first()).toHaveText(
      'Pay electric bill'
    );
    await expect(page.locator('.todo-list li').last()).toHaveText(
      'Walk the dog'
    );
  });

  test('can add new todo items', async ({ page }) => {
    const newItem = 'Feed the cat';
    await page.locator('[data-test=new-todo]').fill(newItem);
    await page.locator('[data-test=new-todo]').press('Enter');
    await expect(page.locator('.todo-list li')).toHaveCount(3);
    await expect(page.locator('.todo-list li').last()).toHaveText(newItem);
  });
});
```

:::

For more Playwright content, check out [my blog posts about 🎭 Playwright](https://timdeschryver.dev/blog?q=Playwright).
