# Conventional Commit Workflow

An agent skill for analyzing Git changes, proposing atomic commits, validating Conventional Commit messages, and
evaluating release impact using each repository's actual conventions and configuration.

## Features

- **Git change analysis:** Inspects staged, unstaged, and untracked changes while preserving existing user work and
  staging decisions.
- **Atomic commit proposals:** Groups related changes into coherent, independently reviewable commits.
- **Repository-aware conventions:** Discovers accepted commit types, scopes, message formats, validation rules, and
  repository-specific instructions.
- **Release impact analysis:** Evaluates PATCH, MINOR, MAJOR, NO RELEASE, or UNKNOWN outcomes using the effective
  release configuration.
- **Breaking change detection:** Identifies potentially breaking changes and evaluates them against the configured
  release analyzer.
- **Targeted validation:** Identifies and executes applicable tests, linting, type checking, and architectural checks
  when required or requested.
- **Architecture awareness:** Considers DDD, Hexagonal Architecture, and CQRS when established by the repository.
- **Polyglot and monorepo support:** Relates changes and validation requirements to affected components, regardless of
  language or module structure.
- **Execution safety:** Separates analysis, preparation, validation, and commit execution, requiring explicit
  authorization before modifying the Git index or creating commits.
- **Evidence-based reporting:** Distinguishes configured policies, observed conventions, executed checks,
  recommendations, and unresolved uncertainties.

## How it works

The skill follows a structured workflow:

1. **Detect intent:** Determines whether the request concerns commit analysis, preparation, validation, or execution.
2. **Inspect Git state:** Captures the initial repository status and examines staged, unstaged, and untracked changes.
3. **Discover repository policies:** Identifies applicable instructions, toolchains, commit conventions, validation
   requirements, and release configuration.
4. **Classify changes:** Identifies independent responsibilities and groups related modifications into atomic commit
   proposals.
5. **Prepare messages:** Generates Conventional Commit messages consistent with the repository's actual conventions.
6. **Evaluate release impact:** Applies the effective release analyzer when available and identifies breaking changes
   and uncertainties.
7. **Validate:** Runs only the required or justified checks and reports their actual results.
8. **Execute when authorized:** Stages explicitly authorized changes, respects mandatory hooks, creates commits, and
   verifies their results.

## Operating modes

The skill supports four operating modes:

| Mode     | Responsibility                                              |
| -------- | ----------------------------------------------------------- |
| Analyze  | Inspect Git state, discover policies, and classify changes. |
| Prepare  | Group changes and propose atomic commits and messages.      |
| Validate | Execute applicable quality checks and message validation.   |
| Execute  | Stage authorized changes and create commits.                |

Analysis and preparation do not modify the repository. Validation is subject to the safety restrictions documented in
`SKILL.md`.

Commit execution always requires explicit user authorization.

## Repository compatibility

The skill does not assume a particular language, package manager, architecture, directory layout, or release tool.

It discovers the effective repository configuration using relevant manifests, scripts, documentation, CI workflows,
hooks, and release configuration.

Examples include:

- **JavaScript / TypeScript:** `package.json`, lockfiles, workspace configuration, ESLint, Prettier, and TypeScript
  configuration.
- **Python:** `pyproject.toml`, `tox.ini`, Ruff, Black, mypy, and pytest configuration.
- **Rust:** `Cargo.toml`, `Cargo.lock`, workspace manifests, rustfmt, and Clippy.
- **Go:** `go.mod`, `go.work`, and repository validation scripts.
- **Java / JVM:** Maven and Gradle configuration.
- **.NET:** `.sln`, `.csproj`, `Directory.Build.*`, and `global.json`.

These are discovery examples, not mandatory dependencies.

The skill supports polyglot repositories and monorepos by identifying the components affected by each change and
applying only the relevant validation requirements.

## Release compatibility

Release impact is determined by the repository's effective release configuration, not merely by the Conventional Commit
type.

When semantic-release or another release analyzer is configured, the skill evaluates its actual rules, including custom
release rules and breaking-change handling.

Possible classifications:

- `MAJOR`
- `MINOR`
- `PATCH`
- `NO RELEASE`
- `UNKNOWN`

When release configuration is absent or incomplete, the skill reports uncertainty instead of promising a release.

Individual commit classification is distinguished from actual release publication, which may depend on branches, tags,
release ranges, and CI conditions.

## Safety principles

The skill is designed to preserve user control over Git operations.

It never:

- Executes destructive Git operations implicitly.
- Discards or overwrites existing user changes.
- Automatically stages all repository modifications.
- Modifies existing staging decisions without authorization.
- Creates commits without explicit authorization.
- Amends, rebases, or pushes without explicit authorization.
- Bypasses mandatory repository hooks.
- Claims that skipped or unavailable checks passed.

Existing staged changes are treated as user-owned work.

Ambiguous commit groupings are reported before modifying the staging area.

## Installation

Install the skill using the directory name `conventional-commit-workflow` in a skills location supported by your agent.

Expected structure:

```text
<skills-directory>/
└── conventional-commit-workflow/
    ├── SKILL.md
    ├── README.md
    ├── CHANGELOG.md
    └── LICENSE
```

Keep `SKILL.md` at the root of the skill directory.

Restart or refresh the agent if it does not discover newly installed skills.

Refer to your agent's documentation for supported skill installation locations and invocation syntax.

## Usage

Examples of supported requests:

**Analyze changes**

```text
Analyze my current Git changes and identify independent responsibilities.
```

**Prepare atomic commits**

```text
Group my changes into atomic Conventional Commits.
```

**Generate commit messages**

```text
Suggest Conventional Commit messages based on the repository conventions.
```

**Evaluate release impact**

```text
Analyze the release impact of these changes, including potential breaking changes.
```

**Validate changes**

```text
Identify and run the required validation checks for my proposed commits.
```

**Execute authorized commits**

```text
Execute the approved commit plan using only the files we identified.
```

The skill will inspect repository instructions and configuration before making recommendations.

Requests to prepare commits or suggest messages do not authorize staging or commit creation.

## Project structure

```text
conventional-commit-workflow/
├── SKILL.md
├── README.md
├── CHANGELOG.md
└── LICENSE
```

- `SKILL.md` — Complete agent instructions, operating modes, safety rules, validation workflow, and reporting
  requirements.
- `README.md` — Overview, features, installation, compatibility, and usage.
- `CHANGELOG.md` — Version history and notable changes.
- `LICENSE` — MIT License.

## Version

**Current version:** 1.3.0

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT. See [LICENSE](LICENSE).
