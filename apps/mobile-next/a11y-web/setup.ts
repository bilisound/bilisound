// React 19 `act` outside a test renderer requires this flag.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// SSR uses server.node; a Node MessageChannel polyfill only leaves React's scheduler port open.

// jsdom 20 cannot parse the modern CSS Tamagui injects (`@scope`, `::backdrop`).
// The page still renders; only the repeated parse report is dropped here.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  const message = first instanceof Error ? first.message : String(first);
  if (message.includes("Could not parse CSS stylesheet")) {
    return;
  }
  originalConsoleError(...args);
};
