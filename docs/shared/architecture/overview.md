# Architecture Overview

## System Context
A command-line tool that generates secure, customizable passwords based on user-defined length and character set constraints.

## Services
*This table is the single source of truth for valid `service` values used in ADR frontmatter.*

| Service | Description |
|---|---|
| cli-interface | Command-line interface handling user input and output |
| core-generator | Core password generation engine with security validation |

### Service Details
*(Note: To be expanded by the architecture team post-initialization based on the services listed above. Include Port, Role, Stack, and "Communicates with" fields for each.)*

## Infrastructure
* **Database:** [to be filled]
* **Cache:** [to be filled]
* **Blob Storage:** [to be filled]
* **Message Broker:** [to be filled]

## Communication Patterns
| Pattern | Technology / Protocol | Use Case |
|---|---|---|
| Synchronous | [to be filled] | Client-to-service |
| Asynchronous | [to be filled] | Service-to-service |  
| Real-time | [to be filled] | Live updates |

## Solution Diagram
```mermaid
graph TB
    Client[Client Application]
    
    %% Placeholder for dynamic service injection
    %% | Service | Description |
|---|---|
| cli-interface | Command-line interface handling user input and output |
| core-generator | Core password generation engine with security validation | components will be mapped here
    
    Client --> API_Gateway
    API_Gateway --> Core_Services
```