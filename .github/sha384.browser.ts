/**
 * Browser counterpart of .github/sha384.sh - see .github/sha384.md
 *
 * Searches entire document for markers "sha384.sh::path/to/file", asks the server
 * (.github/sha384.express.ts mounted in server.js) for the hash of each file and replaces the markers
 * with "sha384-...", exactly like .github/sha384.sh + .github/sha384.cjs do during the build in CI.
 *
 * It is needed only for pages served by local server.js - on production markers are already replaced.
 *
 * Used in js/github.js right after "await urlwizzard();" and before ace editors are created,
 * only in dev mode (location.hostname different than PROD_HOSTNAME env var):
 *
 *   const { default: sha384 } = await import("/sha384/browser.js");
 *
 *   await sha384();
 *
 * NOTICE: no imports here on purpose - this file is served from different url (/sha384/browser.js)
 *         than its location in the repository, so relative imports would not resolve
 */

// keep in sync with regex in .github/sha384.cjs
const createRegex = () => /sha384\.sh::([^"]+)/g;

const MARKER = "sha384.sh::";

type Target = Text | Attr;

const getValue = (target: Target): string => (target instanceof Attr ? target.value : target.textContent || "");

const setValue = (target: Target, value: string) => {
  if (target instanceof Attr) {
    target.value = value;
  } else {
    target.textContent = value;
  }
};

/**
 * Finds all text nodes (also inside <script> tags) and all attributes containing marker
 */
function findTargets(root: Node): Target[] {
  const targets: Target[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);

  let node: Node | null = walker.currentNode;

  while (node) {
    if (node instanceof Text) {
      if ((node.textContent || "").includes(MARKER)) {
        targets.push(node);
      }
    } else if (node instanceof Element) {
      for (const attr of Array.from(node.attributes)) {
        if (attr.value.includes(MARKER)) {
          targets.push(attr);
        }
      }
    }

    node = walker.nextNode();
  }

  return targets;
}

type Hashes = {
  hashes: Record<string, string>;
  errors: Record<string, string>;
};

/**
 * One request for all paths found on the page.
 * Never throws - when entire request fails then every path gets the same error
 */
async function fetchHashes(endpoint: string, paths: string[]): Promise<Hashes> {
  const fail = (error: string): Hashes => ({
    hashes: {},
    errors: Object.fromEntries(paths.map((path) => [path, error])),
  });

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    });

    const text = await res.text();

    let json: any;

    try {
      json = JSON.parse(text);
    } catch (e) {
      return fail(`POST ${endpoint} status ${res.status}: response is not valid json: >${text.slice(0, 200)}<`);
    }

    if (!res.ok) {
      return fail(`POST ${endpoint} status ${res.status}: ${json?.error || text.slice(0, 200)}`);
    }

    return {
      hashes: json?.hashes || {},
      errors: json?.errors || {},
    };
  } catch (e) {
    return fail(`POST ${endpoint} failed: ${e}`);
  }
}

/**
 * Returns number of replaced markers.
 * Marker for which hash can't be obtained is left untouched and reported in the console.
 */
export default async function sha384(endpoint: string = "/sha384/hash"): Promise<number> {
  const targets = findTargets(document.documentElement);

  if (targets.length === 0) {
    return 0;
  }

  const paths = new Set<string>();

  for (const target of targets) {
    for (const match of getValue(target).matchAll(createRegex())) {
      paths.add(match[1]);
    }
  }

  const { hashes, errors } = await fetchHashes(endpoint, Array.from(paths));

  for (const path of paths) {
    if (typeof hashes[path] !== "string") {
      // >< to make leading and trailing spaces visible
      console.error(
        `sha384.browser error: marker >${MARKER}${path}< not replaced: ${
          errors[path] || "server returned no hash and no error"
        }`
      );
    }
  }

  let replaced = 0;

  for (const target of targets) {
    const value = getValue(target);

    const transformed = value.replace(createRegex(), (wholematch: string, path: string) => {
      const hash = hashes[path];

      if (typeof hash !== "string") {
        return wholematch;
      }

      replaced += 1;

      return hash;
    });

    if (transformed !== value) {
      setValue(target, transformed);
    }
  }

  return replaced;
}
