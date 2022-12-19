Using a Test Harness is a good fit to Angular Testing Library when it's not possible to query an element with Testing Library.

```ts{11-13, 15, 17-18}:snack-bar.component.spec.ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { render, screen } from '@testing-library/angular';
import user from '@testing-library/user-event';

import { SnackBarComponent } from './snack-bar.component.ts';

test('shows a message on click (Test Harness with Queries)', async () => {
	const view = await render(SnackBarComponent);

	// use the root loader to get the harnesses for the entire document
	// because the snack bar is rendered outside of the component
	const loader = TestbedHarnessEnvironment.documentRootLoader(view.fixture);

	user.click(screen.getByRole('button'));

	const snackbarHarness = await loader.getHarness(MatSnackBarHarness);
	expect(await snackbarHarness.getMessage()).toMatch(/Pizza Party!!!/i);
});
```
