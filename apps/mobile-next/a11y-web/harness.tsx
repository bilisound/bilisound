import type { ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import { BilisoundProvider } from "@bilisound/ui";

/** The real app provider, so components resolve the real tamagui config/themes. */
export function Provider({ children }: { children: ReactNode }) {
  return <BilisoundProvider appearance="light">{children}</BilisoundProvider>;
}

/** React reports unknown-DOM-prop problems through console.error; capture instead of printing. */
export function captureErrors<T>(run: () => T): { errors: string[]; value: T } {
  const errors: string[] = [];
  const spy = jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args.map(arg => String(arg)).join(" "));
  });
  try {
    return { errors, value: run() };
  } finally {
    spy.mockRestore();
  }
}

/** SSR the component exactly like a prerender pass of the real web bundle. */
export function ssr(node: ReactNode) {
  const { errors, value } = captureErrors(() => renderToStaticMarkup(<Provider>{node}</Provider>));
  return { errors, html: value };
}

export async function mount(node: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<Provider>{node}</Provider>);
  });
  return {
    container,
    async unmount() {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

export async function pressKey(target: Element, key: string) {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
  await act(async () => {
    target.dispatchEvent(event);
  });
  return event;
}

export async function clickElement(target: Element) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  await act(async () => {
    target.dispatchEvent(event);
  });
  return event;
}

/** Every DOM attribute React would flag as an unrecognized `accessibility*` RN prop. */
export const RN_LEAK_ATTRS = /accessibility[a-z-]+=/i;

export function expectNoPropLeak(errors: string[]) {
  expect(
    errors.filter(message => /does not recognize|Invalid DOM property|Invalid ARIA attribute/i.test(message)),
  ).toEqual([]);
}
