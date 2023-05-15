The solution is to utilize the [`forwardRef` function](https://angular.io/api/core/forwardRef).
Rather than directly importing the parent component (`ListComponent`) from the child component (`ListItemComponent`), the child component uses `forwardRef` to import the parent component.

```ts{10}:list-item.component.ts
import { Component, forwardRef } from '@angular/core';
import { ListComponent } from '../list/list.component';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.css'],
  standalone: true,
  imports: [
    forwardRef(() => ListComponent)
  ],
  // 👇 not using `forwardRef` throws a reference error
  // imports: [ComponentAComponent],
})
export class ListItemComponent {
}

```

## Playground

<iframe src="https://stackblitz.com/edit/angular-hqgbou?file=src/list-item/list-item.component.ts" title="circular-standalone-components" loading="lazy"></iframe>
