# Source Control Management (SCM)

## Audience
| Persona | Must read to understand... |
|---|---|
| Designer | How to submit asset updates without breaking code |
| PM / PO | How to track milestones and PR statuses |
| Architect | How ADRs are merged and versioned |
| Developer | Branching strategy, commit rules, and PR gates |

## Branching Strategy
**Strategy:** Trunk-based

*(The dev team must adhere strictly to the rules of the selected strategy above. Direct commits to protected branches are prohibited).*

## Pull Request Process
1. Create a branch following the strategy conventions.
2. Implement code/docs strictly satisfying the accepted REQ/ADR.
3. Ensure all tests (derived from ACs) pass locally.
4. Open a PR against the target branch.
5. Fill out the PR template entirely.
6. Await human code review and CI pipeline clearance.

### PR Description Format
* **Summary:** What changed and why.
* **Key changes:** Bulleted list of technical modifications.
* **Related Spec:** Link to the REQ-NNN or ADR-NNN.

## Code Reviews
* Code reviews must validate logic, security boundaries, and strict adherence to the specification. 
* See `workflows/code-review.md` for persona-specific checklists.

## Commit Messages
We use Conventional Commits. Commits must be prefixed with: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, or `chore:`.

## Release Management
Releases are mapped to the | Milestone | Meaning |
|---|---|
| mvp | Minimum Viable Product — core password generation with basic customization |
| v2 | Version 2 — advanced features, history, custom profiles, and integration capabilities | defined in the root README. 

## Repositories & Modules
* **Project Name:** CLI Password Generator

**Microservices / Modules:**
| Service | Description |
|---|---|
| cli-interface | Command-line interface handling user input and output |
| core-generator | Core password generation engine with security validation |

*(Update with actual repository URLs once provisioned).*