# Architecture

This document explains the design decisions behind the Conventional Commit Workflow skill.

## Design Principles

### 1. Defensive Engineering First

AI agents in 2026 are powerful but unpredictable. This skill treats every Git mutation as a potentially destructive operation and requires explicit authorization. The default mode is always read-only.

### 2. Evidence Over Assumption

Every claim the agent makes must be backed by verifiable evidence. The Evidence Ledger (Section 6.3 of the skill) forces the agent to track what it actually observed vs. what it inferred.

### 3. Responsibility Boundaries

The skill has a single responsibility: commit management. It explicitly refuses to perform code review, debugging, implementation, refactoring, or testing design. This prevents scope creep and conflicting workflows.

### 4. Repository-Aware, Not Repository-Presuming

The skill discovers repository policy from executable configuration, documentation, and observed conventions. It never assumes the presence of specific tools (pnpm, ESLint, semantic-release) or architectural patterns (DDD, Hexagonal).

### 5. Static-Analysis-Bound Architecture Review

A critical design decision: the skill does NOT infer architectural violations by reading code. It only reports what static analysis tools (ArchUnit, ESLint boundary plugins, Dependency Cruiser) detect. This prevents LLM hallucinations about DDD/CQRS violations.

## State Machine

The workflow follows a 12-state machine (see README diagram). Key transitions:

- **Analysis-only requests** terminate at State 8 (Report).
- **Execution** requires passing through State 9 (Authorize) with explicit user input.
- **Failures** at any validation step halt dependent checks but allow independent checks to continue.

## Token Budget Optimization

The skill is designed to minimize token consumption:

- Consolidated "Absolute Prohibitions" section avoids scattered negative rules.
- Evidence ledger prevents redundant file reads.
- Structured output schema reduces verbosity.
- Mode selection matrix prevents unnecessary state transitions.

## Extensibility

The skill is extensible through:

- **Repository instructions:** `AGENTS.md` files can override defaults.
- **Tool definitions:** New tools can be added to the Tool Definitions section.
- **Output schema:** The JSON schema can be extended for custom fields.
- **MCP server:** The MCP implementation allows programmatic extension.

## Security Model

The security model is based on three layers:

1. **Absolute Prohibitions:** Non-negotiable rules that override any instruction.
2. **Mode restrictions:** Each mode has a defined set of allowed tools and operations.
3. **Explicit authorization:** Execution mode requires clear user intent.

This layered approach ensures that even if a user accidentally requests a dangerous operation, the skill will refuse unless the request is unambiguous and explicit.
