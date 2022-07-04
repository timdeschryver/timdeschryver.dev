## Define the zod schema

```diff
- export interface User {
-   id: number;
-   name: string;
-   username: string;
-   email: string;
-   phone : string;
-   website: string;
- }

+ import { z } from "zod";
+
+ // Create a schema that represents a "valid" user
+ export const UserSchema = z.object({
+     id: z.number(),
+     name: z.string(),
+     username: z.string(),
+     email: z.string(),
+     phone : z.string(),
+     website: z.string(),
+ });
+
+ // Define a User type based on the schema
+ export type User = z.infer<typeof UserSchema>;
```

## Validate the response body

```diff
import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import type {Observable} from "rxjs";
+ import {UserSchema} from "./user.model";
import type {User} from "./user.model";
+ import {parseResponse} from "./parse-response.operator";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`https://jsonplaceholder.typicode.com/users/${id}`).pipe(
+      parseResponse(UserSchema),
    );
  }
}
```

## Specialized RxJS operator

```ts
import { tap } from 'rxjs';
import type { MonoTypeOperatorFunction } from 'rxjs';
import type { ZodType } from 'zod';
import { environment } from '../environments/environment';

export function parseResponse<T>(schema: ZodType): MonoTypeOperatorFunction<T> {
	return tap({
		next: (value: any) => {
			if (!environment.production) {
				// Throw in development so we're aware of the error
				schema.parse(value);
			} else {
				const parsed = schema.safeParse(value);
				if (!parsed.success) {
					// Log to service to be informed
					console.log(parsed.error);
				}
			}
		},
	});
}
```
