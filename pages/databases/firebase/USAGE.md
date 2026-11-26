# Quick Integration Guide: `useCustomState`

Universal state hook persisting tree-structured data to Firebase Realtime Database scoped per user and section namespace.

## 1. Prerequisites in HTML

The runtime requires environment variables (`preprocessed.js`) and the core Firebase bridge (`firebase.core.entry.bundle.js`) loaded before your entry bundle:

```html
<script src="/public/preprocessed.js?my-app"></script>
<script type="module" src="/dist/firebase.core.entry.bundle.js"></script>
<script type="module" src="/dist/my-app.entry.bundle.js"></script>
```

## 2. Import & Hook Setup

```tsx
import useCustomState from "./path/to/useCustomState";

const { ready, error, username, userId, get, set, push, del, signIn, signOut } = useCustomState({
  section: "my_namespace", // isolates database root: users/<user_email>/<section>
});
```

That is the complete interface (contract: `UseCustomStateReturn` in `pages/useCustomState.ts`). Nothing in it is Firebase specific -
Firebase is only the current implementation (`pages/databases/firebase/useFirebase.ts`) and can be swapped in
`pages/useCustomState.ts` without touching components. Don't import `useFirebase.ts` in components.

| field      | meaning                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------- |
| `ready`    | `false` during authentication, `true` when all methods are ready to use                       |
| `error`    | `false` or error object                                                                       |
| `username` | human readable user name (Firebase: email `john.doe@gmail.com`), `undefined` when not ready   |
| `userId`   | stable unique user id (Firebase: `john,doe@gmail,com`), `undefined` when not ready            |
| `get`      | read value / subtree                                                                          |
| `set`      | write (overwrite) value / subtree                                                             |
| `push`     | add new child with generated key, returns that key                                            |
| `del`      | remove value / subtree                                                                        |
| `signOut`  | destroy the session, `ready` goes back to `false`                                             |
| `signIn`   | authenticate again (after `signOut` or error), `ready` goes to `true` when done               |

Authentication (popup with choice of google account, tokens, re-authentication) happens behind the scene
when the hook is mounted. Component only watches `ready`.

This is where we specify 'section'. Section is main root level of key in the data tree. Everything what we will manipulate with get, set, push and so on will be under this section.
This way we can keep the logic isolated from other data points and at least reduce danger of overriding any data in firebase

## 3. Ready Gate

Always guard initialization until `ready` is `true`:

```tsx
useEffect(() => {
  if (ready) {
    loadData();
  }
}, [ready]);

if (error) return <div>Error: {JSON.stringify(error)}</div>;
if (!ready) return <div>Connecting...</div>;
```

If the app has "sign out" button then the `!ready` screen should have a button calling `signIn()` -
after `signOut()` it is the only way back in.

## 4. Path Resolution & Operations (Concrete Example)

Assume:

- Authenticated user `userId`: `"john,doe@gmail,com"`
- Hook configured with: `section: "my_namespace"`

Internal database root is:

```text
users/john,doe@gmail,com/my_namespace
```

---

### A. Insert (`push`)

Creates a new child under the given parent collection using a unique Firebase push ID.

```ts
const itemId = await push({
  key: "todos",
  data: { text: "Buy bread", done: false },
});
```

- **What `push()` returns**: The generated key of the new item (`itemId`), relative to the `key` it was pushed to:
  ```text
  "-Nxi98AbCdEf12345"
  ```
- Path written to: `users/john,doe@gmail,com/my_namespace/todos/-Nxi98AbCdEf12345`
- Use it with other methods as `["todos", itemId]`.

---

### B. Read (`get`)

Fetches the entire subtree/collection or a single specific item:

**1. Read entire collection:**

```ts
const list = await get<Record<string, TodoItem>>("todos");
```

- **What `get("todos")` returns**: An object mapping each `itemId` to its data:
  ```json
  {
    "-Nxi98AbCdEf12345": {
      "text": "Buy bread",
      "done": false
    },
    "-Nxi99ZzYyXx67890": {
      "text": "Call dentist",
      "done": true
    }
  }
  ```
- Extract items with `Object.entries(list)` where key is `itemId` (`"-Nxi98AbCdEf12345"`).

**2. Read single individual item:**
Pass the exact sub-path directly to `get()`:

```ts
const itemId = "-Nxi99ZzYyXx67890";

const item = await get<TodoItem>(`todos/${itemId}`);
// or: await get<TodoItem>(["todos", itemId]);
```

- **What `get("todos/-Nxi99ZzYyXx67890")` returns**: Only that single item's data:
  ```json
  {
    "text": "Call dentist",
    "done": true
  }
  ```

---

### C. Update (`set`)

Updates or overwrites a single item directly. Provide the relative key path using the `itemId`:

```ts
const itemId = "-Nxi98AbCdEf12345";

await set({
  key: ["todos", itemId], // equivalent to: key: `todos/${itemId}`
  data: {
    text: "Buy sourdough bread",
    done: true,
  },
});
```

- Path written to: `users/john,doe@gmail,com/my_namespace/todos/-Nxi98AbCdEf12345`

---

### D. Delete (`del`)

Removes an item or entire branch. Pass the relative path including `itemId`:

```ts
const itemId = "-Nxi98AbCdEf12345";

await del(`todos/${itemId}`); // or del(["todos", itemId])
```

- Path removed: `users/john,doe@gmail,com/my_namespace/todos/-Nxi98AbCdEf12345`

---

## 5. Example

Playground demonstrating every part of the interface (ready, error, username, userId, get, set, push, del, signIn, signOut):

- HTML entry: [index.html](../../services/custom_state/index.html)
- React component: [custom_state.entry.tsx](../../services/custom_state/custom_state.entry.tsx)

Working todo implementation:

- HTML entry: [index.html](../../firebase-example/index.html)
- React component: [firebase-example.entry.tsx](../../firebase-example/firebase-example.entry.tsx)

## link firebase dashboard

If it won't cause any problems then in whatever we create what would be using this library (hook) then also at the bottom of UI render link to firebase dashboard:

```

<a href="https://console.firebase.google.com/">https://console.firebase.google.com/</a>

```
