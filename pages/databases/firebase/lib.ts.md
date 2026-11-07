# Firebase Admin Library (`lib.ts`) Quick Guide

Compact reference for using `lib.ts` and `server.ts` to interact with Firebase Realtime Database.

Database root format:

```text
users/<FB_EMAIL>/<section>/<key>
```

_(User email dots `.` are automatically normalized to commas `,` for Firebase path compliance)._

---

## 1. Setup & Requirements

Add to your `.env`:

```bash
FB_EMAIL="user@gmail.com"
FB_PROJECT_ID="your-project-id"
FB_CLIENT_EMAIL="service-account@your-project-id.iam.gserviceaccount.com"
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FB_PRIVATE_KEY_ID="key-id"

# Optional:
FB_DATABASE_URL="https://your-project-id.firebaseio.com" # defaults to https://${FB_PROJECT_ID}.firebaseio.com
FB_SECTION="my_default_section"                          # optional default section
```

---

## 2. Use Case A: With Section (Bound)

When you know the namespace upfront (e.g. CLI tool or dedicated microservice).

```ts
import { getFirebase, deleteApp } from "./lib.ts";

const { app, getSection } = getFirebase();

// Pre-bind section "antigravity_cli":
const sec = getSection("antigravity_cli");

// 1. Insert new item (push)
const newPath = await sec.push({
  key: "todos",
  data: { text: "Buy milk", done: false },
});
// newPath => "users/user@gmail,com/antigravity_cli/todos/-Nxi12345"
const itemId = newPath.split("/").pop();

// 2. Read (get)
const item = await sec.get(`todos/${itemId}`);
const allTodos = await sec.get("todos");

// 3. Overwrite/update (set)
await sec.set({
  key: ["todos", itemId],
  data: { text: "Buy milk", done: true },
});

// 4. Delete (del)
await sec.del(`todos/${itemId}`);

// 5. Inspect path (getroot)
console.log(sec.getroot("todos"));
// => "users/user@gmail,com/antigravity_cli/todos"

// Close on exit (CLI scripts):
await deleteApp(app);
```

---

## 3. Use Case B: Without Section (Unbound / Dynamic)

When one instance serves multiple dynamic sections across calls. `section` is passed per operation and throws if omitted.

```ts
import { getFirebase } from "./lib.ts";

const { getSection } = getFirebase();

// Call getSection without section argument (or empty string):
const sec = getSection();

// 1. Provide section per operation:
const newPath = await sec.push({
  section: "project_alpha",
  key: "tasks",
  data: { task: "Deploy server" },
});

// 2. Read with section:
const task = await sec.get({
  section: "project_alpha",
  key: "tasks",
});

// 3. Update with section:
await sec.set({
  section: "project_beta",
  key: "settings",
  data: { theme: "dark" },
});

// 4. Delete with section:
await sec.del({
  section: "project_alpha",
  key: "tasks",
});

// 5. Missing section throws Error:
try {
  await sec.get("tasks"); // throws: Error("section is not specified")
} catch (e) {
  console.error(e.message);
}
```

---

## 4. Express Server (`server.ts`)

### Mode 1: Pre-bound with `FB_SECTION`

```bash
PORT=4398 HOST=0.0.0.0 FB_SECTION=my_section node --env-file .env pages/databases/firebase/server.ts
```

Calls don't need to specify `section`:

```bash
# Push:
curl -X POST http://localhost:4398/push/todos -H "Content-Type: application/json" -d '{"text":"Buy milk"}'

# Get:
curl http://localhost:4398/get/todos

# Set:
curl -X POST http://localhost:4398/set/todos/item123 -H "Content-Type: application/json" -d '{"text":"Done","done":true}'

# Del:
curl -X DELETE http://localhost:4398/del/todos/item123
```

### Mode 2: Unbound (Requires `section` per request)

```bash
PORT=4398 HOST=0.0.0.0 node --env-file .env pages/databases/firebase/server.ts
```

> **Overriding `.env` on CLI**:
> If `FB_SECTION` is defined in `.env`, you can override it to `undefined` from the command line by passing an empty value:
>
> ```bash
> PORT=4398 HOST=0.0.0.0 FB_SECTION= node --env-file .env pages/databases/firebase/server.ts
> ```
>
> In Node.js `--env-file`, environment variables passed in the shell command take precedence over `.env`. Passing `FB_SECTION=` leaves it empty in `process.env`, which the server treats as `undefined` (unbound mode), requiring `section` on every request.

Provide `section` via query param `?section=...`, body `{ "section": "..." }`, or header `x-section`:

```bash
# Via query param:
curl "http://localhost:4398/get/todos?section=my_section"

# Via JSON body:
curl -X POST http://localhost:4398/push/todos \
  -H "Content-Type: application/json" \
  -d '{"section":"my_section","text":"Buy milk"}'

# Via HTTP header:
curl -X DELETE http://localhost:4398/del/todos/item123 \
  -H "x-section: my_section"
```

_(If omitted in unbound mode, server returns HTTP `400 Bad Request` with `{"error": "section is not specified"}`)._
