/**
 * import { isVisibleElement, filterVisibleList } from "./isVisibleElement.js";
 */

const list = ["script", "style", "meta", "noscript", "template", "link"];

export function isVisibleElement(element) {
  const tagName = element.tagName.toLowerCase();

  if (list.includes(tagName)) {
    return isVisibleElement(element.parentNode);
  }

  if (tagName === "input" && element.type === "hidden") {
    return isVisibleElement(element.parentNode);
  }

  return element.checkVisibility();
}

export function filterVisibleList(list) {
  return list.filter(isVisibleElement);
}
