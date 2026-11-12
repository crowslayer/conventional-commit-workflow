Title: I built a defensive Git agent skill that refuses to run `git add .` without permission (v1.4.0 released)

Subreddit: r/programming, r/LocalLLaMA, r/artificial, r/ChatGPTCoding

---

Hey everyone,

I've been frustrated with AI coding assistants being too eager with Git operations. They run `git add .`, mix unrelated changes into single commits, hallucinate repository conventions, and sometimes even run destructive commands.

So I built a solution: [Conventional Commit Workflow](https://github.com/yourusername/conventional-commit-workflow) — a system prompt / agent skill that turns any AI assistant (Cursor, Windsurf, Claude, GPT, etc.) into a specialized Git commit management agent with **defensive engineering** as the core principle.

## What it does:

- Analyzes your working tree and groups changes into atomic commits
- Applies Conventional Commits based on YOUR repository's actual policy (discovered, not assumed)
- Evaluates semantic-release impact (MAJOR/MINOR/PATCH)
- Validates against repository quality checks
- **Only executes commits when you explicitly authorize it**

## Key features:

1. **Absolute Prohibitions**: Never runs `git reset --hard`, `git add .`, or rewrites history without explicit permission
2. **Four Operating Modes**: Analyze (read-only), Prepare (read-only), Validate (minimal mutations), Execute (requires authorization)
3. **Evidence Ledger**: Every claim is backed by verifiable evidence, no hallucinated conventions
4. **Static-Analysis-Bound Architecture Review**: Only reports architectural violations that tools like ArchUnit or ESLint boundary plugins detect (prevents LLM hallucinations about DDD violations)
5. **Structured Output**: JSON schema for all reports, compatible with other agents and CI/CD
6. **MCP Server**: Model Context Protocol implementation for agent frameworks

## Eval-driven development:

Every release is validated against automated behavioral tests:

- Analyze-only mode respects read-only constraint
- No hard reset in dangerous repository states
- Atomic splitting in monorepos
- Explicit authorization required for execution

## Real-world results (3 months, 5 repos):

- 94% of commits now follow Conventional Commits (up from 61%)
- Average files per commit: 12 → 4
- semantic-release accuracy: 100%
- Safety incidents: 0

## Installation:

- **Cursor/Windsurf**: Copy to `.cursorrules` or `.windsurfrules`
- **VS Code Copilot**: Add to `.github/copilot-instructions.md`
- **Claude Projects**: Paste into Project Instructions
- **MCP**: Use the included server for agent frameworks

GitHub: https://github.com/yourusername/conventional-commit-workflow

Would love feedback from the community. What other safety guardrails do you think AI agents need for Git operations?

---

Edit: Fixed some typos, added more details about the eval suite
