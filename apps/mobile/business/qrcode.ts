import { resolveVideoAndJump } from "./format";

export async function handleQrCode(input: string) {
  await resolveVideoAndJump(input, true);
  return "";
}
