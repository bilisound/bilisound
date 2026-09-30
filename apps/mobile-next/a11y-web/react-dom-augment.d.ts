/**
 * Minimal ambient types for the react-dom entry points the web a11y harness uses.
 * The app does not depend on `@types/react-dom` (react-dom itself is only pulled
 * in for the web tests), so declare just the surface used here.
 */
declare module "react-dom/client" {
  import type { ReactNode } from "react";

  export function createRoot(container: Element | DocumentFragment): {
    render(children: ReactNode): void;
    unmount(): void;
  };
}

declare module "react-dom/server" {
  import type { ReactNode } from "react";

  export function renderToStaticMarkup(children: ReactNode): string;
}
