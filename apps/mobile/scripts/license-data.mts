import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getProjectLicenses } from "generate-license-file";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Script to generate license data from npm dependencies
 * Reads all license files from the apps/mobile package and exports as JSON
 */

const PACKAGE_DIR = path.resolve(__dirname, "..");
const PACKAGE_JSON_PATH = path.resolve(PACKAGE_DIR, "package.json");
const OUTPUT_FILE = path.resolve(__dirname, "../assets/licenses.json");

interface LicensePattern {
  pattern: RegExp;
  name: string;
}

// Common license patterns to identify license types from text
const LICENSE_PATTERNS: LicensePattern[] = [
  // 确保 Apache 许可证检测更加精确，并放在更高优先级
  {
    pattern:
      /Apache License,?\s+Version 2\.0|Licensed under the Apache License,?\s+Version 2\.0|^Apache License\r?\n\r?\nVersion 2\.0/i,
    name: "Apache-2.0",
  },
  { pattern: /MIT License|Permission is hereby granted, free of charge/i, name: "MIT" },
  { pattern: /GNU GENERAL PUBLIC LICENSE\s+Version 3/i, name: "GPL-3.0" },
  { pattern: /GNU GENERAL PUBLIC LICENSE\s+Version 2/i, name: "GPL-2.0" },
  { pattern: /BSD 3-Clause|The BSD 3-Clause License/i, name: "BSD-3-Clause" },
  { pattern: /BSD 2-Clause|The BSD 2-Clause License/i, name: "BSD-2-Clause" },
  { pattern: /ISC License|The ISC License/i, name: "ISC" },
  // 调整 MPL 检测，使其更加精确
  { pattern: /Mozilla Public License,?\s+Version|MPL\s+Version|^Mozilla Public License\s/i, name: "MPL" },
  { pattern: /WTFPL|DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE/i, name: "WTFPL" },
  { pattern: /Creative Commons/i, name: "CC" },
  { pattern: /Unlicense|This is free and unencumbered software released into the public domain/i, name: "Unlicense" },
];

interface FormattedLicense {
  name: string;
  version: string;
  license: string;
  licenseText: string;
}

async function generateLicenseData(): Promise<void> {
  try {
    console.log("Generating license data...");

    // Get license data using getProjectLicenses method
    const licenses = await getProjectLicenses(PACKAGE_JSON_PATH);

    // Format the license data as needed
    const formattedData: FormattedLicense[] = [];
    const warnings: string[] = [];

    // Process each license
    for (const license of licenses) {
      // Each license has a list of dependencies it applies to
      for (const dependency of license.dependencies) {
        try {
          // Extract package name and version from dependency string (format: package@version)
          const lastAtIndex = dependency.lastIndexOf("@");
          let name: string, version: string;

          if (lastAtIndex > 0) {
            // Handle scoped packages like @scope/package@version
            const firstAtIndex = dependency.indexOf("@");
            if (firstAtIndex === 0 && lastAtIndex > firstAtIndex) {
              name = dependency.substring(0, lastAtIndex);
              version = dependency.substring(lastAtIndex + 1);
            } else {
              name = dependency.substring(0, lastAtIndex);
              version = dependency.substring(lastAtIndex + 1);
            }
          } else {
            // No version info
            name = dependency;
            version = "";
          }

          // Determine license type from license text
          const licenseType = determineLicenseType(license.content, name);

          formattedData.push({
            name: name,
            version: version,
            license: licenseType,
            licenseText: license.content || "",
          });
        } catch (err) {
          warnings.push(`Error processing dependency ${dependency}: ${(err as Error).message}`);
        }
      }
    }

    // Sort the formatted data by package name
    formattedData.sort((a, b) => {
      // Convert to lowercase for case-insensitive sorting
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

    // Create directory if it doesn't exist
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(formattedData, null, 2), "utf8");

    console.log(`License data successfully written to ${OUTPUT_FILE}`);
    console.log(`Total packages with license information: ${formattedData.length}`);

    if (warnings.length > 0) {
      console.log("\nWarnings:");
      warnings.forEach(warning => console.log(`- ${warning}`));
    }
  } catch (error) {
    console.error("Error generating license data:", error);
    process.exit(1);
  }
}

/**
 * Determine license type from license text
 */
function determineLicenseType(licenseText: string, packageName: string): string {
  if (!licenseText) return "Unknown";

  // 特殊处理 typescript 包
  if (packageName === "typescript" && licenseText.includes("Apache License")) {
    return "Apache-2.0";
  }

  for (const { pattern, name } of LICENSE_PATTERNS) {
    if (pattern.test(licenseText)) {
      return name;
    }
  }

  return "Unknown";
}

// Execute the function
generateLicenseData();
