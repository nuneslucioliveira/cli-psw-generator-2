# Shared Documentation

A command-line tool that generates secure, customizable passwords based on user-defined length and character set constraints.

## Structure

| Directory | Purpose |
|---|---|
| `architecture/` | System overview, tech stack, glossary, SCM rules, ADRs |
| `requirements/` | Product requirements (REQs) |
| `contracts/` | JSON schemas for inter-service data contracts |
| `workflows/` | Step-by-step contribution guides |
| `../methodology.md` | SDD lifecycle, vocabulary reference, and evaluation criteria |

## Authoring Guidelines
Before writing specifications or architectural decisions, all contributors and AI agents must review the guidelines and templates:
* **REQs:** See [`requirements/guidelines.md`](requirements/guidelines.md) and [`requirements/000-template.md`](requirements/000-template.md).
* **ADRs:** See [`architecture/adrs/guidelines.md`](architecture/adrs/guidelines.md) and [`architecture/adrs/000-template.md`](architecture/adrs/000-template.md).

## Milestones
This table is the single source of truth for valid `milestone` values across the entire project (used in REQ and ADR frontmatter).

| Milestone | Meaning |
|---|---|
| mvp | Minimum Viable Product — core password generation with basic customization |
| v2 | Version 2 — advanced features, history, custom profiles, and integration capabilities |

## How to Contribute
Start by reading the workflow index at [`workflows/README.md`](workflows/README.md) to understand how to route your tasks, fix typos, and utilize AI coding tools securely.