// https://github.com/IvanLuLyf/bilibili-av-bv-converter

const magicStr = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf";
const table: Record<string, bigint> = {};
for (let i = 0; i < magicStr.length; i++) table[magicStr[i]] = BigInt(i);
let s = [0, 1, 2, 9, 7, 5, 6, 4, 8, 3, 10, 11];
const BASE = 58n,
  MAX = 1n << 51n,
  LEN = 12;
const XOR = 23442827791579n,
  MASK = 2251799813685247n;

export function av2bv(src: number | bigint) {
  if (typeof src !== "bigint") src = BigInt(src);
  let r = Array.from("BV1         ");
  let it = LEN - 1;
  let tmp = (src | MAX) ^ XOR;
  while (tmp !== 0n) {
    r[s[it]] = magicStr[Number(tmp % BASE)];
    tmp /= BASE;
    it--;
  }
  return r.join("");
}

export function bv2av(src: string) {
  let r = 0n;
  for (let i = 3; i < LEN; i++) {
    r = r * BASE + BigInt(table[src[s[i]]]);
  }
  return (r & MASK) ^ XOR;
}
