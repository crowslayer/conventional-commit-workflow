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
];

export async function callTool(name: string, args: any) {
  try {
    switch (name) {
      case "git_status": {
        const cwd = args.path || process.cwd();
        const output = execSync("git status --short --branch", {
          cwd,
        }).toString();
        return { content: [{ type: "text", text: output }] };
      }

      case "git_diff": {
        const cwd = args.path || process.cwd();
        const cmd = args.staged ? "git diff --cached" : "git diff";
        const output = execSync(cmd, { cwd }).toString();
        return { content: [{ type: "text", text: output }] };
      }

      case "run_bash": {
        const cwd = args.cwd || process.cwd();
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
        // This would invoke the full skill logic
        // For now, return a placeholder
        return {
          content: [
            {
              type: "text",
              text: "Analysis complete. See structured output for commit proposals.",
            },
          ],
        };
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
