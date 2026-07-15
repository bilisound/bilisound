import Color from "colorjs.io";

import { generateTailwindScale } from "../color-scale";
import { TAILWIND_SHADES } from "../types";

describe("generateTailwindScale", () => {
  it("generates every Tailwind shade key", () => {
    const scale = generateTailwindScale("#14b8a6");
    expect(Object.keys(scale)).toEqual(TAILWIND_SHADES);
  });

  it("keeps medium colors closest to shade 500", () => {
    const scale = generateTailwindScale("#14b8a6");
    expect(getClosestShade(scale, "#14b8a6")).toBe("500");
    expect(scale["500"]).toBe("#14b8a6");
  });

  it("accepts rgb input", () => {
    const scale = generateTailwindScale("rgb(20 184 166)");
    expect(getClosestShade(scale, "#14b8a6")).toBe("500");
  });

  it("places bright source colors on a lighter shade", () => {
    const scale = generateTailwindScale("#fde047");
    expect(getClosestShade(scale, "#fde047")).toBe("300");
    expect(scale["300"]).toBe("#fde047");
  });

  it("does not turn generated middle shades black when source shade is not 500", () => {
    const scale = generateTailwindScale("#fde047");
    expect(scale["500"]).not.toBe("#000000");
  });

  it("smooths neighboring lightness around the source color intent", () => {
    const scale = generateTailwindScale("#dfc8b9");
    const deltas = TAILWIND_SHADES.slice(1).map((shade, index) => {
      const previousShade = TAILWIND_SHADES[index];
      return Math.abs(getLightness(scale[shade]) - getLightness(scale[previousShade]));
    });

    expect(Math.max(...deltas)).toBeLessThanOrEqual(0.12);
  });
});

function getClosestShade(scale: ReturnType<typeof generateTailwindScale>, target: string) {
  const targetColor = new Color(target).to("oklch");
  return TAILWIND_SHADES.reduce((closestShade, shade) => {
    const currentDistance = getOklchDistance(scale[shade], targetColor);
    const closestDistance = getOklchDistance(scale[closestShade], targetColor);
    return currentDistance < closestDistance ? shade : closestShade;
  }, TAILWIND_SHADES[0]);
}

function getOklchDistance(color: string, targetColor: Color) {
  const oklch = new Color(color).to("oklch");
  const lightnessDelta = (oklch.coords[0] ?? 0) - (targetColor.coords[0] ?? 0);
  const chromaDelta = (oklch.coords[1] ?? 0) - (targetColor.coords[1] ?? 0);
  return Math.hypot(lightnessDelta, chromaDelta);
}

function getLightness(color: string) {
  return new Color(color).to("oklch").coords[0] ?? 0;
}
