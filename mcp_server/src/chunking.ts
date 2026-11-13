import { execSync } from "child_process";

// ============================================
// Types
// ============================================

export interface DiffFile {
  path: string;
  old_path: string | null;
  status: "added" | "modified" | "deleted" | "renamed" | "copied";
  is_binary: boolean;
  added_lines: number;
  deleted_lines: number;
  total_lines: number;
  hunks: DiffHunk[];
  raw_content: string;
}

export interface DiffHunk {
  header: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  content: string;
  line_count: number;
}

export interface DiffAnalysis {
  is_massive: boolean;
  total_files: number;
  total_lines_added: number;
  total_lines_deleted: number;
  total_lines_changed: number;
  threshold: number;
  strategy_used: "full" | "summary" | "chunked";
  files: DiffFileSummary[];
  recommended_strategy: "by-file" | "by-directory" | "by-hunk";
  chunks_available: number;
  raw_diff_size_bytes: number;
}

export interface DiffFileSummary {
  path: string;
  old_path: string | null;
  status: string;
  is_binary: boolean;
  added_lines: number;
  deleted_lines: number;
  total_lines: number;
  hunk_count: number;
  chunk_ids: string[];
}

export interface DiffChunk {
  chunk_id: string;
  file_path: string;
  chunk_type: "file" | "directory" | "hunk";
  header: string;
  content: string;
  line_count: number;
  added_lines: number;
  deleted_lines: number;
  metadata: {
    hunk_index?: number;
    hunk_header?: string;
    directory?: string;
  };
}

export interface ChunkRequest {
  repository_path: string;
  chunk_id: string;
  staged?: boolean;
}

// ============================================
// Constants
// ============================================

export const DEFAULT_THRESHOLD = 2000; // lines
export const MAX_CHUNK_SIZE = 500; // lines per chunk
export const MAX_RAW_DIFF_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================
// Main Analysis Function
// ============================================

export function analyzeDiff(
  repositoryPath: string,
  staged: boolean = false,
  pathFilter?: string,
  threshold: number = DEFAULT_THRESHOLD,
): DiffAnalysis {
  const rawDiff = getRawDiff(repositoryPath, staged, pathFilter);
  const files = parseDiff(rawDiff);

  const totalLinesAdded = files.reduce((sum, f) => sum + f.added_lines, 0);
  const totalLinesDeleted = files.reduce((sum, f) => sum + f.deleted_lines, 0);
  const totalLinesChanged = totalLinesAdded + totalLinesDeleted;
  const isMassive = totalLinesChanged > threshold;

  // Build file summaries with chunk IDs
  const fileSummaries: DiffFileSummary[] = files.map((file) => {
    const chunkIds: string[] = [];
    if (file.is_binary) {
      chunkIds.push(`binary:${file.path}`);
    } else if (file.total_lines <= MAX_CHUNK_SIZE) {
      chunkIds.push(`file:${file.path}`);
    } else {
      // Split into hunks
      file.hunks.forEach((hunk, idx) => {
        chunkIds.push(`hunk:${file.path}:${idx}`);
      });
    }

    return {
      path: file.path,
      old_path: file.old_path,
      status: file.status,
      is_binary: file.is_binary,
      added_lines: file.added_lines,
      deleted_lines: file.deleted_lines,
      total_lines: file.total_lines,
      hunk_count: file.hunks.length,
      chunk_ids: chunkIds,
    };
  });

  // Determine recommended strategy
  const recommendedStrategy = determineRecommendedStrategy(files);

  // Count total chunks available
  const chunksAvailable = fileSummaries.reduce((sum, f) => sum + f.chunk_ids.length, 0);

  return {
    is_massive: isMassive,
    total_files: files.length,
    total_lines_added: totalLinesAdded,
    total_lines_deleted: totalLinesDeleted,
    total_lines_changed: totalLinesChanged,
    threshold,
    strategy_used: isMassive ? "summary" : "full",
    files: fileSummaries,
    recommended_strategy: recommendedStrategy,
    chunks_available: chunksAvailable,
    raw_diff_size_bytes: Buffer.byteLength(rawDiff, "utf-8"),
  };
}

// ============================================
// Chunk Retrieval
// ============================================

export function getChunk(request: ChunkRequest): DiffChunk | null {
  const rawDiff = getRawDiff(request.repository_path, request.staged || false);
  const files = parseDiff(rawDiff);

  const [type, ...parts] = request.chunk_id.split(":");

  if (type === "binary") {
    const filePath = parts.join(":");
    const file = files.find((f) => f.path === filePath);
    if (!file || !file.is_binary) return null;
    return {
      chunk_id: request.chunk_id,
      file_path: file.path,
      chunk_type: "file",
      header: `Binary file: ${file.path} (${file.status})`,
      content: `[Binary file - ${file.added_lines} additions, ${file.deleted_lines} deletions]`,
      line_count: 0,
      added_lines: file.added_lines,
      deleted_lines: file.deleted_lines,
      metadata: {},
    };
  }

  if (type === "file") {
    const filePath = parts.join(":");
    const file = files.find((f) => f.path === filePath);
    if (!file) return null;
    return {
      chunk_id: request.chunk_id,
      file_path: file.path,
      chunk_type: "file",
      header: `File: ${file.path} (${file.status})`,
      content: file.raw_content,
      line_count: file.total_lines,
      added_lines: file.added_lines,
      deleted_lines: file.deleted_lines,
      metadata: {},
    };
  }

  if (type === "hunk") {
    const hunkIndex = parseInt(parts[parts.length - 1], 10);
    const filePath = parts.slice(0, -1).join(":");
    const file = files.find((f) => f.path === filePath);
    if (!file || hunkIndex >= file.hunks.length) return null;
    const hunk = file.hunks[hunkIndex];
    return {
      chunk_id: request.chunk_id,
      file_path: file.path,
      chunk_type: "hunk",
      header: `Hunk ${hunkIndex + 1}/${file.hunks.length} in ${file.path}`,
      content: hunk.header + "\n" + hunk.content,
      line_count: hunk.line_count,
      added_lines: (hunk.content.match(/^\+/gm) || []).length,
      deleted_lines: (hunk.content.match(/^-/gm) || []).length,
      metadata: {
        hunk_index: hunkIndex,
        hunk_header: hunk.header,
      },
    };
  }

  if (type === "directory") {
    const dirPath = parts.join(":");
    const dirFiles = files.filter((f) => f.path.startsWith(dirPath + "/") || f.path === dirPath);
    if (dirFiles.length === 0) return null;
    const content = dirFiles.map((f) => f.raw_content).join("\n\n");
    return {
      chunk_id: request.chunk_id,
      file_path: dirPath,
      chunk_type: "directory",
      header: `Directory: ${dirPath} (${dirFiles.length} files)`,
      content,
      line_count: dirFiles.reduce((sum, f) => sum + f.total_lines, 0),
      added_lines: dirFiles.reduce((sum, f) => sum + f.added_lines, 0),
      deleted_lines: dirFiles.reduce((sum, f) => sum + f.deleted_lines, 0),
      metadata: { directory: dirPath },
    };
  }

  return null;
}

// ============================================
// Diff Parsing
// ============================================

function getRawDiff(repositoryPath: string, staged: boolean, pathFilter?: string): string {
  try {
    let cmd = staged ? "git diff --cached" : "git diff";
    if (pathFilter) {
      cmd += ` -- ${pathFilter}`;
    }
    const output = execSync(cmd, {
      cwd: repositoryPath,
      encoding: "utf-8",
      maxBuffer: MAX_RAW_DIFF_SIZE,
    });
    return output;
  } catch (error: any) {
    if (error.message?.includes("maxBuffer")) {
      throw new Error(`Diff exceeds maximum size of ${MAX_RAW_DIFF_SIZE / 1024 / 1024}MB`);
    }
    return "";
  }
}

function parseDiff(rawDiff: string): DiffFile[] {
  if (!rawDiff.trim()) return [];

  const files: DiffFile[] = [];
  const fileSections = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const section of fileSections) {
    const file = parseFileSection("diff --git " + section);
    if (file) files.push(file);
  }

  return files;
}

function parseFileSection(section: string): DiffFile | null {
  const lines = section.split("\n");
  if (lines.length === 0) return null;

  // Parse the diff --git header
  const headerMatch = lines[0].match(/^diff --git a\/(.+?) b\/(.+?)$/);
  if (!headerMatch) return null;

  const oldPath = headerMatch[1];
  const newPath = headerMatch[2];

  // Detect file status
  let status: DiffFile["status"] = "modified";
  let path = newPath;
  let oldPathResult: string | null = null;

  if (section.includes("new file mode")) {
    status = "added";
    path = newPath;
  } else if (section.includes("deleted file mode")) {
    status = "deleted";
    path = oldPath;
  } else if (section.includes("rename from") || section.includes("similarity index")) {
    status = "renamed";
    oldPathResult = oldPath;
    path = newPath;
  } else if (section.includes("copy from")) {
    status = "copied";
    oldPathResult = oldPath;
    path = newPath;
  }

  // Detect binary files
  const isBinary = section.includes("Binary files") || section.includes("GIT binary patch");

  // Parse hunks
  const hunks: DiffHunk[] = [];
  let addedLines = 0;
  let deletedLines = 0;
  let currentHunk: DiffHunk | null = null;
  let hunkContent: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Detect hunk header
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);

    if (hunkMatch) {
      // Save previous hunk
      if (currentHunk) {
        currentHunk.content = hunkContent.join("\n");
        currentHunk.line_count = hunkContent.length;
        hunks.push(currentHunk);
      }

      currentHunk = {
        header: line,
        old_start: parseInt(hunkMatch[1], 10),
        old_lines: hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1,
        new_start: parseInt(hunkMatch[3], 10),
        new_lines: hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1,
        content: "",
        line_count: 0,
      };
      hunkContent = [];
      continue;
    }

    if (currentHunk) {
      hunkContent.push(line);

      // Count added/deleted lines
      if (line.startsWith("+") && !line.startsWith("+++")) {
        addedLines++;
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        deletedLines++;
      }
    }
  }

  // Save last hunk
  if (currentHunk) {
    currentHunk.content = hunkContent.join("\n");
    currentHunk.line_count = hunkContent.length;
    hunks.push(currentHunk);
  }

  return {
    path,
    old_path: oldPathResult,
    status,
    is_binary: isBinary,
    added_lines: addedLines,
    deleted_lines: deletedLines,
    total_lines: addedLines + deletedLines,
    hunks,
    raw_content: section,
  };
}

// ============================================
// Strategy Determination
// ============================================

function determineRecommendedStrategy(files: DiffFile[]): "by-file" | "by-directory" | "by-hunk" {
  if (files.length === 0) return "by-file";

  const totalLines = files.reduce((sum, f) => sum + f.total_lines, 0);
  const avgLinesPerFile = totalLines / files.length;
  const maxFileLines = Math.max(...files.map((f) => f.total_lines));

  // If most changes are concentrated in a few large files
  if (maxFileLines > 1000 && files.length <= 5) {
    return "by-hunk";
  }

  // If changes are spread across many files in few directories
  const directories = new Set(files.map((f) => f.path.split("/").slice(0, -1).join("/")));
  if (directories.size <= 3 && files.length > 10) {
    return "by-directory";
  }

  // Default: by file
  return "by-file";
}
