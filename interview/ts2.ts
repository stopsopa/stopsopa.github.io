function solution2(A: number[][]): number {
  const rows = A.length;
  const cols = A[0].length;

  const twos = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const fives = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let num = A[r][c];

      while (num % 2 === 0) {
        twos[r][c]++;
        num /= 2;
      }

      while (num % 5 === 0) {
        fives[r][c]++;
        num /= 5;
      }
    }
  }

  const leftTwos = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const leftFives = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const topTwos = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const topFives = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      leftTwos[r][c] = twos[r][c] + (c > 0 ? leftTwos[r][c - 1] : 0);
      leftFives[r][c] = fives[r][c] + (c > 0 ? leftFives[r][c - 1] : 0);

      topTwos[r][c] = twos[r][c] + (r > 0 ? topTwos[r - 1][c] : 0);
      topFives[r][c] = fives[r][c] + (r > 0 ? topFives[r - 1][c] : 0);
    }
  }

  const rightTwos = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const rightFives = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const bottomTwos = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const bottomFives = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let r = rows - 1; r >= 0; r--) {
    for (let c = cols - 1; c >= 0; c--) {
      rightTwos[r][c] = twos[r][c] + (c < cols - 1 ? rightTwos[r][c + 1] : 0);
      rightFives[r][c] = fives[r][c] + (c < cols - 1 ? rightFives[r][c + 1] : 0);

      bottomTwos[r][c] = twos[r][c] + (r < rows - 1 ? bottomTwos[r + 1][c] : 0);
      bottomFives[r][c] = fives[r][c] + (r < rows - 1 ? bottomFives[r + 1][c] : 0);
    }
  }

  let best = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const paths = [
        [leftTwos[r][c], leftFives[r][c], topTwos[r][c], topFives[r][c]],
        [leftTwos[r][c], leftFives[r][c], bottomTwos[r][c], bottomFives[r][c]],
        [rightTwos[r][c], rightFives[r][c], topTwos[r][c], topFives[r][c]],
        [rightTwos[r][c], rightFives[r][c], bottomTwos[r][c], bottomFives[r][c]],
      ];

      for (const [a, b, d, e] of paths) {
        const totalTwos = a + d - twos[r][c];
        const totalFives = b + e - fives[r][c];

        best = Math.max(best, Math.min(totalTwos, totalFives));
      }
    }
  }

  return best;
}
