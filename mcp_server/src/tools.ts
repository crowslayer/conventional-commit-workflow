import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

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
        const cmd = args.staged ? "git diff --cached" : "git diff";
        const output = execSync(cmd, { cwd }).toString();
        return { content: [{ type: "text", text: output }] };
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
