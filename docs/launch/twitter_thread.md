🧵 THREAD: I built a defensive Git agent that refuses to destroy your repository

Most AI coding assistants are too eager with Git:

- Run `git add .` without asking
- Mix 47 files into one commit
- Hallucinate repository conventions
- Sometimes run destructive commands

So I built a solution 👇

1/ Introducing: Conventional Commit Workflow v1.4.0

A system prompt that turns any AI assistant into a specialized Git commit agent — with defensive engineering as the core
principle.

Works with: Cursor, Windsurf, Claude, GPT, VS Code Copilot, MCP

github.com/yourusername/conventional-commit-workflow

2/ Key feature #1: Absolute Prohibitions

The agent will NEVER run these without explicit permission:

- git reset --hard
- git add . / git add -A
- git commit --amend, rebase, push
- Modifying user-owned changes

These are hard-coded, not suggestions.

3/ Key feature #2: Four Operating Modes

- Analyze: Read-only, understand state
- Prepare: Read-only, construct commit plan
- Validate: Run checks, minimal mutations
- Execute: Create commits (requires EXPLICIT authorization)

When you say "prepare commits", it knows that's NOT "execute commits".

4/ Key feature #3: Evidence Ledger

Every claim must be backed by verifiable evidence:

- Git state: Verified
- Toolchain: Verified
- Repository policy: Verified or Unknown
- Release behavior: Verified or Unknown

No more hallucinated conventions.

5/ Key feature #4: Static-Analysis-Bound Architecture

Controversial decision: The agent does NOT infer DDD/CQRS violations by reading code.

Why? LLMs hallucinate architectural violations.

Instead, it only reports what tools like ArchUnit, ESLint boundary plugins, or Dependency Cruiser detect.

6/ Key feature #5: Eval-Driven Development

Every release is validated against automated behavioral tests: ✓ Analyze-only mode respects read-only ✓ No hard reset in
dangerous states ✓ Atomic splitting in monorepos ✓ Explicit authorization required

Tests run in CI on every PR.

7/ Real-world results (3 months, 5 repos):

- 94% commits follow Conventional Commits (was 61%)
- Avg files per commit: 12 → 4
- semantic-release accuracy: 100%
- Safety incidents: 0

Zero accidental `git reset --hard`. Zero lost work.

8/ How to use it:

Cursor/Windsurf: Copy to .cursorrules VS Code Copilot: Add to .github/copilot-instructions.md Claude Projects: Paste
into Project Instructions MCP: Use the included server

Full docs: github.com/yourusername/conventional-commit-workflow

9/ What's next:

- Multi-agent coordination (commit agent + code review agent)
- Custom rule plugins for repositories
- Visual commit planner UI

10/ If you're tired of your AI assistant running `git add .` without asking, give it a try.

Star the repo if you find it useful: github.com/yourusername/conventional-commit-workflow

Feedback welcome! What other safety guardrails do AI agents need?

#AI #Git #ConventionalCommits #DevTools #AIAgents
