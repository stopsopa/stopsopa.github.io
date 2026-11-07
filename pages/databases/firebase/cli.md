# Firebase CLI (`cli.ts`) Documentation

Command line tool exposing all Firebase Admin Realtime Database methods (`get`, `set`, `push`, `del`, `getroot`).

Database root path:

```text
users/<FB_EMAIL>/<section>/<key>
```

---

## 1. Syntax Rules

- **CLI Arguments**: Only `<method>` (defaults to `get` if omitted) and optional `[key]` are accepted as positional arguments:
  ```bash
  NODE_OPTIONS= node --env-file .env pages/databases/firebase/cli.ts [method] [key]
  ```
- **No Default Section or Key**: There is **no default section fallback** (e.g. no fallback to `"antigravity_cli"`) and **no default key** (e.g. no fallback to `"settings"`).
- **Data Input**: Data is **never** passed via CLI arguments. For `set` and `push`, payload data **must** be piped as JSON through `stdin`.
- **Section Resolution**:
  - If `FB_SECTION` is defined in `.env` or set inline (`FB_SECTION=my_section`), it is used.
  - If `FB_SECTION` is empty or unset (`FB_SECTION=`), the CLI runs in **unbound mode** and **requires** `"section"` inside the stdin JSON. If missing, it throws:
    ```text
    Error: Section is not specified: provide it via FB_SECTION env var or in stdin JSON { "section": "..." }
    ```

---

## 2. Examples: With `FB_SECTION` in Environment

When `FB_SECTION` is specified, `stdin` (if needed) only contains the payload data.

### A. Read (`get`)

```bash
# Read whole section (method defaults to get, no key reads section root):
NODE_OPTIONS= FB_SECTION=my_section node --env-file .env pages/databases/firebase/cli.ts

# Read whole section explicitly:
NODE_OPTIONS= FB_SECTION=my_section node --env-file .env pages/databases/firebase/cli.ts get

# Read specific key:
NODE_OPTIONS= FB_SECTION=my_section node --env-file .env pages/databases/firebase/cli.ts get settings
NODE_OPTIONS= FB_SECTION=my_section node --env-file .env pages/databases/firebase/cli.ts get todos/item1
```

### B. Insert with unique ID (`push`)

Data is passed as JSON on `stdin`:

```bash
cat <<EEE | NODE_OPTIONS= FB_SECTION=my_section node --env-file .env pages/databases/firebase/cli.ts push todos
{
  "text": "Buy groceries",
  "done": false
}
EEE
```

_(Prints the generated full path: `users/<user>/my_section/todos/-Nxi...`)_

### C. Update / Overwrite (`set`)

Data is passed as JSON on `stdin`:

```bash
cat <<EEE | NODE_OPTIONS= FB_SECTION=my_section node --env-file .env pages/databases/firebase/cli.ts set todos/-Nxi12345
{
  "text": "Buy groceries",
  "done": true
}
EEE
```

### D. Delete (`del`)

```bash
NODE_OPTIONS= FB_SECTION=my_section node --env-file .env pages/databases/firebase/cli.ts del todos/-Nxi12345
```

### E. Resolve Path (`getroot`)

```bash
NODE_OPTIONS= FB_SECTION=my_section node --env-file .env pages/databases/firebase/cli.ts getroot todos
# Output: users/<user>/my_section/todos
```

---

## 3. Examples: In Unbound Mode (`FB_SECTION=`)

When `FB_SECTION=` overrides `.env` to empty/undefined, `"section"` **must** be provided in the stdin JSON.

### A. Read (`get`)

```bash
cat <<EEE | NODE_OPTIONS= FB_SECTION= node --env-file .env pages/databases/firebase/cli.ts get settings
{
  "section": "my_section"
}
EEE
```

### B. Insert with unique ID (`push`)

```bash
cat <<EEE | NODE_OPTIONS= FB_SECTION= node --env-file .env pages/databases/firebase/cli.ts push todos
{
  "section": "todos_app",
  "data": {
    "text": "Buy milk",
    "done": false
  }
}
EEE
```

### C. Update / Overwrite (`set`)

```bash
cat <<EEE | NODE_OPTIONS= FB_SECTION= node --env-file .env pages/databases/firebase/cli.ts set todos/-Nxi12345
{
  "section": "todos_app",
  "data": {
    "text": "Buy almond milk",
    "done": true
  }
}
EEE
```

### D. Delete (`del`)

```bash
cat <<EEE | NODE_OPTIONS= FB_SECTION= node --env-file .env pages/databases/firebase/cli.ts del todos/-Nxi12345
{
  "section": "todos_app"
}
EEE
```

### E. Error Example (Missing Section)

```bash
NODE_OPTIONS= FB_SECTION= node --env-file .env pages/databases/firebase/cli.ts get todos
# Error: Section is not specified: provide it via FB_SECTION env var or in stdin JSON { "section": "..." }
```
