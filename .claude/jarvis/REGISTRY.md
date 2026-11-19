# Реестр агентов — JARVIS AI CITY

Всего определений: **127** · активных: **126** · отключено: **1** · цель: 300.

Файл генерируется командой `python3 tools/agentlib.py build` — не редактируйте вручную.

Доступ: `read-only` — только чтение; `research` — чтение + веб; `write` — правит файлы и запускает команды; `coordinator` — запускает других агентов.


## 00-jarvis — Рова Алеф — Ратуша JARVIS (центр управления) (1)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `jarvis` | inherit | coordinator | JARVIS main coordinator. Use as the main-session agent (claude --agent jarvis) or when a task spans several domains (development, design, testing, analytics, automation) and needs to be split between  ⚠️ coordinator written for this library (not from the original collection); run as main agent: claude --agent jarvis |

## 01-core-development — Рова Бет — квартал разработчиков (13)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `api-designer` | sonnet | write | designing new APIs, creating API specifications, or refactoring existing API architecture for scalability and developer experience. Invoke when you need REST/GraphQL endpoint design, OpenAPI documenta |
| `auth-integration-engineer` | sonnet | write | implementing authentication and authorization — OAuth 2.1/OIDC flows, SAML enterprise SSO, session and token management, multi-tenant permission models, or MFA and passwordless login. |
| `backend-developer` | sonnet | write | building server-side APIs, microservices, and backend systems that require robust architecture, scalability planning, and production-ready implementation. |
| `design-bridge` | inherit | write | translate a DESIGN.md from the VoltAgent/awesome-design-md repository into polished Claude Code instructions for building user interfaces that faithfully match the chosen brand. Invoke this agent when |
| `electron-pro` | sonnet | write | building Electron desktop applications that require native OS integration, cross-platform distribution, security hardening, and performance optimization. Use electron-pro for complete desktop app deve |
| `frontend-developer` | sonnet | write | building complete frontend applications across React, Vue, and Angular frameworks requiring multi-framework expertise and full-stack integration. |
| `fullstack-developer` | sonnet | write | build complete features spanning database, API, and frontend layers together as a cohesive unit. |
| `graphql-architect` | inherit | write | designing or evolving GraphQL schemas across microservices, implementing federation architectures, or optimizing query performance in distributed graphs. |
| `microservices-architect` | inherit | write | designing distributed system architecture, decomposing monolithic applications into independent microservices, or establishing communication patterns between services at scale. |
| `mobile-developer` | sonnet | write | building cross-platform mobile applications requiring native performance optimization, platform-specific features, and offline-first architecture. Use for React Native and Flutter projects where code  |
| `ui-designer` | sonnet | write | designing visual interfaces, creating design systems, building component libraries, or refining user-facing aesthetics requiring expert visual design, interaction patterns, and accessibility considera |
| `webhook-engineer` | sonnet | write | consuming or delivering webhooks — signature verification, idempotent handlers, retry and backoff policies, event ordering, dead-letter queues, or designing an outbound webhook system for your own API |
| `websocket-engineer` | sonnet | write | implementing real-time bidirectional communication features using WebSockets, Socket.IO, or similar technologies at scale. |

## 02-language-specialists — Рова Гимель — квартал языков (32)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `angular-architect` | sonnet | write | architecting enterprise Angular 15+ applications with complex state management, optimizing RxJS patterns, designing micro-frontend systems, or solving performance and scalability challenges in large c |
| `cpp-pro` | sonnet | write | building high-performance C++ systems requiring modern C++20/23 features, template metaprogramming, or zero-overhead abstractions for systems programming, embedded systems, or performance-critical app |
| `csharp-developer` | sonnet | write | building ASP.NET Core web APIs, cloud-native .NET solutions, or modern C# applications requiring async patterns, dependency injection, Entity Framework optimization, and clean architecture. |
| `django-developer` | sonnet | write | building Django 4+ web applications, REST APIs, or modernizing existing Django projects with async views and enterprise patterns. |
| `dotnet-core-expert` | sonnet | write | building .NET Core applications requiring cloud-native architecture, high-performance microservices, modern C# patterns, or cross-platform deployment with minimal APIs and advanced ASP.NET Core featur |
| `dotnet-framework-4.8-expert` | sonnet | write | working on legacy .NET Framework 4.8 enterprise applications that require maintenance, modernization, or integration with Windows-based infrastructure. |
| `elixir-expert` | sonnet | write | build fault-tolerant, concurrent systems leveraging OTP patterns, GenServer architectures, and Phoenix framework for real-time applications. |
| `expo-react-native-expert` | sonnet | write | building mobile applications with Expo and React Native that require native module integration, navigation setup, performant animations, push notifications, OTA updates, or App Store/Play Store deploy |
| `fastapi-developer` | sonnet | write | building modern async Python APIs with FastAPI, implementing Pydantic v2 validation, dependency injection patterns, or deploying high-performance ASGI applications. |
| `flutter-expert` | sonnet | write | building cross-platform mobile applications with Flutter 3+ that require custom UI implementation, complex state management, native platform integrations, or performance optimization across iOS/Androi |
| `golang-pro` | sonnet | write | building Go applications requiring concurrent programming, high-performance systems, microservices, or cloud-native architectures where idiomatic patterns, error handling excellence, and efficiency ar |
| `java-architect` | sonnet | write | designing enterprise Java architectures, migrating Spring Boot applications, or establishing microservices patterns for scalable cloud-native systems. |
| `javascript-pro` | sonnet | write | build, optimize, or refactor modern JavaScript code for browser, Node.js, or full-stack applications requiring ES2023+ features, async patterns, or performance-critical implementations. |
| `kotlin-specialist` | sonnet | write | building Kotlin applications requiring advanced coroutine patterns, multiplatform code sharing, or Android/server-side development with functional programming principles. |
| `laravel-specialist` | sonnet | write | building Laravel 10+ applications, architecting Eloquent models with complex relationships, implementing queue systems for async processing, or optimizing API performance. |
| `nextjs-developer` | sonnet | write | building production Next.js 14+ applications that require full-stack development with App Router, server components, and advanced performance optimization. Invoke when you need to architect or impleme |
| `node-specialist` | sonnet | write | build, optimize, or debug Node.js backend applications, APIs, CLIs, or microservices requiring deep ecosystem knowledge and server-side JavaScript expertise. |
| `php-pro` | sonnet | write | working with PHP 8.3+ projects that require strict typing, modern language features, and enterprise framework expertise (Laravel or Symfony). Use when building scalable applications, optimizing perfor |
| `postgres-pro` | sonnet | write | optimize PostgreSQL performance, design high-availability replication, or troubleshoot database issues at scale. Invoke this agent for query optimization, configuration tuning, replication setup, back |
| `powershell-5.1-expert` | sonnet | write | automating Windows infrastructure tasks requiring PowerShell 5.1 scripts with RSAT modules for Active Directory, DNS, DHCP, GPO management, or when building safe, enterprise-grade automation workflows |
| `powershell-7-expert` | sonnet | write | building cross-platform cloud automation scripts, Azure infrastructure orchestration, or CI/CD pipelines requiring PowerShell 7+ with modern .NET interop, idempotent operations, and enterprise-grade e |
| `python-pro` | sonnet | write | build type-safe, production-ready Python code for web APIs, system utilities, or complex applications requiring modern async patterns and extensive type coverage. |
| `rails-expert` | sonnet | write | building or modernizing Rails applications requiring API development, Hotwire reactivity, real-time features, background job processing, deployment automation, or Rails-idiomatic patterns for maximum  |
| `react-specialist` | sonnet | write | optimizing existing React applications for performance, implementing advanced React 18+ features, or solving complex state management and architectural challenges within React codebases. |
| `rust-engineer` | sonnet | write | building Rust systems where memory safety, ownership patterns, zero-cost abstractions, and performance optimization are critical for systems programming, embedded development, async applications, or h |
| `spring-boot-engineer` | sonnet | write | building enterprise Spring Boot 3+ applications requiring microservices architecture, cloud-native deployment, or reactive programming patterns. |
| `sql-pro` | sonnet | write | optimize complex SQL queries, design efficient database schemas, or solve performance issues across PostgreSQL, MySQL, SQL Server, and Oracle requiring advanced query optimization, index strategies, o |
| `swift-expert` | sonnet | write | building native iOS, macOS, or server-side Swift applications requiring advanced concurrency patterns, protocol-oriented architecture, and Swift-specific optimizations. Invoke for SwiftUI modernizatio |
| `symfony-specialist` | sonnet | write | building Symfony 6+/7+/8+ applications, architecting Doctrine ORM entities with complex relationships, implementing Messenger component for async processing, or optimizing API Platform performance. |
| `typescript-pro` | sonnet | write | implementing TypeScript code requiring advanced type system patterns, complex generics, type-level programming, or end-to-end type safety across full-stack applications. |
| `vue-expert` | sonnet | write | building Vue 3 applications that require Composition API mastery, reactivity optimization, or Nuxt 3 development with enterprise-scale performance concerns. |
| `wordpress-master` | sonnet | write | architect, optimize, or troubleshoot WordPress implementations ranging from custom theme/plugin development to enterprise-scale multisite platforms. Invoke this agent for performance optimization, sec |

## 03-infrastructure — Порт Ашдода — инфраструктура и доставка (15)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `azure-infra-engineer` | sonnet | write | designing, deploying, or managing Azure infrastructure with focus on network architecture, Entra ID integration, PowerShell automation, and Bicep IaC. |
| `cloud-architect` | inherit | write | design, evaluate, or optimize cloud infrastructure architecture at scale. Invoke when designing multi-cloud strategies, planning cloud migrations, implementing disaster recovery, optimizing cloud cost |
| `database-administrator` | sonnet | write | optimizing database performance, implementing high-availability architectures, setting up disaster recovery, or managing database infrastructure for production systems. |
| `deployment-engineer` | haiku | write | designing, building, or optimizing CI/CD pipelines and deployment automation strategies. |
| `devops-engineer` | sonnet | write | building or optimizing infrastructure automation, CI/CD pipelines, containerization strategies, and deployment workflows to accelerate software delivery while maintaining reliability and security. |
| `devops-incident-responder` | sonnet | write | actively responding to production incidents, diagnosing critical service failures, or conducting incident postmortems to implement permanent fixes and preventative measures. |
| `docker-expert` | sonnet | write | build, optimize, or secure Docker container images and orchestration for production environments. |
| `incident-responder` | sonnet | write | an active security breach, service outage, or operational incident requires immediate response, evidence preservation, and coordinated recovery. |
| `kubernetes-specialist` | sonnet | write | design, deploy, configure, or troubleshoot Kubernetes clusters and workloads in production environments. |
| `network-engineer` | sonnet | write | designing, optimizing, or troubleshooting cloud and hybrid network infrastructures, or when addressing network security, performance, or reliability challenges. |
| `platform-engineer` | inherit | write | building or improving internal developer platforms (IDPs), designing self-service infrastructure, or optimizing developer workflows to reduce friction and accelerate delivery. The platform-engineer ag |
| `sre-engineer` | sonnet | write | establish or improve system reliability through SLO definition, error budget management, and automation. Invoke when implementing SLI/SLO frameworks, reducing operational toil, designing fault-toleran |
| `terraform-engineer` | sonnet | write | building, refactoring, or scaling infrastructure as code using Terraform with focus on multi-cloud deployments, module architecture, and enterprise-grade state management. |
| `terragrunt-expert` | sonnet | write | Expert Terragrunt specialist mastering infrastructure orchestration, DRY configurations, and multi-environment deployments. Masters stacks, units, dependency management, and scalable IaC patterns with |
| `windows-infra-admin` | sonnet | write | managing Windows Server infrastructure, Active Directory, DNS, DHCP, and Group Policy configurations, especially for enterprise-scale deployments requiring safe automation and compliance validation. |

## 04-quality-security — Рова Далет — контроль качества и безопасность (18)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `accessibility-tester` | haiku | write | comprehensive accessibility testing, WCAG compliance verification, or assessment of assistive technology support. |
| `ad-security-reviewer` | inherit | write | audit Active Directory security posture, evaluate privilege escalation risks, review identity delegation patterns, or assess authentication protocol hardening. |
| `architect-reviewer` | inherit | write | evaluate system design decisions, architectural patterns, and technology choices at the macro level. |
| `chaos-engineer` | sonnet | write | design and execute controlled failure experiments, validate system resilience before incidents occur, or conduct game day exercises to test your team's incident response capabilities. |
| `code-reviewer` | inherit | write | conduct comprehensive code reviews focusing on code quality, security vulnerabilities, and best practices. |
| `compliance-auditor` | inherit | read-only | achieve regulatory compliance, implement compliance controls, or prepare for audits across frameworks like GDPR, HIPAA, PCI DSS, SOC 2, and ISO standards. |
| `debugger` | sonnet | write | diagnose and fix bugs, identify root causes of failures, or analyze error logs and stack traces to resolve issues. |
| `error-detective` | sonnet | write | diagnose why errors are occurring in your system, correlate errors across services, identify root causes, and prevent future failures. |
| `penetration-tester` | inherit | write | conduct authorized security penetration tests to identify real vulnerabilities through active exploitation and validation. Use penetration-tester for offensive security testing, vulnerability exploita |
| `performance-engineer` | sonnet | write | identify and eliminate performance bottlenecks in applications, databases, or infrastructure systems, and when baseline performance metrics need improvement. |
| `ponder-auditor` | inherit | write | a convergent, multi-pass codebase, UI, architecture, or security audit with 100% surface coverage, adversarial false-positive retraction (Skeptic), user-empathy severity ranking (Empath), and epistemi |
| `powershell-security-hardening` | inherit | write | harden PowerShell automation, secure remoting configuration, enforce least-privilege design, or align scripts with enterprise security baselines and compliance frameworks. |
| `qa-expert` | sonnet | write | comprehensive quality assurance strategy, test planning across the entire development cycle, or quality metrics analysis to improve overall software quality. |
| `security-auditor` | inherit | read-only | conducting comprehensive security audits, compliance assessments, or risk evaluations across systems, infrastructure, and processes. Invoke when you need systematic vulnerability analysis, compliance  |
| `security-engineer` | inherit | write | implementing comprehensive security solutions across infrastructure, building automated security controls into CI/CD pipelines, or establishing compliance and vulnerability management programs. Invoke |
| `surgeon-reviewer` | inherit | write | a ruthlessly prioritized code review that reports only real problems — bugs, money-losing logic, maintenance traps — ranked by blast radius, with zero style opinions and a clear ship/no-ship verdict. |
| `test-automator` | sonnet | write | build, implement, or enhance automated test frameworks, create test scripts, or integrate testing into CI/CD pipelines. |
| `ui-ux-tester` | sonnet | write | exhaustive UI and UX functionality testing driven by documented user flows, with browser or desktop interaction tooling and structured defect reporting. ⚠️ removed invalid tool names 'chrome-mcp', 'computer-use'; no browser tool; use Playwright via Bash |

## 05-data-ai — Рова Хей — научный городок данных и ИИ (5)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `data-engineer` | sonnet | write | design, build, or optimize data pipelines, ETL/ELT processes, and data infrastructure. Invoke when designing data platforms, implementing pipeline orchestration, handling data quality issues, or optim |
| `data-scientist` | sonnet | write | analyze data patterns, build predictive models, or extract statistical insights from datasets. Invoke this agent for exploratory analysis, hypothesis testing, machine learning model development, and t |
| `database-optimizer` | sonnet | write | analyze slow queries, optimize database performance across multiple systems, or implement indexing strategies to improve query execution. |
| `machine-learning-engineer` | sonnet | write | deploy, optimize, or serve machine learning models at scale in production environments. |
| `mlops-engineer` | sonnet | write | design and implement ML infrastructure, set up CI/CD for machine learning models, establish model versioning systems, or optimize ML platforms for reliability and automation. Invoke this agent to buil |

## 06-developer-experience — Рова Вав — мастерские инструментов (3)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `codebase-orchestrator` | inherit | write | repository-wide refactor governance with explicit approval loops, weighted risk prioritization, diff previews, and deterministic fallback strategies. ⚠️ removed 6 invalid tool names (agent names / plugin skills / MCP gateway); subagents cannot launch subagents; orchestration is done by the main session |
| `license-engineer` | inherit | write | architecting, implementing, or optimizing end-to-end legal licensing systems—from OSI standard selection and dependency compliance pipelines to proprietary deployment and risk monitoring. |
| `technical-writer` | haiku | write | create, improve, or maintain technical documentation including API references, user guides, SDK documentation, and getting-started guides. |

## 08-business-product — Сити — деловой центр (18)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `ai-writing-auditor` | inherit | write | audit content for AI writing patterns and rewrite text to remove them. |
| `assumption-mapping` | inherit | write | the user needs to identify and prioritize risky assumptions in a product idea, feature, or strategy. Triggers on: 'assumptions', 'what could go wrong', 'validate', 'riskiest assumption', 'de-risk', 'a |
| `backlog-grooming` | inherit | write | the user needs to groom, refine, or clean up a product backlog. Triggers on: 'groom backlog', 'backlog refinement', 'backlog grooming', 'clean up backlog', 'refine stories', 'sprint refinement', 'back |
| `business-analyst` | sonnet | write | analyzing business processes, gathering requirements from stakeholders, or identifying process improvement opportunities to drive operational efficiency and measurable business value. |
| `content-marketer` | haiku | write | develop comprehensive content strategies, create SEO-optimized marketing content, or execute multi-channel content campaigns to drive engagement and conversions. Invoke this agent for content planning |
| `content-quality-editor` | haiku | write | Use this agent before publishing any AI-generated content — blog posts, READMEs, release notes, commit messages, PR descriptions, documentation, or social posts. Strips AI writing patterns using unslo |
| `customer-success-manager` | sonnet | write | assess customer health, develop retention strategies, identify upsell opportunities, or maximize customer lifetime value. Invoke this agent for account health analysis, churn prevention, product adopt |
| `gdpr-ccpa-compliance` | inherit | research | the user needs to understand GDPR or CCPA compliance, review data practices, or assess privacy requirements. Triggers on: 'GDPR', 'CCPA', 'privacy compliance', 'data privacy', 'right to deletion', 'co |
| `growth-loops` | inherit | write | the user wants to design a growth loop, understand PLG mechanics, or build sustainable acquisition. Triggers on: 'growth loop', 'flywheel', 'viral loop', 'PLG growth', 'product-led growth', 'growth me |
| `landing-page-copywriter` | sonnet | write | writing or optimizing landing page copy, hero sections, CTAs, or conversion-focused funnel content for a specific audience and offer. |
| `legal-advisor` | sonnet | write | draft contracts, review compliance requirements, develop IP protection strategies, or assess legal risks for technology businesses. |
| `product-manager` | haiku | write | make product strategy decisions, prioritize features, or define roadmap plans based on user needs and business goals. |
| `project-manager` | haiku | write | establish project plans, track execution progress, manage risks, control budget/schedule, and coordinate stakeholders across complex initiatives. |
| `sales-engineer` | sonnet | write | conduct technical pre-sales activities including solution architecture, proof-of-concept development, and technical demonstrations for complex sales deals. |
| `scrum-master` | haiku | write | teams need facilitation, process optimization, velocity improvement, or agile ceremony management—especially for sprint planning, retrospectives, impediment removal, and scaling agile practices across |
| `telegram-ads-analyst` | inherit | write | the user wants to advertise in Telegram channels, vet a channel before buying a post, check whether a channel's audience is real, or price a Telegram ad. Triggers on: 'Telegram ads', 'Telegram channel |
| `ux-microcopy-reviewer` | sonnet | read-only | Use this agent after changing user-facing interface text (buttons, error messages, empty states, form labels, confirmations, toasts) to review it for clarity, consistency and accessibility before it s |
| `ux-researcher` | sonnet | research | conduct user research, analyze user behavior, or generate actionable insights to validate design decisions and uncover user needs. Invoke when you need usability testing, user interviews, survey desig |

## 09-meta-orchestration — Рова Зайн — диспетчерская (10)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `agent-organizer` | sonnet | write | break a complex task into subtasks, match each to the capabilities of available subagents, and write a concrete team/workflow plan as Markdown. ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `context-manager` | sonnet | write | Use to organize the shared context and state that a multi-agent workflow keeps in files — deciding directory/file structure, naming conventions, what goes where, and how agents read and update it. ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `error-coordinator` | sonnet | write | mine error logs and agent output for recurring failure and cascade patterns, then document grounded recovery and cascade-prevention strategies (as Markdown specs) that other agents or humans can act o ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `it-ops-orchestrator` | sonnet | write | Use for orchestrating complex IT operations tasks that span multiple domains (PowerShell automation, .NET development, infrastructure management, Azure, M365) by intelligently routing work to speciali ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `knowledge-synthesizer` | sonnet | write | mine recurring patterns from agent logs, session transcripts, and workflow history, then write grounded, evidence-cited findings that other agents or humans can act on. |
| `memory-curator` | sonnet | write | Use to maintain an agent's long-term memory across sessions — deciding what is worth saving, recalling relevant context before acting, recording corrections without erasing history, and pruning what n |
| `multi-agent-coordinator` | inherit | write | plan how multiple concurrent subagents should communicate, sequence their work, share state through files, and handle failures — written up as a coordination plan or convention in Markdown. ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `performance-monitor` | haiku | write | analyze existing metric, log, and output files to spot performance patterns and anomalies, then write a grounded, evidence-cited observability plan (what to measure, thresholds, dashboards) as Markdow |
| `task-distributor` | haiku | write | design and document a task-distribution strategy across multiple agents or workers — how to split work, order queues, respect priorities and deadlines, and balance load — written as a clear Markdown p ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `workflow-orchestrator` | inherit | write | design workflow and state-machine definitions — states, transitions, error handling, and compensation/rollback logic — and write them as specs or config that other agents or a runtime can execute. ⚠️ coordinator role: produces a plan; the main session launches the workers |

## 10-research-analysis — Рова Хет — библиотека и аналитика (11)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `ab-test-analysis` | inherit | research | the user wants to analyze A/B test results, interpret p-values, determine statistical significance, or make a ship/no-ship decision. Triggers on: 'analyze A/B test', 'p-value', 'statistical significan |
| `cohort-analysis` | inherit | research | the user wants to analyze retention, cohort behavior, engagement trends, or understand how different user groups perform over time. Triggers on: 'cohort analysis', 'retention analysis', 'user retentio |
| `competitive-analyst` | sonnet | research | analyze direct and indirect competitors, benchmark against market leaders, or develop strategies to strengthen competitive positioning and market advantage. |
| `data-researcher` | sonnet | research | discover, collect, and validate data from multiple sources to fuel analysis and decision-making. Invoke this agent for identifying data sources, gathering raw datasets, performing quality checks, and  |
| `first-principles-thinking` | inherit | research | the user wants to challenge assumptions, break down a complex problem from scratch, or approach something with first principles reasoning. Triggers on: 'first principles', 'challenge assumptions', 'wh |
| `market-researcher` | sonnet | research | analyze markets, understand consumer behavior, assess competitive landscapes, and size opportunities to inform business strategy and market entry decisions. |
| `project-idea-validator` | sonnet | write | an idea pressure-tested with brutal honesty, competitor teardown, market validation, and clear go/no-go guidance before building. |
| `research-analyst` | sonnet | research | comprehensive research across multiple sources with synthesis of findings into actionable insights, trend identification, and detailed reporting. |
| `scientific-literature-researcher` | sonnet | research | search scientific literature and retrieve structured experimental data from published studies. Invoke this agent when the task requires evidence-grounded answers from full-text research papers, includ ⚠️ needs the 'bgpt' MCP server (mcp__bgpt__search_papers, external service bgpt.pro); without it only WebSearch/WebFetch |
| `search-specialist` | sonnet | research | find specific information across multiple sources using advanced search strategies, query optimization, and targeted information retrieval. Invoke this agent when the priority is locating precise, rel |
| `trend-analyst` | sonnet | research | analyzing emerging patterns, predicting industry shifts, or developing future scenarios to inform strategic planning and competitive positioning. |

## disabled — Отключённые (1)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `agent-installer` | haiku | write | the user wants to discover, browse, or install Claude Code agents from the awesome-claude-code-subagents repository. ⚠️ disabled: downloads unreviewed agent files from VoltAgent/awesome-claude-code-subagents; kept in library/disabled/ |
