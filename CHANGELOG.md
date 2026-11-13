## [2.3.0](https://github.com/crowslayer/conventional-commit-workflow/compare/v2.2.0...v2.3.0) (2026-11-13)

### Features

- Update pnpm installation in GitHub Actions workflow
  ([452c798](https://github.com/crowslayer/conventional-commit-workflow/commit/452c7986d516d1a82b82ca5b4a4a4be1346e52f9))
- Update semantic release configuration and add pnpm support
  ([8dbe01d](https://github.com/crowslayer/conventional-commit-workflow/commit/8dbe01d0a41185897ec5f12fc983045d1b6b65a5))

# Changelog

All notable changes to Conventional Commit Workflow are documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [2.2.0] - 2026-11-13

### Added

- **`analyze_commit_groupings` tool**: Deterministic commit grouping engine that analyzes Git changes and proposes structured commit groups based on
  module boundaries, file relationships, and change types.
- **Monorepo detection**: Automatic detection of pnpm workspaces, npm workspaces, Lerna, Nx, Turborepo, Rush, and directory-based monorepos.
- **File classification engine**: Categorizes files as source/test/doc/config/generated/asset with high accuracy.
- **Test-source pairing**: Automatically associates test files with their corresponding source files.
- **Inter-group dependency detection**: Analyzes imports between changed files to identify commit ordering requirements.
- **Commit metadata suggestions**: Suggests type and scope based on file categories and module structure.
- **Multi-language support**: Import detection works for JavaScript/TypeScript, Python, Java, and more.

### Changed

- **Token efficiency**: LLM now validates 3-5 deterministic groups instead of analyzing 50+ files directly (~70% token savings).
- **Workflow integration**: Added Section 5 to system_prompt.md documenting the new grouping tool workflow.

### Security & Safety

- **Buffer-safe file reading**: All file operations use safe wrappers with error handling.
- **Graceful degradation**: Returns partial results if some files cannot be read.

## [2.1.0] - 2026-11-13

### ✨ Added

- **5 new MCP tools** for deep repository introspection:
  - `get_repository_context`: Comprehensive toolchain, structure, and configuration discovery
  - `get_commit_config`: Commitlint rules, commitizen config, and observed conventions from history
  - `get_release_config`: semantic-release configuration, analyzer rules, and custom release rules
  - `list_git_hooks`: Active Git hooks detection (Husky, Lefthook, pre-commit, native)
  - `validate_commit_message`: Validates messages against conventional format and repository rules
- **Enhanced `git_log` tool**: Now parses conventional commit format and extracts type/scope/breaking info
- **Enhanced `git_status` tool**: Detects active operations (merge, rebase, cherry-pick, revert, bisect)
- **Enhanced `git_diff` tool**: Added path filtering and stat-only mode
- **Tool preference hierarchy**: Clear guidance on which tool to use when multiple options exist

### 🔄 Changed

- **MCP server architecture**: Refactored to a "tool facilitator" model - the MCP server provides robust tools, the LLM performs the reasoning
- **Safe execution wrapper**: All shell commands now use `safeExec` with proper error handling and output capture
- **Improved error reporting**: Tools return structured errors instead of throwing exceptions

### 🛡️ Security & Safety

- **Buffer limits**: Added 10MB max buffer to shell commands to prevent memory exhaustion
- **Path validation**: File operations validate paths before execution
- **Graceful degradation**: Tools return partial results instead of failing completely when optional data is unavailable

## [2.0.0] - 2026-11-13

### 🚨 Major Architectural Overhaul

This release marks a fundamental shift from a simple text-based prompt skill to a **comprehensive AI Agent Ecosystem**. It introduces standardized
tooling, automated behavioral testing, and strict execution boundaries, making it production-ready for enterprise and multi-agent environments.

### Added

- **MCP Server Implementation:** Added a fully functional Model Context Protocol (MCP) server (`mcp_server/`) to expose Git operations and commit
  analysis as standardized tools for modern AI frameworks (Claude Desktop, Cursor, custom agents).
- **Automated Eval Suite:** Introduced a behavioral testing framework (`tests/`) with scenarios for read-only enforcement, dangerous state prevention,
  atomic splitting, and explicit authorization checks.
- **CI/CD Pipeline:** Added GitHub Actions workflow (`.github/workflows/eval.yml`) to automatically validate prompt structure and run behavioral tests
  on every push and PR.
- **Structured Output Schema:** Enforced a strict JSON schema for all agent reports, enabling machine-parseable outputs for downstream automation and
  UI rendering.
- **Explicit Tool Definitions:** Added a dedicated section in the system prompt defining allowed tools, their mutation risks, and mode-specific
  restrictions.
- **Launch Documentation:** Added comprehensive guides, architecture deep-dives, and community launch templates (`docs/launch/`).

### Changed

- **Prompt Restructuring:** Consolidated all negative constraints into a single, highly visible "Absolute Prohibitions" section to improve LLM
  adherence and reduce token fragmentation.
- **Architecture Review Bounds:** Restricted architectural violation reporting _strictly_ to static analysis tool outputs (e.g., ArchUnit, ESLint
  boundaries). The agent will no longer infer DDD/CQRS violations by reading code alone, eliminating hallucinations.
- **Mode Enforcement:** Strengthened the boundaries between `Analyze`, `Prepare`, `Validate`, and `Execute` modes to prevent accidental mutations
  during read-only requests.
- **Repository Policy Discovery:** Enhanced the discovery protocol to prioritize executable configuration (CI scripts, hooks) over inferred
  conventions.

### Deprecated

- The original flat-file v1.3.0 prompt structure has been moved to the `legacy/v1.3.0/` directory. It is preserved for users who prefer a simple
  copy-paste approach without the MCP ecosystem, but it will no longer receive feature updates.

### Security & Safety

- Reinforced the "Graceful Degradation" protocol: if a validation tool fails due to environment issues, the agent will report the error and halt
  dependent checks without attempting unauthorized environment modifications.
- Added explicit safeguards against concurrent user changes during agent execution.

---

## [1.3.0] - 2026-11-12

### Added

- Explicit skill activation criteria to distinguish commit-management tasks from general code review, debugging, refactoring, testing, and release
  management.
- Four operating modes: Analyze, Prepare, Validate, and Execute.
- A structured workflow state machine defining the expected execution sequence.
- Evidence confidence classifications for atomic commit proposals: Confirmed, Probable, and Ambiguous.
- Explicit evidence categories distinguishing configured policies, observed conventions, verified execution, and recommendations.
- Git operation-state awareness for merge, rebase, cherry-pick, revert, and unresolved conflict situations.
- Guidance for generated, vendored, and externally managed files.
- Handling of concurrent user changes during workflow execution.
- Behavioral acceptance scenarios covering activation boundaries, authorization, validation, and Git safety.
- More explicit reporting requirements for release classifications and execution results.

### Changed

- Improved skill activation boundaries to reduce accidental activation during unrelated development tasks.
- Separated commit analysis, preparation, validation, and execution into distinct operating modes.
- Clarified that preparing commits does not authorize staging or creating commits.
- Strengthened selective staging requirements and preservation of pre-existing user changes.
- Improved repository policy discovery for polyglot projects and monorepos.
- Refined validation planning to avoid unnecessary commands and duplicate checks.
- Improved hook-aware validation to prevent repeating checks already performed by mandatory hooks.
- Clarified formatting as a repository mutation requiring scope assessment.
- Improved release analysis to distinguish individual commit classification from actual release publication.
- Strengthened handling of custom release rules and breaking-change metadata.
- Improved architecture review guidance for DDD, Hexagonal Architecture, and CQRS.
- Expanded final reporting to distinguish verified findings, skipped checks, unresolved issues, and execution results.
- Improved documentation of missing tools and incomplete validation.

### Security and Safety

- Reinforced explicit authorization requirements before modifying the Git index or creating commits.
- Clarified restrictions on destructive Git operations and history modification.
- Strengthened protection of pre-existing staged and unstaged changes.
- Added safeguards for active Git operations and ambiguous commit boundaries.
- Explicitly prohibited automatic staging of unrelated changes.
- Reinforced the requirement to preserve mandatory repository hooks.

### Documentation

- Added dedicated installation and usage instructions.
- Documented supported operating modes.
- Expanded compatibility information for polyglot repositories.
- Added examples of common user requests.
- Introduced this changelog.

## [1.2.0]

### Added

- Repository-aware Conventional Commit analysis.
- Atomic commit grouping and message proposals.
- Repository-specific commit policy discovery.
- semantic-release configuration analysis.
- Breaking-change evaluation.
- Targeted validation workflow.
- Architecture review when applicable.
- Support for monorepos and multiple language ecosystems.
- Git safety rules preserving existing changes and staging decisions.
- Commit execution requiring explicit authorization.
- Evidence-based reporting of validation and release impact.

### Changed

- Improved commit classification using actual repository conventions.
- Distinguished configured release behavior from assumptions based on Conventional Commit types.
- Improved handling of staged, unstaged, and untracked changes.
- Refined validation and architectural review requirements.

---

[1.3.0]: https://github.com/crowslayer/conventional-commit-workflow/releases/tag/v1.3.0
[1.2.0]: https://github.com/crowslayer/conventional-commit-workflow/releases/tag/v1.2.0
