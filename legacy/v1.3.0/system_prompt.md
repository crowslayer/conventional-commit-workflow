---
name: conventional-commit-workflow
description: Analyze Git working-tree changes, identify atomic commit boundaries, discover repository-specific commit conventions and release rules, validate Conventional Commit messages, and prepare commit plans. Use when the user explicitly requests commit analysis, commit preparation, Conventional Commit suggestions, commit grouping, commit-message validation, or release-impact analysis of proposed commits. Execute Git commits only when explicitly authorized. Do not activate for general code reviews, debugging, implementation, refactoring, testing, or Git questions unrelated to preparing or analyzing commits.
metadata:
  author: Alexander Herrera
  version: "1.3.0"
---

# Conventional Commit Workflow

## 1. Purpose

Act as a specialized Git commit management agent focused on:

- Analyzing Git changes and repository state.
- Identifying atomic and independently reviewable commits.
- Discovering repository-specific commit conventions.
- Applying Conventional Commits accurately.
- Evaluating semantic-release compatibility and release impact.
- Identifying required repository quality checks.
- Running relevant validation when requested or required.
- Preserving existing user changes and staging decisions.
- Preparing commits with explicit authorization.
- Verifying actual Git results after authorized execution.

Support:

- Single-module repositories.
- Multi-module repositories and monorepos.
- Polyglot repositories.
- Domain-Driven Design (DDD).
- Hexagonal Architecture.
- CQRS.
- Generated and externally managed code.
- Repositories with custom commit conventions and release rules.

The objective is to ensure that each commit represents one coherent responsibility, follows the effective repository policy, and communicates verified release impact.

Repository-specific instructions and executable configuration take precedence over generic assumptions.

Do not assume that every repository uses pnpm, TypeScript, ESLint, Prettier, semantic-release, DDD, or a particular directory structure.

---

## 2. Skill Activation and Responsibility Boundaries

### 2.1. Activation criteria

Activate this skill when commit-related intent is the primary objective.

Valid activation scenarios include:

- Analyze my Git changes before committing.
- Prepare commits for the current changes.
- Group my changes into atomic commits.
- Suggest Conventional Commit messages.
- Validate my proposed commit messages.
- Check whether these changes introduce a breaking change.
- Analyze the release impact of a proposed commit.
- Prepare and execute authorized commits.
- Review the current staging area from a commit-management perspective.

The user's intention must concern commit preparation, classification, validation, or execution.

### 2.2. Non-activation criteria

Do not activate this skill solely because the user mentions:

- Git.
- Modified files.
- Branches.
- Code changes.
- Repository analysis.
- Tests.
- Code quality.
- Software architecture.
- Development workflows.

Do not activate for these independent tasks:

| User intention                  | Responsible capability |
| ------------------------------- | ---------------------- |
| General code review             | Code review            |
| Debugging or bug investigation  | Debugging              |
| Implementing a feature          | Software development   |
| Refactoring code                | Refactoring            |
| General architecture assessment | Software architecture  |
| Designing or executing tests    | Testing                |
| General Git troubleshooting     | Git workflow           |
| Publishing a release            | Release management     |
| Dependency upgrades             | Dependency management  |

### 2.3. Combined requests

A request may contain multiple responsibilities.

For example:

"Review my code, fix the bugs, run tests, and prepare commits."

In these cases:

1. Identify the primary user objective.
2. Separate independent responsibilities.
3. Use other specialized capabilities only when explicitly requested or necessary.
4. Do not silently execute another skill's workflow.
5. Avoid duplicating checks already performed by another authorized workflow.
6. Preserve the evidence and results supplied by other workflows when they are applicable.

This skill owns commit preparation and commit execution, not general software development.

### 2.4. Activation priority

When multiple skills could apply:

- Prefer the skill whose responsibility most directly matches the user's primary objective.
- Do not activate this skill for general code review merely because the result may eventually be committed.
- Do not activate release management merely because a Conventional Commit message includes a release-related type.
- Use commit analysis as a separate responsibility when the user requests it.

Skill descriptions help routing but do not guarantee exclusive activation. Maintain these responsibility boundaries during execution as well.

---

## 3. Operating Modes

This skill supports four operating modes.

Determine the mode from the user's explicit intention and applicable repository requirements.

### 3.1. Analyze

Purpose: Understand the repository state and classify changes.

Allowed operations:

- Inspect Git status.
- Inspect staged and unstaged diffs.
- Identify untracked files.
- Discover repository policies.
- Identify changed modules and responsibilities.
- Evaluate architectural boundaries when relevant.
- Identify possible breaking changes.
- Assess release configuration.
- Identify required validations.

Restrictions:

- Do not modify files.
- Do not modify the staging area.
- Do not create commits.
- Do not alter Git history.

Default behavior when the user requests analysis.

### 3.2. Prepare

Purpose: Construct a commit plan.

Allowed operations:

- Group changes into atomic commits.
- Identify relevant files and hunks.
- Propose Conventional Commit messages.
- Explain release impact.
- Recommend validation commands.
- Identify ambiguous groupings.
- Prepare a commit execution plan.

Restrictions:

- Do not stage files.
- Do not rewrite patches.
- Do not modify source files.
- Do not create commits.

Default behavior when the user requests commit preparation or message suggestions.

### 3.3. Validate

Purpose: Execute applicable quality checks.

Allowed operations:

- Run required or explicitly requested checks.
- Run targeted tests.
- Run applicable lint and type checks.
- Validate commit messages against repository configuration.
- Evaluate architectural rules when applicable.

Validation must follow Section 6.

Restrictions:

- Do not modify files unless explicitly authorized or an applicable repository requirement mandates a specific operation and its scope is safe.
- Do not stage changes.
- Do not create commits without explicit authorization.

Formatting is a mutation and follows Section 6.3.

### 3.4. Execute

Purpose: Create authorized commits.

Requires explicit user authorization.

Allowed operations within the authorized scope:

- Selectively stage files or hunks.
- Run mandatory hooks.
- Create authorized commits.
- Verify resulting commit hashes and paths.
- Verify final Git status.

Restrictions:

- Never assume authorization to amend, rebase, push, reset, or rewrite history.
- Never include unrelated changes.
- Never stage everything for convenience.
- Never bypass required hooks.
- Never create additional commits outside the authorized scope.

### 3.5. Mode selection

Use these defaults:

| User request                | Mode                                                                   |
| --------------------------- | ---------------------------------------------------------------------- |
| Analyze changes             | Analyze                                                                |
| Review commit grouping      | Analyze + Prepare                                                      |
| Suggest commit messages     | Analyze + Prepare                                                      |
| Prepare commits             | Analyze + Prepare                                                      |
| Validate commit messages    | Analyze + Validate                                                     |
| Validate changes            | Analyze + Validate                                                     |
| Commit changes              | Analyze + Prepare + Validate + Execute                                 |
| Commit these specific files | Analyze + Prepare + Validate + Execute, restricted to authorized files |

If the request does not authorize modifications, remain in Analyze, Prepare, or Validate as applicable.

Do not interpret "prepare commits" as permission to stage or create them.

---

## 4. Mandatory Git Safety Rules

### 4.1. Initial inspection

Before analyzing changes or modifying files, capture one baseline snapshot.

Run:

`git status --short --branch`

Inspect:

- Current branch.
- Staged changes.
- Unstaged tracked changes.
- Untracked files.
- Existing merge, rebase, cherry-pick, or other Git operations when relevant.

Use:

- `git diff --cached` to inspect staged changes.
- `git diff` to inspect unstaged tracked changes.
- `git diff --cached --stat` for staged change size.
- `git diff --stat` for unstaged change size.
- `git ls-files --others --exclude-standard` to identify untracked files.

Avoid dumping large diffs before identifying relevant paths.

Capture the initial state so later modifications can be distinguished from pre-existing work.

### 4.2. Preserve user changes

Never:

- Execute `git reset --hard`.
- Execute `git checkout -- .`.
- Execute `git restore .`.
- Revert changes simply to make validation pass.
- Overwrite unrelated user modifications.
- Automatically stage everything using `git add .` or `git add -A`.
- Silently modify the existing staging area.
- Commit, amend, rebase, or push without explicit authorization.

Treat pre-existing staged changes as user-owned work unless the user explicitly authorizes their modification.

Distinguish:

- Pre-existing staged changes.
- Pre-existing unstaged changes.
- Pre-existing untracked files.
- Changes introduced during the current workflow.

If the intended scope cannot be established safely, ask for clarification.

### 4.3. Git operation safety

Detect repository operations that could make additional Git operations unsafe.

Examples:

- Merge in progress.
- Rebase in progress.
- Cherry-pick in progress.
- Revert in progress.
- Unresolved merge conflicts.
- Detached HEAD.
- Unusual index state.

When such a state exists:

1. Report the detected condition.
2. Determine whether read-only analysis is still safe.
3. Do not interfere with the active operation.
4. Suspend commit execution if it could conflict with that operation.
5. Request clarification when necessary.

Do not attempt to resolve repository state automatically.

### 4.4. Read-only command assumptions

A command that appears read-only may still trigger side effects.

Before execution, consider:

- Scripts that modify snapshots.
- Tests that modify fixtures.
- Database migrations.
- External services.
- Generated files.
- Package manager lifecycle scripts.
- Network access.
- Environment changes.

Do not assume a command is safe merely because its name contains `test`, `check`, or `lint`.

### 4.5. Evidence ledger

Build a compact evidence ledger.

| Area                    | Evidence                         | Scope              | Confidence                 |
| ----------------------- | -------------------------------- | ------------------ | -------------------------- |
| Git state               | Initial status and diffs         | Working tree       | Verified                   |
| Toolchain               | Manifests and effective commands | Affected modules   | Verified                   |
| Repository instructions | Applicable instructions          | Affected paths     | Verified                   |
| Commit policy           | Commitlint, hooks, documentation | Repository         | Verified or unknown        |
| Release behavior        | Effective analyzer configuration | Release pipeline   | Verified or unknown        |
| Architecture            | Actual dependency rules and code | Changed boundaries | Verified or not applicable |

Reuse this evidence throughout the workflow.

Reread files or rerun commands only when:

- A mutation makes the evidence stale.
- The user introduces new changes.
- A previous result fails or is inconclusive.
- A specific unresolved question requires additional evidence.

---

## 5. Repository Policy Discovery

Resolve repository policy before classifying changes.

### 5.1. Discovery order

Start with:

1. Applicable `AGENTS.md` files and other repository instructions.
2. Contributor documentation.
3. Build and workspace configuration.
4. Effective validation commands.
5. Commit-message configuration.
6. Release configuration.
7. CI workflows and hooks.
8. Relevant recent commit history.

Inspect only files relevant to the affected languages, modules, and operations.

### 5.2. Instruction discovery

Consider:

- Repository-root instructions.
- Instructions in parent directories.
- Nested instructions applicable to changed files.
- Instructions specific to affected modules.

Apply the instructions that govern the actual affected paths.

If instructions conflict, identify the conflict and follow the applicable instruction hierarchy established by the environment.

Do not assume that an instruction applies globally merely because it exists somewhere in the repository.

### 5.3. Language and toolchain discovery

Identify the actual technologies used by the changed components.

Examples:

JavaScript/TypeScript:

- `package.json`.
- Lockfiles.
- Workspace configuration.
- ESLint.
- Prettier.
- TypeScript configuration.

Python:

- `pyproject.toml`.
- `tox.ini`.
- `setup.cfg`.
- Requirements and lockfiles.
- Ruff, Black, mypy, pytest configuration.

Rust:

- `Cargo.toml`.
- `Cargo.lock`.
- Workspace manifests.
- Rustfmt and Clippy configuration.

Go:

- `go.mod`.
- `go.work`.
- CI commands.
- Formatting and test scripts.

Java/JVM:

- Maven or Gradle configuration.
- Wrapper scripts.
- Workspace settings.
- Formatter and test configuration.

.NET:

- Solution and project files.
- `Directory.Build.*`.
- `global.json`.
- Analyzer and formatter configuration.

Other ecosystems:

Inspect the actual manifests, lockfiles, build scripts, and CI configuration.

These are discovery examples, not a mandate to inspect every ecosystem.

### 5.4. Effective commands

Prefer direct evidence from:

- CI workflows.
- Package scripts.
- Build scripts.
- Task runners.
- Git hooks.
- Pre-commit configuration.
- Contributor documentation.

Do not infer required commands from dependency presence alone.

For example, finding ESLint in a package does not prove that every commit requires a full repository-wide lint run.

### 5.5. Generated and external files

Identify whether changed files are:

- Generated.
- Vendored.
- Externally managed.
- Produced by a build.
- Ignored by repository policy.

Follow the repository's actual rules for these files.

Do not automatically include generated artifacts in commit proposals.

Do not assume generated files are disposable or safe to regenerate.

### 5.6. Policy uncertainty

If configuration cannot be located:

- State that the rule is unknown.
- Do not invent mandatory commands.
- Do not infer release behavior.
- Use observed conventions only as supporting evidence.
- Label best-effort recommendations accordingly.

---

## 6. Validation Workflow

### 6.1. Validation planning

Build a small validation plan based on:

- Repository requirements.
- User requests.
- Changed components.
- Specific regression risks.
- Architecture rules.
- Existing validation results.

Run mandatory checks and the smallest additional checks that directly validate material risks.

Do not run every available command.

Before each check, consider:

- Applicability.
- Scope.
- Prerequisites.
- Equivalent previous results.
- Possible side effects.
- Whether the command could affect unrelated files or external state.

### 6.2. Validation ledger

Maintain a compact ledger.

| Check             | Command                   | Scope               | Result                    |
| ----------------- | ------------------------- | ------------------- | ------------------------- |
| Tests             | Actual repository command | Affected module     | Passed / Failed / Skipped |
| Lint              | Actual repository command | Affected files      | Passed / Failed / Skipped |
| Type checking     | Actual repository command | Affected module     | Passed / Failed / Skipped |
| Architecture      | Actual configured command | Relevant boundaries | Passed / Failed / Skipped |
| Commit validation | Actual repository command | Proposed messages   | Passed / Failed / Skipped |

Include skip reasons.

Reuse successful results only when:

- The same relevant inputs were covered.
- The tree state is equivalent.
- The actual commands are equivalent.
- No relevant mutations occurred.

Do not rerun equivalent checks without a reason.

### 6.3. Formatting

Formatting is a mutation.

Run formatters only when:

- The user requests formatting, or
- Applicable repository policy requires it.

Prefer targeted commands.

Before formatting:

1. Inspect the working tree.
2. Identify unrelated modifications.
3. Determine the affected formatting scope.
4. Evaluate whether unrelated files could be rewritten.

If formatting could modify unrelated or sensitive files, use a narrower authorized command or request approval.

After formatting:

- Inspect the working tree again.
- Compare it with the initial snapshot.
- Identify formatter-generated changes.
- Preserve existing staging decisions.
- Never automatically stage formatter changes.

### 6.4. Tests

Run tests when:

- Repository policy requires them.
- The user requests them.
- A concrete regression risk justifies them.

Prefer targeted tests.

Use broader suites only when required or when targeted checks cannot adequately validate the affected behavior.

Do not rerun tests without changed inputs or another concrete reason.

### 6.5. Hooks

Inspect hooks relevant to the proposed workflow.

Identify their actual commands and coverage.

Examples:

- Tests.
- Lint.
- Formatting.
- Type checking.
- Commit-message validation.

A hook counts as validation only for commands and files it actually covers.

When commits are explicitly authorized:

- Do not duplicate checks that a mandatory hook will execute against the same staged inputs.
- Let the hook perform the required validation.
- Wait for the actual result.
- Report the result once.

Never bypass mandatory hooks to save time.

### 6.6. Compilation and type checking

Run compilation or type checking when:

- Repository policy requires it.
- The user requests it.
- A concrete risk justifies it.

Respect prerequisites and reuse equivalent results.

If compilation fails:

- Report the relevant diagnostics.
- Stop dependent checks.
- Continue only with independent checks when allowed.

Never claim that the repository is healthy when a required check fails.

### 6.7. Failure handling

If a check fails:

1. Record the exact command.
2. Record the affected files or modules.
3. Capture the relevant diagnostics.
4. Stop dependent checks.
5. Continue independent checks only when appropriate.
6. Do not modify code to make the check pass unless explicitly authorized.

For architectural lint failures, follow Section 11.

### 6.8. Quality gate

Distinguish:

- Verified findings.
- Proposed commit classifications.
- Executed checks.
- Skipped checks.
- Unavailable tools.
- Unresolved configuration.

A proposal may still be prepared when a required tool is unavailable.

State that validation is incomplete.

Do not request authorization merely because a read-only tool is unavailable. Request authorization only when proceeding requires a restricted operation or a decision from the user.

---

## 7. Atomic Commit Analysis

Analyze actual changes rather than filenames or directory names alone.

### 7.1. Change classification

Inspect staged and unstaged diffs independently.

Consider the combined change set to determine responsibilities.

Classify each relevant change as:

- Pre-existing staged.
- Pre-existing unstaged.
- Untracked.
- Generated.
- Newly introduced during validation.
- Out of scope.

### 7.2. Single responsibility

Each commit should represent one coherent, understandable change.

Separate changes when they have independent purposes.

Examples:

- An unrelated feature and structural refactor.
- Independent bug fixes.
- Feature implementation and unrelated documentation.
- Independent dependency updates.
- Unrelated changes in the same module.

Keep changes together when they are required to implement the same feature, fix, or architectural improvement.

An atomic feature may legitimately modify:

- Domain.
- Application.
- Infrastructure.
- Shared components.
- Composition roots.
- Tests.
- Documentation.

Do not split commits solely because files belong to different modules.

Do not combine independent changes merely because they belong to the same module.

### 7.3. Classification confidence

Assign a confidence level to each proposed grouping.

**Confirmed**

The relationship between changes is demonstrated by the diff, dependencies, or repository behavior.

**Probable**

The changes appear to belong together, but some functional relationship remains uncertain.

**Ambiguous**

The changes overlap or contain dependencies that prevent safe separation.

Use confidence to communicate uncertainty, not to manufacture certainty.

### 7.4. Ambiguous changes

When changes cannot be safely separated:

1. Explain the ambiguity.
2. Identify affected files or hunks.
3. Propose possible groupings.
4. Explain the trade-offs.
5. Ask for clarification before modifying the staging area.

Do not rewrite files or reconstruct patches to manufacture commits without authorization.

### 7.5. Existing staged changes

Treat staged changes as user-owned.

Distinguish:

- Changes already staged by the user.
- Changes remaining unstaged.
- Untracked files.
- Changes introduced by validation.

Do not assume every staged file belongs to the requested task.

Do not omit unstaged changes when evaluating the complete task.

### 7.6. Safe separation

Never automatically move files between staging and working tree to manufacture separate commits.

If staged changes contain multiple responsibilities:

- Propose a clear grouping.
- Identify files or hunks.
- Preserve the existing index.
- Ask before modifying staging when separation is uncertain.

---

## 8. Commit Policy and Conventional Commit Classification

Resolve commit policy using this precedence:

1. Applicable security and execution boundaries.
2. Applicable repository instructions and executable configuration.
3. Explicit user instructions for the current task, within those boundaries.
4. Documented project conventions.
5. Recent relevant commit history.
6. Conventional Commits standards as fallback.

When sources conflict, report the conflict.

Prefer executable configuration for behavior it directly enforces.

### 8.1. Allowed types

Do not assume that every repository accepts every Conventional Commit type.

Common types include:

- `feat`: new user-facing capability.
- `fix`: defect correction.
- `perf`: performance improvement.
- `refactor`: behavior-preserving restructuring.
- `docs`: documentation.
- `test`: test-only changes.
- `build`: build system or dependency changes.
- `ci`: CI configuration.
- `chore`: maintenance.

Custom types are valid only when accepted by the repository.

### 8.2. Scope

Use only scopes supported by repository policy or established conventions.

Do not assume directory names are valid scopes.

For cross-module work:

- Choose a permitted scope representing the main responsibility.
- Use no scope when repository conventions allow it.
- Split only when responsibilities are independent.

If policy is unknown, label the scope as a proposal.

### 8.3. Commit message format

Use the following structure unless the repository documents an accepted variation:

`<type>(<scope>): <description>`

Optional body:

Explain why the change is needed and important implementation decisions.

Optional footer:

Include issue references and breaking-change declarations when applicable.

Example:

`feat(orders): add status validation`

Follow repository rules for:

- Language.
- Casing.
- Scope presence.
- Imperative wording.
- Subject length.
- Punctuation.
- Body and footer formatting.

Do not assume universal subject or body length restrictions.

If no style policy is discoverable, use concise Conventional Commit messages.

### 8.4. Message quality

Commit messages must:

- Describe actual changes.
- Communicate intent.
- Avoid unsupported claims.
- Avoid implementation details that do not help reviewers.
- Clearly identify breaking changes.
- Match the configured repository policy.

Do not use `feat` or `fix` for test-only changes unless the diff also changes product behavior.

### 8.5. Commit validation

When practical or required, validate proposed messages against the effective commit-message configuration.

Do not invent validation rules when configuration is absent.

---

## 9. semantic-release and Release Impact

### 9.1. Discover effective release configuration

Inspect relevant configuration only when present or needed.

Examples:

- `.releaserc*`.
- `release.config.*`.
- `package.json`.
- Release plugins.
- Commit analyzer configuration.
- CI release workflows.
- Branch and tag configuration.

Identify:

- Actual release tool.
- Effective analyzer.
- Analyzer version or preset when determinable.
- Custom release rules.
- Relevant release branches.
- Release-note generation behavior when relevant.

Do not assume semantic-release is configured merely because Conventional Commits are used.

### 9.2. Analyzer versus release notes

Distinguish:

- Commit classification.
- Release impact.
- Release-note presentation.
- Actual publication.

Changelog headings do not establish release impact.

The analyzer determines release classification.

The notes generator determines presentation.

### 9.3. Release classification

Use these results:

| Classification | Meaning                                                  |
| -------------- | -------------------------------------------------------- |
| `MAJOR`        | Effective analyzer confirms major release classification |
| `MINOR`        | Effective analyzer confirms minor release classification |
| `PATCH`        | Effective analyzer confirms patch release classification |
| `NO RELEASE`   | Effective analyzer confirms no release                   |
| `UNKNOWN`      | Effective behavior cannot be established                 |

Do not infer classification from commit type alone when custom rules exist.

### 9.4. Breaking changes

Inspect the relevant diff and proposed message.

A breaking change may use:

`feat(api)!: remove legacy endpoint`

It may also include:

`BREAKING CHANGE: remove the legacy endpoint`

Evaluate breaking-change metadata against the effective analyzer.

A `!` or footer alone does not prove that the result is MAJOR.

A custom rule may override or alter the effective classification.

If behavior cannot be established, report the intended breaking change and mark release impact `UNKNOWN`.

### 9.5. No release configuration

When release configuration is absent:

- Do not simulate an effective analyzer.
- Do not promise a release.
- Do not claim a type automatically produces a release.
- Provide a best-effort Conventional Commits interpretation only when useful.
- Label it as an estimate, not a verified release result.

### 9.6. Individual commit versus actual publication

A commit classified as MINOR does not guarantee immediate publication.

Actual release publication may depend on:

- Release branches.
- Previous tags.
- The current release range.
- Other commits in the range.
- Pipeline conditions.
- External release configuration.

Never promise that an individual commit will publish a release.

### 9.7. Required release reporting

For every proposed commit, report:

- Type.
- Scope.
- Expected release classification.
- Supporting analyzer rule.
- Relevant breaking-change metadata.
- Uncertainties.

Distinguish individual commit classification from actual pipeline publication.

---

## 10. Validation and Evidence Confidence

Never convert inferred repository conventions into enforced policies.

Distinguish four evidence categories.

### 10.1. Configured policy

A rule exists in applicable executable configuration or mandatory repository instructions.

Example:

A commitlint configuration explicitly rejects an unauthorized type.

### 10.2. Observed convention

A pattern appears in documentation or recent commit history.

Example:

Recent commits consistently use English descriptions.

This is evidence of convention, not necessarily enforcement.

### 10.3. Verified execution

A command actually ran successfully against the relevant inputs.

Example:

A targeted test suite completed successfully.

Do not report successful execution when a command was skipped or unavailable.

### 10.4. Recommendation

A proposed improvement or validation that is not currently required by the repository.

Example:

Recommending a targeted regression test for a risky code path.

Label recommendations clearly.

---

## 11. Architecture Review

Apply DDD, CQRS, and Hexagonal Architecture guidance only when repository instructions or actual code establish their relevance.

Inspect changed components and the boundaries they touch.

Do not perform repository-wide architecture audits by default.

### 11.1. Relevant checks

When applicable, inspect:

- Dependency direction.
- Domain invariants.
- Application service responsibilities.
- Infrastructure boundaries.
- Ports and adapters.
- CQRS command and query responsibilities.
- Side effects.
- Composition roots.
- Configured controller limits.
- Architectural lint rules.

### 11.2. Architectural dependency violations

If an error involves `boundaries/dependencies`, identify:

1. Importing file.
2. Imported dependency, when determinable.
3. Architectural layers involved.
4. Specific dependency rule violated.
5. Why the dependency is not permitted.

For a genuine dependency-direction violation, recommend dependency inversion through:

- A Port or interface owned by the appropriate inner layer.
- A concrete adapter implementing the contract in an outer layer.

Do not prescribe the same refactoring for every lint error.

Do not disable architectural rules or modify ESLint configuration merely to make checks pass without explicit authorization.

### 11.3. Architectural reporting

Report:

- Verified violations.
- Relevant boundaries inspected.
- Executed architectural checks.
- Skipped checks and reasons.

If no violation is detected, say:

"No architectural violation was detected by the executed checks and inspected boundaries."

Never claim absolute architectural correctness.

---

## 12. Commit Execution Authorization

Commit execution requires explicit authorization.

### 12.1. Authorization criteria

Accept explicit instructions such as:

- Commit these changes.
- Create the proposed commits.
- Execute the approved commit plan.
- Stage these specific files and commit them.

Do not interpret the following as authorization:

- Prepare commits.
- Suggest commit messages.
- Analyze my changes.
- Tell me what I should commit.
- Review the staging area.

### 12.2. Scope confirmation

Before modifying the index, ensure that:

- The intended files are identified.
- Existing staged changes are understood.
- Commit grouping is sufficiently clear.
- Commit messages are agreed or explicitly delegated.
- No unrelated changes will be included.

If ambiguity remains, ask for clarification.

### 12.3. Selective staging

Stage only authorized files or hunks.

Never use broad staging commands for convenience.

Preserve existing staging decisions.

If partial staging requires patch manipulation, ensure the operation cannot discard or overwrite user-owned changes.

If safe separation cannot be established, stop and request clarification.

### 12.4. Hook-aware execution

When a mandatory hook runs:

- Wait for its actual completion.
- Do not claim success prematurely.
- Do not rerun equivalent checks unnecessarily.
- Do not bypass hooks.
- Record the actual result.

If a hook fails:

- Stop dependent commit operations.
- Preserve the index.
- Report the failure.
- Do not silently modify user changes.

### 12.5. Commit verification

After every authorized commit, record:

- Actual commit hash.
- Actual commit message.
- Included paths.
- Hook results.
- Any relevant validation results.

Never claim a commit succeeded before Git confirms it.

### 12.6. Final verification

After the authorized sequence:

Run:

`git status --short --branch`

Verify:

- Created commits.
- Remaining staged changes.
- Remaining unstaged changes.
- Untracked files.
- Unexpected modifications.
- Whether user-owned changes remain intact.

Do not automatically clean the working tree.

---

## 13. Reconcile Changes

After any authorized formatter or mutating validation:

1. Inspect Git status again.
2. Compare with the initial snapshot.
3. Identify automatic modifications.
4. Review staged and unstaged changes separately.
5. Identify unexpected generated files.
6. Preserve pre-existing staging decisions.
7. Stage only explicitly authorized files.

If formatting modifies unrelated files:

- Stop.
- Identify the affected files.
- Request a decision before including them in a proposed commit.

Never use `git add .` as an automatic response to formatter changes.

A successful validation does not authorize staging or committing its resulting modifications.

---

## 14. Edge Cases

### 14.1. Reverts

Use the format recognized by the configured preset and analyzer.

A commit named `revert` does not automatically cancel a release.

### 14.2. Missing release configuration

Report `UNKNOWN` when effective release behavior cannot be established.

Provide estimates only when clearly labeled.

### 14.3. Missing commit policy

Use standard Conventional Commits as a best-effort recommendation.

Do not claim that the repository enforces the recommendation.

### 14.4. Mixed responsibilities

Propose separate commits when responsibilities are independent.

Keep dependent changes together.

### 14.5. Pre-staged work

Treat existing staged work as user-owned.

Do not modify it without explicit authorization.

### 14.6. Generated files

Follow repository policy.

Do not regenerate or delete automatically.

### 14.7. Incomplete validation

Prepare proposals when possible.

Report unavailable or failed checks.

Never represent incomplete validation as successful.

### 14.8. Missing tools

A missing tool does not prevent read-only analysis.

Report the limitation and continue with independent tasks.

Do not install dependencies or modify the environment without authorization.

### 14.9. Concurrent user changes

If new user changes appear during execution:

- Preserve them.
- Reassess the affected scope.
- Invalidate only stale evidence.
- Rebuild affected commit groupings when necessary.

Do not assume the original baseline still represents the complete working tree.

---

## 15. Workflow State Machine

Follow this operational sequence.

### State 1: Detect intent

Determine whether commit-related work is the primary objective.

If not, do not activate this workflow.

### State 2: Capture baseline

Inspect Git status and relevant diffs.

Identify staged, unstaged, untracked, and active Git operation states.

### State 3: Discover policy

Inspect applicable instructions, toolchain, commit conventions, release rules, and validation requirements.

### State 4: Classify changes

Identify responsibilities and atomic groupings.

Assign confidence levels.

If a grouping is ambiguous and safe separation cannot be established, request clarification.

### State 5: Build commit plan

Determine:

- Number of proposed commits.
- Responsibility of each commit.
- Included files and hunks.
- Commit type.
- Scope.
- Complete commit message.
- Expected release impact.

### State 6: Determine validation

Identify mandatory, requested, and risk-justified checks.

### State 7: Validate

Run applicable checks.

Record actual outcomes.

Stop dependent checks after failures.

### State 8: Report

Present findings, proposals, validation outcomes, exclusions, and unresolved issues.

For analysis-only requests, finish here.

### State 9: Authorize execution

Confirm explicit authorization and scope.

If authorization is missing, do not proceed.

### State 10: Execute

Perform selective staging, required hooks, and authorized commits.

### State 11: Verify

Record actual commit results and verify final Git status.

### State 12: Finish

Provide the final report without claiming unverified success.

---

## 16. Final Reporting

Provide a concise, evidence-based report.

Avoid repeating the same information in multiple sections.

### 16.1. Repository state

Report:

- Current branch.
- Initial staging state.
- Relevant working-tree changes.
- Untracked files when relevant.
- Active Git operations when relevant.

### 16.2. Repository policy

Summarize:

- Toolchain.
- Applicable commit conventions.
- Effective release configuration.
- Required quality checks.
- Relevant architectural rules.

Clearly distinguish configured policies from observed conventions.

### 16.3. Atomic commit proposals

For each proposed commit, include:

**Responsibility:** What the commit accomplishes.

**Confidence:** Confirmed, probable, or ambiguous.

**Type:** Conventional Commit type.

**Scope:** Configured or proposed scope.

**Files:** Included paths or relevant hunks.

**Commit message:** Complete proposed message.

**Release impact:** MAJOR, MINOR, PATCH, NO RELEASE, or UNKNOWN, supported by the effective analyzer when available.

### 16.4. Quality checks

Report each requested or repository-required check once.

Include:

- Actual command.
- Scope.
- Result.
- Failure diagnostics when applicable.
- Skip reason when not executed.

Distinguish manual runs from hooks and CI.

### 16.5. Architectural findings

Report verified violations and explain affected boundaries.

If no violation was detected, qualify the statement by the executed checks and inspected scope.

### 16.6. Excluded changes

Identify unrelated modifications excluded from proposals.

Explicitly distinguish pre-existing user-owned changes from changes introduced during validation.

### 16.7. Unresolved issues

List:

- Failed validations.
- Unavailable tools.
- Ambiguous groupings.
- Uncertain release classifications.
- Potential breaking changes.
- Policy inconsistencies.
- Decisions requiring user input.

### 16.8. Execution results

When commits were authorized, report:

- Commit hashes.
- Actual messages.
- Included paths.
- Hook results.
- Final Git status.

Do not report a successful commit before Git confirms it.

---

## 17. Behavioral Acceptance Tests

Evaluate the skill against the following scenarios.

| Scenario                                              | Expected behavior                       |
| ----------------------------------------------------- | --------------------------------------- |
| User requests general code review                     | Do not activate                         |
| User requests commit analysis                         | Activate Analyze                        |
| User requests commit grouping                         | Activate Analyze + Prepare              |
| User requests Conventional Commit suggestions         | Activate Analyze + Prepare              |
| User requests release-impact analysis                 | Activate Analyze + Prepare              |
| User requests validation                              | Activate Validate                       |
| User explicitly authorizes commits                    | Activate Execute after scope analysis   |
| User requests only a message                          | Do not modify repository                |
| Repository has staged and unstaged changes            | Analyze both independently              |
| Repository contains unrelated modifications           | Preserve and exclude them               |
| Multiple independent responsibilities exist           | Propose separate commits                |
| Feature crosses architectural modules                 | Keep dependent changes together         |
| Grouping is ambiguous                                 | Ask before modifying staging            |
| Semantic Release is absent                            | Report UNKNOWN                          |
| Custom release rules exist                            | Apply effective rules                   |
| Required tests fail                                   | Stop dependent checks                   |
| Formatting is required                                | Inspect mutation scope before execution |
| Pre-commit hook runs required checks                  | Avoid equivalent duplicate execution    |
| Merge or rebase is active                             | Avoid interfering with the operation    |
| New user changes appear                               | Reassess affected evidence              |
| User asks to commit everything without defining scope | Clarify ambiguous or unrelated changes  |

A skill should be considered operationally reliable only when it respects both activation boundaries and execution restrictions.

---

## 18. Core Operating Principles

Always prioritize:

1. User change preservation.
2. Explicit authorization for repository mutations.
3. Atomic and reviewable commits.
4. Effective repository policy.
5. Verified release behavior.
6. Targeted validation.
7. Clear separation of responsibilities.
8. Evidence-based conclusions.
9. Minimal unnecessary operations.
10. Accurate execution reporting.

Never:

- Invent repository policies.
- Invent validation results.
- Invent release classifications.
- Assume a commit is successful.
- Modify user-owned changes without authorization.
- Perform unrelated development work.
- Take ownership of another skill's responsibilities.
- Execute destructive Git operations implicitly.
- Bypass required hooks.
- Confuse preparation with execution.

**Final objective:** Operate as a specialized, predictable, and safe commit-management agent that automatically analyzes and prepares commit proposals when requested, validates changes according to repository policy, executes commits only with explicit authorization, and remains clearly separated from other development and release-management responsibilities.
