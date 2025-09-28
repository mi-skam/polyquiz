#!/usr/bin/env -S deno run --allow-run --allow-write --allow-read

import { dirname, join } from "https://deno.land/std@0.208.0/path/mod.ts";

async function runCommand(cmd: string[]): Promise<string> {
  try {
    const command = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout } = await command.output();
    if (code !== 0) {
      throw new Error(`Command failed: ${cmd.join(" ")}`);
    }
    return new TextDecoder().decode(stdout).trim();
  } catch (error) {
    throw new Error(`Command failed: ${cmd.join(" ")} - ${error.message}`);
  }
}

async function generateVersion() {
  try {
    // Check if we're in a git repository
    await runCommand(["git", "rev-parse", "--git-dir"]);

    // Get the current commit hash (short)
    const commitHash = await runCommand(["git", "rev-parse", "--short", "HEAD"]);

    // Check if working directory is clean
    let isDirty = false;
    try {
      await runCommand(["git", "diff-index", "--quiet", "HEAD", "--"]);
    } catch {
      isDirty = true;
    }

    // Get the latest tag if it exists
    let latestTag = null;
    try {
      latestTag = await runCommand(["git", "describe", "--tags", "--abbrev=0"]);
    } catch {
      // No tags found
    }

    // Check if current commit is tagged
    let currentTag = null;
    try {
      currentTag = await runCommand(["git", "describe", "--exact-match", "--tags", "HEAD"]);
    } catch {
      // Current commit is not tagged
    }

    let version: string;
    let buildType: string;

    if (currentTag && !isDirty) {
      // Current commit is tagged and clean
      version = currentTag;
      buildType = "release";
    } else if (latestTag) {
      // We have a previous tag, create development version
      const commitsSinceTag = await runCommand([
        "git", "rev-list", `${latestTag}..HEAD`, "--count"
      ]);
      version = `${latestTag}-dev.${commitsSinceTag}+${commitHash}${isDirty ? "-dirty" : ""}`;
      buildType = "development";
    } else {
      // No tags at all, use v0.0.0 as base
      const totalCommits = await runCommand(["git", "rev-list", "--count", "HEAD"]);
      version = `v0.0.0-dev.${totalCommits}+${commitHash}${isDirty ? "-dirty" : ""}`;
      buildType = "development";
    }

    const buildTime = new Date().toISOString();

    const versionInfo = {
      version,
      commitHash,
      buildType,
      buildTime,
      isDirty,
    };

    // Write to src/version.json
    const scriptDir = dirname(new URL(import.meta.url).pathname);
    const versionPath = join(scriptDir, "..", "src", "version.json");
    await Deno.writeTextFile(versionPath, JSON.stringify(versionInfo, null, 2));

    console.log(`Generated version: ${version}`);
    console.log(`Build type: ${buildType}`);
    console.log(`Commit: ${commitHash}${isDirty ? " (dirty)" : ""}`);

    return versionInfo;
  } catch (error) {
    console.error("Error generating version:", error.message);

    // Fallback version for non-git environments
    const fallbackVersion = {
      version: "v0.0.0-unknown",
      commitHash: "unknown",
      buildType: "unknown",
      buildTime: new Date().toISOString(),
      isDirty: false,
    };

    const scriptDir = dirname(new URL(import.meta.url).pathname);
    const versionPath = join(scriptDir, "..", "src", "version.json");
    await Deno.writeTextFile(versionPath, JSON.stringify(fallbackVersion, null, 2));

    return fallbackVersion;
  }
}

// Run if this is the main module
if (import.meta.main) {
  await generateVersion();
}

export { generateVersion };