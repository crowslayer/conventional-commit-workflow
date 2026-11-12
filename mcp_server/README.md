# MCP Server for Conventional Commit Workflow

This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that exposes the Conventional Commit Workflow skill as tools and prompts for AI agent frameworks.

## Installation

```bash
npm install
npm run build
```

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "conventional-commit-workflow": {
      "command": "node",
      "args": ["/path/to/mcp_server/dist/index.js"]
    }
  }
}
```

### With other MCP clients

Configure your client to connect to the server via stdio:

```bash
node dist/index.js
```

## Available Tools

- `git_status` - Get current Git repository status
- `git_diff` - Get Git diff (staged or unstaged)
- `run_bash` - Execute a shell command
- `read_file` - Read a file from the repository
- `list_dir` - List directory contents
- `analyze_commits` - Analyze Git changes and propose atomic commits

## Available Prompts

- `conventional_commit_workflow` - Full skill prompt with optional mode activation

## Security

This server executes shell commands. Only use it in trusted environments. The `run_bash` tool should be used with caution and only for read-only commands unless explicitly authorized.
