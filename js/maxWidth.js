export default function maxWidth(list) {
  let i = 0;

  list.forEach(function (el) {
    if (el.offsetWidth > i) {
      i = el.offsetWidth;
    }
  });

  return i;
}
