#!/usr/bin/env node
/**
 * Regression check for the typed-routes Metro watch handler of `@expo/router-server`.
 *
 * Background: Metro reports changed files relative to its project root (`config.projectRoot`),
 * e.g. `..\..\.temp\worktrees\...\components\settings-menu.tsx` on Windows, and `@expo/cli`
 * forwards `change[0]` unchanged to `getWatchHandler`. That handler used to feed the value into
 * `path.relative(EXPO_ROUTER_APP_ROOT, filePath)` and to reject anything that did not start with
 * `'../'`. On Windows the relative result starts with `..\`, so the check never matched and every
 * watched `.ts`/`.tsx` file outside `app/` leaked into `.expo/types/router.d.ts` as a `/../…`
 * route. A same-named `.ts` + `.tsx` pair outside `app/` even cleared every route, because the
 * resulting route conflict is swallowed by the generator that writes the 816 byte zero-route
 * template. See `.temp/reviews/next-typed-routes.md`.
 *
 * This script drives the real handler in-process with Metro's canonical (project-root relative)
 * event paths and checks that (relative events require cwd == Metro projectRoot, as with
 * `pnpm -C apps/mobile-next start`; starting Expo from another cwd is not covered):
 *   1. add / change / delete of real routes under `app/` still work,
 *   2. watched files outside `app/` never reach the route context,
 *   3. same-named `.ts`/`.tsx` pairs outside `app/` cannot clear the generated routes,
 *   4. absolute inputs and POSIX separators behave identically.
 *
 * No Metro, no dev server, no ports, no device: the handler is called directly and the generated
 * declarations are only inspected in memory. Fixtures live in `.temp/router-watch-check/` and are
 * removed again (use `--keep` to keep them for inspection).
 *
 * Usage:
 *   node apps/mobile-next/scripts/check-router-watch.cjs [--keep] [--verbose]
 *
 * Environment:
 *   ROUTER_SERVER_DIR  Package directory to test. Defaults to the same resolution `@expo/cli`
 *                      uses (`@expo/router-server/build/typed-routes` from the CLI package).
 *                      When testing an extracted patch directory (`pnpm patch --edit-dir`), also
 *                      set NODE_PATH to the peer dependency directory of the installed package,
 *                      e.g. <repo>/node_modules/.pnpm/@expo+router-server@<version>/node_modules
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const APP_DIR = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(APP_DIR, "..", "..");

const WORK_DIR = path.join(REPO_ROOT, ".temp", "router-watch-check");
const FIXTURE_ROOT = path.join(WORK_DIR, "workspace"); // stands in for the monorepo root (watchFolders)
const PROJECT_ROOT = path.join(FIXTURE_ROOT, "project"); // stands in for apps/mobile-next (Metro projectRoot)
const APP_ROOT = path.join(PROJECT_ROOT, "app"); // stands in for apps/mobile-next/app
const TYPE_OUTPUT_DIR = path.join(PROJECT_ROOT, ".expo", "types"); // where router.d.ts would be written

const KEEP = process.argv.includes("--keep");
const VERBOSE = process.argv.includes("--verbose");

/** Route files, relative to the fixture app directory. */
const APP_FILES = ["_layout.tsx", "index.tsx", "settings.tsx", "settings/about.tsx", "settings/log/[id].tsx"];

/** Watched TypeScript files that must never become routes, relative to PROJECT_ROOT. */
const PROJECT_NON_ROUTES = [
  "components/download-button.tsx",
  "features/playlist/cover.ts",
  "packages/sdk/src/index.tsx",
  "app-other/route.tsx",
  "app.config.ts",
];

/** Watched TypeScript files outside the Metro project root, relative to FIXTURE_ROOT. */
const WORKSPACE_NON_ROUTES = [
  ".temp/worktrees/next-settings/apps/mobile-next/components/settings-menu.tsx",
  ".temp/reviews/frozen/v2/useDownloadMenuItem.ts",
  ".temp/reviews/frozen/v2/useDownloadMenuItem.tsx",
];

const SOURCE = "export default function Screen() {\n  return null;\n}\n";

function writeFixtureFile(absolutePath, contents = SOURCE) {
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents, "utf8");
}

function createFixture() {
  fs.rmSync(WORK_DIR, { recursive: true, force: true });
  fs.mkdirSync(TYPE_OUTPUT_DIR, { recursive: true });
  for (const file of APP_FILES) writeFixtureFile(path.join(APP_ROOT, file));
  for (const file of PROJECT_NON_ROUTES) writeFixtureFile(path.join(PROJECT_ROOT, file));
  for (const file of WORKSPACE_NON_ROUTES) {
    // The historical trigger was a same-named `.ts` + `.tsx` pair where the `.tsx` copy was empty.
    writeFixtureFile(path.join(FIXTURE_ROOT, file), file.endsWith(".tsx") ? "" : SOURCE);
  }
}

function findPackageRoot(startDir, packageName) {
  for (let dir = startDir; ;) {
    const manifestPath = path.join(dir, "package.json");
    if (fs.existsSync(manifestPath)) {
      try {
        if (JSON.parse(fs.readFileSync(manifestPath, "utf8")).name === packageName) return dir;
      } catch {
        // Ignore malformed manifests while walking up.
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function resolveRouterServerDir() {
  if (process.env.ROUTER_SERVER_DIR) return path.resolve(process.env.ROUTER_SERVER_DIR);

  const resolveFrom = (request, from) => {
    try {
      return require.resolve(request, { paths: [from] });
    } catch {
      return null;
    }
  };

  // `@expo/cli` calls `require.resolve('@expo/router-server/build/typed-routes')` from inside the
  // CLI package, so try that chain first, then the usual workspace locations.
  const roots = [];
  const expoManifest = resolveFrom("expo/package.json", APP_DIR);
  if (expoManifest) roots.push(path.dirname(expoManifest));
  roots.push(APP_DIR, REPO_ROOT);
  for (const root of roots) {
    const entry = resolveFrom("@expo/router-server/build/typed-routes", root);
    const packageDir = entry && findPackageRoot(path.dirname(entry), "@expo/router-server");
    if (packageDir) return packageDir;
  }

  // pnpm fallback: node_modules/.pnpm/@expo+router-server@<version>/node_modules/@expo/router-server
  const pnpmDir = path.join(REPO_ROOT, "node_modules", ".pnpm");
  if (fs.existsSync(pnpmDir)) {
    for (const name of fs.readdirSync(pnpmDir)) {
      if (!name.startsWith("@expo+router-server@")) continue;
      const candidate = path.join(pnpmDir, name, "node_modules", "@expo", "router-server");
      if (fs.existsSync(path.join(candidate, "build", "typed-routes", "index.js"))) return candidate;
    }
  }

  throw new Error("Could not resolve @expo/router-server. Set ROUTER_SERVER_DIR to a package directory.");
}

async function main() {
  createFixture();

  // `@expo/router-server` scans the app directory when it is imported, so `EXPO_ROUTER_APP_ROOT`
  // has to be set before the require below. Same order as `@expo/cli`.
  process.env.EXPO_ROUTER_APP_ROOT = APP_ROOT;

  // The handler resolves relative event paths against `process.cwd()`, and Metro's canonical paths
  // are relative to the Metro project root, which is also the cwd of `expo start`.
  process.chdir(PROJECT_ROOT);

  const serverDir = resolveRouterServerDir();
  const serverRequire = Module.createRequire(path.join(serverDir, "package.json"));
  const { getWatchHandler } = serverRequire("./build/typed-routes/index.js");
  const { getTypedRoutesDeclarationFile } = serverRequire("./build/typed-routes/generate.js");
  const { requireContext } = serverRequire("expo-router/internal/testing");
  const { EXPO_ROUTER_CTX_IGNORE } = serverRequire("expo-router/_ctx-shared");

  const handlerSource = fs.readFileSync(path.join(serverDir, "build", "typed-routes", "index.js"), "utf8");
  const patched = handlerSource.includes("absoluteFilePath");

  console.log(`@expo/router-server : ${serverDir}`);
  console.log(`handler patch marker: ${patched ? "found" : "NOT FOUND (pre-patch handler)"}`);
  console.log(`cwd                 : ${process.cwd()}`);
  console.log(`app root            : ${APP_ROOT}`);

  const ctx = requireContext(APP_ROOT, true, EXPO_ROUTER_CTX_IGNORE);
  let regenerations = 0;
  const handler = getWatchHandler(TYPE_OUTPUT_DIR, {
    ctx,
    regenerateFn: () => {
      regenerations += 1;
    },
  });

  const declarations = () => getTypedRoutesDeclarationFile(ctx);
  const pollutedKeys = () => ctx.keys().filter(key => key.includes("..") || key.includes("\\"));
  const canonical = absolutePath => path.relative(PROJECT_ROOT, absolutePath);
  const appKey = absolutePath => `./${path.relative(APP_ROOT, absolutePath).split(path.sep).join("/")}`;

  const results = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  async function check(name, run) {
    const before = regenerations;
    try {
      await run();
      results.push(true);
      console.log(`  PASS  ${name}${VERBOSE ? ` (regenerations: +${regenerations - before})` : ""}`);
    } catch (error) {
      results.push(false);
      console.log(`  FAIL  ${name}`);
      console.log(`        ${error.message}`);
      if (VERBOSE) console.log(error.stack);
    }
  }

  const assertNoPollution = label => {
    const polluted = pollutedKeys();
    assert(polluted.length === 0, `${label}: route context polluted with ${JSON.stringify(polluted)}`);
    const file = declarations();
    assert(!file.includes(".temp"), `${label}: generated declarations reference .temp`);
    assert(!file.includes("/../"), `${label}: generated declarations contain a "/../" route`);
  };

  console.log("\n[1] baseline");
  await check("fixture routes are picked up by the initial scan", async () => {
    assert(
      ctx.keys().length === APP_FILES.length,
      `expected ${APP_FILES.length} context keys, got ${JSON.stringify(ctx.keys())}`,
    );
    assert(declarations().includes("/settings/about"), "generated declarations are missing /settings/about");
    assertNoPollution("baseline");
  });

  console.log("\n[2] add / change / delete of real routes under app/");
  const newRoute = path.join(APP_ROOT, "settings", "new-page.tsx");

  await check("add: nested route is registered and regenerated", async () => {
    const before = regenerations;
    await handler(canonical(newRoute), "add");
    assert(ctx.keys().includes(appKey(newRoute)), `expected context key ${appKey(newRoute)}`);
    assert(regenerations === before + 1, `expected one regeneration, got ${regenerations - before}`);
    assert(declarations().includes("/settings/new-page"), "generated declarations are missing /settings/new-page");
    assertNoPollution("after add");
  });

  await check("change: existing route triggers a regeneration", async () => {
    const before = regenerations;
    await handler(canonical(newRoute), "change");
    assert(regenerations === before + 1, `expected one regeneration, got ${regenerations - before}`);
    assert(ctx.keys().includes(appKey(newRoute)), "route key disappeared on change");
  });

  await check("delete: route leaves the context and the declarations", async () => {
    const before = regenerations;
    await handler(canonical(newRoute), "delete");
    assert(!ctx.keys().includes(appKey(newRoute)), `context key ${appKey(newRoute)} was not deleted`);
    assert(regenerations === before + 1, `expected one regeneration, got ${regenerations - before}`);
    assert(!declarations().includes("/settings/new-page"), "generated declarations still contain /settings/new-page");
  });

  await check("delete: scanned nested route is removed", async () => {
    const target = path.join(APP_ROOT, "settings", "about.tsx");
    const before = regenerations;
    await handler(canonical(target), "delete");
    assert(!ctx.keys().includes(appKey(target)), `context key ${appKey(target)} was not deleted`);
    assert(regenerations === before + 1, `expected one regeneration, got ${regenerations - before}`);
    assert(!declarations().includes("/settings/about"), "generated declarations still contain /settings/about");
    await handler(canonical(target), "add"); // restore the fixture
    assert(ctx.keys().includes(appKey(target)), "restoring the deleted route failed");
  });

  await check("add: absolute path input behaves the same", async () => {
    const target = path.join(APP_ROOT, "settings", "absolute-page.tsx");
    const before = regenerations;
    await handler(target, "add");
    assert(ctx.keys().includes(appKey(target)), `expected context key ${appKey(target)} for an absolute input`);
    assert(regenerations === before + 1, `expected one regeneration, got ${regenerations - before}`);
    await handler(target, "delete");
  });

  await check("add: forward slash input behaves the same", async () => {
    const target = path.join(APP_ROOT, "settings", "posix-page.tsx");
    const before = regenerations;
    await handler(canonical(target).split(path.sep).join("/"), "add");
    assert(ctx.keys().includes(appKey(target)), `expected context key ${appKey(target)} for forward slashes`);
    assert(regenerations === before + 1, `expected one regeneration, got ${regenerations - before}`);
    await handler(target, "delete");
  });

  console.log("\n[3] watched files outside app/ must not become routes");
  const outsideFiles = [
    ...PROJECT_NON_ROUTES.map(file => path.join(PROJECT_ROOT, file)),
    ...WORKSPACE_NON_ROUTES.map(file => path.join(FIXTURE_ROOT, file)),
  ];
  for (const target of outsideFiles) {
    const label = path.relative(FIXTURE_ROOT, target);
    await check(`ignore ${label}`, async () => {
      const keysBefore = ctx.keys().length;
      const declarationsBefore = declarations();
      const regenerationsBefore = regenerations;
      for (const type of ["add", "change", "delete"]) {
        await handler(canonical(target), type);
      }
      assert(ctx.keys().length === keysBefore, `route context changed: ${JSON.stringify(ctx.keys())}`);
      assert(
        regenerations === regenerationsBefore,
        `handler regenerated ${regenerations - regenerationsBefore} time(s)`,
      );
      assert(declarations() === declarationsBefore, "generated declarations changed");
      assertNoPollution(label);
    });
  }

  console.log("\n[4] path escapes");
  await check("ignore an unnormalized path that climbs out of app/", async () => {
    const keysBefore = ctx.keys().length;
    const before = regenerations;
    // A literal, unnormalized path: string prefix checks must not be enough to pass it.
    await handler("app/../components/download-button.tsx", "add");
    assert(ctx.keys().length === keysBefore, `route context changed: ${JSON.stringify(ctx.keys())}`);
    assert(regenerations === before, "handler regenerated for a path outside app/");
  });

  await check("ignore an absolute path outside app/", async () => {
    const target = path.join(PROJECT_ROOT, "components", "download-button.tsx");
    const keysBefore = ctx.keys().length;
    const before = regenerations;
    await handler(target, "add");
    assert(ctx.keys().length === keysBefore, `route context changed: ${JSON.stringify(ctx.keys())}`);
    assert(regenerations === before, "handler regenerated for a path outside app/");
  });

  console.log("\n[5] declarations after all events");
  await check("routes survive non-route traffic and same-named .ts/.tsx pairs", async () => {
    const file = declarations();
    assert(file.includes("/settings/about"), "generated declarations lost /settings/about");
    assert(file.includes("/settings/log/"), "generated declarations lost /settings/log/[id]");
    assert(file.includes("`/settings${"), "generated declarations lost /settings");
    assertNoPollution("final");
  });

  const failures = results.filter(ok => !ok).length;
  console.log(`\n${results.length - failures}/${results.length} checks passed`);
  if (failures > 0) {
    console.log(
      patched
        ? "The patched handler still misbehaves; see the failures above."
        : "The handler still has the Windows path bug; run `pnpm install` with the patch applied.",
    );
    process.exitCode = 1;
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    // Windows cannot remove the process' current directory, so leave the fixture project first.
    process.chdir(REPO_ROOT);
    if (KEEP) {
      console.log(`\nfixtures kept at ${WORK_DIR}`);
    } else {
      fs.rmSync(WORK_DIR, { recursive: true, force: true });
    }
  });
