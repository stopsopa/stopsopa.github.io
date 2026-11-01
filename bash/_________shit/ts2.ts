
function solution(A: number[][]): number {
    const rows = A.length;
    const cols = A[0].length;

    const count2 = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const count5 = Array.from({ length: rows }, () => new Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let num = A[i][j];

            while (num % 2 === 0) {
                count2[i][j]++;
                num /= 2;
            }

            while (num % 5 === 0) {
                count5[i][j]++;
                num /= 5;
            }
        }
    }

    const l2 = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const l5 = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const u2 = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const u5 = Array.from({ length: rows }, () => new Array(cols).fill(0));

    const r2 = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const r5 = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const d2 = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const d5 = Array.from({ length: rows }, () => new Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            l2[i][j] = count2[i][j] + (j > 0 ? l2[i][j - 1] : 0);
            l5[i][j] = count5[i][j] + (j > 0 ? l5[i][j - 1] : 0);

            u2[i][j] = count2[i][j] + (i > 0 ? u2[i - 1][j] : 0);
            u5[i][j] = count5[i][j] + (i > 0 ? u5[i - 1][j] : 0);
        }
    }

    for (let i = rows - 1; i >= 0; i--) {
        for (let j = cols - 1; j >= 0; j--) {
            r2[i][j] = count2[i][j] + (j < cols - 1 ? r2[i][j + 1] : 0);
            r5[i][j] = count5[i][j] + (j < cols - 1 ? r5[i][j + 1] : 0);

            d2[i][j] = count2[i][j] + (i < rows - 1 ? d2[i + 1][j] : 0);
            d5[i][j] = count5[i][j] + (i < rows - 1 ? d5[i + 1][j] : 0);
        }
    }

    let result = 0;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const paths = [
                [l2[i][j], l5[i][j], u2[i][j], u5[i][j]],
                [l2[i][j], l5[i][j], d2[i][j], d5[i][j]],
                [r2[i][j], r5[i][j], u2[i][j], u5[i][j]],
                [r2[i][j], r5[i][j], d2[i][j], d5[i][j]]
            ];

            for (const [a2, a5, b2, b5] of paths) {
                const zeros = Math.min(
                    a2 + b2 - count2[i][j],
                    a5 + b5 - count5[i][j]
                );

                result = Math.max(result, zeros);
            }
        }
    }

    return result;
}
