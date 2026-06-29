describe("buttonStyle Android ripple behavior", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("~/constants/platform");
  });

  it("keeps native ripple out of className when Android ripple is enabled", () => {
    const { buttonStyle } = loadButtonStyles(true);

    const className = buttonStyle({ variant: "solid", action: "primary", size: "md" });

    expect(className).not.toContain("android_ripple");
    expect(className).not.toContain("data-[active=true]:bg-primary-700");
    expect(className).not.toContain("data-[hover=true]:bg-primary-600");
  });

  it("keeps press feedback classes when native ripple is disabled", () => {
    const { buttonStyle } = loadButtonStyles(false);

    const className = buttonStyle({ variant: "solid", action: "primary", size: "md" });

    expect(className).toContain("data-[active=true]:bg-primary-700");
    expect(className).toContain("data-[hover=true]:bg-primary-600");
  });
});

describe("pressableStyle Android ripple behavior", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("~/constants/platform");
  });

  it("keeps native ripple out of className when Android ripple is enabled", () => {
    const { pressableStyle } = loadPressableStyles(true);

    const className = pressableStyle({ androidRipple: true });

    expect(className).not.toContain("android_ripple");
    expect(className).not.toContain("active:bg-background-100");
    expect(className).not.toContain("hover:bg-background-50");
  });

  it("keeps press feedback classes when native ripple is disabled", () => {
    const { pressableStyle } = loadPressableStyles(false);

    const className = pressableStyle({ androidRipple: true });

    expect(className).toContain("active:bg-background-100");
    expect(className).toContain("hover:bg-background-50");
  });
});

describe("createAndroidRipple", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("~/constants/platform");
  });

  it("returns native ripple props with resolved theme color when enabled", () => {
    const { createAndroidRipple } = loadAndroidRipple(true);

    expect(createAndroidRipple(color => `resolved:${color}`, "--color-primary-700")).toEqual({
      color: "resolved:--color-primary-700",
    });
  });

  it("returns undefined when native ripple is disabled", () => {
    const { createAndroidRipple } = loadAndroidRipple(false);

    expect(createAndroidRipple(color => `resolved:${color}`, "--color-primary-700")).toBeUndefined();
  });
});

function loadButtonStyles(isAndroidRippleEnabled: boolean) {
  jest.resetModules();
  jest.doMock("@gluestack-ui/utils/nativewind-utils", () => ({
    tva: createTva,
  }));
  jest.doMock("~/constants/platform", () => ({
    IS_ANDROID_RIPPLE_ENABLED: isAndroidRippleEnabled,
  }));

  return require("../styles") as typeof import("../styles");
}

function loadPressableStyles(isAndroidRippleEnabled: boolean) {
  jest.resetModules();
  jest.doMock("@gluestack-ui/utils/nativewind-utils", () => ({
    tva: createTva,
  }));
  jest.doMock("~/constants/platform", () => ({
    IS_ANDROID_RIPPLE_ENABLED: isAndroidRippleEnabled,
  }));

  return require("../../pressable/styles") as typeof import("../../pressable/styles");
}

function loadAndroidRipple(isAndroidRippleEnabled: boolean) {
  jest.resetModules();
  jest.doMock("~/constants/platform", () => ({
    IS_ANDROID_RIPPLE_ENABLED: isAndroidRippleEnabled,
  }));

  return require("../../android-ripple") as typeof import("../../android-ripple");
}

function createTva(config: {
  base?: string;
  variants?: Record<string, Record<string, string>>;
  compoundVariants?: Array<Record<string, unknown> & { class?: string }>;
}) {
  return (options: Record<string, unknown> = {}) => {
    const classes = [config.base];

    for (const [variantName, variantOptions] of Object.entries(config.variants ?? {})) {
      const value = options[variantName];
      if (value !== undefined) {
        classes.push(variantOptions[String(value)]);
      }
    }

    for (const compoundVariant of config.compoundVariants ?? []) {
      const matches = Object.entries(compoundVariant).every(([key, value]) => {
        return key === "class" || options[key] === value;
      });
      if (matches) {
        classes.push(compoundVariant.class);
      }
    }

    if (typeof options.class === "string") {
      classes.push(options.class);
    }

    return classes.filter(Boolean).join(" ");
  };
}
