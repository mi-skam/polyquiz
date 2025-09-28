#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateVersion() {
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });

    // Get the current commit hash (short)
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

    // Check if working directory is clean
    let isDirty = false;
    try {
      execSync('git diff-index --quiet HEAD --', { stdio: 'ignore' });
    } catch {
      isDirty = true;
    }

    // Get the latest tag if it exists
    let latestTag = null;
    try {
      latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    } catch {
      // No tags found
    }

    // Check if current commit is tagged
    let currentTag = null;
    try {
      currentTag = execSync('git describe --exact-match --tags HEAD', { encoding: 'utf8' }).trim();
    } catch {
      // Current commit is not tagged
    }

    let version;
    let buildType;

    if (currentTag && !isDirty) {
      // Current commit is tagged and clean
      version = currentTag;
      buildType = 'release';
    } else if (latestTag) {
      // We have a previous tag, create development version
      const commitsSinceTag = execSync(`git rev-list ${latestTag}..HEAD --count`, { encoding: 'utf8' }).trim();
      version = `${latestTag}-dev.${commitsSinceTag}+${commitHash}${isDirty ? '-dirty' : ''}`;
      buildType = 'development';
    } else {
      // No tags at all, use v0.0.0 as base
      const totalCommits = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
      version = `v0.0.0-dev.${totalCommits}+${commitHash}${isDirty ? '-dirty' : ''}`;
      buildType = 'development';
    }

    const buildTime = new Date().toISOString();

    const versionInfo = {
      version,
      commitHash,
      buildType,
      buildTime,
      isDirty
    };

    // Write to src/version.json
    const versionPath = join(__dirname, '..', 'src', 'version.json');
    writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));

    console.log(`Generated version: ${version}`);
    console.log(`Build type: ${buildType}`);
    console.log(`Commit: ${commitHash}${isDirty ? ' (dirty)' : ''}`);

    return versionInfo;
  } catch (error) {
    console.error('Error generating version:', error.message);

    // Fallback version for non-git environments
    const fallbackVersion = {
      version: 'v0.0.0-unknown',
      commitHash: 'unknown',
      buildType: 'unknown',
      buildTime: new Date().toISOString(),
      isDirty: false
    };

    const versionPath = join(__dirname, '..', 'src', 'version.json');
    writeFileSync(versionPath, JSON.stringify(fallbackVersion, null, 2));

    return fallbackVersion;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateVersion();
}

export { generateVersion };