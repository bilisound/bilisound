module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // 临时方案：解决 Web 端 Cannot use 'import.meta' outside a module 错误
          unstable_transformImportMeta: true,
        },
      ],
      "nativewind/babel",
    ],

    plugins: [
      ["react-native-worklets-core/plugin"],
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "~": "./",
            "tailwind.config": "./tailwind.config.js",
          },
        },
      ],
    ],
  };
};
