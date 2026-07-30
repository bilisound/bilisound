if (process.env.STORYBOOK_ENABLED !== "true") {
  throw new Error("packages/ui/index.ts is reserved for the native Storybook entry");
}

require("./.rnstorybook");
