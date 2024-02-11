import { removeAccents } from "./remove-accents.js";

export const generateFileName = function (
  series /* 1 | 2 | 3 | 4 | 5 */,
  symbol /* Nr 3 | 4/99 | 6/2000 */,
  title /* 'Title' */
) {
  series = series.replace(/.*?(\d+).*/, "$1");

  title = removeAccents(title)
    .replace(/[^a-z\d]+/gi, " ")
    .trim()
    .replace(/[^a-z\d]+/gi, "_");

  symbol = symbol
    .replace(/[^\d]+/g, " ")
    .trim()
    .replace(/[^\d]+/g, "_");

  let name = `Komiks-Gigant-seria_${series}-nr_${symbol}`;

  if (title) {
    name += `-${title}`;
  }

  name += `.pdf`;

  return name;
};

export const enrichData = function (data) {
  Object.entries(data).forEach(([key, value]) => {
    value.forEach(({ title, nr }, i) => {
      data[key][i].filename = generateFileName(key, nr, title);
    });
  });
};
