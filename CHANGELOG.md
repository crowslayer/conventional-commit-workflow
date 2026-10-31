# Changelog

## [1.2.0]

### Added

- Repository discovery examples for Python, Rust, Go, Java/JVM, .NET, Ruby, PHP, and language-neutral build tools.
- Risk-based validation guidance, targeted test selection, and an internal validation ledger.
- Hook-aware validation for authorized commits, including command/scope checks and reuse of actual results without bypassing hooks.
- Post-commit reporting for commit hashes, messages, included paths, hook results, and final working-tree status.

### Improved

- Reduced repeated configuration reads and redundant checks by reusing a compact evidence ledger and only invalidating results affected by changes.
- Clarified test-only commit classification, analyzer release impact versus actual release execution, and scope-limited architecture review.
- Shortened duplicated workflow guidance while retaining Git safety and reporting requirements.
