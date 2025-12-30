/**
 * Extract SVG icons from @iconify-json packages
 * Run with: bun scripts/extract-icons.ts
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// All icons used in the project (from metro.config.js + code search)
const iconsToExtract = [
  // fa6-solid icons
  "fa6-solid:pause",
  "fa6-solid:play",
  "fa6-solid:check",
  "fa6-solid:cloud",
  "fa6-solid:filter",
  "fa6-solid:xmark",
  "fa6-solid:plus",
  "fa6-solid:arrow-left",
  "fa6-solid:file-lines",
  "fa6-solid:paintbrush",
  "fa6-solid:image",
  "fa6-solid:clock-rotate-left",
  "fa6-solid:ellipsis-vertical",
  "fa6-solid:list",
  "fa6-solid:file-import",
  "fa6-solid:house",
  "fa6-solid:gear",
  "fa6-solid:music",
  "fa6-solid:download",
  "fa6-solid:trash",
  "fa6-solid:pen",
  "fa6-solid:circle-info",
  "fa6-solid:arrow-up-from-bracket",
  "fa6-solid:magnifying-glass",
  "fa6-solid:images",
  "fa6-solid:file-export",
  "fa6-solid:check-double",
  "fa6-solid:circle-half-stroke",
  "fa6-solid:copy",
  "fa6-solid:trash-can",
  "fa6-solid:arrow-rotate-left",
  "fa6-solid:link",
  "fa6-solid:cloud-arrow-down",
  "fa6-solid:database",
  "fa6-solid:code",
  "fa6-solid:bug",
  "fa6-solid:share",
  "fa6-solid:list-check",
  "fa6-solid:angle-down",
  "fa6-solid:eye",
  "fa6-solid:floppy-disk",
  "fa6-solid:circle-up",
  "fa6-solid:award",
  "fa6-solid:circle-stop",
  "fa6-solid:face-kiss-wink-heart",

  // ion icons
  "ion:checkmark-circle",
  "ion:information-circle",
  "ion:alert-circle",
  "ion:close-circle",

  // tabler icons
  "tabler:alert-square-rounded",
  "tabler:repeat-off",
  "tabler:repeat",
  "tabler:repeat-once",
  "tabler:arrows-right",
  "tabler:arrows-shuffle",

  // ri icons
  "ri:skip-back-mini-fill",

  // uil icons
  "uil:qrcode-scan",

  // mingcute icons
  "mingcute:grid-fill",

  // material-symbols icons
  "material-symbols:speed-rounded",
];

const outputDir = join(import.meta.dir, "../assets/icons");

// Cache for loaded icon collections
const collectionCache: Record<string, any> = {};

function loadCollection(prefix: string) {
  if (collectionCache[prefix]) {
    return collectionCache[prefix];
  }

  const packagePath = join(import.meta.dir, `../node_modules/@iconify-json/${prefix}/icons.json`);

  if (!existsSync(packagePath)) {
    console.error(`Collection not found: ${prefix}`);
    return null;
  }

  const data = JSON.parse(readFileSync(packagePath, "utf-8"));
  collectionCache[prefix] = data;
  return data;
}

function getIcon(iconName: string): { svg: string; name: string } | null {
  const [prefix, name] = iconName.split(":");
  const collection = loadCollection(prefix);

  if (!collection) {
    return null;
  }

  const icon = collection.icons[name];
  if (!icon) {
    console.error(`Icon not found: ${iconName}`);
    return null;
  }

  // Get dimensions
  const width = icon.width || collection.width || 24;
  const height = icon.height || collection.height || 24;

  // Build SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="currentColor">
  ${icon.body}
</svg>`;

  // Convert icon name to valid filename (e.g., "fa6-solid:arrow-left" -> "arrow-left")
  // We'll use a simple naming scheme
  const fileName = name;

  return { svg, name: fileName };
}

// Extract all icons
console.log("Extracting icons...\n");

const extractedIcons: { originalName: string; fileName: string }[] = [];
const seenNames = new Set<string>();

for (const iconName of iconsToExtract) {
  const result = getIcon(iconName);
  if (result) {
    // Handle duplicate names from different collections
    let fileName = result.name;
    const [prefix] = iconName.split(":");

    if (seenNames.has(fileName)) {
      // Add prefix to disambiguate
      fileName = `${prefix.replace("-", "")}-${fileName}`;
    }
    seenNames.add(fileName);

    const outputPath = join(outputDir, `${fileName}.svg`);
    writeFileSync(outputPath, result.svg);
    extractedIcons.push({ originalName: iconName, fileName });
    console.log(`✓ ${iconName} -> ${fileName}.svg`);
  }
}

console.log(`\nExtracted ${extractedIcons.length} icons to ${outputDir}`);

// Generate icon name mapping for the Icon component
console.log("\n--- Icon name mapping ---\n");

const mapping: Record<string, string> = {};
for (const { originalName, fileName } of extractedIcons) {
  mapping[originalName] = fileName;
}

console.log(JSON.stringify(mapping, null, 2));
