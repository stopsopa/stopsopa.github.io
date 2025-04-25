/**
 * requires loaded preprocess.js
 */

import negotiatePort from "./negotiatePort.js";

import log from "./log.js";

import {
  all,
  get,
  has,
  getDefault,
  getThrow,
  getIntegerThrowInvalid, // equivalent to get
  getIntegerDefault,
  getIntegerThrow,
} from "/public/env.js";

// look also to .github/urlwizzard.sh
const schema = location.protocol.replace(/^([a-z]+).*$/, "$1");

const hostname = location.hostname;

const portnegotiated = negotiatePort(schema, location.port, ":");

const host = `${hostname}${portnegotiated}`;

const port = location.port;

// see /research/urlwizzard/urlwizzard.html for testing
// see /research/urlwizzard/urlwizzard.html for testing
// see /research/urlwizzard/urlwizzard.html for testing
// see /research/urlwizzard/urlwizzard.html for testing

function replace(str) {
  return str
    .replace(/urlwizzard\.hostname/g, hostname)
    .replace(/urlwizzard\.schema/g, schema)
    .replace(/urlwizzard\.hostnegotiated/g, host)
    .replace(/urlwizzard\.portnegotiated/g, portnegotiated)
    .replace(/urlwizzard\.port/g, port)
    .replace(/GITHUB_SOURCES_PREFIX/g, getThrow("GITHUB_SOURCES_PREFIX"));
}

function traverseAndReplace(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    // If it's a text node, replace the text content
    node.textContent = replace(node.textContent);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // Process element attributes
    for (const attr of node.attributes) {
      attr.value = replace(attr.value);
    }

    // Check if the element is a script tag
    if (node.tagName === "SCRIPT") {
      // If it's a script element, replace the text content inside the script tag
      if (node.textContent) {
        node.textContent = replace(node.textContent);
      }
    } else {
      // For other elements, recursively process their children
      for (const childNode of node.childNodes) {
        traverseAndReplace(childNode);
      }
    }
  }
}

export default function urlwizzard() {
  log.green("urlwizzard", {
    ["urlwizzard." + "protocol"]: schema,
    ["urlwizzard." + "hostname"]: hostname,
    ["urlwizzard." + "host"]: location.host,
  });

  traverseAndReplace(document.body);
}
