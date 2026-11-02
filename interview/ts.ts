function solution(N: number): number {
  const binary = N.toString(2);
  let maxGap = 0;
  let currentGap = 0;

  for (const bit of binary) {
    if (bit === "0") {
      currentGap++;
    } else {
      maxGap = Math.max(maxGap, currentGap);
      currentGap = 0;
    }
  }

  return maxGap;
}
