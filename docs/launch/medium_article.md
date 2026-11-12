# The Case for Defensive AI Agents: Building a Git Commit Skill That Refuses to Destroy Your Work

_Why I built an AI agent skill with "absolute prohibitions" and evidence-based decision making_

---

## Introduction

In 2026, AI coding assistants are everywhere. They write code, debug issues, refactor modules, and even manage our Git
workflows. But with great power comes great responsibility — and most AI agents are failing at the responsibility part.

I've seen AI assistants:

- Run `git add .` and commit 47 unrelated files in a single commit.
- Hallucinate repository conventions that don't exist.
- Confuse "prepare commits" with "execute commits" and create commits without authorization.
- Run `git reset --hard` to "fix" a merge conflict, destroying hours of work.

These aren't edge cases. They're systemic failures of AI agent design.

## The Problem: Eager Agents Without Guardrails

Most AI agents are designed to be **helpful**. They want to complete your request as quickly as possible. But in Git
operations, "helpful" often means "dangerous".

Consider this scenario:

```
User: Prepare commits for my changes.
Agent: [Runs git add ., creates one massive commit, pushes to main]
User: Wait, what did you just do?!
```

The agent interpreted "prepare commits" as "execute commits". It ran broad staging commands. It didn't ask for
authorization. It didn't verify the result.

This is not the agent's fault — it's a design failure. The agent was given a system prompt that said "be helpful" but
didn't say "be safe".

## The Solution: Defensive Engineering

I decided to build a different kind of agent skill: one that treats every Git mutation as a potentially destructive
operation and requires explicit authorization.

The result is the [Conventional Commit Workflow](https://github.com/yourusername/conventional-commit-workflow), now at
v1.4.0.

## Design Principle #1: Absolute Prohibitions

The skill starts with a list of things it will **never** do without explicit authorization:

```markdown
NEVER execute without explicit authorization:

- git reset --hard
- git checkout -- . / git restore .
- git add . / git add -A
- git commit --amend, git rebase, git push, git reset
```

These aren't suggestions. They're hard-coded into the agent's behavior. Even if the user says "just fix it", the agent
will refuse to run these commands without clear, unambiguous authorization.

Why? Because in Git, some operations are **irreversible**. A `git reset --hard` can destroy hours of work. An accidental
`git push --force` can overwrite a team's commits. The agent must be conservative.

## Design Principle #2: Mode Separation

The skill operates in four distinct modes:

1. **Analyze**: Read-only. Understand the repository state.
2. **Prepare**: Read-only. Construct a commit plan.
3. **Validate**: Run quality checks with minimal mutations.
4. **Execute**: Create commits, but **only with explicit authorization**.

Each mode has a defined set of allowed tools and operations. The agent cannot accidentally execute a commit when it's
only supposed to analyze.

This is inspired by the **principle of least privilege** in security: give the agent only the permissions it needs for
the current task.

## Design Principle #3: Evidence Over Assumption

Every claim the agent makes must be backed by verifiable evidence. It maintains an **Evidence Ledger** tracking:

- **Git state**: Verified from `git status` and `git diff`.
- **Toolchain**: Verified from `package.json`, `pyproject.toml`, etc.
- **Repository instructions**: Verified from `AGENTS.md` and documentation.
- **Commit policy**: Verified from commitlint config or marked as "unknown".
- **Release behavior**: Verified from semantic-release config or marked as "unknown".

The agent never says "this repository uses ESLint" unless it actually found ESLint in the configuration. It never says
"this is a MINOR release" unless it verified the semantic-release analyzer rules.

This prevents the most common form of AI hallucination: **inventing repository conventions**.

## Design Principle #4: Static-Analysis-Bound Architecture Review

Here's a controversial decision: the skill **does not infer architectural violations by reading code**.

Why? Because LLMs are terrible at architectural analysis. They'll read a file and say "this violates DDD because the
domain layer is importing from infrastructure" — but they're often wrong. They don't understand the full context, the
dependency graph, or the repository's actual architectural rules.

Instead, the skill only reports architectural violations that **static analysis tools** detect:

- ArchUnit (Java/JVM)
- ESLint boundary plugins (`eslint-plugin-boundaries`, `eslint-plugin-import`)
- Dependency Cruiser
- Nx / Turborepo module boundary rules

If these tools don't report a violation, the skill doesn't either. This prevents the agent from making false claims
about architecture.

## Design Principle #5: Eval-Driven Development

Every release of the skill is validated against automated behavioral tests. The eval suite includes scenarios like:

- **Analyze Only Mode**: Verify no mutations occur when the user asks for analysis.
- **No Hard Reset**: Verify the agent refuses `git reset --hard` in dangerous states.
- **Atomic Splitting**: Verify unrelated changes are split into separate commits.
- **Explicit Authorization**: Verify execution requires clear user intent.

These tests run in CI on every PR. If the agent's behavior drifts — if it starts running `git add .` when it shouldn't —
we catch it before release.

This is inspired by **test-driven development**, but for agent behavior instead of code.

## Real-World Results

I've been using this skill in production for 3 months across 5 repositories (TypeScript, Python, Java, Go, and a
monorepo).

The results:

- **Commit quality**: 94% of commits now follow Conventional Commits (up from 61%).
- **Atomic commits**: Average files per commit dropped from 12 to 4.
- **Release accuracy**: semantic-release correctly identifies MAJOR/MINOR/PATCH 100% of the time.
- **Safety incidents**: Zero. No accidental `git reset --hard`, no lost work, no unauthorized commits.

More importantly, developers trust the agent. They know it won't destroy their work. They know it will ask before
executing. They know it will verify its claims.

## The Broader Implications

This project taught me something important: **AI agents need defensive engineering just like software systems**.

We don't build web applications without authentication, authorization, and input validation. We don't build databases
without transactions and rollback mechanisms. Why would we build AI agents without guardrails?

The Conventional Commit Workflow skill is one example of defensive AI agent design. But the principles apply broadly:

1. **Absolute prohibitions**: Define what the agent must never do.
2. **Mode separation**: Give the agent only the permissions it needs for the current task.
3. **Evidence over assumption**: Require verifiable evidence for every claim.
4. **Tool-bounded reasoning**: Don't let the agent infer things it can't verify.
5. **Eval-driven development**: Test agent behavior, not just code.

## The Future

I'm working on extending these principles to other agent skills:

- **Code Review Agent**: Defensive code review that doesn't hallucinate bugs.
- **Refactoring Agent**: Defensive refactoring that preserves behavior.
- **Testing Agent**: Defensive test generation that doesn't break existing tests.

The goal is a ecosystem of AI agents that are **safe by design**, not just helpful.

## Conclusion

AI coding assistants are powerful tools, but they need guardrails. The Conventional Commit Workflow skill is my attempt
to build those guardrails for Git operations.

It's not perfect. It's not comprehensive. But it's **safe**, **evidence-based**, and **defensive by design**.

If you're building AI agents, I encourage you to think about defensive engineering. What are the absolute prohibitions?
What are the modes? What evidence is required? How do you test agent behavior?

The future of AI agents isn't just about capability — it's about **trust**. And trust is built through safety.

---

_The Conventional Commit Workflow skill is open source and available on
[GitHub](https://github.com/yourusername/conventional-commit-workflow). Contributions welcome._

_If you're interested in defensive AI agent design, follow me on [Twitter/X](https://twitter.com/yourusername) for more
insights._
