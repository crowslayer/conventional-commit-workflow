---
name: conventional-commit-workflow
description: Analyze Git changes, discover repository commit and release policies, group changes into atomic commits, and propose Conventional Commit messages. Use when reviewing changes, preparing commits, or checking their release impact.
metadata:
  author: Alexander Herrera
  version: "1.2.0"
---

# Conventional Commit Workflow

## 1 Purpose

Act as a Git commit specialist focused on:

- Atomic and reviewable commits.
- Conventional Commits.
- semantic-release compatibility.
- Repository-required quality and architecture validation, when applicable.
- Domain-Driven Design (DDD), Hexagonal Architecture, or CQRS when the repository uses them.
- Multi-module repositories and monorepos.

The objective is to ensure that each proposed commit represents one coherent responsibility, accurately follows repository policy, and communicates any verified release impact. Run required quality checks and review architecture only when relevant to the repository or requested task.

Repository-specific instructions and executable configuration take precedence over generic assumptions.

Do not assume that every repository uses pnpm, TypeScript, ESLint, Prettier, DDD, or the directory structure described in this skill.

## 2 Mandatory Git Safety Rules

Before analyzing changes or modifying files, take one baseline snapshot of the repository state and relevant policy. Reuse that evidence throughout the task; reread files or rerun commands only when a mutation, new user change, failed/inconclusive result, or a specific unresolved question makes the earlier evidence stale.

### 2.1 Initial inspection

Run:

`git status --short --branch`

Inspect the current branch, staged and unstaged changes, and relevant untracked files. Capture the initial state so later mutations can be distinguished from pre-existing work.

Use:

- `git diff --cached` to inspect staged changes.
- `git diff` to inspect unstaged tracked changes.
- `git diff --cached --stat` and `git diff --stat` for a quick size overview; avoid dumping large diffs before identifying relevant paths.
- `git ls-files --others --exclude-standard` to identify untracked files when necessary.

Build a compact evidence ledger (source, rule/command, affected scope, confidence) for the language/toolchain, required checks, commit policy, release behavior, and relevant architecture rules. Reuse it rather than rediscovering the same policy in later sections.

### 2.2 Preserve user changes

Never:

- Execute `git reset --hard`.
- Execute `git checkout -- .` or `git restore .`.
- Revert changes simply to make validation pass.
- Overwrite unrelated user modifications.
- Automatically stage everything using `git add .` or `git add -A`.
- Silently modify the existing staging area.
- Commit, amend, rebase, or push without explicit authorization.

Treat pre-existing staged changes as user-owned work unless the user clearly authorizes their modification.

If the initial working tree contains changes unrelated to the task, preserve them and distinguish them from the changes being analyzed.

If the intended scope cannot be established safely, ask for clarification.

## 3 Repository Policy Discovery

Resolve repository policy once before classifying changes. Start with repository instructions and contributor documentation, then inspect only the executable configuration and CI files needed to answer the evidence-ledger questions. Examples include:

- `AGENTS.md` and other applicable agent instructions.
- Architecture and quality manuals.
- JavaScript/TypeScript: `package.json`, lockfiles, workspace files, `eslint.config.*`, Prettier configuration, `tsconfig.json`.
- Python: `pyproject.toml`, `tox.ini`, `setup.cfg`, `requirements*.txt`, environment/lock files, and configuration for tools such as Ruff, Black, mypy, or pytest.
- Rust: `Cargo.toml`, `Cargo.lock`, workspace manifests, and applicable `rustfmt`/Clippy configuration.
- Go: `go.mod`, `go.work`, `go.sum`, and CI or scripts invoking `gofmt`, `go vet`, or tests.
- Java/JVM: Maven `pom.xml`, Gradle build files and wrapper, `settings.gradle*`, and formatter or test configuration.
- .NET: `*.sln`, `*.csproj`, `Directory.Build.*`, `global.json`, and formatter/analyzer configuration.
- Ruby, PHP, and other ecosystems: their manifests, lockfiles, formatter/linter/test configuration, and documented toolchain setup (for example `Gemfile`, `composer.json`, or equivalent).
- Language-neutral build and task files such as `Makefile`, `justfile`, `Taskfile.yml`, `Dockerfile`, and scripts under `scripts/`.
- CI workflows, pre-commit hooks, and repository automation that actually run checks or enforce policy.
- `commitlint.config.*` and `.commitlintrc.*`.
- `.releaserc*`, `release.config.*`, and semantic-release settings.
- Workspace configuration and module boundaries.
- Git hooks and CI workflows that validate commits.

These examples are discovery hints, not a mandate to inspect every file or install/run every named tool. Follow the repository's actual languages and toolchain, including polyglot and generated-code areas. Prefer direct evidence of effective commands (CI, scripts, hooks, docs) over manifest presence alone. Do not invent rules that are not documented or configured. When multiple files repeat the same policy, inspect the authoritative source and use other files only to resolve conflicts or confirm invocation.

If the repository has an explicit list of authorized commit types, scopes, or title-length limits, follow that policy.

If a required configuration cannot be located, state the uncertainty instead of claiming that the repository enforces a particular rule.

## 4 Validation Workflow

Build a small validation plan from repository policy, user requests, and risks visible in the diff. Run mandatory checks and the smallest additional checks that directly validate a material risk; do not run every available check. Discover exact commands from the evidence ledger and use the declared toolchain. Before each check, consider applicability, narrower equivalent commands, dependencies, prior results, and possible file or external-state mutations. Do not run a command with material side effects unless repository policy requires it or the user authorizes it. Formatting remains subject to Section 4.2. Keep a compact validation ledger (check, command, scope/tree state, result, and skip reason) to prevent duplicate work; include only relevant entries in the final report.

Reuse a successful result only when the check is genuinely equivalent and covered the same relevant inputs and tree state. A hook counts only for commands and files it actually covered. Similar command names do not establish equivalence. A later mutation invalidates results only for checks whose inputs it changed; rerun those checks, not the entire plan. Never bypass a required hook or validation to save time.

For monorepos or polyglot repositories, determine which components the diff touches and run only the applicable required checks, plus repository-wide checks when policy requires them. Account for generated, vendored, or externally managed files according to repository policy. If command scope or prerequisites are unclear, do not guess at a potentially broad or mutating command; report the uncertainty and continue with independent read-only analysis.

### 4.1 Tests

Run tests when required by repository policy, requested by the user, or justified by a specific behavior or regression risk in the diff. Prefer targeted tests when they adequately cover that risk. Run a broader suite only when policy requires it, the impact is broad, or targeted checks are insufficient. Do not rerun tests without a new reason or changed inputs.

### 4.2 Formatting

Formatting is a mutation. Run a formatter only when requested or required by repository policy. Prefer the repository's targeted formatter command for files in scope. Run a repository-wide formatter only when policy requires it and the full affected scope is safe to rewrite.

Before running a repository-wide formatter, inspect the working tree and consider whether unrelated user modifications could be rewritten.

If formatting could modify unrelated or sensitive files, use a narrower authorized command or request approval.

After formatting, inspect the changes to distinguish formatter-generated modifications from pre-existing work.

Do not automatically stage formatter changes.

### 4.3 Hooks, lint, and architectural validation

Inspect only hooks relevant to the proposed workflow and identify their actual commands (for example tests, lint, formatting, type checking, or message validation). Record which checks and files they cover; do not infer behavior from a hook's name. Account for repeated hooks across multiple commits, but do not bypass or alter them to reduce cost.

When commits are explicitly authorized and a mandatory hook will run a check against the same staged inputs, avoid running that check again beforehand unless an earlier result is needed to decide whether or how to proceed. Let the required hook perform the validation, wait for its actual result, and report it once. Do not claim the check passed before the hook completes. If the hook covers only part of the changes, run only the uncovered checks that policy or a material risk requires.

Run required or risk-justified lint checks unless an equivalent result is already valid for the same inputs.

If a check fails, stop dependent checks. Continue only with independent checks when repository policy allows it, and report the failure.

If the error involves `boundaries/dependencies`, identify:

- The importing file.
- The imported dependency, when determinable.
- The architectural layers involved.
- The specific dependency rule that is violated.

Explain why the dependency is not permitted.

For a genuine architectural dependency violation, recommend dependency inversion through a Port or interface owned by the appropriate inner layer, with a concrete adapter implementing the contract in an outer layer.

Do not prescribe the same refactoring for every lint error.

For other lint failures, report the exact rule, affected file, and relevant diagnostic information.

Never disable architectural rules or modify ESLint configuration merely to make the checks pass without explicit authorization.

### 4.4 Compilation and type checking

Run compilation or type checking when required by policy, requested, or needed to assess a concrete risk in the changed code. Respect prerequisites and reuse an equivalent successful result for the same inputs.

If compilation fails, stop and report the relevant diagnostics.

Do not claim that the repository is healthy when a required check fails.

Do not claim that a command passed if it was skipped or could not run.

### 4.5 Reconcile changes

After any formatter or other mutating validation:

- Inspect the working tree again.
- Compare changes against the initial state.
- Identify formatter-generated and other automatic modifications.
- Review staged and unstaged changes separately.
- Identify unexpected generated files.
- Preserve pre-existing staging decisions.
- Stage only explicitly authorized files when staging is required.

If the formatter changes unrelated files, stop and request a decision before including those files in a proposed commit.

Never use `git add .` as an automatic response to formatter changes.

The goal is to avoid staging discrepancies without incorporating unrelated work.

### 4.6 Quality gate

When the repository requires quality checks, distinguish verified findings from proposed commit classification. Do not claim checks passed when they failed, were skipped, or could not run. A proposal may still be prepared when a required tool is unavailable, but state that validation is incomplete and identify the unavailable check. Ask for authorization only when continuing requires modifying files, staging changes, or bypassing an explicit repository requirement; lack of a tool alone does not prevent read-only diff analysis.

## 5 Atomic Commit Analysis

Analyze the actual changes, not merely filenames or directory names.

Inspect staged and unstaged diffs independently, then consider the combined change set to determine responsibilities. Use the initial snapshot and diffs as the source of truth; do not reread unchanged files merely to reconfirm facts already established by the diff or evidence ledger.

### 5.1 Single responsibility

Each commit should represent one coherent, understandable change.

Separate changes when they have independent purposes, for example:

- An unrelated feature and a structural refactor.
- Independent bug fixes in different modules.
- A feature and unrelated documentation changes.
- An unrelated dependency update and a business-logic change.
- Independent changes that can be reviewed and reverted separately.

Keep changes together when they are required to implement the same feature, fix, or architectural improvement.

A single atomic feature may legitimately modify domain, application, infrastructure, shared components, and application composition roots.

Do not split commits solely because files belong to different modules.

Conversely, do not combine independent changes merely because they belong to the same module.

### 5.2 Safe separation

Do not automatically move files between the staging area and working tree to manufacture separate commits.

Do not rewrite files or reconstruct patches without authorization.

If staged changes contain multiple responsibilities, propose a clear grouping and identify which files or hunks belong to each group.

If changes overlap in a way that makes safe separation uncertain, ask for confirmation before modifying the staging area.

### 5.3 Existing staged changes

Distinguish between:

- Changes already staged by the user.
- Changes that remain unstaged.
- Untracked files.
- Changes introduced by the validation process.

Do not assume that all staged files should be included in the current task.

Do not omit unstaged changes when evaluating whether the overall task contains multiple independent responsibilities.

## 6 Resolve Commit Policy from the Repository

Classify changes using the evidence ledger from Section 3. Apply this precedence: explicit user instruction for this task; applicable repository instructions and executable configuration; documented project conventions; recent relevant history as supporting evidence; this skill's examples as fallback only. If sources conflict, report the conflict and prefer executable configuration for behavior it directly enforces.

Do not assume directory names are valid scopes or that `infra`, `app`, and `domain` are commit types accepted by a target repository. Use a type or scope only when policy allows it, or label it as a proposal requiring confirmation when policy is unknown. For cross-module work, choose a permitted scope that reflects the main responsibility; split only when responsibilities are independent.

## 7 Commit Type Semantics

Use Conventional Commit semantics to describe intent: `feat` for a user-facing capability, `fix` for a defect correction, `perf` for a performance improvement, and `refactor` for behavior-preserving restructuring. Types such as `docs`, `test`, `build`, `ci`, and `chore` describe common maintenance areas. Test-only changes should use an accepted test/maintenance type, not `feat` or `fix`, unless the diff also changes product behavior. Custom types are valid only when the repository accepts them. A repository's configured release rules determine release impact; type names alone do not.

## 8 Conventional Commit Message Format

Use the following Conventional Commits structure unless the repository documents an accepted variation:

`<type>(<scope>): <description>`

Optional body:

Explain why the change is needed and any important design decisions.

Optional footer:

Include issue references and breaking-change declarations when applicable.

Example:

`feat(orders): add status validation`

Follow the repository's configured or documented style for language, casing, scope presence, imperative wording, subject length, punctuation, body/footer length, and blank lines. Do not assume universal limits such as a 50-character subject or a 72-character body; those are project conventions when configured.

If no style policy is discoverable, use a concise subject and the standard Conventional Commits structure. Do not invent mandatory limits.

Keep the description concise and precise.

Do not include claims that are unsupported by the diff.

If the repository provides commit-message validation, check proposed messages against the effective rules when required or practical; reuse already inspected configuration and avoid rerunning equivalent checks.

## 9 semantic-release Configuration

Use the release configuration already identified in the evidence ledger. If not yet resolved, inspect whether semantic-release or another release automation is configured and identify the effective analyzer/rules, versions, branches or tags, and release-note behavior as needed. Do not assume a tool or preset, or infer release behavior from changelog headings alone. The analyzer determines release impact; the notes generator determines presentation. Never assume a custom type affects releases without verifying effective rules. If release behavior is external or unresolved, state that limitation.

### 9.1 Release configuration takes precedence

Custom rules may alter defaults; changelog sections alone do not establish release impact. Apply the exact configured rule behavior already collected above, and mark any unresolved analyzer/version interaction as uncertain.

### 9.2 Breaking changes

Inspect the relevant diff and proposed message for intentional breaking changes; reuse the reviewed diff rather than rereading it.

A breaking change may use:

`feat(api)!: remove legacy endpoint`

It may also include a footer:

`BREAKING CHANGE: remove the legacy endpoint`

A breaking change must not be hidden by choosing a non-releasing type. Use the effective custom release rules and analyzer version to determine whether breaking-change metadata raises the release to MAJOR, is overridden by another custom rule, or is otherwise handled. A type rule returning PATCH or MINOR can affect classification depending on analyzer rule matching and version. Do not claim that a breaking change will produce MAJOR merely because the message contains `!` or a footer. If effective behavior cannot be established, report the intended breaking change and mark its release impact unresolved.

### 9.3 Release impact reporting

For each proposed commit, report:

- Commit type.
- Scope.
- Expected release effect from the configured analyzer, or `unknown`/`no release` with the supporting rule.
- The rule supporting that expectation.
- Any uncertainty caused by analyzer configuration or version.

Distinguish an analyzer's classification of an individual commit from whether the current release range produces a release. Do not promise that a commit will actually publish a release; that result may depend on release branches, previous tags, other commits in the release range, and the rest of the pipeline.

## 10 Architecture Review

Apply DDD, CQRS, or hexagonal guidance only when repository instructions or code establish it as relevant. Inspect changed components and the boundaries they touch, reusing the diff, evidence ledger, and check results; do not perform a repository-wide audit by default. Follow executable rules for dependency boundaries. Where relevant, inspect actual invariants, dependency direction, command/query side effects, adapters, and configured controller limits. Do not infer behavior from filenames or recommend a Port/interface refactor unless an actual boundary violation supports it. Do not claim architectural correctness from a successful lint run; report only inspected boundaries and executed rules.

## 11 Edge Cases

- Keep implementation and tests together when they serve one responsibility; split independent work. Preserve pre-staged work and staging choices.
- For reverts, use the format recognized by the configured preset/analyzer; a commit named `revert` does not automatically cancel a release.
- If release setup or commit policy is missing, report the uncertainty and make a clearly labeled best-effort proposal without promising a release or presenting assumptions as rules.
- Evaluate breaking changes against effective analyzer rules; `!` or a footer alone does not prove a MAJOR release.

## 12 Final Reporting

After the workflow and diff analysis, present a concise report. Avoid repeating the same evidence in multiple sections: state each check once, summarize repeated identical hook runs compactly (including how many times they ran), and separate configured policy from observed results.

### Quality checks

Report each requested or repository-required check once, its actual result, and skipped checks with reasons. Name only applicable tools. Distinguish manual runs from hooks/CI and state the covered scope when it affects confidence.

### Atomic commit proposals

For each proposed commit, include:

- Responsibility.
- Type and scope.
- Files or changes included.
- Complete commit message.
- Expected release effect.

If multiple responsibilities exist, propose separate commits.

### Architectural findings

Report verified violations and explain the affected boundary.

If no architectural violation was detected, say that no violation was detected by the executed checks; do not claim absolute proof of architectural correctness.

### Excluded changes

Identify unrelated modifications that are excluded from the proposal.

Preserve all user-owned changes and staging decisions.

### Unresolved issues

List failed validations, uncertain classifications, potential breaking changes, and configuration inconsistencies that require a decision.

Do not report success for checks that were not executed.

Do not execute a commit unless explicitly requested.

When a commit is explicitly authorized, preserve existing staged work and use only files/hunks within the authorized scope. Resolve ambiguity about grouping, scope, or message before changing the index. Do not stage broadly for convenience. Use the hook-aware validation rule in Section 4.3 to avoid duplicate pre-commit checks. After each commit, record its actual hash, message, included paths, and hook results. Verify final status after the authorized sequence, and sooner only if a hook, failure, or user change may have altered the tree. Never imply a commit succeeded before Git confirms it.

If the user asks only for analysis or proposals, do not stage or commit.
