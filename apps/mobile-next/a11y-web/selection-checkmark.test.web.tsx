/**
 * Web regression for the edit-mode selection circle of
 * `components/playlist-track-row.tsx`.
 *
 * The checked circle paints a solid `$primarySolid` disc and puts the
 * `fa6-solid:check` glyph on top of it. The glyph must use the readable
 * on-solid foreground token (`$primaryOnSolid`) — the same convention the
 * checkbox/button recipes and `app/settings/theme.tsx` use — never the token
 * that fills the disc, otherwise the check disappears into the background.
 * The unchecked circle stays transparent, and the reviewed edit-mode
 * `aria-pressed` contract must keep working.
 *
 * Renders the real react-native-web component inside the real app provider
 * (`BilisoundProvider`) in both appearances. The check icon resolves through
 * the reviewed svg stub, which keeps every prop — including `color` — the way
 * the metro svg-transformer pipeline forwards it to the browser.
 */
import { BilisoundProvider } from "@bilisound/ui";
import { useTheme } from "@tamagui/core";
import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { PlaylistTrackRow } from "~/components/playlist-track-row";

jest.mock("~/features/cache", () => ({ useCacheExists: () => false }));

jest.mock("~/features/player", () => ({
  useCurrentTrack: () => null,
  useIsPlaying: () => false,
  usePlaybackState: () => undefined,
  toggle: jest.fn(),
}));

const mockTrack = { author: "阿婆主", bvid: "BV1TEST", duration: 61, episode: 1, title: "测试曲目" };

interface ThemeTokens {
  primarySolid: string;
  primaryOnSolid: string;
}

let capturedTokens: ThemeTokens | undefined;

function ThemeProbe() {
  const theme = useTheme() as unknown as Record<string, { get: () => string }>;
  // Module state is written in an effect, not during render; `act` flushes it
  // before the assertions run.
  useEffect(() => {
    capturedTokens = {
      primarySolid: theme.primarySolid.get(),
      primaryOnSolid: theme.primaryOnSolid.get(),
    };
  }, [theme]);
  return null;
}

async function mountRow(appearance: "light" | "dark", isChecked: boolean) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <BilisoundProvider appearance={appearance}>
        <ThemeProbe />
        <PlaylistTrackRow data={mockTrack} index={3} isChecking isChecked={isChecked} onToggle={() => {}} />
      </BilisoundProvider>,
    );
  });
  return {
    container,
    tokens: capturedTokens as ThemeTokens,
    async unmount() {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

/**
 * Every CSS declaration Tamagui has injected into this document, in order.
 *
 * The base sheet ships as `<style>` text (unparseable by jsdom, so its sheet is
 * null), while the atomic utility classes are inserted through CSSOM and only
 * surface as `sheet.cssRules` — collect both.
 */
function injectedCss(): string {
  const parts: string[] = [];
  for (const style of Array.from(document.querySelectorAll("style"))) {
    parts.push(style.textContent ?? "");
    const sheet = style.sheet;
    if (sheet) {
      for (const rule of Array.from(sheet.cssRules)) parts.push(rule.cssText);
    }
  }
  return parts.join("\n");
}

/**
 * Resolve the value a rendered element actually gets for one atomic Tamagui
 * class (e.g. `_backgroundColor-primarySoli100` -> `var(--primarySolid)`), by
 * reading the rule Tamagui injected for that class.
 */
function resolveClassValue(element: Element, classPrefix: string, property: string): string {
  const className = Array.from(element.classList).find(name => name.startsWith(classPrefix));
  if (!className) {
    throw new Error(`No "${classPrefix}" class on the element; classes: ${element.className}`);
  }
  const rule = new RegExp(`\\.${className}\\s*\\{[^}]*?${property}:\\s*([^;]+);`).exec(injectedCss());
  if (!rule) {
    throw new Error(`No CSS rule for .${className} with a "${property}" declaration was injected`);
  }
  return rule[1].trim();
}

describe("selection circle checkmark on web", () => {
  for (const appearance of ["light", "dark"] as const) {
    it(`${appearance}: a checked row shows the check in the on-solid foreground, never in the circle fill`, async () => {
      const view = await mountRow(appearance, true);

      const svgs = view.container.querySelectorAll("svg");
      expect(svgs).toHaveLength(1);
      const checkIcon = svgs[0];
      const circle = checkIcon.parentElement as Element;

      const fill = resolveClassValue(circle, "_backgroundColor-", "background-color");
      const iconColor = checkIcon.getAttribute("color");

      // The circle really is the solid primary fill...
      expect(fill).toBe(view.tokens.primarySolid);
      // ...and the glyph uses the readable foreground, so the two differ.
      expect(iconColor).toBe(view.tokens.primaryOnSolid);
      expect(iconColor).not.toBe(fill);

      // The reviewed edit-mode toggle semantics stay untouched by the color fix.
      expect(view.container.querySelector('[role="button"]')?.getAttribute("aria-pressed")).toBe("true");

      await view.unmount();
    });

    it(`${appearance}: an unchecked row keeps the icon transparent`, async () => {
      const view = await mountRow(appearance, false);

      const svgs = view.container.querySelectorAll("svg");
      expect(svgs).toHaveLength(1);
      const checkIcon = svgs[0];
      const circle = checkIcon.parentElement as Element;

      expect(checkIcon.getAttribute("color")).toBe("transparent");
      expect(resolveClassValue(circle, "_backgroundColor-", "background-color")).toBe("transparent");
      expect(resolveClassValue(circle, "_btc-", "border-top-color")).toBe("var(--border)");

      await view.unmount();
    });
  }
});
