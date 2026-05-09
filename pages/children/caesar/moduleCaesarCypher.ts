export const alpha =
  "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ0123456789!@#$%^&*(){}[]-+_=\\|;:,.ąĄęĘśŚźŹżŻćĆńŃłŁóÓ'\"?<>`~/ \n"; // 94

export const alphaLength = alpha.length;

export function caesarCypher(offset: number, text: string): string {
  let encrypted = "";
  for (var k = 0; k < text.length; k = k + 1) {
    const letter = text[k];
    let index = alpha.indexOf(letter);
    index = index + offset;
    if (index > alphaLength - 1) {
      index = index % alphaLength;
    }
    if (index < 0) {
      index = index % alphaLength;
      index = index + alphaLength;
    }
    const encryptedLetter = alpha[index];
    encrypted = encrypted + encryptedLetter;
  }
  return encrypted;
}
