export default function maxHeight(list) {
  let i = 0;

  list.forEach(function (el) {
    if (el.offsetHeight > i) {
      i = el.offsetHeight;
    }
  });

  return i;
}
