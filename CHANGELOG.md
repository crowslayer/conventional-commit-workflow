# Changelog

All notable changes to Conventional Commit Workflow are documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [2.0.0] - 2026-11-13

### 🚨 Major Architectural Overhaul

This release marks a fundamental shift from a simple text-based prompt skill to a **comprehensive AI Agent Ecosystem**.
It introduces standardized tooling, automated behavioral testing, and strict execution boundaries, making it
production-ready for enterprise and multi-agent environments.

### Added

- **MCP Server Implementation:** Added a fully functional Model Context Protocol (MCP) server (`mcp_server/`) to expose
  Git operations and commit analysis as standardized tools for modern AI frameworks (Claude Desktop, Cursor, custom
  agents).
- **Automated Eval Suite:** Introduced a behavioral testing framework (`tests/`) with scenarios for read-only
  enforcement, dangerous state prevention, atomic splitting, and explicit authorization checks.
- **CI/CD Pipeline:** Added GitHub Actions workflow (`.github/workflows/eval.yml`) to automatically validate prompt
  structure and run behavioral tests on every push and PR.
- **Structured Output Schema:** Enforced a strict JSON schema for all agent reports, enabling machine-parseable outputs
  for downstream automation and UI rendering.
- **Explicit Tool Definitions:** Added a dedicated section in the system prompt defining allowed tools, their mutation
  risks, and mode-specific restrictions.
- **Launch Documentation:** Added comprehensive guides, architecture deep-dives, and community launch templates
  (`docs/launch/`).

### Changed

- **Prompt Restructuring:** Consolidated all negative constraints into a single, highly visible "Absolute Prohibitions"
  section to improve LLM adherence and reduce token fragmentation.
- **Architecture Review Bounds:** Restricted architectural violation reporting _strictly_ to static analysis tool
  outputs (e.g., ArchUnit, ESLint boundaries). The agent will no longer infer DDD/CQRS violations by reading code alone,
  eliminating hallucinations.
- **Mode Enforcement:** Strengthened the boundaries between `Analyze`, `Prepare`, `Validate`, and `Execute` modes to
  prevent accidental mutations during read-only requests.
- **Repository Policy Discovery:** Enhanced the discovery protocol to prioritize executable configuration (CI scripts,
  hooks) over inferred conventions.

### Deprecated

- The original flat-file v1.3.0 prompt structure has been moved to the `legacy/v1.3.0/` directory. It is preserved for
  users who prefer a simple copy-paste approach without the MCP ecosystem, but it will no longer receive feature
  updates.

### Security & Safety

- Reinforced the "Graceful Degradation" protocol: if a validation tool fails due to environment issues, the agent will
  report the error and halt dependent checks without attempting unauthorized environment modifications.
- Added explicit safeguards against concurrent user changes during agent execution.

---

## [1.3.0] - 2026-11-12

### Added

- Explicit skill activation criteria to distinguish commit-management tasks from general code review, debugging,
  refactoring, testing, and release management.
- Four operating modes: Analyze, Prepare, Validate, and Execute.
- A structured workflow state machine defining the expected execution sequence.
- Evidence confidence classifications for atomic commit proposals: Confirmed, Probable, and Ambiguous.
- Explicit evidence categories distinguishing configured policies, observed conventions, verified execution, and
  recommendations.
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
