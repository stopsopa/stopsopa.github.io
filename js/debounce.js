/**
 * import { debounce, debounceOnce } from "./debounce.js";
 */

export function debounce(fn, delay) {
  var timer = null;
  return function () {
    var context = this,
      args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

export function debounceOnce(fn, delay) {
  var timer = null,
    stop = false;
  return function () {
    if (stop) {
      return;
    }
    var context = this,
      args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      stop = true;
      fn.apply(context, args);
    }, delay);
  };
}
