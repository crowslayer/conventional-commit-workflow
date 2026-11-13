import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync } from "fs";
import { dirname, join } from "path";

// ============================================
// Helper Functions
// ============================================

function safeExec(command: string, cwd: string): { stdout: string; stderr: string; success: boolean } {
  try {
    const stdout = execSync(command, { cwd, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
    return { stdout: stdout || "", stderr: "", success: true };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || error.message,
      success: false,
    };
  }
}

function safeReadFile(path: string): { content: string; exists: boolean; error?: string } {
  try {
    if (!existsSync(path)) {
      return { content: "", exists: false, error: "File not found" };
    }
    const content = readFileSync(path, "utf-8");
    return { content, exists: true };
  } catch (error: any) {
    return { content: "", exists: false, error: error.message };
  }
}

function findFileUp(filename: string, startDir: string): string | null {
  let currentDir = startDir;
  while (currentDir !== dirname(currentDir)) {
    const filePath = join(currentDir, filename);
    if (existsSync(filePath)) {
      return filePath;
    }
    currentDir = dirname(currentDir);
  }
  return null;
}

export const tools = [
  {
    name: "git_status",
    description: "Get the current Git repository status",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Repository path (optional)" },
      },
    },
  },
  {
    name: "git_diff",
    description: "Get Git diff (staged or unstaged)",
    inputSchema: {
      type: "object",
      properties: {
        staged: { type: "boolean", description: "Show staged changes" },
        path: { type: "string", description: "Repository path (optional)" },
      },
    },
  },
  {
    name: "run_bash",
    description: "Execute a shell command (use with caution)",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command to execute" },
        cwd: { type: "string", description: "Working directory" },
      },
      required: ["command"],
    },
  },
  {
    name: "read_file",
    description: "Read a file from the repository",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_dir",
    description: "List directory contents",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path" },
      },
      required: ["path"],
    },
  },
  {
    name: "analyze_commits",
    description: "Analyze Git changes and propose atomic commits",
    inputSchema: {
      type: "object",
      properties: {
        repository_path: { type: "string", description: "Repository path" },
      },
    },
  },
  {
    name: "analyze_commit_groupings",
    description:
      "Analyze Git changes and propose deterministic groupings based on module boundaries, file relationships, and change types. Returns structured commit groups with suggested types and scopes. Use this BEFORE generating commit messages to reduce token usage and improve grouping accuracy.",
    inputSchema: {
      type: "object",
      properties: {
        repository_path: { type: "string", description: "Repository root path" },
        strategy: {
          type: "string",
          enum: ["modules", "files", "hybrid"],
          description: "Grouping strategy: 'modules' (monorepo-focused), 'files' (by file type), 'hybrid' (recommended default)",
        },
      },
    },
  },
  {
    name: "get_diff_summary",
    description:
      "Get a summary of Git changes with file-level statistics. Automatically detects massive diffs and returns metadata instead of full content. Use this FIRST when analyzing changes to understand scope before requesting specific chunks.",
    inputSchema: {
      type: "object",
      properties: {
        repository_path: { type: "string", description: "Repository root path" },
        staged: { type: "boolean", description: "Analyze staged changes (default: false)" },
        path_filter: { type: "string", description: "Filter to specific file or directory" },
        threshold: { type: "number", description: "Line threshold for massive diff detection (default: 2000)" },
      },
    },
  },
  {
    name: "get_diff_chunk",
    description:
      "Retrieve a specific chunk of a diff by chunk_id. Use after get_diff_summary to inspect specific files or hunks without loading the entire diff.",
    inputSchema: {
      type: "object",
      properties: {
        repository_path: { type: "string", description: "Repository root path" },
        chunk_id: {
          type: "string",
          description: "Chunk ID from get_diff_summary (format: 'file:path', 'hunk:path:index', 'directory:path', 'binary:path')",
        },
        staged: { type: "boolean", description: "Get chunk from staged changes" },
      },
      required: ["chunk_id"],
    },
  },
];

export async function callTool(name: string, args: any) {
  const cwd = args.repository_path || args.path || args.cwd || process.cwd();
  try {
    switch (name) {
      case "git_status": {
        const output = execSync("git status --short --branch", {
          cwd,
        }).toString();
        return { content: [{ type: "text", text: output }] };
      }

      case "git_diff": {
        const { analyzeDiff } = await import("./chunking.js");
        const threshold = args.threshold || 2000;
        const analysis = analyzeDiff(cwd, args.staged || false, args.path, threshold);

        // If massive, return summary with instructions
        if (analysis.is_massive) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    _warning: "MASSIVE DIFF DETECTED",
                    _message: `This diff has ${analysis.total_lines_changed} lines changed across ${analysis.total_files} files, exceeding the threshold of ${threshold} lines. Use get_diff_summary for full metadata, then get_diff_chunk to inspect specific parts.`,
                    analysis,
                    _instructions: {
                      step_1: "Review the analysis.files array to identify relevant files",
                      step_2: "Use get_diff_chunk with chunk_id from analysis.files[].chunk_ids",
                      step_3: "Chunk ID formats: 'file:path', 'hunk:path:index', 'directory:path'",
                    },
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        // Otherwise, return stat or full diff
        if (args.stat_only) {
          const result = safeExec(`git diff ${args.staged ? "--cached" : ""} --stat${args.path ? ` -- ${args.path}` : ""}`, cwd);
          return {
            content: [{ type: "text", text: result.stdout || "(no changes)" }],
          };
        }

        const result = safeExec(`git diff ${args.staged ? "--cached" : ""}${args.path ? ` -- ${args.path}` : ""}`, cwd);
        return {
          content: [{ type: "text", text: result.stdout || "(no changes)" }],
        };
      }

      case "run_bash": {
        const output = execSync(args.command, { cwd }).toString();
        return { content: [{ type: "text", text: output }] };
      }

      case "read_file": {
        const fullPath = join(process.cwd(), args.path);
        if (!existsSync(fullPath)) {
          return {
            content: [{ type: "text", text: "File not found" }],
            isError: true,
          };
        }
        const content = readFileSync(fullPath, "utf-8");
        return { content: [{ type: "text", text: content }] };
      }

      case "list_dir": {
        const fullPath = join(process.cwd(), args.path);
        if (!existsSync(fullPath)) {
          return {
            content: [{ type: "text", text: "Directory not found" }],
            isError: true,
          };
        }
        const entries = readdirSync(fullPath);
        return { content: [{ type: "text", text: entries.join("\n") }] };
      }

      case "analyze_commits": {
        return {
          content: [
            {
              type: "text",
              text: "Analysis complete. See structured output for commit proposals.",
            },
          ],
        };
      }
      case "analyze_commit_groupings": {
        const { analyzeCommitGroupings } = await import("./grouping");
        const strategy = args.strategy || "hybrid";
        const analysis = analyzeCommitGroupings(cwd, strategy);
        return { content: [{ type: "text", text: JSON.stringify(analysis, null, 2) }] };
      }

      case "get_diff_summary": {
        const { analyzeDiff } = await import("./chunking.js");
        const threshold = args.threshold || 2000;
        const analysis = analyzeDiff(cwd, args.staged || false, args.path_filter, threshold);
        return { content: [{ type: "text", text: JSON.stringify(analysis, null, 2) }] };
      }

      case "get_diff_chunk": {
        const { getChunk } = await import("./chunking.js");
        const chunk = getChunk({
          repository_path: cwd,
          chunk_id: args.chunk_id,
          staged: args.staged || false,
        });
        if (!chunk) {
          return {
            content: [{ type: "text", text: `Chunk not found: ${args.chunk_id}` }],
            isError: true,
          };
        }
        return { content: [{ type: "text", text: JSON.stringify(chunk, null, 2) }] };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}
