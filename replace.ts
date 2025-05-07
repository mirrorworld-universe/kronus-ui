#!/usr/bin/env bun
/**
 * String Replacement Script
 *
 * This script recursively reads all files under a directory and replaces
 * all occurrences of a source string with a target string.
 *
 * Usage:
 * bun replace.ts --dir <directory> --source <sourceString> --target <targetString> [--dry-run] [--extensions ext1,ext2,...]
 */

import { existsSync, statSync } from "fs";
import { readdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";

interface ReplaceOptions {
  directory: string;
  sourceString: string;
  targetString: string;
  dryRun: boolean;
  extensions: string[];
}

async function replaceInFile(filePath: string, source: string, target: string, dryRun: boolean): Promise<boolean> {
  try {
    const content = await readFile(filePath, "utf-8");

    if (!content.includes(source)) {
      return false;
    }

    const newContent = content.replaceAll(source, target);

    if (dryRun) {
      console.log(`Would replace in file: ${filePath}`);
      return true;
    }

    await writeFile(filePath, newContent, "utf-8");
    console.log(`Replaced in file: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

async function processDirectory(
  directory: string,
  source: string,
  target: string,
  dryRun: boolean,
  extensions: string[]
): Promise<{ processed: number; replaced: number }> {
  const stats = { processed: 0, replaced: 0 };

  try {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, .git, and other common directories to ignore
        if (["node_modules", ".git", "dist", "build", ".cache"].includes(entry.name)) {
          continue;
        }

        const subStats = await processDirectory(entryPath, source, target, dryRun, extensions);
        stats.processed += subStats.processed;
        stats.replaced += subStats.replaced;
      } else if (entry.isFile()) {
        // Check if the file has one of the specified extensions
        if (extensions.length > 0) {
          const fileExt = entryPath.split(".").pop()?.toLowerCase() || "";
          if (!extensions.includes(fileExt)) {
            continue;
          }
        }

        stats.processed++;
        const replaced = await replaceInFile(entryPath, source, target, dryRun);
        if (replaced) {
          stats.replaced++;
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
  }

  return stats;
}

function parseArgs(): ReplaceOptions {
  const args = Bun.argv.slice(2);
  const options: Partial<ReplaceOptions> = {
    dryRun: false,
    extensions: []
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--dir":
      case "-d":
        options.directory = args[++i];
        break;
      case "--source":
      case "-s":
        options.sourceString = args[++i];
        break;
      case "--target":
      case "-t":
        options.targetString = args[++i];
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--extensions":
      case "-e":
        options.extensions = args[++i].split(",").map((ext: string) => ext.toLowerCase().replace(/^\./, ""));
        break;
    }
  }

  // Validate required options
  if (!options.directory) {
    console.error("Error: Missing required --dir option");
    printUsage();
    process.exit(1);
  }

  if (!options.sourceString) {
    console.error("Error: Missing required --source option");
    printUsage();
    process.exit(1);
  }

  if (!options.targetString) {
    console.error("Error: Missing required --target option");
    printUsage();
    process.exit(1);
  }

  // Validate directory exists
  const absoluteDir = resolve(options.directory);
  if (!existsSync(absoluteDir) || !statSync(absoluteDir).isDirectory()) {
    console.error(`Error: Directory does not exist: ${absoluteDir}`);
    process.exit(1);
  }

  return options as ReplaceOptions;
}

function printUsage() {
  console.log(`
Usage: bun replace.ts --dir <directory> --source <sourceString> --target <targetString> [--dry-run] [--extensions ext1,ext2,...]

Options:
  --dir, -d          Directory to process recursively
  --source, -s       String to find
  --target, -t       String to replace with
  --dry-run          Run without making changes (preview only)
  --extensions, -e   Comma-separated list of file extensions to process (e.g., ts,js,tsx)
`);
}

async function main() {
  console.log("String Replacement Tool");

  const options = parseArgs();

  console.log(`
Configuration:
  Directory: ${options.directory}
  Source string: "${options.sourceString}"
  Target string: "${options.targetString}"
  Dry run: ${options.dryRun ? "Yes" : "No"}
  Extensions: ${options.extensions.length > 0 ? options.extensions.join(", ") : "All files"}

Starting replacement process...
`);

  const startTime = performance.now();
  const stats = await processDirectory(
    options.directory,
    options.sourceString,
    options.targetString,
    options.dryRun,
    options.extensions
  );
  const endTime = performance.now();

  console.log(`
Replacement complete:
  Files processed: ${stats.processed}
  Files with replacements: ${stats.replaced}
  Time taken: ${((endTime - startTime) / 1000).toFixed(2)} seconds

${options.dryRun ? "This was a dry run. No files were modified." : "All replacements have been applied."}
`);
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
