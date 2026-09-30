#!/usr/bin/env node
/**
 * generate-license.cjs — regenerate `third-party-licenses.txt` for apps/mobile-next.
 *
 * WHY THIS EXISTS
 * ---------------
 * The official `generate-license-file` CLI decides between "npm mode" and
 * "pnpm mode" by looking for a `pnpm-lock.yaml` NEXT TO the input package.json
 * (src/lib/internal/resolveDependencies/index.js). This workspace keeps a
 * single lockfile at the repo root, so the CLI silently falls back to npm mode
 * and only sees the app's direct dependencies. This script therefore keeps the
 * official *pnpm* data source (`pnpm licenses list --prod --json`) and reuses
 * the official tool's own resolution and formatting code
 * (`resolveLicenseContent`, `resolveNotices`, `License`), pinned to the
 * `generate-license-file` version declared in this app's devDependencies.
 *
 * FIXED INPUTS (edit the constants below only when the dependency set changes)
 * ------------
 *   - `pnpm licenses list --prod --json --filter <project>` for
 *     @bilisound/mobile-next, @bilisound/ui, @bilisound/sdk, @bilisound/player
 *   - `pnpm list --prod --depth Infinity --json --filter @bilisound/mobile-next`
 *     (list-tree coverage: reaches workspace-linked dependencies and
 *     not-installed platform packages that the licenses report collapses)
 *
 * OUTPUTS
 * -------
 *   - <app>/third-party-licenses.txt                  (shipped artifact, LF)
 *   - <repo>/.temp/next-licenses-generated/manifest.json
 *   - <repo>/.temp/next-licenses-generated/coverage.json
 *   - <repo>/.temp/next-licenses-generated/raw/*.json (raw pnpm stdout captures)
 *
 * FAILURE BEHAVIOUR
 * -----------------
 * Any pnpm start/exit failure, non-JSON output (the single exception being
 * player's known empty message, see below), or a failed coverage expectation
 * aborts the run BEFORE any output is replaced. Existing shipped files are
 * left untouched; raw captures are still written for diagnosis.
 *
 * FLAGS (deliberately small; both exist to replay/inspect captured runs)
 * ---------------------------------------------------------------------
 *   --out <file>      write the text to <file> instead of <app>/third-party-licenses.txt
 *   --from-raw <dir>  reuse raw captures from <dir> instead of running pnpm
 *                     (dir must contain the same `*.json` names this script writes)
 */

"use strict";

const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Fixed configuration
// ---------------------------------------------------------------------------

const APP_PACKAGE_NAME = "@bilisound/mobile-next";
/** The deep imports below are pinned to this package layout; bump after re-review. */
const EXPECTED_GLF_VERSION = "4.2.1";
/** `pnpm licenses list --prod --json --filter <project>` inputs, in order. */
const LICENSE_PROJECTS = ["@bilisound/mobile-next", "@bilisound/ui", "@bilisound/sdk", "@bilisound/player"];
/** `pnpm list --prod --depth Infinity --json --filter <project>` input. */
const TREE_PROJECT = "@bilisound/mobile-next";
/** The only source allowed to be legitimately empty, and its exact message. */
const EMPTY_LICENSES_PROJECT = "@bilisound/player";
const EMPTY_LICENSES_MESSAGE = "No licenses in packages found";
/** Coverage expectations. A violation fails the run without replacing any output. */
const EXPECT_PRESENT = ["@tamagui/core", "reanimated-color-picker", "mp4.js", "expo-router", "react-native", "axios"];
const EXPECT_ABSENT = ["nativewind", "@gluestack-ui/themed"];
/** The shipped file is byte-stable LF regardless of the platform that runs this. */
const EOL = "\n";

// ---------------------------------------------------------------------------
// Paths (derived from this file's location: <app>/scripts/generate-license.cjs)
// ---------------------------------------------------------------------------

const APP_DIR = path.resolve(__dirname, "..");
const DEFAULT_OUT_FILE = path.join(APP_DIR, "third-party-licenses.txt");
const REPO_ROOT = findRepoRoot(APP_DIR);
const REPORT_DIR = path.join(REPO_ROOT, ".temp", "next-licenses-generated");
const RAW_DIR = path.join(REPORT_DIR, "raw");
const MANIFEST_FILE = path.join(REPORT_DIR, "manifest.json");
const COVERAGE_FILE = path.join(REPORT_DIR, "coverage.json");

function findRepoRoot(startDir) {
  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`could not find the pnpm workspace root above ${startDir}`);
    dir = parent;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rawLabel = (prefix, project) => `${prefix}-${project.replace(/[^\w.-]+/g, "_")}`;

function runPnpm(args, label) {
  const res = spawnSync("pnpm", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    shell: false,
  });
  if (res.error) throw new Error(`pnpm ${args.join(" ")} failed to start: ${res.error.message}`);
  const stdout = res.stdout ?? "";
  const stderr = res.stderr ?? "";
  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(path.join(RAW_DIR, `${label}.json`), stdout, "utf8");
  if (stderr.trim() !== "") fs.writeFileSync(path.join(RAW_DIR, `${label}.stderr.txt`), stderr, "utf8");
  if (res.status !== 0) {
    throw new Error(
      `pnpm ${args.join(" ")} exited with status ${res.status}; raw output kept in ${RAW_DIR} for diagnosis`,
    );
  }
  return stdout;
}

function readRaw(label, rawInputDir) {
  const file = path.join(rawInputDir, `${label}.json`);
  if (!fs.existsSync(file)) throw new Error(`--from-raw: missing capture ${file}`);
  return fs.readFileSync(file, "utf8");
}

/** `pnpm licenses list --prod --json` -> [{name, path}] (pnpm prints license groups). */
function parseLicensesList(raw, project) {
  const trimmed = raw.trim();
  if (trimmed === "") throw new Error(`pnpm licenses list for ${project} returned no output`);
  if (trimmed === EMPTY_LICENSES_MESSAGE) {
    if (project !== EMPTY_LICENSES_PROJECT) {
      throw new Error(
        `pnpm licenses list for ${project} returned "${EMPTY_LICENSES_MESSAGE}" — ` +
          `only ${EMPTY_LICENSES_PROJECT} may legitimately have no licenses`,
      );
    }
    return [];
  }
  let data;
  try {
    data = JSON.parse(trimmed);
  } catch (err) {
    throw new Error(
      `pnpm licenses list for ${project} returned invalid JSON: ${err.message}; ` +
        `starts with ${JSON.stringify(trimmed.slice(0, 120))}`,
    );
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`pnpm licenses list for ${project} returned unexpected JSON (not an object)`);
  }
  if (data.error) throw new Error(`pnpm licenses list for ${project} reported ${data.error.code}: ${data.error.message}`);
  const records = [];
  for (const [license, group] of Object.entries(data)) {
    if (!Array.isArray(group)) throw new Error(`pnpm licenses list for ${project}: unexpected group for ${license}`);
    for (const rec of group) {
      for (const p of rec.paths ?? []) records.push({ name: rec.name, license, path: p });
    }
  }
  return records;
}

/** `pnpm list --prod --depth Infinity --json` -> [{name, version, path}]. */
function collectListTreePaths(raw, project) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`pnpm list for ${project} returned invalid JSON: ${err.message}`);
  }
  const roots = Array.isArray(data) ? data : [data];
  const out = [];
  const walk = (deps) => {
    for (const [name, info] of Object.entries(deps ?? {})) {
      if (info?.path) out.push({ name: info.name ?? name, version: info.version, path: info.path });
      if (info?.dependencies) walk(info.dependencies);
    }
  };
  for (const root of roots) walk(root?.dependencies);
  if (out.length === 0) throw new Error(`pnpm list for ${project} contains no dependency paths`);
  return out;
}

/** Content shape of the official identifier/URL fallbacks (not of real license files). */
function classifyLicenseText(content) {
  const t = (content ?? "").trim();
  if (t === "" || t.includes("\n") || t.includes("\r")) return "text";
  if (/^https?:\/\/\S+$/.test(t)) return "url";
  if (t.length <= 64 && /^\(?[A-Za-z0-9][A-Za-z0-9.+\-]*( (OR|AND) [A-Za-z0-9][A-Za-z0-9.+\-]*)?\)?$/.test(t)) {
    return "identifier";
  }
  return "text";
}

/** Stage a file next to its target, then rename (only after every check passed). */
function stageFile(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content, "utf8");
  return { target, tmp };
}

function replaceStaged(staged) {
  for (const { target, tmp } of staged) {
    try {
      fs.renameSync(tmp, target);
    } catch (err) {
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* the temp file is diagnostic at this point */
      }
      throw new Error(`failed to replace ${target}: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // --- flags (replay/testing only) -----------------------------------------
  const argv = process.argv.slice(2);
  const takeValue = (name) => {
    const idx = argv.indexOf(name);
    if (idx === -1) return undefined;
    const value = argv[idx + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`${name} requires a value`);
    argv.splice(idx, 2);
    return value;
  };
  const outArg = takeValue("--out");
  const fromRawArg = takeValue("--from-raw");
  if (argv.length > 0) throw new Error(`unknown arguments: ${argv.join(" ")} (supported: --out, --from-raw)`);
  const outFile = outArg ? path.resolve(process.cwd(), outArg) : DEFAULT_OUT_FILE;
  const rawInputDir = fromRawArg ? path.resolve(process.cwd(), fromRawArg) : undefined;

  // --- layout guards --------------------------------------------------------
  const appPkg = JSON.parse(fs.readFileSync(path.join(APP_DIR, "package.json"), "utf8"));
  if (appPkg.name !== APP_PACKAGE_NAME) {
    throw new Error(`this script must live in ${APP_PACKAGE_NAME}/scripts/ (found "${appPkg.name}" in ${APP_DIR})`);
  }

  // --- official code: app-local resolution only, no cross-app fallback ------
  const glfDir = path.join(APP_DIR, "node_modules", "generate-license-file");
  if (!fs.existsSync(path.join(glfDir, "package.json"))) {
    throw new Error(
      `${glfDir} is not installed. Declare "generate-license-file": "${EXPECTED_GLF_VERSION}" in ` +
        `${APP_PACKAGE_NAME} devDependencies and run pnpm install; this script intentionally does not ` +
        `fall back to another app's node_modules.`,
    );
  }
  const glfRequire = createRequire(path.join(glfDir, "package.json"));
  const glfVersion = glfRequire("./package.json").version;
  if (glfVersion !== EXPECTED_GLF_VERSION) {
    throw new Error(
      `generate-license-file@${glfVersion} found, expected ${EXPECTED_GLF_VERSION}: the deep imports into ` +
        `src/lib/internal are pinned to that layout. Update EXPECTED_GLF_VERSION after re-reviewing a bump.`,
    );
  }
  const { resolveLicenseContent } = glfRequire("./src/lib/internal/resolveLicenseContent/index.js");
  const { resolveNotices } = glfRequire("./src/lib/internal/resolveNoticeContent/index.js");
  const { License } = glfRequire("./src/lib/models/license.js");

  // --- collect dependency paths --------------------------------------------
  const sourceCounts = {};
  const byPath = new Map();
  const addPath = (source, rec) => {
    if (!rec.path) return;
    const key = rec.path.replace(/\\/g, "/").toLowerCase();
    const existing = byPath.get(key);
    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      if (!existing.name && rec.name) existing.name = rec.name;
    } else {
      byPath.set(key, { path: rec.path, name: rec.name, sources: [source] });
    }
  };
  const acquire = (label, args) => (rawInputDir ? readRaw(label, rawInputDir) : runPnpm(args, label));

  for (const project of LICENSE_PROJECTS) {
    const label = rawLabel("licenses", project);
    const raw = acquire(label, ["licenses", "list", "--prod", "--json", "--filter", project]);
    const records = parseLicensesList(raw, project);
    if (records.length === 0 && project !== EMPTY_LICENSES_PROJECT) {
      throw new Error(`pnpm licenses list for ${project} returned zero records — refusing to generate a partial file`);
    }
    sourceCounts[`licenses:${project}`] = records.length;
    for (const rec of records) addPath(`licenses:${project}`, rec);
  }

  const treeLabel = rawLabel("list", TREE_PROJECT);
  const treeRaw = acquire(treeLabel, ["list", "--prod", "--depth", "Infinity", "--json", "--filter", TREE_PROJECT]);
  const treePaths = collectListTreePaths(treeRaw, TREE_PROJECT);
  sourceCounts[`list-tree:${TREE_PROJECT}`] = treePaths.length;
  for (const rec of treePaths) addPath(`list-tree:${TREE_PROJECT}`, rec);

  // Paths referenced by the graph but not installed on this machine (for
  // example platform-specific optional binaries) are recorded, not dropped.
  const notInstalled = [...byPath.values()]
    .filter((entry) => !fs.existsSync(path.join(entry.path, "package.json")))
    .map((entry) => ({ name: entry.name, path: entry.path, sources: entry.sources }))
    .sort((a, b) => `${a.name}`.localeCompare(`${b.name}`));

  // --- resolve license text with the official code --------------------------
  const firstParty = [];
  const unresolved = [];
  const resolved = [];
  const seenPaths = new Set();
  for (const entry of byPath.values()) {
    const pkgJsonPath = path.join(entry.path, "package.json");
    if (!fs.existsSync(pkgJsonPath)) continue;
    if (seenPaths.has(entry.path)) continue;
    seenPaths.add(entry.path);
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    } catch (err) {
      unresolved.push({ name: entry.name, path: entry.path, reason: `unreadable package.json: ${err.message}` });
      continue;
    }
    const name = pkg.name ?? entry.name;
    if (name.startsWith("@bilisound/")) {
      firstParty.push({ name, version: pkg.version, path: entry.path, sources: entry.sources });
      continue;
    }
    try {
      const content = await resolveLicenseContent(entry.path, pkg, {});
      const notices = await resolveNotices(entry.path);
      resolved.push({
        name,
        version: pkg.version,
        licenseField: typeof pkg.license === "string" ? pkg.license : undefined,
        path: entry.path,
        content,
        notices,
      });
    } catch (err) {
      unresolved.push({
        name,
        version: pkg.version,
        path: entry.path,
        licenseField: typeof pkg.license === "string" ? pkg.license : undefined,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // --- format exactly like the official tool ---------------------------------
  const groups = new Map();
  for (const r of resolved) {
    const noticeKey = r.notices.length === 0 ? "" : r.notices.join("\n");
    const key = `${r.content}:${noticeKey}`;
    let group = groups.get(key);
    if (!group) {
      group = { content: r.content, notices: r.notices, deps: new Set() };
      groups.set(key, group);
    }
    group.deps.add(`${r.name}@${r.version ?? "unknown"}`);
  }
  const sortedGroups = [...groups.values()].sort((a, b) => a.content.localeCompare(b.content));

  const textsByPackage = new Map();
  for (const r of resolved) {
    const key = `${r.name}@${r.version ?? "unknown"}`;
    if (!textsByPackage.has(key)) textsByPackage.set(key, r.content);
  }
  // Counted per installed package instance — the same denominator as
  // coverage.thirdPartyPackages (1034 instances / 1031 unique name@version).
  let identifierOnly = 0;
  let urlOnly = 0;
  for (const r of resolved) {
    const kind = classifyLicenseText(r.content);
    if (kind === "identifier") identifierOnly += 1;
    else if (kind === "url") urlOnly += 1;
  }

  const credit =
    `This file was generated with the generate-license-file npm package!${EOL}` +
    `https://www.npmjs.com/package/generate-license-file`;
  const noteLines = [
    "============================== 重要说明 ==============================",
    "本文件由仓库内生成脚本产出，是开发版应用中已安装的 npm 生产依赖清单（Next",
    "应用与仓库内 ui / sdk / player 三个 workspace 包的第三方依赖闭包）；它不是",
    "完整的许可证声明：",
    ` - ${identifierOnly} 个条目仅有许可证标识符（如 "MIT"）、${urlOnly} 个条目仅有 URL，`,
    "   这是官方 generate-license-file 按包元数据与许可证文件解析后的结果；",
    "   仅标识符或 URL 不能替代完整许可证文本；",
    ` - 生成机器上未安装、因此未包含的包共 ${notInstalled.length} 条路径（例如其`,
    "   他操作系统的平台二进制等），仅在生成器的 coverage 报告中列出；",
    " - 通过 npm 之外分发的原生依赖（Android Maven，如 androidx.media3；iOS",
    "   CocoaPods）不在本文件覆盖范围内。",
    "完整包列表与逐包解析细节见生成器的 coverage / manifest 输出。",
    "====================================================================",
  ];

  let text = `${credit}${EOL}${EOL}${noteLines.join(EOL)}${EOL}${EOL}`;
  for (const group of sortedGroups) {
    const license = new License(group.content, group.notices, [...group.deps]);
    text += license.format(EOL) + EOL + EOL + "-----------" + EOL + EOL;
  }
  if (unresolved.length > 0) {
    text +=
      `The following npm packages could not be resolved to license text locally and are listed here without license text:${EOL}${EOL}` +
      unresolved.map((u) => ` - ${u.name}@${u.version ?? "unknown"}${EOL}`).join("") +
      EOL +
      `-----------${EOL}${EOL}`;
  }
  text += credit + EOL;

  // --- coverage expectations: fail before replacing anything -----------------
  const present = new Set(resolved.map((r) => r.name.toLowerCase()));
  const known = new Set([
    ...firstParty.map((p) => p.name.toLowerCase()),
    ...unresolved.map((u) => u.name.toLowerCase()),
  ]);
  const failures = [];
  for (const name of EXPECT_PRESENT) {
    if (!present.has(name.toLowerCase())) failures.push(`expect-present: ${name} is missing from the package list`);
  }
  for (const name of EXPECT_ABSENT) {
    const lower = name.toLowerCase();
    if (present.has(lower) || known.has(lower)) {
      failures.push(`expect-absent: ${name} must not appear anywhere (third-party, first-party or unresolved)`);
    }
  }
  if (text.includes("\r")) failures.push("generated text contains CR bytes; the shipped file must be LF-only");
  if (text.includes("@bilisound/")) failures.push("generated text mentions @bilisound/; first-party must be excluded");
  if (unresolved.length > 0 && !text.includes("could not be resolved to license text locally")) {
    failures.push("unresolved packages exist but the appendix is missing from the text");
  }
  if (failures.length > 0) {
    throw new Error("coverage expectations failed:\n" + failures.map((f) => ` - ${f}`).join("\n"));
  }

  // --- outputs (staged, then renamed; the shipped txt is replaced last) ------
  const manifest = {
    generatedAt: new Date().toISOString(),
    generator: "generate-license.cjs",
    generateLicenseFileVersion: glfVersion,
    eol: "lf",
    project: APP_PACKAGE_NAME,
    rawSource: rawInputDir ? path.resolve(rawInputDir) : "pnpm (live)",
    sources: sourceCounts,
    packages: resolved
      .map((r) => ({
        name: r.name,
        version: r.version,
        licenseField: r.licenseField,
        path: r.path,
        textSha256: crypto.createHash("sha256").update(r.content).digest("hex"),
        textLength: r.content.length,
      }))
      .sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)),
    firstParty,
    unresolved,
  };
  const coverage = {
    generatedAt: manifest.generatedAt,
    sources: sourceCounts,
    uniquePathsSeen: byPath.size,
    installedPaths: byPath.size - notInstalled.length,
    thirdPartyPackages: resolved.length,
    uniqueNameVersion: textsByPackage.size,
    licenseGroups: sortedGroups.length,
    firstParty: firstParty.length,
    unresolved: unresolved.length,
    notInstalled: notInstalled.length,
    notInstalledPaths: notInstalled,
    disclosure: { identifierOnly, urlOnly },
    expectPresent: Object.fromEntries(EXPECT_PRESENT.map((n) => [n, present.has(n.toLowerCase())])),
    expectAbsent: Object.fromEntries(
      EXPECT_ABSENT.map((n) => [n, !present.has(n.toLowerCase()) && !known.has(n.toLowerCase())]),
    ),
    outputFile: path.resolve(outFile),
    outputBytes: Buffer.byteLength(text, "utf8"),
  };
  const manifestJson = JSON.stringify(manifest, null, 2) + "\n";
  const coverageJson = JSON.stringify(coverage, null, 2) + "\n";

  const staged = [
    stageFile(MANIFEST_FILE, manifestJson),
    stageFile(COVERAGE_FILE, coverageJson),
    stageFile(outFile, text), // shipped artifact replaced last
  ];
  replaceStaged(staged);

  // --- summary ---------------------------------------------------------------
  console.log(`project:          ${APP_PACKAGE_NAME}`);
  console.log(`raw source:       ${rawInputDir ? `replayed from ${path.resolve(rawInputDir)}` : `pnpm live (captured to ${RAW_DIR})`}`);
  console.log(`sources:          ${JSON.stringify(sourceCounts)}`);
  console.log(`installed paths:  ${coverage.installedPaths} (of ${byPath.size} seen)`);
  console.log(`third-party pkgs: ${resolved.length} (${textsByPackage.size} unique name@version)`);
  console.log(`license groups:   ${sortedGroups.length}`);
  console.log(`first-party:      ${firstParty.length} (excluded from the text)`);
  console.log(`not installed:    ${notInstalled.length} (listed in coverage json)`);
  console.log(`unresolved:       ${unresolved.length}${unresolved.length ? " -> " + unresolved.map((u) => u.name).join(", ") : ""}`);
  console.log(`disclosure note:  ${identifierOnly} identifier-only, ${urlOnly} url-only`);
  console.log(`expect present:   ${EXPECT_PRESENT.length}/${EXPECT_PRESENT.length} ok`);
  console.log(`expect absent:    ${EXPECT_ABSENT.length}/${EXPECT_ABSENT.length} ok`);
  console.log(`txt:              ${path.resolve(outFile)} (${coverage.outputBytes} bytes)`);
  console.log(`manifest:         ${path.resolve(MANIFEST_FILE)}`);
  console.log(`coverage:         ${path.resolve(COVERAGE_FILE)}`);
}

main().catch((err) => {
  console.error("generate-license failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
