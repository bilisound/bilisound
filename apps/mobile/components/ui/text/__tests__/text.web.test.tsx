/// <reference types="jest" />
import { normalizeWebTextStyle } from "../web-style";

describe("web Text", () => {
  it("renders numeric lineHeight as px instead of a unitless CSS multiplier", () => {
    expect(normalizeWebTextStyle({ fontSize: 15, lineHeight: 22.5 })).toMatchObject({
      fontSize: 15,
      lineHeight: "22.5px",
    });
  });
});
