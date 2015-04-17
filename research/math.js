const tmp = {};
// https://www.mathsisfun.com/numbers/factors-multiples-table.html
for (let i = 2; i <= 120; i = i + 1) {
  for (let k = i; k > 1; k = k - 1) {
    if (!tmp[i]) {
      tmp[i] = {};
    }

    if (i % k == 0) {
      tmp[i][k] = i / k;
    }
  }
  const leave = Math.floor(Object.keys(tmp[i]).length / 2);

  tmp[i] = Object.entries(tmp[i]).reduce((acc, [key, val], ii) => {
    if (ii < leave) {
      acc[key] = val;
    }
    return acc;
  }, {});
}

console.log(JSON.stringify(tmp, null, 4));
