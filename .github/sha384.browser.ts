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

async function fetchHash(endpoint: string, path: string): Promise<string | null> {
  try {
    const res = await fetch(`${endpoint}?path=${encodeURIComponent(path)}`);

    const json = await res.json();

    if (!res.ok || typeof json?.hash !== "string") {
      console.warn(`sha384.browser: can't get hash for >${path}<: ${json?.error || `status ${res.status}`}`);

      return null;
    }

    return json.hash;
  } catch (e) {
    console.warn(`sha384.browser: can't get hash for >${path}<: ${e}`);

    return null;
  }
}

/**
 * Returns number of replaced markers.
 * Marker for which hash can't be obtained is left untouched (with warning in the console).
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

  const hashes = new Map<string, string>();

  await Promise.all(
    Array.from(paths).map(async (path) => {
      const hash = await fetchHash(endpoint, path);

      if (hash) {
        hashes.set(path, hash);
      }
    })
  );

  let replaced = 0;

  for (const target of targets) {
    const value = getValue(target);

    const transformed = value.replace(createRegex(), (wholematch: string, path: string) => {
      const hash = hashes.get(path);

      if (!hash) {
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
