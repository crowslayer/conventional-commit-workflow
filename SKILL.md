---
name: conventional-commit-workflow
description: Analyze Git changes, discover repository commit and release policies, group changes into atomic commits, and propose Conventional Commit messages. Use when reviewing changes, preparing commits, or checking their release impact.
metadata:
  author: Alexander Herrera
  version: "1.0.0"
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

Before modifying files or proposing commits, inspect the repository.

### 2.1 Initial inspection

Run:

`git status --short --branch`

Inspect the current branch, working tree, staged changes, unstaged changes, and relevant untracked files.

Use:

- `git diff --cached` to inspect staged changes.
- `git diff` to inspect unstaged tracked changes.
- `git diff --cached --stat` and `git diff --stat` to understand the overall change size.
- `git ls-files --others --exclude-standard` to identify untracked files when necessary.

Read applicable repository instructions, including `AGENTS.md`, architecture manuals, and commit conventions.

Identify the repository's language(s), build and workspace tools, quality checks, commit policy, and release configuration from repository evidence. The files named in this skill are examples, not a required checklist; inspect only those relevant to the repository.

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

Before analyzing commit semantics, identify the actual repository policy.

Inspect applicable sources, when available. Start with repository instructions and contributor documentation, then inspect executable configuration and CI workflows. Examples include:

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

These examples are discovery hints, not a mandate to inspect every file or install/run every named tool. Follow the repository's actual languages and toolchain, including polyglot and generated-code areas. Do not infer a command from a manifest alone when its documented or CI invocation differs. Do not invent rules that are not documented or configured.

If the repository has an explicit list of authorized commit types, scopes, or title-length limits, follow that policy.

If a required configuration cannot be located, state the uncertainty instead of claiming that the repository enforces a particular rule.

## 4 Repository-Required Quality Workflow

Run only checks required by repository instructions, CI, or the user. Discover exact commands from contributor documentation, build/task files, scripts, and CI; do not assume a package manager or language-specific tool. Use the repository's declared toolchain and version where practical. Respect dependencies between checks and stop a dependent sequence when an earlier check fails. Report the exact commands run, results, skipped checks, and reasons. Do not run checks solely because this skill lists them.

For monorepos or polyglot repositories, determine which components the diff touches and run only the applicable required checks, plus repository-wide checks when policy requires them. Account for generated, vendored, or externally managed files according to repository policy. If command scope or prerequisites are unclear, do not guess at a potentially broad or mutating command; report the uncertainty and continue with independent read-only analysis.

### 4.1 Formatting

Formatting is a mutation. Run a formatter only when requested or required by repository policy. Prefer the repository's targeted formatter command for files in scope. Run a repository-wide formatter only when policy requires it and the full affected scope is safe to rewrite.

Before running a repository-wide formatter, inspect the working tree and consider whether unrelated user modifications could be rewritten.

If formatting could modify unrelated or sensitive files, use a narrower authorized command or request approval.

After formatting, inspect the changes to distinguish formatter-generated modifications from pre-existing work.

Do not automatically stage formatter changes.

### 4.2 Lint and architectural validation

Run the repository's required lint command, if any.

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

### 4.3 Compilation and type checking

Run the repository's required compilation or type-check command, if any, after its prerequisites succeed.

If compilation fails, stop and report the relevant diagnostics.

Do not claim that the repository is healthy when a required check fails.

Do not claim that a command passed if it was skipped or could not run.

### 4.4 Reconcile changes

After the requested or required quality checks complete:

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

### 4.5 Quality gate

When the repository requires quality checks, distinguish verified findings from proposed commit classification. Do not claim checks passed when they failed, were skipped, or could not run. A proposal may still be prepared when a required tool is unavailable, but state that validation is incomplete and identify the unavailable check. Ask for authorization only when continuing requires modifying files, staging changes, or bypassing an explicit repository requirement; lack of a tool alone does not prevent read-only diff analysis.

## 5 Atomic Commit Analysis

Analyze the actual changes, not merely filenames or directory names.

Inspect staged and unstaged diffs independently, then consider the overall change set to determine the underlying responsibilities.

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

Build a short policy profile from repository evidence before classifying changes:

- Allowed types and scopes: commitlint configuration, hooks, documented conventions, and recent relevant commits.
- Subject style and limits: commitlint rules and repository documentation.
- Release behavior: semantic-release configuration, analyzer and preset versions, custom `releaseRules`, branches, and release-note plugins.
- Quality commands and architecture: project instructions, package scripts, CI, and executable lint rules.

Apply this precedence: explicit user instruction for this task; applicable repository instructions and executable configuration; documented project conventions; recent history as supporting evidence; this skill's examples as fallback only. If sources conflict, report the conflict and prefer executable configuration for behavior it directly enforces.

Do not assume directory names are valid scopes or that `infra`, `app`, and `domain` are commit types accepted by a target repository. Use a type or scope only when policy allows it, or label it as a proposal requiring confirmation when policy is unknown. For cross-module work, choose a permitted scope that reflects the main responsibility; split only when responsibilities are independent.

## 7 Commit Type Semantics

Use Conventional Commit semantics to describe intent: `feat` for a user-facing capability, `fix` for a defect correction, `perf` for a performance improvement, and `refactor` for behavior-preserving restructuring. Types such as `docs`, `test`, `build`, `ci`, and `chore` describe common maintenance areas. Custom types are valid only when the repository accepts them. A repository's configured release rules determine release impact; type names alone do not.

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

If the repository provides a commitlint configuration, validate the message against that configuration as well.

## 9 semantic-release Configuration

Inspect whether semantic-release or another release automation is configured and identify its effective commit analyzer/rules, versions, branches or tags, and release-note behavior where available. Do not assume semantic-release or a particular preset is present. Do not infer release behavior from changelog sections alone. The analyzer determines release impact; the release-notes generator determines how commits are presented. A type not matched by custom rules may receive no release under that tool's defaults. Never assume custom types such as `infra`, `app`, or `domain` affect releases without verifying effective rules. If release behavior is handled outside the repository or cannot be resolved from available configuration, state that limitation.

### 9.1 Release configuration takes precedence

Inspect the real semantic-release configuration before claiming a release result. Custom rules may alter default behavior; changelog sections alone do not establish release impact.

### 9.2 Breaking changes

Inspect commit messages and diffs for intentional breaking changes.

A breaking change may use:

`feat(api)!: remove legacy endpoint`

It may also include a footer:

`BREAKING CHANGE: remove the legacy endpoint`

A breaking change must not be hidden by choosing a non-releasing type. Inspect the effective custom release rules and analyzer version to determine whether breaking-change metadata raises the release to MAJOR, is overridden by a lower custom rule, or is otherwise handled. A type rule returning PATCH or MINOR can affect classification depending on analyzer rule matching and version. Do not claim that a breaking change will produce MAJOR merely because the message contains `!` or a footer. If effective behavior cannot be established, report the intended breaking change and mark its release impact unresolved.

### 9.3 Release impact reporting

For each proposed commit, report:

- Commit type.
- Scope.
- Expected release effect.
- The rule supporting that expectation.
- Any uncertainty caused by analyzer configuration or version.

Do not promise that a commit will actually publish a release. The final result may also depend on release branches, previous tags, other commits in the release range, and the rest of the pipeline.

## 10 Architecture and DDD Review

Use executable repository rules as the authoritative source for enforced dependency boundaries. Apply DDD, CQRS, and hexagonal architecture guidance only when repository code and instructions establish those patterns as relevant.

The architecture review should focus on actual evidence.

### 10.1 Domain

Inspect domain entities, value objects, aggregates, factories, domain services, and business invariants.

Respect the project's restrictions on direct time access, aggregate construction, and property setters.

Do not recommend changing a domain factory or disabling a rule simply to suppress an ESLint error.

### 10.2 Application

Inspect use cases, application services, command handlers, and query handlers.

Verify that dependencies and responsibilities match the configured architecture.

### 10.3 Infrastructure

Inspect persistence, external integrations, adapters, and other infrastructure concerns.

When the architecture requires inversion of dependencies, recommend a Port or interface in the appropriate inner layer and an adapter in the appropriate outer layer.

### 10.4 CQRS

Pay attention to command/query separation.

Where repository policy defines CQRS, verify query handlers against its read-only and import rules.

Do not assume that every query handler is read-only merely because of its filename. Validate the actual implementation and lint results.

### 10.5 Controllers

Respect configured limits for function length, complexity, and parameter count.

Recommend extracting responsibilities or delegating work to application services when a controller violates those constraints.

### 10.6 Limits of architectural claims

Do not claim that all architectural properties are verified merely because ESLint succeeds.

Report only the boundaries and rules actually checked, along with any additional issues established through code inspection.

## 11 Edge Cases

- **Mixed responsibilities:** group independent changes separately, but keep implementation and tests together when they serve one responsibility.
- **Pre-staged work:** treat it as user-owned; do not silently restage, unstage, or include it in a proposal.
- **Breaking changes:** inspect the effective analyzer rules and version. The `!` marker or `BREAKING CHANGE` footer alone is not proof of a MAJOR release when custom rules may alter classification.
- **Reverts:** inspect the revert format recognized by the configured preset and analyzer; do not assume every commit named `revert` cancels a prior release.
- **Missing release setup:** report commit semantics without promising a release. If configuration is partial, identify exactly what remains unknown.
- **Unknown policy:** make a clearly labeled best-effort proposal based on Conventional Commits and relevant history; do not present guesses as enforced rules.

## 12 Final Reporting

After the workflow and diff analysis, present a concise report.

### Quality checks

Report each requested or repository-required check, its actual result, and skipped checks with reasons. Name only the tools that apply to the repository.

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

If the user asks to commit, confirm the exact files and commit messages when the staging scope or intent remains ambiguous.
