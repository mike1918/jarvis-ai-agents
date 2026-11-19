# Реестр агентов — JARVIS AI CITY

Всего определений: **301** · активных: **300** · отключено: **1** · цель: 300.

Файл генерируется командой `python3 tools/agentlib.py build` — не редактируйте вручную.

Доступ: `read-only` — только чтение; `research` — чтение + веб; `write` — правит файлы и запускает команды; `coordinator` — запускает других агентов.


## 00-jarvis — Рова Алеф — Ратуша JARVIS (центр управления) (3)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `budget-controller` | haiku | read-only | spending must be reviewed: city costs by agent, runtime and project, budget forecasts and recommendations to cut cost. |
| `jarvis` | inherit | coordinator | JARVIS main coordinator. Use as the main-session agent (claude --agent jarvis) or when a task spans several domains (development, design, testing, analytics, automation) and needs to be split between  ⚠️ coordinator written for this library (not from the original collection); run as main agent: claude --agent jarvis |
| `owner-briefing-writer` | haiku | write | the owner needs a short daily or weekly briefing: finished tasks, failures, approvals waiting, spend and suggested next steps. |

## 01-core-development — Рова Бет — квартал разработчиков (35)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `admin-panel-developer` | sonnet | write | building internal admin panels and back-office tools: CRUD screens, filters, bulk actions, roles and audit logs. |
| `api-designer` | sonnet | write | designing new APIs, creating API specifications, or refactoring existing API architecture for scalability and developer experience. Invoke when you need REST/GraphQL endpoint design, OpenAPI documenta |
| `api-gateway-engineer` | sonnet | write | configuring an API gateway or reverse-proxy layer: routing, authentication, rate limiting, request validation and API keys. |
| `astro-developer` | sonnet | write | building content-heavy, fast websites with Astro: islands architecture, content collections, static and hybrid rendering. |
| `auth-integration-engineer` | sonnet | write | implementing authentication and authorization — OAuth 2.1/OIDC flows, SAML enterprise SSO, session and token management, multi-tenant permission models, or MFA and passwordless login. |
| `backend-developer` | sonnet | write | building server-side APIs, microservices, and backend systems that require robust architecture, scalability planning, and production-ready implementation. |
| `background-jobs-engineer` | sonnet | write | building background job processing with queues (Celery, RQ, BullMQ, Sidekiq): retries, idempotency, scheduling and monitoring. |
| `browser-extension-developer` | sonnet | write | building Chrome/Firefox browser extensions with Manifest V3: background service workers, content scripts, permissions and store packaging. |
| `caching-engineer` | sonnet | write | adding or fixing caching layers — Redis, HTTP caching, CDN — including invalidation, stampede protection and cache keys. |
| `cli-tool-developer` | sonnet | write | building command-line tools: argument parsing, subcommands, helpful errors, config files, shell completion and packaging. |
| `design-bridge` | inherit | write | translate a DESIGN.md from the VoltAgent/awesome-design-md repository into polished Claude Code instructions for building user interfaces that faithfully match the chosen brand. Invoke this agent when |
| `design-system-engineer` | sonnet | write | building or maintaining a component library/design system: tokens, accessible components, theming, Storybook and versioning. |
| `electron-pro` | sonnet | write | building Electron desktop applications that require native OS integration, cross-platform distribution, security hardening, and performance optimization. Use electron-pro for complete desktop app deve |
| `feature-flag-engineer` | sonnet | write | introducing feature flags, gradual rollouts, A/B switches and kill switches, and cleaning up stale flags. |
| `frontend-developer` | sonnet | write | building complete frontend applications across React, Vue, and Angular frameworks requiring multi-framework expertise and full-stack integration. |
| `fullstack-developer` | sonnet | write | build complete features spanning database, API, and frontend layers together as a cohesive unit. |
| `geospatial-developer` | sonnet | write | building map and location features: Leaflet/MapLibre maps, PostGIS queries, geocoding, routing and geofencing. |
| `graphql-architect` | inherit | write | designing or evolving GraphQL schemas across microservices, implementing federation architectures, or optimizing query performance in distributed graphs. |
| `graphql-federation-implementer` | sonnet | write | implementing (not designing) GraphQL servers and resolvers: DataLoader batching, auth in resolvers, pagination and query cost limits. |
| `htmx-developer` | sonnet | write | building server-rendered interactive pages with htmx and minimal JavaScript (hx-get/hx-post, partial swaps, progressive enhancement). |
| `media-upload-engineer` | sonnet | write | implementing file and media uploads: direct-to-storage uploads, image/video processing, thumbnails, virus scanning and CDN delivery. |
| `microservices-architect` | inherit | write | designing distributed system architecture, decomposing monolithic applications into independent microservices, or establishing communication patterns between services at scale. |
| `mobile-developer` | sonnet | write | building cross-platform mobile applications requiring native performance optimization, platform-specific features, and offline-first architecture. Use for React Native and Flutter projects where code  |
| `multi-tenancy-architect` | sonnet | write | designing SaaS multi-tenancy: tenant isolation in the database, per-tenant config, billing boundaries and data export/deletion. |
| `notification-system-engineer` | sonnet | write | building notification delivery across email, SMS, push and in-app channels with templates, preferences, batching and retries. |
| `pwa-specialist` | sonnet | write | turning a web app into an installable Progressive Web App: manifest, service worker caching strategies, offline mode, push notifications. |
| `realtime-collaboration-engineer` | sonnet | write | building collaborative real-time editing (shared documents, whiteboards) with CRDTs or OT, presence and offline sync. |
| `sdk-designer` | sonnet | write | designing or building client SDKs/libraries for an API: idiomatic interfaces, auth, retries, pagination, versioning and docs. |
| `search-integration-engineer` | sonnet | write | adding full-text search to an app with Elasticsearch, OpenSearch, Meilisearch or Typesense: indexing, relevance tuning, facets. |
| `svelte-developer` | sonnet | write | building or refactoring Svelte 5 / SvelteKit applications (runes, load functions, form actions, SSR). |
| `tauri-desktop-developer` | sonnet | write | building small, secure desktop apps with Tauri (Rust backend + web frontend) for Windows, macOS and Linux. |
| `ui-designer` | sonnet | write | designing visual interfaces, creating design systems, building component libraries, or refining user-facing aesthetics requiring expert visual design, interaction patterns, and accessibility considera |
| `webhook-engineer` | sonnet | write | consuming or delivering webhooks — signature verification, idempotent handlers, retry and backoff policies, event ordering, dead-letter queues, or designing an outbound webhook system for your own API |
| `webrtc-engineer` | sonnet | write | building audio/video calls, screen sharing or peer-to-peer data channels with WebRTC, including signaling and TURN servers. |
| `websocket-engineer` | sonnet | write | implementing real-time bidirectional communication features using WebSockets, Socket.IO, or similar technologies at scale. |

## 02-language-specialists — Рова Гимель — квартал языков (50)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `angular-architect` | sonnet | write | architecting enterprise Angular 15+ applications with complex state management, optimizing RxJS patterns, designing micro-frontend systems, or solving performance and scalability challenges in large c |
| `bash-scripting-expert` | sonnet | write | writing or hardening shell scripts: set -euo pipefail, quoting, portability, idempotency and shellcheck-clean code. |
| `c-systems-programmer` | sonnet | write | writing or reviewing C code: memory safety, undefined behaviour, POSIX APIs, Makefiles/CMake and sanitizers. |
| `clojure-developer` | sonnet | write | writing Clojure/ClojureScript: data-oriented design, REPL-driven development, deps.edn, spec/malli validation. |
| `cobol-modernization-specialist` | sonnet | read-only | analysing legacy COBOL systems: copybooks, batch jobs, business rules extraction and migration planning. |
| `cpp-pro` | sonnet | write | building high-performance C++ systems requiring modern C++20/23 features, template metaprogramming, or zero-overhead abstractions for systems programming, embedded systems, or performance-critical app |
| `csharp-developer` | sonnet | write | building ASP.NET Core web APIs, cloud-native .NET solutions, or modern C# applications requiring async patterns, dependency injection, Entity Framework optimization, and clean architecture. |
| `deno-bun-developer` | sonnet | write | building with Deno or Bun runtimes: permissions, built-in tooling, Web-standard APIs and Node compatibility. |
| `django-developer` | sonnet | write | building Django 4+ web applications, REST APIs, or modernizing existing Django projects with async views and enterprise patterns. |
| `dotnet-core-expert` | sonnet | write | building .NET Core applications requiring cloud-native architecture, high-performance microservices, modern C# patterns, or cross-platform deployment with minimal APIs and advanced ASP.NET Core featur |
| `dotnet-framework-4.8-expert` | sonnet | write | working on legacy .NET Framework 4.8 enterprise applications that require maintenance, modernization, or integration with Windows-based infrastructure. |
| `elixir-expert` | sonnet | write | build fault-tolerant, concurrent systems leveraging OTP patterns, GenServer architectures, and Phoenix framework for real-time applications. |
| `expo-react-native-expert` | sonnet | write | building mobile applications with Expo and React Native that require native module integration, navigation setup, performant animations, push notifications, OTA updates, or App Store/Play Store deploy |
| `fastapi-developer` | sonnet | write | building modern async Python APIs with FastAPI, implementing Pydantic v2 validation, dependency injection patterns, or deploying high-performance ASGI applications. |
| `flutter-expert` | sonnet | write | building cross-platform mobile applications with Flutter 3+ that require custom UI implementation, complex state management, native platform integrations, or performance optimization across iOS/Androi |
| `fortran-modernizer` | sonnet | write | maintaining or modernising Fortran scientific code: modules, free-form, OpenMP/MPI and Python bindings. |
| `golang-pro` | sonnet | write | building Go applications requiring concurrent programming, high-performance systems, microservices, or cloud-native architectures where idiomatic patterns, error handling excellence, and efficiency ar |
| `gradle-build-specialist` | sonnet | write | fixing or speeding up Gradle/Maven builds for JVM and Android projects: dependency conflicts, caching, multi-module setups. |
| `haskell-developer` | sonnet | write | working on Haskell code: type-level design, laziness and space leaks, Cabal/Stack builds and property-based testing. |
| `java-architect` | sonnet | write | designing enterprise Java architectures, migrating Spring Boot applications, or establishing microservices patterns for scalable cloud-native systems. |
| `javascript-pro` | sonnet | write | build, optimize, or refactor modern JavaScript code for browser, Node.js, or full-stack applications requiring ES2023+ features, async patterns, or performance-critical implementations. |
| `julia-developer` | sonnet | write | writing high-performance numerical or scientific code in Julia. |
| `kotlin-specialist` | sonnet | write | building Kotlin applications requiring advanced coroutine patterns, multiplatform code sharing, or Android/server-side development with functional programming principles. |
| `laravel-specialist` | sonnet | write | building Laravel 10+ applications, architecting Eloquent models with complex relationships, implementing queue systems for async processing, or optimizing API performance. |
| `lua-developer` | sonnet | write | writing Lua for games, Neovim plugins, OpenResty/Nginx or embedded scripting. |
| `nestjs-developer` | sonnet | write | building Node.js backends with NestJS: modules, providers, guards, pipes, TypeORM/Prisma and OpenAPI. |
| `nextjs-developer` | sonnet | write | building production Next.js 14+ applications that require full-stack development with App Router, server components, and advanced performance optimization. Invoke when you need to architect or impleme |
| `node-specialist` | sonnet | write | build, optimize, or debug Node.js backend applications, APIs, CLIs, or microservices requiring deep ecosystem knowledge and server-side JavaScript expertise. |
| `nuxt-developer` | sonnet | write | building Nuxt 3/4 applications: SSR, server routes, composables, Nitro deployment and SEO. |
| `objective-c-maintainer` | sonnet | write | maintaining legacy Objective-C iOS/macOS code and bridging it with Swift. |
| `perl-maintainer` | sonnet | write | maintaining or modernising legacy Perl scripts and applications safely. |
| `php-pro` | sonnet | write | working with PHP 8.3+ projects that require strict typing, modern language features, and enterprise framework expertise (Laravel or Symfony). Use when building scalable applications, optimizing perfor |
| `postgres-pro` | sonnet | write | optimize PostgreSQL performance, design high-availability replication, or troubleshoot database issues at scale. Invoke this agent for query optimization, configuration tuning, replication setup, back |
| `powershell-5.1-expert` | sonnet | write | automating Windows infrastructure tasks requiring PowerShell 5.1 scripts with RSAT modules for Active Directory, DNS, DHCP, GPO management, or when building safe, enterprise-grade automation workflows |
| `powershell-7-expert` | sonnet | write | building cross-platform cloud automation scripts, Azure infrastructure orchestration, or CI/CD pipelines requiring PowerShell 7+ with modern .NET interop, idempotent operations, and enterprise-grade e |
| `python-pro` | sonnet | write | build type-safe, production-ready Python code for web APIs, system utilities, or complex applications requiring modern async patterns and extensive type coverage. |
| `r-statistician` | sonnet | write | doing statistics or data analysis in R: tidyverse pipelines, models, ggplot2 charts and reproducible R Markdown/Quarto reports. |
| `rails-expert` | sonnet | write | building or modernizing Rails applications requiring API development, Hotwire reactivity, real-time features, background job processing, deployment automation, or Rails-idiomatic patterns for maximum  |
| `react-specialist` | sonnet | write | optimizing existing React applications for performance, implementing advanced React 18+ features, or solving complex state management and architectural challenges within React codebases. |
| `rust-engineer` | sonnet | write | building Rust systems where memory safety, ownership patterns, zero-cost abstractions, and performance optimization are critical for systems programming, embedded development, async applications, or h |
| `scala-developer` | sonnet | write | writing or reviewing Scala 3 code: functional effects (Cats Effect/ZIO), Akka/Pekko, sbt builds and JVM performance. |
| `spring-boot-engineer` | sonnet | write | building enterprise Spring Boot 3+ applications requiring microservices architecture, cloud-native deployment, or reactive programming patterns. |
| `sql-pro` | sonnet | write | optimize complex SQL queries, design efficient database schemas, or solve performance issues across PostgreSQL, MySQL, SQL Server, and Oracle requiring advanced query optimization, index strategies, o |
| `swift-expert` | sonnet | write | building native iOS, macOS, or server-side Swift applications requiring advanced concurrency patterns, protocol-oriented architecture, and Swift-specific optimizations. Invoke for SwiftUI modernizatio |
| `symfony-specialist` | sonnet | write | building Symfony 6+/7+/8+ applications, architecting Doctrine ORM entities with complex relationships, implementing Messenger component for async processing, or optimizing API Platform performance. |
| `typescript-pro` | sonnet | write | implementing TypeScript code requiring advanced type system patterns, complex generics, type-level programming, or end-to-end type safety across full-stack applications. |
| `vue-expert` | sonnet | write | building Vue 3 applications that require Composition API mastery, reactivity optimization, or Nuxt 3 development with enterprise-scale performance concerns. |
| `webassembly-developer` | sonnet | write | compiling code to WebAssembly (Rust, C/C++, Go) and integrating it into web or server apps. |
| `wordpress-master` | sonnet | write | architect, optimize, or troubleshoot WordPress implementations ranging from custom theme/plugin development to enterprise-scale multisite platforms. Invoke this agent for performance optimization, sec |
| `zig-developer` | sonnet | write | writing systems code in Zig: explicit allocators, comptime, C interop and cross-compilation. |

## 03-infrastructure — Порт Ашдода — инфраструктура и доставка (30)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `ansible-automation-engineer` | sonnet | write | automating server configuration with Ansible: roles, inventories, idempotent tasks, vault for secrets. |
| `aws-solutions-engineer` | sonnet | write | building on AWS: IAM least privilege, VPC design, ECS/EKS/Lambda, RDS, S3 and cost-aware architectures. |
| `azure-infra-engineer` | sonnet | write | designing, deploying, or managing Azure infrastructure with focus on network architecture, Entra ID integration, PowerShell automation, and Bicep IaC. |
| `backup-recovery-specialist` | sonnet | write | designing and testing backups and disaster recovery: RPO/RTO, database backups, restore drills and offsite copies. |
| `ci-pipeline-optimizer` | sonnet | write | making CI pipelines (GitHub Actions, GitLab CI) faster and more reliable: caching, parallelism, flaky steps, pinned actions. |
| `cloud-architect` | inherit | write | design, evaluate, or optimize cloud infrastructure architecture at scale. Invoke when designing multi-cloud strategies, planning cloud migrations, implementing disaster recovery, optimizing cloud cost |
| `database-administrator` | sonnet | write | optimizing database performance, implementing high-availability architectures, setting up disaster recovery, or managing database infrastructure for production systems. |
| `deployment-engineer` | haiku | write | designing, building, or optimizing CI/CD pipelines and deployment automation strategies. |
| `devops-engineer` | sonnet | write | building or optimizing infrastructure automation, CI/CD pipelines, containerization strategies, and deployment workflows to accelerate software delivery while maintaining reliability and security. |
| `devops-incident-responder` | sonnet | write | actively responding to production incidents, diagnosing critical service failures, or conducting incident postmortems to implement permanent fixes and preventative measures. |
| `dns-email-admin` | sonnet | write | configuring DNS and email deliverability: records, SPF, DKIM, DMARC, MX, TTLs and domain migrations. |
| `docker-expert` | sonnet | write | build, optimize, or secure Docker container images and orchestration for production environments. |
| `edge-cdn-engineer` | sonnet | write | configuring CDNs and edge compute (Cloudflare, Fastly, CloudFront): caching rules, edge functions, WAF and image optimisation. |
| `finops-cost-optimizer` | sonnet | read-only | reducing cloud and SaaS spend: rightsizing, reserved capacity, idle resources, storage tiers and cost allocation. |
| `gcp-engineer` | sonnet | write | building on Google Cloud: Cloud Run, GKE, Cloud SQL, IAM, VPC and BigQuery. |
| `helm-chart-maintainer` | sonnet | write | writing or maintaining Helm charts: values design, templates, upgrades, chart tests and versioning. |
| `incident-responder` | sonnet | write | an active security breach, service outage, or operational incident requires immediate response, evidence preservation, and coordinated recovery. |
| `kubernetes-specialist` | sonnet | write | design, deploy, configure, or troubleshoot Kubernetes clusters and workloads in production environments. |
| `linux-sysadmin` | sonnet | write | administering Linux servers: systemd services, users and permissions, firewall, logs, packages and hardening. |
| `network-engineer` | sonnet | write | designing, optimizing, or troubleshooting cloud and hybrid network infrastructures, or when addressing network security, performance, or reliability challenges. |
| `observability-engineer` | sonnet | write | setting up monitoring: Prometheus metrics, Grafana dashboards, OpenTelemetry tracing, structured logs and alert rules. |
| `platform-engineer` | inherit | write | building or improving internal developer platforms (IDPs), designing self-service infrastructure, or optimizing developer workflows to reduce friction and accelerate delivery. The platform-engineer ag |
| `reverse-proxy-specialist` | sonnet | write | configuring Nginx, Caddy or Traefik: TLS, HTTP/2/3, reverse proxying, WebSockets, compression and security headers. |
| `self-hosting-admin` | sonnet | write | self-hosting services on a home server or small VPS: Docker Compose stacks, reverse proxy, backups, updates and remote access. |
| `serverless-engineer` | sonnet | write | building serverless functions (AWS Lambda, Cloud Functions, Vercel/Netlify functions): cold starts, limits, events and costs. |
| `service-mesh-engineer` | sonnet | write | running a service mesh (Istio, Linkerd): mTLS, traffic splitting, retries, timeouts and observability. |
| `sre-engineer` | sonnet | write | establish or improve system reliability through SLO definition, error budget management, and automation. Invoke when implementing SLI/SLO frameworks, reducing operational toil, designing fault-toleran |
| `terraform-engineer` | sonnet | write | building, refactoring, or scaling infrastructure as code using Terraform with focus on multi-cloud deployments, module architecture, and enterprise-grade state management. |
| `terragrunt-expert` | sonnet | write | Expert Terragrunt specialist mastering infrastructure orchestration, DRY configurations, and multi-environment deployments. Masters stacks, units, dependency management, and scalable IaC patterns with |
| `windows-infra-admin` | sonnet | write | managing Windows Server infrastructure, Active Directory, DNS, DHCP, and Group Policy configurations, especially for enterprise-scale deployments requiring safe automation and compliance validation. |

## 04-quality-security — Рова Далет — контроль качества и безопасность (35)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `accessibility-tester` | haiku | write | comprehensive accessibility testing, WCAG compliance verification, or assessment of assistive technology support. |
| `ad-security-reviewer` | inherit | write | audit Active Directory security posture, evaluate privilege escalation risks, review identity delegation patterns, or assess authentication protocol hardening. |
| `api-contract-tester` | sonnet | write | testing APIs against their contract: OpenAPI schema validation, consumer-driven contracts (Pact), status codes and error formats. |
| `architect-reviewer` | inherit | write | evaluate system design decisions, architectural patterns, and technology choices at the macro level. |
| `auth-security-reviewer` | sonnet | read-only | reviewing authentication and session security: password storage, tokens, OAuth flows, MFA, session fixation and access control. |
| `chaos-engineer` | sonnet | write | design and execute controlled failure experiments, validate system resilience before incidents occur, or conduct game day exercises to test your team's incident response capabilities. |
| `code-reviewer` | inherit | write | conduct comprehensive code reviews focusing on code quality, security vulnerabilities, and best practices. |
| `compliance-auditor` | inherit | read-only | achieve regulatory compliance, implement compliance controls, or prepare for audits across frameworks like GDPR, HIPAA, PCI DSS, SOC 2, and ISO standards. |
| `container-security-auditor` | sonnet | read-only | auditing Docker images and Kubernetes workloads: base images, root users, capabilities, secrets, network policies and image scanning. |
| `debugger` | sonnet | write | diagnose and fix bugs, identify root causes of failures, or analyze error logs and stack traces to resolve issues. |
| `dependency-vulnerability-scanner` | sonnet | read-only | auditing third-party dependencies for known vulnerabilities, abandoned packages and risky licences (npm audit, pip-audit, OSV). |
| `e2e-playwright-tester` | sonnet | write | writing end-to-end browser tests with Playwright: user journeys, stable locators, fixtures, traces and CI integration. |
| `error-detective` | sonnet | write | diagnose why errors are occurring in your system, correlate errors across services, identify root causes, and prevent future failures. |
| `flaky-test-hunter` | sonnet | write | tests pass and fail intermittently: reproduce flakiness, find timing/order/shared-state causes and fix them. |
| `fuzzing-engineer` | sonnet | write | fuzzing parsers, protocols or APIs (libFuzzer, AFL++, Atheris, property-based fuzzing) to find crashes and security bugs. |
| `load-tester` | sonnet | write | running load and stress tests (k6, Locust, JMeter): realistic scenarios, ramp-up, thresholds and bottleneck reports. |
| `mobile-app-tester` | sonnet | write | testing iOS/Android apps: Appium/Detox/Maestro flows, device matrices, permissions, offline and deep links. |
| `mutation-testing-specialist` | sonnet | write | measuring test-suite strength with mutation testing (Stryker, mutmut, PIT) and closing the gaps it reveals. |
| `penetration-tester` | inherit | write | conduct authorized security penetration tests to identify real vulnerabilities through active exploitation and validation. Use penetration-tester for offensive security testing, vulnerability exploita |
| `performance-engineer` | sonnet | write | identify and eliminate performance bottlenecks in applications, databases, or infrastructure systems, and when baseline performance metrics need improvement. |
| `ponder-auditor` | inherit | write | a convergent, multi-pass codebase, UI, architecture, or security audit with 100% surface coverage, adversarial false-positive retraction (Skeptic), user-empathy severity ranking (Empath), and epistemi |
| `powershell-security-hardening` | inherit | write | harden PowerShell automation, secure remoting configuration, enforce least-privilege design, or align scripts with enterprise security baselines and compliance frameworks. |
| `qa-expert` | sonnet | write | comprehensive quality assurance strategy, test planning across the entire development cycle, or quality metrics analysis to improve overall software quality. |
| `release-qa-gatekeeper` | sonnet | read-only | a release needs a go/no-go decision: test results, open bugs, migrations, rollback plan and monitoring readiness. |
| `secrets-leak-auditor` | sonnet | read-only | checking a repository, its history, logs or configs for leaked secrets (API keys, tokens, passwords, private keys). |
| `security-auditor` | inherit | read-only | conducting comprehensive security audits, compliance assessments, or risk evaluations across systems, infrastructure, and processes. Invoke when you need systematic vulnerability analysis, compliance  |
| `security-engineer` | inherit | write | implementing comprehensive security solutions across infrastructure, building automated security controls into CI/CD pipelines, or establishing compliance and vulnerability management programs. Invoke |
| `supply-chain-security-reviewer` | sonnet | read-only | reviewing software supply chain risks: CI permissions, pinned actions, build provenance (SLSA), signed releases and install scripts. |
| `surgeon-reviewer` | inherit | write | a ruthlessly prioritized code review that reports only real problems — bugs, money-losing logic, maintenance traps — ranked by blast radius, with zero style opinions and a clear ship/no-ship verdict. |
| `test-automator` | sonnet | write | build, implement, or enhance automated test frameworks, create test scripts, or integrate testing into CI/CD pipelines. |
| `test-data-manager` | sonnet | write | creating test data: factories, fixtures, anonymised production-like datasets and database seeding for tests and demos. |
| `threat-modeler` | sonnet | write | threat-modelling a system or feature (STRIDE, attack trees): assets, trust boundaries, threats and mitigations before building. |
| `ui-ux-tester` | sonnet | write | exhaustive UI and UX functionality testing driven by documented user flows, with browser or desktop interaction tooling and structured defect reporting. ⚠️ removed invalid tool names 'chrome-mcp', 'computer-use'; no browser tool; use Playwright via Bash |
| `unit-test-writer` | haiku | write | an existing module needs focused unit tests: edge cases, error paths and fast, deterministic tests in the project's framework. |
| `visual-regression-tester` | sonnet | write | catching unintended UI changes with screenshot comparison: baselines, thresholds, responsive breakpoints and dark mode. |

## 05-data-ai — Рова Хей — научный городок данных и ИИ (25)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `ai-safety-evaluator` | sonnet | read-only | red-teaming an LLM feature: prompt injection, data leakage, jailbreaks, harmful output and tool misuse risks. |
| `analytics-engineer` | sonnet | write | modelling analytics data with dbt or SQL: staging/marts layers, tests, documentation and metric definitions. |
| `bi-dashboard-developer` | sonnet | write | building BI dashboards (Metabase, Superset, Power BI, Grafana): KPIs, filters, drill-downs and data freshness. |
| `computer-vision-engineer` | sonnet | write | building image or video understanding: detection, segmentation, OCR, classification and on-device inference. |
| `data-engineer` | sonnet | write | design, build, or optimize data pipelines, ETL/ELT processes, and data infrastructure. Invoke when designing data platforms, implementing pipeline orchestration, handling data quality issues, or optim |
| `data-quality-engineer` | sonnet | write | checking and enforcing data quality: validation rules, anomaly detection, freshness and lineage for pipelines. |
| `data-scientist` | sonnet | write | analyze data patterns, build predictive models, or extract statistical insights from datasets. Invoke this agent for exploratory analysis, hypothesis testing, machine learning model development, and t |
| `data-visualization-specialist` | sonnet | write | turning data into clear charts and visual stories for reports, presentations or the web (matplotlib, Plotly, D3, Vega-Lite). |
| `database-optimizer` | sonnet | write | analyze slow queries, optimize database performance across multiple systems, or implement indexing strategies to improve query execution. |
| `embedding-search-engineer` | sonnet | write | building semantic search or similarity features with embeddings and vector databases (Chroma, pgvector, Qdrant, FAISS). |
| `etl-orchestration-engineer` | sonnet | write | orchestrating batch pipelines with Airflow, Dagster or Prefect: DAG design, retries, backfills and dependencies. |
| `feature-engineering-specialist` | sonnet | write | creating model features: encodings, aggregations over time windows, leakage checks and feature stores. |
| `llm-engineer` | sonnet | write | building features on large language models: API integration, structured output, tool calling, streaming, retries and cost control. |
| `local-llm-ops` | sonnet | write | running local models with Ollama or llama.cpp: model choice for the hardware, quantisation, context size, GPU/CPU tuning and Modelfiles. |
| `machine-learning-engineer` | sonnet | write | deploy, optimize, or serve machine learning models at scale in production environments. |
| `mlops-engineer` | sonnet | write | design and implement ML infrastructure, set up CI/CD for machine learning models, establish model versioning systems, or optimize ML platforms for reliability and automation. Invoke this agent to buil |
| `model-evaluation-specialist` | sonnet | read-only | evaluating ML or LLM models: test sets, metrics, error analysis, fairness slices and comparison against baselines. |
| `nlp-engineer` | sonnet | write | processing text: classification, entity extraction, language detection, tokenisation and multilingual (Russian/Hebrew/English) pipelines. |
| `prompt-engineer` | sonnet | write | writing, testing and improving prompts and system prompts for LLM agents, with examples and an evaluation set. |
| `rag-architect` | sonnet | write | designing retrieval-augmented generation: chunking, embeddings, vector stores, hybrid search, reranking and citation of sources. |
| `recommendation-systems-engineer` | sonnet | write | building recommendations: candidate generation, ranking, cold start, feedback loops and offline/online evaluation. |
| `speech-ai-engineer` | sonnet | write | building speech features: speech-to-text (Whisper), text-to-speech (Piper), voice activity detection and audio pipelines. |
| `streaming-data-engineer` | sonnet | write | building streaming pipelines with Kafka, Redpanda or Flink: topics, schemas, exactly-once semantics and consumer lag. |
| `synthetic-data-generator` | sonnet | write | generating synthetic datasets for testing or training: realistic distributions, constraints, privacy and labelling. |
| `time-series-forecaster` | sonnet | write | forecasting time series: demand, traffic, prices, energy — with baselines, backtesting and prediction intervals. |

## 06-developer-experience — Рова Вав — мастерские инструментов (15)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `api-docs-generator` | sonnet | write | generating and improving API reference documentation from code or OpenAPI: examples, error codes and auth instructions. |
| `build-performance-optimizer` | sonnet | write | builds or dev servers are slow: profiling bundlers (Vite, webpack, esbuild), TypeScript project references and caching. |
| `changelog-writer` | haiku | write | writing release notes and changelogs from commits and pull requests for users and developers. |
| `code-executor` | sonnet | write | a small program, script or data transformation must actually be written and run to get an answer — reproduce a bug, compute a result, convert files — inside the project sandbox. ⚠️ prefers the openhands runtime (runs code in the project); needs owner confirmation |
| `codebase-orchestrator` | inherit | write | repository-wide refactor governance with explicit approval loops, weighted risk prioritization, diff previews, and deterministic fallback strategies. ⚠️ removed 6 invalid tool names (agent names / plugin skills / MCP gateway); subagents cannot launch subagents; orchestration is done by the main session |
| `dependency-upgrade-manager` | sonnet | write | upgrading dependencies or frameworks: reading changelogs, codemods, fixing breaking changes and verifying with tests. |
| `developer-onboarding-guide` | haiku | write | writing onboarding material for a codebase: setup guide, architecture tour, first tasks and glossary for new contributors. |
| `documentation-site-builder` | sonnet | write | building documentation sites (Docusaurus, MkDocs, VitePress, Starlight): structure, search, versioning and deployment. |
| `git-workflow-expert` | sonnet | write | sorting out Git problems or workflows: branching strategy, rebases, conflicts, history cleanup, hooks and recovering lost work. |
| `license-engineer` | inherit | write | architecting, implementing, or optimizing end-to-end legal licensing systems—from OSI standard selection and dependency compliance pipelines to proprietary deployment and risk monitoring. |
| `lint-format-configurator` | haiku | write | setting up or unifying linters and formatters (ESLint, Prettier, Ruff, Black, golangci-lint) and pre-commit hooks. |
| `monorepo-maintainer` | sonnet | write | managing monorepos (pnpm/npm workspaces, Nx, Turborepo, Bazel): package boundaries, shared configs and affected-only builds. |
| `project-scaffolder` | sonnet | write | starting a new project or module from scratch: folder structure, tooling, tests, CI and README following best practice for the stack. |
| `refactoring-specialist` | sonnet | write | restructuring code without changing behaviour: extracting modules, removing duplication, simplifying conditionals — under test protection. |
| `technical-writer` | haiku | write | create, improve, or maintain technical documentation including API references, user guides, SDK documentation, and getting-started guides. |

## 07-specialized-domains — Промзона — специализированные отрасли (30)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `agritech-engineer` | sonnet | write | building agriculture technology: field sensors, irrigation control, crop monitoring with satellite/drone imagery and farm records. |
| `audio-music-developer` | sonnet | write | building audio or music software: Web Audio, DSP effects, MIDI, audio file processing and low-latency playback. |
| `automotive-telematics-engineer` | sonnet | write | working with vehicle data: OBD-II/CAN telemetry, GPS tracks, trip detection, driver scoring and EV charging data. |
| `blockchain-developer` | sonnet | write | Use this agent for smart contracts and blockchain integrations: Solidity/EVM contracts, wallets, transaction signing flows and on-chain data reading. |
| `construction-estimator` | sonnet | research | estimating construction or renovation work: quantities, materials, labour, schedules and cost ranges with assumptions. |
| `ecommerce-developer` | sonnet | write | building online stores: catalog, cart, checkout, payments integration, inventory, orders, shipping and promotions. |
| `edtech-developer` | sonnet | write | building learning platforms: courses, lessons, quizzes, progress tracking, certificates and teacher dashboards. |
| `event-ticketing-developer` | sonnet | write | building event ticketing: seat maps, holds, high-demand sales queues, QR tickets, scanning and refunds. |
| `fintech-engineer` | sonnet | write | building or reviewing financial software: payments, ledgers, money arithmetic, reconciliation, idempotent transactions and audit trails. |
| `fleet-routing-engineer` | sonnet | write | optimising vehicle routes and fleets: VRP solvers (OR-Tools), time windows, capacities, live tracking and ETA. |
| `game-developer` | sonnet | write | Use this agent for game and real-time 3D development: game loops, Three.js/WebGL scenes, physics, input, animation and performance on desktop and mobile. |
| `govtech-forms-developer` | sonnet | write | digitising public-service forms and workflows: accessible multi-step forms, validation, document upload, status tracking. |
| `healthtech-engineer` | sonnet | write | Use this agent for health software: patient data models, HL7/FHIR integration, consent, audit logging and privacy (HIPAA/GDPR) requirements. |
| `hospitality-tech-specialist` | sonnet | write | building hotel and short-stay rental software: room inventory, channel managers, check-in, housekeeping and guest messaging. |
| `hr-tech-specialist` | sonnet | write | building HR and recruiting software: job posts, applicant tracking, interview scheduling, onboarding and employee records. |
| `i18n-rtl-specialist` | sonnet | write | Use this agent to internationalise apps for Russian, Hebrew, Arabic and English: translation keys, plural rules, RTL layouts, date/number/currency formats and fonts. |
| `insurance-domain-analyst` | sonnet | research | analysing insurance products and processes: policies, premiums, claims workflows, underwriting rules and regulatory notes. |
| `iot-engineer` | sonnet | write | Use this agent for IoT systems: device firmware interfaces, MQTT/CoAP messaging, telemetry pipelines, device provisioning and over-the-air updates. |
| `legaltech-engineer` | sonnet | write | building legal-tech software: document assembly from templates, clause libraries, e-signature flows and matter management. |
| `maritime-weather-analyst` | haiku | research | Use this agent to read marine and weather forecasts for coastal operations (ports, marinas, beaches): wind, waves, visibility, and go/no-go windows for activities. ⚠️ advisory only; always check official marine forecasts before going to sea |
| `media-streaming-engineer` | sonnet | write | building video/audio streaming: HLS/DASH packaging, adaptive bitrate, transcoding pipelines, DRM basics and players. |
| `port-logistics-planner` | sonnet | research | Use this agent for maritime and port logistics: container flows, vessel schedules, berth and yard planning, customs paperwork steps, and cost/time estimates for shipments. |
| `real-estate-analyst` | sonnet | research | Use this agent for real-estate questions: comparing listings, price per square metre, rental yield, neighbourhood factors, and the data model and features of real-estate websites. |
| `restaurant-ordering-developer` | sonnet | write | building restaurant ordering and delivery: menus with modifiers, carts, kitchen display, delivery zones and peak-hour load. |
| `retail-pos-specialist` | sonnet | write | building retail point-of-sale and inventory systems: barcode scanning, offline sales, receipts, stock counts and integrations. |
| `smart-city-planner` | sonnet | write | planning smart-city and urban solutions: mobility, parking, lighting, waste, sensors and open data — with citizen privacy in mind. |
| `solar-energy-analyst` | sonnet | research | assessing solar and energy projects: PV yield estimates, consumption profiles, battery sizing, tariffs and payback. |
| `sports-analytics-analyst` | sonnet | research | analysing sports data: match and player statistics, expected-goals style models, scouting reports and visualisations. |
| `telegram-bot-developer` | sonnet | write | Use this agent to build Telegram bots: commands, inline keyboards, webhooks, payments, mini apps and moderation, with safe token handling. |
| `travel-booking-engineer` | sonnet | write | building travel and booking systems: availability, reservations, holds, cancellations, time zones and supplier APIs. |

## 08-business-product — Сити — деловой центр (35)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `ai-writing-auditor` | inherit | write | audit content for AI writing patterns and rewrite text to remove them. |
| `assumption-mapping` | inherit | write | the user needs to identify and prioritize risky assumptions in a product idea, feature, or strategy. Triggers on: 'assumptions', 'what could go wrong', 'validate', 'riskiest assumption', 'de-risk', 'a |
| `backlog-grooming` | inherit | write | the user needs to groom, refine, or clean up a product backlog. Triggers on: 'groom backlog', 'backlog refinement', 'backlog grooming', 'clean up backlog', 'refine stories', 'sprint refinement', 'back |
| `brand-strategist` | sonnet | write | defining brand positioning, naming, voice and messaging for a product or company. |
| `business-analyst` | sonnet | write | analyzing business processes, gathering requirements from stakeholders, or identifying process improvement opportunities to drive operational efficiency and measurable business value. |
| `community-manager` | haiku | write | growing and moderating communities (Telegram, Discord, forums): rules, onboarding, events and moderation playbooks. |
| `content-marketer` | haiku | write | develop comprehensive content strategies, create SEO-optimized marketing content, or execute multi-channel content campaigns to drive engagement and conversions. Invoke this agent for content planning |
| `content-quality-editor` | haiku | write | Use this agent before publishing any AI-generated content — blog posts, READMEs, release notes, commit messages, PR descriptions, documentation, or social posts. Strips AI writing patterns using unslo |
| `contract-clause-reviewer` | sonnet | read-only | reviewing a contract's clauses for business risk: liability, payment terms, IP, termination, auto-renewal and data protection. |
| `customer-success-manager` | sonnet | write | assess customer health, develop retention strategies, identify upsell opportunities, or maximize customer lifetime value. Invoke this agent for account health analysis, churn prevention, product adopt |
| `customer-support-responder` | haiku | write | drafting customer support replies and help-centre articles: empathetic, accurate answers with clear next steps. |
| `email-marketing-specialist` | sonnet | write | planning and writing email campaigns: segments, sequences, subject lines, deliverability and consent. |
| `financial-modeler` | sonnet | write | building financial models: revenue builds, unit economics, cash flow, runway and scenarios in spreadsheets or Python. |
| `gdpr-ccpa-compliance` | inherit | research | the user needs to understand GDPR or CCPA compliance, review data practices, or assess privacy requirements. Triggers on: 'GDPR', 'CCPA', 'privacy compliance', 'data privacy', 'right to deletion', 'co |
| `grant-writer` | sonnet | write | preparing grant or tender applications: eligibility checks, objectives, work plans, budgets and impact metrics. |
| `growth-loops` | inherit | write | the user wants to design a growth loop, understand PLG mechanics, or build sustainable acquisition. Triggers on: 'growth loop', 'flywheel', 'viral loop', 'PLG growth', 'product-led growth', 'growth me |
| `investor-update-writer` | haiku | write | writing monthly or quarterly investor updates: metrics, highlights, lowlights, asks and runway. |
| `landing-page-copywriter` | sonnet | write | writing or optimizing landing page copy, hero sections, CTAs, or conversion-focused funnel content for a specific audience and offer. |
| `legal-advisor` | sonnet | write | draft contracts, review compliance requirements, develop IP protection strategies, or assess legal risks for technology businesses. |
| `meeting-notes-summarizer` | haiku | write | turning meeting transcripts or notes into summaries with decisions, action items, owners and deadlines. |
| `okr-coach` | haiku | write | setting goals and OKRs: objectives, measurable key results, alignment across teams and quarterly reviews. |
| `partnership-manager` | sonnet | write | planning partnerships and business development: partner fit, value exchange, outreach and partnership agreements' key terms. |
| `pitch-deck-writer` | sonnet | write | writing investor pitch decks: story, problem, solution, market, traction, team and the ask. |
| `pricing-strategist` | sonnet | research | deciding prices and packaging: value metrics, tiers, competitor pricing, willingness-to-pay research and discounts. |
| `procurement-vendor-evaluator` | sonnet | research | choosing vendors or SaaS tools: requirements, shortlists, scoring matrices, security questionnaires and total cost of ownership. |
| `product-manager` | haiku | write | make product strategy decisions, prioritize features, or define roadmap plans based on user needs and business goals. |
| `project-manager` | haiku | write | establish project plans, track execution progress, manage risks, control budget/schedule, and coordinate stakeholders across complex initiatives. |
| `russian-hebrew-translator` | sonnet | write | translating between Russian, Hebrew and English: interfaces, documents and marketing copy with correct terminology and RTL formatting. |
| `sales-engineer` | sonnet | write | conduct technical pre-sales activities including solution architecture, proof-of-concept development, and technical demonstrations for complex sales deals. |
| `scrum-master` | haiku | write | teams need facilitation, process optimization, velocity improvement, or agile ceremony management—especially for sprint planning, retrospectives, impediment removal, and scaling agile practices across |
| `seo-specialist` | sonnet | research | improving search visibility: technical SEO audits, keyword research, on-page optimisation, structured data and multilingual SEO. |
| `social-media-manager` | sonnet | write | planning social media content: content calendars, platform-specific posts, hashtags, community replies and analytics. |
| `telegram-ads-analyst` | inherit | write | the user wants to advertise in Telegram channels, vet a channel before buying a post, check whether a channel's audience is real, or price a Telegram ad. Triggers on: 'Telegram ads', 'Telegram channel |
| `ux-microcopy-reviewer` | sonnet | read-only | Use this agent after changing user-facing interface text (buttons, error messages, empty states, form labels, confirmations, toasts) to review it for clarity, consistency and accessibility before it s |
| `ux-researcher` | sonnet | research | conduct user research, analyze user behavior, or generate actionable insights to validate design decisions and uncover user needs. Invoke when you need usability testing, user interviews, survey desig |

## 09-meta-orchestration — Рова Зайн — диспетчерская (15)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `agent-organizer` | sonnet | write | break a complex task into subtasks, match each to the capabilities of available subagents, and write a concrete team/workflow plan as Markdown. ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `context-manager` | sonnet | write | Use to organize the shared context and state that a multi-agent workflow keeps in files — deciding directory/file structure, naming conventions, what goes where, and how agents read and update it. ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `error-coordinator` | sonnet | write | mine error logs and agent output for recurring failure and cascade patterns, then document grounded recovery and cascade-prevention strategies (as Markdown specs) that other agents or humans can act o ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `handoff-brief-writer` | haiku | write | work passes from one agent to another: write a self-contained brief with goal, context files, constraints, done-criteria and open questions. |
| `it-ops-orchestrator` | sonnet | write | Use for orchestrating complex IT operations tasks that span multiple domains (PowerShell automation, .NET development, infrastructure management, Azure, M365) by intelligently routing work to speciali ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `knowledge-synthesizer` | sonnet | write | mine recurring patterns from agent logs, session transcripts, and workflow history, then write grounded, evidence-cited findings that other agents or humans can act on. |
| `local-assistant` | haiku | read-only | Use this agent for quick, low-cost answers that do not need tools or the internet — explanations, short rewrites, checklists, summaries of text given in the prompt. Designed to run on a local model (O ⚠️ made for the ollama runtime: free local answers, no tools |
| `memory-curator` | sonnet | write | Use to maintain an agent's long-term memory across sessions — deciding what is worth saving, recalling relevant context before acting, recording corrections without erasing history, and pruning what n |
| `multi-agent-coordinator` | inherit | write | plan how multiple concurrent subagents should communicate, sequence their work, share state through files, and handle failures — written up as a coordination plan or convention in Markdown. ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `performance-monitor` | haiku | write | analyze existing metric, log, and output files to spot performance patterns and anomalies, then write a grounded, evidence-cited observability plan (what to measure, thresholds, dashboards) as Markdow |
| `quality-gate-reviewer` | sonnet | read-only | another agent's output must be checked before it is used: completeness, correctness against the task, evidence and unverified claims. |
| `runtime-cost-router` | haiku | write | choosing which runtime and model should run a task (Ollama, LangGraph, CAMEL, browser-use, OpenHands, Claude Code, n8n) to balance cost, speed and quality. |
| `task-distributor` | haiku | write | design and document a task-distribution strategy across multiple agents or workers — how to split work, order queues, respect priorities and deadlines, and balance load — written as a clear Markdown p ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `workflow-orchestrator` | inherit | write | design workflow and state-machine definitions — states, transitions, error handling, and compensation/rollback logic — and write them as specs or config that other agents or a runtime can execute. ⚠️ coordinator role: produces a plan; the main session launches the workers |
| `workflow-planner` | sonnet | write | a multi-step task must be turned into an explicit plan of steps, owners (library agents) and checks before execution — e.g. as the plan node of the LangGraph JARVIS workflow. ⚠️ plan node of the LangGraph JARVIS workflow; plans only |

## 10-research-analysis — Рова Хет — библиотека и аналитика (27)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `ab-test-analysis` | inherit | research | the user wants to analyze A/B test results, interpret p-values, determine statistical significance, or make a ship/no-ship decision. Triggers on: 'analyze A/B test', 'p-value', 'statistical significan |
| `academic-paper-summarizer` | haiku | research | summarising academic papers: research question, method, data, results, limitations and practical relevance. |
| `cis-market-researcher` | sonnet | research | researching Russian-speaking markets and audiences in the CIS and diaspora: channels, competitors, payment habits and localisation. |
| `cohort-analysis` | inherit | research | the user wants to analyze retention, cohort behavior, engagement trends, or understand how different user groups perform over time. Triggers on: 'cohort analysis', 'retention analysis', 'user retentio |
| `competitive-analyst` | sonnet | research | analyze direct and indirect competitors, benchmark against market leaders, or develop strategies to strengthen competitive positioning and market advantage. |
| `data-researcher` | sonnet | research | discover, collect, and validate data from multiple sources to fuel analysis and decision-making. Invoke this agent for identifying data sources, gathering raw datasets, performing quality checks, and  |
| `fact-checker` | sonnet | research | verifying claims, numbers and quotes in a text against reliable sources before publishing. |
| `first-principles-thinking` | inherit | research | the user wants to challenge assumptions, break down a complex problem from scratch, or approach something with first principles reasoning. Triggers on: 'first principles', 'challenge assumptions', 'wh |
| `israel-market-researcher` | sonnet | research | researching the Israeli market: consumers, competitors, regulation, pricing in ILS, Hebrew/Russian-speaking audiences and local channels. |
| `market-researcher` | sonnet | research | analyze markets, understand consumer behavior, assess competitive landscapes, and size opportunities to inform business strategy and market entry decisions. |
| `news-digest-monitor` | haiku | research | preparing a news digest on a topic: recent developments, sources, dates and why each item matters. |
| `open-source-scout` | sonnet | research | looking for open-source projects to reuse: finding GitHub repositories, checking activity, licence, security and how to integrate them as packages. |
| `patent-researcher` | sonnet | research | searching patents and prior art: claims analysis, classification codes, freedom-to-operate notes and patent landscapes. |
| `policy-regulation-researcher` | sonnet | research | researching laws, regulations and standards that affect a product: requirements, deadlines and obligations with official sources. |
| `price-monitoring-analyst` | haiku | research | tracking prices of products or services across sellers: comparison tables, changes over time and alerts. |
| `project-idea-validator` | sonnet | write | an idea pressure-tested with brutal honesty, competitor teardown, market validation, and clear go/no-go guidance before building. |
| `research-analyst` | sonnet | research | comprehensive research across multiple sources with synthesis of findings into actionable insights, trend identification, and detailed reporting. |
| `scientific-literature-researcher` | sonnet | research | search scientific literature and retrieve structured experimental data from published studies. Invoke this agent when the task requires evidence-grounded answers from full-text research papers, includ ⚠️ needs the 'bgpt' MCP server (mcp__bgpt__search_papers, external service bgpt.pro); without it only WebSearch/WebFetch |
| `search-specialist` | sonnet | research | find specific information across multiple sources using advanced search strategies, query optimization, and targeted information retrieval. Invoke this agent when the priority is locating precise, rel |
| `sentiment-analyst` | sonnet | research | analysing opinions in reviews, social posts or support tickets: sentiment, topics, trends and representative examples. |
| `statistics-consultant` | sonnet | research | a question needs the right statistical method: test selection, sample size, regression, confidence intervals and interpretation. |
| `supply-chain-risk-analyst` | sonnet | research | assessing supply chain risks: supplier concentration, lead times, geopolitical and logistics disruptions and mitigations. |
| `survey-designer` | sonnet | write | designing surveys and questionnaires: unbiased questions, scales, sampling and analysis plans. |
| `tech-stack-evaluator` | sonnet | research | choosing technologies: comparing frameworks, databases or services on maturity, community, licence, performance and fit. |
| `trend-analyst` | sonnet | research | analyzing emerging patterns, predicting industry shifts, or developing future scenarios to inform strategic planning and competitive positioning. |
| `user-interview-synthesizer` | sonnet | write | synthesising user interviews: coding notes, themes, quotes, jobs-to-be-done and opportunity areas. |
| `web-researcher` | sonnet | research | facts gathered from live websites — prices, documentation, release notes, listings, official announcements — with every claim tied to the page it came from. ⚠️ prefers the browser_use runtime (local Chromium) or Claude Code with WebSearch/WebFetch |

## disabled — Отключённые (1)

| Агент | Модель | Доступ | Специализация |
|---|---|---|---|
| `agent-installer` | haiku | write | the user wants to discover, browse, or install Claude Code agents from the awesome-claude-code-subagents repository. ⚠️ disabled: downloads unreviewed agent files from VoltAgent/awesome-claude-code-subagents; kept in library/disabled/ |
