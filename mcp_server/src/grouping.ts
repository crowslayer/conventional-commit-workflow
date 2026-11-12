import { execSync } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
import { basename, dirname, extname, join } from "path";

// ============================================
// Types
// ============================================

export interface FileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  extension: string;
  category: "source" | "test" | "doc" | "config" | "generated" | "asset" | "other";
  module: string | null;
  directory: string;
}

export interface CommitGroup {
  id: number;
  strategy: "module" | "file-type" | "dependency" | "global";
  module: string | null;
  label: string;
  files: string[];
  change_types: string[];
  file_categories: string[];
  dependencies_on_other_groups: number[];
  confidence: "high" | "medium" | "low";
  suggested_type: string | null;
  suggested_scope: string | null;
  reasoning: string;
}

export interface GroupingAnalysis {
  repository_path: string;
  is_monorepo: boolean;
  monorepo_type: string | null;
  strategy_used: "hybrid" | "module-only" | "file-type-only";
  groups: CommitGroup[];
  unassigned_files: string[];
  metadata: {
    total_files: number;
    total_groups: number;
    modules_detected: string[];
    languages_detected: string[];
  };
}

// ============================================
// Constants
// ============================================

const TEST_PATTERNS = [/\.test\./i, /\.spec\./i, /_test\./i, /_spec\./i, /\/tests?\//i, /\/__tests__\//i, /\/spec\//i, /\.stories\./i];

const DOC_PATTERNS = [
  /\.md$/i,
  /\.mdx$/i,
  /\.rst$/i,
  /\.txt$/i,
  /\/docs?\//i,
  /\/documentation\//i,
  /README/i,
  /CHANGELOG/i,
  /CONTRIBUTING/i,
  /LICENSE/i,
];

const CONFIG_PATTERNS = [
  /\.json$/i,
  /\.ya?ml$/i,
  /\.toml$/i,
  /\.ini$/i,
  /\.config\./i,
  /\.rc$/i,
  /^\.github\//i,
  /^\.vscode\//i,
  /^\.husky\//i,
  /Dockerfile/i,
  /docker-compose/i,
  /Makefile/i,
  /tsconfig/i,
  /eslint/i,
  /prettier/i,
  /babel/i,
  /webpack/i,
  /vite/i,
  /jest/i,
  /vitest/i,
];

const GENERATED_PATTERNS = [
  /\/dist\//i,
  /\/build\//i,
  /\/out\//i,
  /\/target\//i,
  /\/\.next\//i,
  /\/node_modules\//i,
  /\/__generated__\//i,
  /\/generated\//i,
  /\.generated\./i,
  /\.min\./i,
  /package-lock\.json/i,
  /pnpm-lock\.yaml/i,
  /yarn\.lock/i,
];

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".pyw",
  ".java",
  ".kt",
  ".kts",
  ".scala",
  ".groovy",
  ".go",
  ".rs",
  ".rb",
  ".php",
  ".cs",
  ".vb",
  ".fs",
  ".c",
  ".cpp",
  ".cc",
  ".h",
  ".hpp",
  ".swift",
  ".m",
  ".vue",
  ".svelte",
  ".sql",
  ".graphql",
]);

const MONOREPO_INDICATORS = [
  { file: "pnpm-workspace.yaml", type: "pnpm-workspaces" },
  { file: "lerna.json", type: "lerna" },
  { file: "nx.json", type: "nx" },
  { file: "turbo.json", type: "turborepo" },
  { file: "rush.json", type: "rush" },
];

// ============================================
// Main Analysis Function
// ============================================

export function analyzeCommitGroupings(repositoryPath: string, strategy: "modules" | "files" | "hybrid" = "hybrid"): GroupingAnalysis {
  const changedFiles = getChangedFiles(repositoryPath);

  if (changedFiles.length === 0) {
    return {
      repository_path: repositoryPath,
      is_monorepo: false,
      monorepo_type: null,
      strategy_used: "hybrid",
      groups: [],
      unassigned_files: [],
      metadata: {
        total_files: 0,
        total_groups: 0,
        modules_detected: [],
        languages_detected: [],
      },
    };
  }

  // Step 1: Classify each file
  const fileChanges: FileChange[] = changedFiles.map((path) => classifyFile(path, repositoryPath));

  // Step 2: Detect monorepo structure
  const monorepoInfo = detectMonorepo(repositoryPath);

  // Step 3: Assign modules to files
  if (monorepoInfo.isMonorepo) {
    fileChanges.forEach((fc) => {
      fc.module = detectModule(fc.path, monorepoInfo.workspaceRoots || []);
    });
  }

  // Step 4: Group files based on strategy
  let groups: CommitGroup[];
  let strategyUsed: "hybrid" | "module-only" | "file-type-only";

  if (strategy === "modules" && monorepoInfo.isMonorepo) {
    groups = groupByModule(fileChanges);
    strategyUsed = "module-only";
  } else if (strategy === "files") {
    groups = groupByFileType(fileChanges);
    strategyUsed = "file-type-only";
  } else {
    groups = hybridGrouping(fileChanges, monorepoInfo.isMonorepo);
    strategyUsed = "hybrid";
  }

  // Step 5: Detect dependencies between groups
  detectInterGroupDependencies(groups, repositoryPath);

  // Step 6: Suggest commit types and scopes
  groups.forEach((group) => suggestCommitMetadata(group));

  // Step 7: Build metadata
  const modules = Array.from(new Set(fileChanges.map((fc) => fc.module).filter(Boolean))) as string[];
  const languages = detectLanguages(fileChanges);

  return {
    repository_path: repositoryPath,
    is_monorepo: monorepoInfo.isMonorepo,
    monorepo_type: monorepoInfo.type,
    strategy_used: strategyUsed,
    groups,
    unassigned_files: [],
    metadata: {
      total_files: fileChanges.length,
      total_groups: groups.length,
      modules_detected: modules,
      languages_detected: languages,
    },
  };
}

// ============================================
// File Classification
// ============================================

function classifyFile(path: string, repositoryPath: string): FileChange {
  const ext = extname(path).toLowerCase();
  const normalizedPath = path.replace(/\\/g, "/");

  let category: FileChange["category"] = "other";

  if (GENERATED_PATTERNS.some((p) => p.test(normalizedPath))) {
    category = "generated";
  } else if (TEST_PATTERNS.some((p) => p.test(normalizedPath))) {
    category = "test";
  } else if (DOC_PATTERNS.some((p) => p.test(normalizedPath))) {
    category = "doc";
  } else if (CONFIG_PATTERNS.some((p) => p.test(normalizedPath)) && !SOURCE_EXTENSIONS.has(ext)) {
    category = "config";
  } else if (SOURCE_EXTENSIONS.has(ext) || [".css", ".scss", ".less", ".html", ".svg"].includes(ext)) {
    category = "source";
  } else if ([".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp"].includes(ext)) {
    category = "asset";
  }

  return {
    path: normalizedPath,
    status: "modified", // Will be refined if needed
    extension: ext,
    category,
    module: null,
    directory: dirname(normalizedPath),
  };
}

// ============================================
// Monorepo Detection
// ============================================

function detectMonorepo(repositoryPath: string): {
  isMonorepo: boolean;
  type: string | null;
  workspaceRoots: string[];
} {
  for (const indicator of MONOREPO_INDICATORS) {
    const filePath = join(repositoryPath, indicator.file);
    if (existsSync(filePath)) {
      const workspaceRoots = detectWorkspaceRoots(repositoryPath, indicator.type);
      return { isMonorepo: true, type: indicator.type, workspaceRoots };
    }
  }

  // Check package.json for workspaces field
  const pkgJsonPath = join(repositoryPath, "package.json");
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
      if (pkg.workspaces && (Array.isArray(pkg.workspaces) || pkg.workspaces.packages)) {
        const workspaceRoots = detectWorkspaceRoots(repositoryPath, "npm-workspaces");
        return { isMonorepo: true, type: "npm-workspaces", workspaceRoots };
      }
    } catch {}
  }

  // Check for common monorepo directory structures
  const commonDirs = ["packages", "apps", "services", "modules", "libs"];
  for (const dir of commonDirs) {
    const dirPath = join(repositoryPath, dir);
    if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
      const subdirs = listSubdirectories(dirPath);
      if (subdirs.length >= 2) {
        // Check if subdirs look like packages (have package.json, pyproject.toml, etc.)
        const packageIndicators = ["package.json", "pyproject.toml", "Cargo.toml", "go.mod", "pom.xml", "build.gradle"];
        const packageCount = subdirs.filter((sd) => packageIndicators.some((pi) => existsSync(join(dirPath, sd, pi)))).length;
        if (packageCount >= 2) {
          const workspaceRoots = subdirs.map((sd) => join(dir, sd).replace(/\\/g, "/"));
          return { isMonorepo: true, type: `directory-${dir}`, workspaceRoots };
        }
      }
    }
  }

  return { isMonorepo: false, type: null, workspaceRoots: [] };
}

function detectWorkspaceRoots(repositoryPath: string, monorepoType: string | null): string[] {
  const roots: string[] = [];

  if (monorepoType === "pnpm-workspaces") {
    try {
      const content = readFileSync(join(repositoryPath, "pnpm-workspace.yaml"), "utf-8");
      const matches = content.match(/-\s*['"]?([^'"\n]+)['"]?/g);
      if (matches) {
        matches.forEach((m) => {
          const pattern = m
            .replace(/^-\s*['"]?/, "")
            .replace(/['"]?$/, "")
            .trim();
          if (!pattern.includes("*")) {
            roots.push(pattern);
          } else {
            // Expand glob patterns like "packages/*"
            const base = pattern.replace(/\/?\*.*$/, "");
            const basePath = join(repositoryPath, base);
            if (existsSync(basePath)) {
              listSubdirectories(basePath).forEach((sd) => roots.push(join(base, sd).replace(/\\/g, "/")));
            }
          }
        });
      }
    } catch {}
  } else if (monorepoType === "npm-workspaces") {
    try {
      const pkg = JSON.parse(readFileSync(join(repositoryPath, "package.json"), "utf-8"));
      const workspaces = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages || [];
      workspaces.forEach((pattern: string) => {
        if (!pattern.includes("*")) {
          roots.push(pattern);
        } else {
          const base = pattern.replace(/\/?\*.*$/, "");
          const basePath = join(repositoryPath, base);
          if (existsSync(basePath)) {
            listSubdirectories(basePath).forEach((sd) => roots.push(join(base, sd).replace(/\\/g, "/")));
          }
        }
      });
    } catch {}
  } else {
    // Generic: look for common monorepo directories
    const commonDirs = ["packages", "apps", "services", "modules", "libs"];
    for (const dir of commonDirs) {
      const dirPath = join(repositoryPath, dir);
      if (existsSync(dirPath)) {
        listSubdirectories(dirPath).forEach((sd) => roots.push(join(dir, sd).replace(/\\/g, "/")));
      }
    }
  }

  return roots;
}

function detectModule(filePath: string, workspaceRoots: string[]): string | null {
  const normalized = filePath.replace(/\\/g, "/");
  for (const root of workspaceRoots) {
    const normalizedRoot = root.replace(/\\/g, "/");
    if (normalized.startsWith(normalizedRoot + "/") || normalized === normalizedRoot) {
      return normalizedRoot;
    }
  }
  return null;
}

// ============================================
// Grouping Strategies
// ============================================

function hybridGrouping(fileChanges: FileChange[], isMonorepo: boolean): CommitGroup[] {
  const groups: CommitGroup[] = [];
  let groupId = 1;

  // Strategy 1: Group by module (if monorepo)
  if (isMonorepo) {
    const byModule = new Map<string, FileChange[]>();
    const unassigned: FileChange[] = [];

    fileChanges.forEach((fc) => {
      if (fc.module) {
        if (!byModule.has(fc.module)) byModule.set(fc.module, []);
        byModule.get(fc.module)!.push(fc);
      } else {
        unassigned.push(fc);
      }
    });

    byModule.forEach((files, module) => {
      // Within each module, further split by responsibility
      const subGroups = groupByResponsibility(files);
      subGroups.forEach((sg) => {
        groups.push({
          id: groupId++,
          strategy: "module",
          module,
          label: `${module}${sg.labelSuffix}`,
          files: sg.files.map((f) => f.path),
          change_types: Array.from(new Set(sg.files.map((f) => f.status))),
          file_categories: Array.from(new Set(sg.files.map((f) => f.category))),
          dependencies_on_other_groups: [],
          confidence: "high",
          suggested_type: null,
          suggested_scope: extractScopeFromModule(module),
          reasoning: `Files grouped by module '${module}'${sg.labelSuffix ? ` and ${sg.labelSuffix.trim()}` : ""}`,
        });
      });
    });

    // Handle unassigned files (root-level changes)
    if (unassigned.length > 0) {
      const rootGroups = groupByResponsibility(unassigned);
      rootGroups.forEach((sg) => {
        groups.push({
          id: groupId++,
          strategy: "global",
          module: null,
          label: `root${sg.labelSuffix}`,
          files: sg.files.map((f) => f.path),
          change_types: Array.from(new Set(sg.files.map((f) => f.status))),
          file_categories: Array.from(new Set(sg.files.map((f) => f.category))),
          dependencies_on_other_groups: [],
          confidence: "medium",
          suggested_type: null,
          suggested_scope: null,
          reasoning: `Root-level files${sg.labelSuffix ? ` (${sg.labelSuffix.trim()})` : ""}`,
        });
      });
    }
  } else {
    // Single-module repo: group by responsibility (source/test/doc/config)
    const respGroups = groupByResponsibility(fileChanges);
    respGroups.forEach((sg) => {
      groups.push({
        id: groupId++,
        strategy: "file-type",
        module: null,
        label: sg.labelSuffix ? sg.labelSuffix.trim() : "changes",
        files: sg.files.map((f) => f.path),
        change_types: Array.from(new Set(sg.files.map((f) => f.status))),
        file_categories: Array.from(new Set(sg.files.map((f) => f.category))),
        dependencies_on_other_groups: [],
        confidence: sg.files.length > 1 ? "high" : "medium",
        suggested_type: null,
        suggested_scope: null,
        reasoning: `Files grouped by type/responsibility${sg.labelSuffix ? `: ${sg.labelSuffix.trim()}` : ""}`,
      });
    });
  }

  return groups;
}

function groupByModule(fileChanges: FileChange[]): CommitGroup[] {
  const groups: CommitGroup[] = [];
  let groupId = 1;

  const byModule = new Map<string, FileChange[]>();
  fileChanges.forEach((fc) => {
    const key = fc.module || "__root__";
    if (!byModule.has(key)) byModule.set(key, []);
    byModule.get(key)!.push(fc);
  });

  byModule.forEach((files, module) => {
    groups.push({
      id: groupId++,
      strategy: "module",
      module: module === "__root__" ? null : module,
      label: module === "__root__" ? "root-changes" : module,
      files: files.map((f) => f.path),
      change_types: Array.from(new Set(files.map((f) => f.status))),
      file_categories: Array.from(new Set(files.map((f) => f.category))),
      dependencies_on_other_groups: [],
      confidence: "high",
      suggested_type: null,
      suggested_scope: module === "__root__" ? null : extractScopeFromModule(module),
      reasoning: `All changes in module '${module}'`,
    });
  });

  return groups;
}

function groupByFileType(fileChanges: FileChange[]): CommitGroup[] {
  const groups: CommitGroup[] = [];
  let groupId = 1;

  const byCategory = new Map<string, FileChange[]>();
  fileChanges.forEach((fc) => {
    if (!byCategory.has(fc.category)) byCategory.set(fc.category, []);
    byCategory.get(fc.category)!.push(fc);
  });

  const categoryLabels: Record<string, string> = {
    source: "source-code",
    test: "tests",
    doc: "documentation",
    config: "configuration",
    generated: "generated-files",
    asset: "assets",
    other: "other-files",
  };

  byCategory.forEach((files, category) => {
    groups.push({
      id: groupId++,
      strategy: "file-type",
      module: null,
      label: categoryLabels[category] || category,
      files: files.map((f) => f.path),
      change_types: Array.from(new Set(files.map((f) => f.status))),
      file_categories: [category],
      dependencies_on_other_groups: [],
      confidence: "medium",
      suggested_type: null,
      suggested_scope: null,
      reasoning: `All ${category} files grouped together`,
    });
  });

  return groups;
}

function groupByResponsibility(files: FileChange[]): Array<{ files: FileChange[]; labelSuffix: string }> {
  // Within a module, group related files:
  // - Source files with their co-located tests
  // - Docs with the module
  // - Configs with the module
  // - But separate truly independent concerns

  const result: Array<{ files: FileChange[]; labelSuffix: string }> = [];

  // Separate by category first
  const sourceFiles = files.filter((f) => f.category === "source");
  const testFiles = files.filter((f) => f.category === "test");
  const docFiles = files.filter((f) => f.category === "doc");
  const configFiles = files.filter((f) => f.category === "config");
  const otherFiles = files.filter((f) => !["source", "test", "doc", "config"].includes(f.category));

  // Try to associate tests with their source files
  const { paired, orphanTests } = pairTestsWithSource(sourceFiles, testFiles);

  // Build groups
  if (paired.length > 0) {
    result.push({
      files: paired,
      labelSuffix: " (source + tests)",
    });
  }

  if (orphanTests.length > 0) {
    result.push({
      files: orphanTests,
      labelSuffix: " (tests only)",
    });
  }

  if (sourceFiles.length > 0 && paired.length === 0) {
    result.push({
      files: sourceFiles,
      labelSuffix: " (source)",
    });
  }

  if (docFiles.length > 0) {
    result.push({
      files: docFiles,
      labelSuffix: " (docs)",
    });
  }

  if (configFiles.length > 0) {
    result.push({
      files: configFiles,
      labelSuffix: " (config)",
    });
  }

  if (otherFiles.length > 0) {
    result.push({
      files: otherFiles,
      labelSuffix: " (other)",
    });
  }

  // If everything ended up in one group, simplify the label
  if (result.length === 1) {
    result[0].labelSuffix = "";
  }

  return result;
}

function pairTestsWithSource(sourceFiles: FileChange[], testFiles: FileChange[]): { paired: FileChange[]; orphanTests: FileChange[] } {
  const paired: FileChange[] = [...sourceFiles];
  const orphanTests: FileChange[] = [];

  testFiles.forEach((testFile) => {
    // Try to find a matching source file
    // Common patterns:
    // - src/foo.ts ↔ src/foo.test.ts
    // - src/foo.ts ↔ tests/foo.test.ts
    // - src/foo.ts ↔ src/__tests__/foo.test.ts

    const testBaseName = basename(testFile.path)
      .replace(/\.test\./, ".")
      .replace(/\.spec\./, ".")
      .replace(/_test\./, ".")
      .replace(/_spec\./, ".");

    const matchingSource = sourceFiles.find((sf) => {
      const sourceBaseName = basename(sf.path);
      return (
        sourceBaseName === testBaseName ||
        testFile.directory === sf.directory ||
        testFile.directory.includes(dirname(sf.path)) ||
        dirname(sf.path).includes(testFile.directory)
      );
    });

    if (matchingSource) {
      paired.push(testFile);
    } else {
      orphanTests.push(testFile);
    }
  });

  return { paired, orphanTests };
}

// ============================================
// Dependency Detection
// ============================================

function detectInterGroupDependencies(groups: CommitGroup[], repositoryPath: string): void {
  // Build a map of file → group ID
  const fileToGroup = new Map<string, number>();
  groups.forEach((g) => {
    g.files.forEach((f) => fileToGroup.set(f, g.id));
  });

  // For each group, check if its files import from files in other groups
  groups.forEach((group) => {
    const dependencies = new Set<number>();

    group.files.forEach((filePath) => {
      const fullPath = join(repositoryPath, filePath);
      if (!existsSync(fullPath)) return;

      try {
        const content = readFileSync(fullPath, "utf-8");
        const imports = extractImports(content);

        imports.forEach((imp) => {
          // Try to resolve the import to a file in our changed set
          const resolvedFiles = resolveImport(imp, filePath, Array.from(fileToGroup.keys()));
          resolvedFiles.forEach((resolved) => {
            const targetGroup = fileToGroup.get(resolved);
            if (targetGroup && targetGroup !== group.id) {
              dependencies.add(targetGroup);
            }
          });
        });
      } catch {}
    });

    group.dependencies_on_other_groups = Array.from(dependencies).sort((a, b) => a - b);
  });
}

function extractImports(content: string): string[] {
  const imports: string[] = [];

  // JavaScript/TypeScript: import ... from '...' and require('...')
  const jsImportRegex = /(?:import\s+.*?\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
  let match;
  while ((match = jsImportRegex.exec(content)) !== null) {
    imports.push(match[1] || match[2]);
  }

  // Python: import X, from X import Y
  const pyImportRegex = /(?:^|\n)(?:import\s+([\w.]+)|from\s+([\w.]+)\s+import)/g;
  while ((match = pyImportRegex.exec(content)) !== null) {
    imports.push(match[1] || match[2]);
  }

  // Java: import X.Y.Z
  const javaImportRegex = /^import\s+([\w.]+);/gm;
  while ((match = javaImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function resolveImport(importPath: string, fromFile: string, allChangedFiles: string[]): string[] {
  const resolved: string[] = [];

  // Skip external packages (no ./ or ../ prefix and not a relative path)
  if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
    return resolved;
  }

  const fromDir = dirname(fromFile);

  // Try common extensions
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go", ".rs"];
  const indexFiles = ["/index.ts", "/index.js", "/index.tsx", "/index.jsx", "/__init__.py"];

  for (const ext of extensions) {
    const candidate = join(fromDir, importPath + ext).replace(/\\/g, "/");
    if (allChangedFiles.includes(candidate)) {
      resolved.push(candidate);
    }
  }

  for (const idx of indexFiles) {
    const candidate = join(fromDir, importPath + idx).replace(/\\/g, "/");
    if (allChangedFiles.includes(candidate)) {
      resolved.push(candidate);
    }
  }

  return resolved;
}

// ============================================
// Commit Metadata Suggestion
// ============================================

function suggestCommitMetadata(group: CommitGroup): void {
  const categories = new Set(group.file_categories);
  const hasSource = categories.has("source");
  const hasTest = categories.has("test");
  const hasDoc = categories.has("doc");
  const hasConfig = categories.has("config");
  const hasGenerated = categories.has("generated");

  // Suggest type based on content
  if (hasSource && !hasTest && !hasDoc && !hasConfig) {
    group.suggested_type = "feat"; // Default assumption; LLM should refine
    group.confidence = "medium";
  } else if (hasTest && !hasSource) {
    group.suggested_type = "test";
    group.confidence = "high";
  } else if (hasDoc && !hasSource && !hasTest) {
    group.suggested_type = "docs";
    group.confidence = "high";
  } else if (hasConfig && !hasSource) {
    group.suggested_type = "build";
    group.confidence = "high";
  } else if (hasGenerated && !hasSource) {
    group.suggested_type = "chore";
    group.confidence = "high";
  } else if (hasSource && hasTest) {
    group.suggested_type = "feat"; // Most common case
    group.confidence = "medium";
  } else {
    group.suggested_type = "chore";
    group.confidence = "low";
  }

  // Refine reasoning
  const parts: string[] = [];
  if (hasSource) parts.push("source code");
  if (hasTest) parts.push("tests");
  if (hasDoc) parts.push("documentation");
  if (hasConfig) parts.push("configuration");
  if (hasGenerated) parts.push("generated files");

  group.reasoning = `Contains ${parts.join(", ")}. Suggested type: ${group.suggested_type}.`;

  if (group.dependencies_on_other_groups.length > 0) {
    group.reasoning += ` Depends on group(s): ${group.dependencies_on_other_groups.join(", ")}.`;
    group.confidence = "low"; // Dependencies reduce confidence
  }
}

// ============================================
// Utility Functions
// ============================================

function getChangedFiles(repositoryPath: string): string[] {
  try {
    // Get all changed files: staged, unstaged, and untracked
    const staged = execSync("git diff --cached --name-only", { cwd: repositoryPath, encoding: "utf-8" }).split("\n").filter(Boolean);
    const unstaged = execSync("git diff --name-only", { cwd: repositoryPath, encoding: "utf-8" }).split("\n").filter(Boolean);
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: repositoryPath, encoding: "utf-8" }).split("\n").filter(Boolean);

    const all = new Set([...staged, ...unstaged, ...untracked]);
    return Array.from(all).filter((f) => f.trim().length > 0);
  } catch {
    return [];
  }
}

function listSubdirectories(dirPath: string): string[] {
  try {
    const { readdirSync, statSync } = require("fs");
    return readdirSync(dirPath).filter((entry: string) => {
      try {
        return statSync(join(dirPath, entry)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

function extractScopeFromModule(modulePath: string): string {
  // Extract the last segment of the module path as scope
  // e.g., "packages/auth" → "auth", "apps/web" → "web"
  const parts = modulePath.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

function detectLanguages(fileChanges: FileChange[]): string[] {
  const langMap: Record<string, string> = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".py": "Python",
    ".java": "Java",
    ".kt": "Kotlin",
    ".go": "Go",
    ".rs": "Rust",
    ".rb": "Ruby",
    ".php": "PHP",
    ".cs": "C#",
    ".c": "C",
    ".cpp": "C++",
    ".swift": "Swift",
    ".vue": "Vue",
    ".svelte": "Svelte",
  };

  const languages = new Set<string>();
  fileChanges.forEach((fc) => {
    if (langMap[fc.extension]) {
      languages.add(langMap[fc.extension]);
    }
  });

  return Array.from(languages).sort();
}
