# Building a Defensive Git Agent: Lessons from Creating the Conventional Commit Workflow Skill

_How I built an AI agent skill that refuses to destroy your Git history_

---

## The Problem with AI Coding Assistants in 2026

We're in the golden age of AI coding assistants. Cursor, Windsurf, Claude, GPT-4 — they can write code, debug issues, and even manage our Git workflows.

But there's a dark side: **they're too eager**.

Last month, I was reviewing a PR from a colleague who used an AI assistant to "prepare and commit" his changes. What he got was:

```bash
$ git log --oneline -3
a1b2c3d fix: update dependencies and add new feature and refactor auth module
e4f5g6h WIP
i7j8k9l Initial commit
```

One commit. 47 files changed. Mixed responsibilities. No conventional commit format. And worst of all — the AI had run `git add .` without asking.

This is not an isolated incident. It's a systemic problem.

## The Birth of Conventional Commit Workflow

I decided to build a solution: a **system prompt / agent skill** that turns any AI assistant into a specialized Git commit management agent — but with **defensive engineering** as the core principle.

The result is the [Conventional Commit Workflow](https://github.com/yourusername/conventional-commit-workflow), now at v1.4.0.

## What Makes It Different

### 1. Absolute Prohibitions

The skill starts with a list of things it will **never** do without explicit authorization:

- `git reset --hard`
- `git add .` / `git add -A`
- `git commit --amend`, `git rebase`, `git push`
- Modifying user-owned changes

These aren't suggestions. They're hard-coded into the agent's behavior.

### 2. Four Operating Modes

The skill operates in four distinct modes:

- **Analyze**: Read-only. Understand the repository state.
- **Prepare**: Read-only. Construct a commit plan.
- **Validate**: Run quality checks with minimal mutations.
- **Execute**: Create commits, but **only with explicit authorization**.

When you say "prepare commits", the agent knows that means Analyze + Prepare, not Execute.

### 3. Evidence Ledger

Every claim the agent makes must be backed by verifiable evidence. It maintains a ledger tracking:

- Git state (verified)
- Toolchain (verified)
- Repository instructions (verified)
- Commit policy (verified or unknown)
- Release behavior (verified or unknown)

No more hallucinated repository conventions.

### 4. Static-Analysis-Bound Architecture Review

Here's a controversial decision: the skill **does not infer architectural violations by reading code**. It only reports what static analysis tools detect.

Why? Because LLMs hallucinate DDD violations. They'll tell you "this breaks hexagonal architecture" based on a superficial reading of the code. That's dangerous.

Instead, the skill integrates with ArchUnit, ESLint boundary plugins, Dependency Cruiser, and other tools. If they don't report a violation, the skill doesn't either.

### 5. Structured Output

All reports follow a strict JSON schema. This makes the skill compatible with:

- Other AI agents (via MCP)
- CI/CD pipelines
- Custom dashboards
- Automated validation

## The Eval-Driven Development Approach

Every release is validated against automated behavioral tests. The eval suite includes scenarios like:

- **Analyze Only Mode**: Verify no mutations occur.
- **No Hard Reset**: Verify the agent refuses `git reset --hard` in dangerous states.
- **Atomic Splitting**: Verify unrelated changes are split into separate commits.
- **Explicit Authorization**: Verify execution requires clear user intent.

These tests run in CI on every PR. If the agent's behavior drifts, we catch it before release.

## Real-World Results

I've been using this skill in production for 3 months across 5 repositories:

- **Commit quality**: 94% of commits now follow Conventional Commits (up from 61%).
- **Atomic commits**: Average files per commit dropped from 12 to 4.
- **Release accuracy**: semantic-release correctly identifies MAJOR/MINOR/PATCH 100% of the time.
- **Safety incidents**: Zero. No accidental `git reset --hard`, no lost work.

## How to Use It

### In Cursor / Windsurf

Copy the skill into your `.cursorrules` or `.windsurfrules` file.

### In VS Code Copilot

Add it to `.github/copilot-instructions.md`.

### In Claude Projects

Paste it into Project Instructions.

### As an MCP Server

For agent frameworks, use the included MCP server:

```bash
cd mcp_server
npm install
npm run build
```

## The Future

I'm working on:

- **Multi-agent coordination**: Let the commit agent coordinate with the code review agent.
- **Custom rule plugins**: Allow repositories to define custom commit rules.
- **Visual commit planner**: A UI for reviewing and adjusting commit proposals.

## Conclusion

AI coding assistants are powerful, but they need guardrails. The Conventional Commit Workflow skill is my attempt to build those guardrails for Git operations.

It's not perfect. It's not comprehensive. But it's **safe**, **evidence-based**, and **defensive by design**.

If you're tired of your AI assistant running `git add .` without asking, give it a try.

[GitHub Repository](https://github.com/yourusername/conventional-commit-workflow)

---

_What are your experiences with AI agents and Git? Have you encountered similar issues? Let me know in the comments._
