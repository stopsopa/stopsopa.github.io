class Solution {
    public int solution(int N) {
        int maxGap = 0;
        int currentGap = 0;
        boolean foundOne = false;

        while (N > 0) {
            if ((N & 1) == 1) {
                if (foundOne) {
                    maxGap = Math.max(maxGap, currentGap);
                }
                foundOne = true;
                currentGap = 0;
            } else if (foundOne) {
                currentGap++;
            }

            N >>= 1;
        }

        return maxGap;
    }
}