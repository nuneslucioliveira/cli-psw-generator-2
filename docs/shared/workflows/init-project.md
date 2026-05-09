# WORKFLOW: PROJECT INITIALIZATION AND SCAFFOLDING

**TARGET AUDIENCE:** `@companion` (Hub Orchestrator)
**PURPOSE:** Bootstrap a cloned SDD template into a concrete, project-specific repository.

## STATE 0: PRE-FLIGHT CHECK
1. Verify you are in the root of the repository.
2. Output: `[INIT] Starting SDD Project Initialization. Transitioning to Discovery Phase.`

---

## STATE 1: DISCOVERY (THE 13 QUESTIONS)
You MUST ask the user the following 13 questions exactly as written. **Present all 13 questions in a single message.** **HALT** execution and wait for the human to provide answers for all 13 before proceeding to State 2.

* **Q1:** What is the name of this project or product? (Used in README headers)
* **Q2:** What is a one-sentence description of what this system does?
* **Q3a:** List the services (or modules) this system is composed of. (Format: "name | short role | primary stack")
* **Q3b:** Please list just the service names as a comma-separated list. (e.g., "frontend-app, backend-api, platform")
* **Q4a:** What are the business domains that REQs will be organised under? (Include a short description for each, e.g., "auth | Authentication and User Management")
* **Q4b:** Please list just the domain names as a comma-separated list. (e.g., "auth, payments, core")
* **Q5a:** What are the delivery milestones and their meanings? (Format: "name | one-sentence meaning")
* **Q5b:** Please list just the milestone names as a comma-separated list. (e.g., "poc, mvp, v1, unscheduled")
* **Q6:** What SCM platform and branching strategy will you use? (e.g., GitFlow, Trunk-based)
* **Q7:** What AI coding tools will you use? (e.g., OpenCode, Claude Code, GitHub Copilot)
* **Q8:** Include the Companion-First Agency model? (Yes/No. If yes, specify modes: Automation, Augmentation, Agency)
* **Q9:** Do you want standard workflow guides included? (Yes/No)
* **Q10:** Are there any hard constraints on terminology? (e.g., "Use 'Story' instead of 'REQ'")

---

## STATE 2: VARIABLE MAPPING
Once the human answers, you MUST map their responses to the following variables in your memory:
* `{{PROJECT_NAME}}` -> [Q1]
* `{{PROJECT_DESCRIPTION}}` -> [Q2]
* `{{SERVICE_LIST}}` -> [Q3a]
* `{{SERVICE_LIST_INLINE}}` -> [Q3b]
* `{{DOMAIN_LIST}}` -> [Q4a]
* `{{DOMAIN_LIST_INLINE}}` -> [Q4b]
* `{{MILESTONE_TABLE}}` -> [Q5a]
* `{{MILESTONE_LIST}}` -> [Q5b]
* `{{BRANCHING_STRATEGY}}` -> [Q6]

Output: `[INIT] Discovery complete. Variables mapped. Transitioning to File Injection.`

---

## STATE 3: STATIC FILE INJECTION (DELEGATE TO `@operator`)
You MUST use the `task` tool to invoke the `@operator` agent. Instruct the `@operator` to execute bash commands (like `sed`) to search and replace the exact variable strings above in the following files:
1. `README.md` (Repository Root)
2. `docs/shared/README.md`
3. `docs/shared/architecture/overview.md`
4. `docs/shared/architecture/tech-stack.md`
5. `docs/shared/architecture/scm.md`
6. `.opencode/skills/companion/workflows/create-req.md`
7. `.opencode/skills/companion/workflows/create-adr.md`
8. `.github/instructions/req-review.instructions.md`
9. `.github/copilot-instructions.md`
10. `.opencode/skills/companion/SKILL.md`
11. `.opencode/skills/companion/operating-context.md`

*Constraint:* The `@operator` must format the `{{SERVICE_LIST}}`, `{{DOMAIN_LIST}}`, and `{{MILESTONE_TABLE}}` as valid Markdown tables or lists depending on the context of the target file. `{{MILESTONE_LIST}}`, `{{SERVICE_LIST_INLINE}}`, and `{{DOMAIN_LIST_INLINE}}` MUST be injected safely as raw inline text.

---

## STATE 4: DYNAMIC INDEX SCAFFOLDING (DELEGATE TO `@operator`)
Instruct the `@operator` to execute the following file system operations using bash:

**For ADRs (Architecture):**
1. Read the list of services from Q3b.
2. For each service, copy `docs/shared/architecture/adrs/index-template.md.stub` to `docs/shared/architecture/adrs/index-<service_name>.md`.
3. Copy the stub once more to `docs/shared/architecture/adrs/index-platform.md`.
4. In each new file, replace `{{SERVICE_NAME}}` with the actual service name (or "platform").
5. Delete the `.stub` file.

**For REQs (Requirements):**
1. Read the list of domains from Q4b.
2. For each domain, copy `docs/shared/requirements/index-template.md.stub` to `docs/shared/requirements/index-<domain_name>.md`.
3. In each new file, replace `{{DOMAIN_NAME}}` with the actual domain name.
4. Delete the `.stub` file.

---

## STATE 5: GENERATIVE SYNTHESIS (ROOT `AGENTS.md`)
You MUST use the `task` tool to invoke the `@architect` agent. 
Provide the `@architect` with the answers to all discovery questions and instruct it to generate the repository's root `./AGENTS.md` file. 

**Prompt to Architect MUST include:**
> "Generate the root `AGENTS.md` file for this repository. Use the following context: [Insert All Discovery Answers]. The file must enforce the SDD methodology, specify the Node A/Node B hardware topology constraints (if Q8 is yes), and outline the specific tech stack and architectural boundaries for the services. Output ONLY the file content."

Once the `@architect` returns the content, write it to `./AGENTS.md`.

---

## STATE 6: COMPLETION
Output the following message exactly:
`"🚀 SDD Initialization Complete. The repository has been scaffolded for {{PROJECT_NAME}}. All index files, architecture overviews, and routing maps are active. Start by writing your first REQ using docs/shared/workflows/authoring-guide.md."`