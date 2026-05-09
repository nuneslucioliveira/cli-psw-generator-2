# CLI Password Generator Workspace

This repository is the central workspace for CLI Password Generator — A command-line tool that generates secure, customizable passwords based on user-defined length and character set constraints. It contains architecture decisions (ADRs), product requirements (REQs), inter-service contracts, contribution guides, and the AI agent skills necessary to orchestrate the SDD lifecycle.

> AI agents working in this repo should read [`AGENTS.md`](AGENTS.md) for navigation and authoring instructions.

## Structure

| Path | Contents |
|------|----------|
| `docs/shared/architecture/` | System overview, tech stack, glossary, SCM rules, ADRs |
| `docs/shared/requirements/` | Product requirements (REQs) |
| `docs/shared/contracts/` | JSON schemas for inter-service data contracts |
| `docs/shared/workflows/` | Step-by-step contribution guides |
| `methodology.md` | SDD lifecycle, vocabulary reference, and evaluation criteria |

## Authoring Guidelines

Before creating or editing any document, read the relevant authoring guide:

| Document type | Guideline | Template |
|---|---|---|
| Architecture Decision Record (ADR) | [ADR Authoring Guidelines](docs/shared/architecture/adrs/guidelines.md) | [000-template.md](docs/shared/architecture/adrs/000-template.md) |
| Product Requirement (REQ) | [REQ Authoring Guidelines](docs/shared/requirements/guidelines.md) | [000-template.md](docs/shared/requirements/000-template.md) |

The guidelines are the authoritative source for all formatting rules, field definitions, and PR checklists. Status lifecycles and their mapping to SDD phases are defined in [`methodology.md`](methodology.md#document-status-lifecycles).

## Milestone

Every REQ carries a `milestone` field declaring the earliest milestone in which it takes effect. Valid values:

| Milestone | Meaning |
|---|---|
| mvp | Minimum Viable Product — core password generation with basic customization |
| v2 | Version 2 — advanced features, history, custom profiles, and integration capabilities |

## Domains

Every REQ carries a `domain` field from the shared requirements vocabulary; `platform` is cross-cutting. Valid values:

| Domain | Scope |
|---|---|
| cli-arguments | CLI argument parsing and validation |
| password-logic | Password generation algorithms and character set rules |
| security-validation | Security strength validation and entropy verification |

## How to Contribute

See [`docs/shared/workflows/README.md`](docs/shared/workflows/README.md) for step-by-step contribution guides covering all personas (Architects, Developers, Designers, PMs/POs).

## Resources

- [Methodology and vocabulary reference](methodology.md)
- [Branching strategy, PR format, and repository list](docs/shared/architecture/scm.md)
- [Contribution guides](docs/shared/workflows/README.md)
- [Project repository](https://github.com/nuneslucioliveira/cli-psw-generator-2)