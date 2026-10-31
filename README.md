# Conventional Commit Workflow

An agent skill for reviewing Git changes and proposing clear, atomic Conventional Commits based on each repository's actual conventions and release configuration.

## What it does

- Inspects staged, unstaged, and untracked changes while preserving existing user work.
- Discovers commit types, scopes, subject rules, checks, architecture conventions, and release behavior from repository evidence across language-specific and polyglot projects.
- Groups independent responsibilities into reviewable commit proposals.
- Explains verified release impact and flags uncertainty, especially around custom release rules and breaking changes.
- Chooses targeted checks based on repository requirements and concrete change risks, reusing valid hook results to avoid duplicate runs.
- Reports actual hook/check outcomes and skipped validations without claiming unverified results.

The skill does not assume a particular package manager, language, architecture, module layout, or release tool. It uses repository manifests, scripts, CI, hooks, and documentation as discovery evidence (for example `pyproject.toml`, `Cargo.toml`, `go.mod`, Maven/Gradle files, or `.sln`/`.csproj` alongside JavaScript/TypeScript configuration). It limits checks to repository requirements, user requests, and concrete risks; it reuses a hook result only when the actual command, inputs, and covered scope match. It supports polyglot repositories by relating checks to affected components. It does not commit, amend, rebase, or push without explicit authorization.

## Installation

Install the skill using the skill directory name `conventional-commit-workflow` in a skills location supported by your agent. Keep `SKILL.md` at the root of that directory. For example:

```text
<skills-directory>/conventional-commit-workflow/SKILL.md
```

Restart or refresh the agent if it does not discover newly installed skills. Refer to your agent's skill documentation for supported installation locations and invocation syntax.

## Use

Ask the agent to review staged or working-tree changes, propose atomic commits, or explain the likely release effect. The skill will inspect the repository's instructions and configuration first. If policy is missing or ambiguous, it will label its assumptions rather than presenting them as enforced rules.

## Contents

- `SKILL.md` — workflow and agent instructions
- `CHANGELOG.md` — version history
- `LICENSE` — MIT License

## License

MIT. See [LICENSE](LICENSE).
