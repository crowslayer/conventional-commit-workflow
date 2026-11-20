#!/usr/bin/env node
// Bumps version strings across the monorepo during semantic-release.
// Usage: node scripts/bump-versions.js <version>

const fs = require("fs");
const path = require("path");

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/bump-versions.js <version>");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");

function updateJson(relPath) {
  const file = path.join(root, relPath);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  json.version = version;
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  console.log(`updated ${relPath} -> ${version}`);
}

function replaceInFile(relPath, regex, replacement) {
  const file = path.join(root, relPath);
  if (!fs.existsSync(file)) {
    console.warn(`skip (not found): ${relPath}`);
    return;
  }
  const original = fs.readFileSync(file, "utf8");
  const updated = original.replace(regex, replacement);
  if (updated === original) {
    console.warn(`no change: ${relPath}`);
  } else {
    fs.writeFileSync(file, updated);
    console.log(`updated ${relPath}`);
  }
}

// Root package.json
updateJson("package.json");

// Skill system prompt metadata version (both filenames for compatibility)
for (const skillFile of ["skills/v2.0.0/system_prompt.md", "skills/v2.0.0/SKILL.md"]) {
  replaceInFile(skillFile, /^(\s*version:\s*")[^"]*(")/m, `$1${version}$2`);
  replaceInFile(skillFile, /^# Conventional Commit Workflow v[^\n]*/m, `# Conventional Commit Workflow v${version}`);
}

// MCP server source version
replaceInFile("mcp_server/src/index.ts", /version:\s*"[^"]*"/, `version: "${version}"`);

// README badge version
replaceInFile("README.md", /version-\d+\.\d+\.\d+-blue/, `version-${version}-blue`);
