# Changelog

All notable changes to Conventional Commit Workflow are documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [1.3.0] - 2026-11-12

### Added

- Explicit skill activation criteria to distinguish commit-management tasks from general code review, debugging, refactoring, testing, and release management.
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
