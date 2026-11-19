# Research & Analysis Subagents

Research & Analysis subagents are your investigative powerhouses, specializing in finding, analyzing, and synthesizing information from diverse sources. These experts excel at deep research, competitive intelligence, market analysis, and trend identification. They transform raw information into actionable insights, helping you make informed decisions based on comprehensive analysis and data-driven research.

## When to Use Research & Analysis Subagents

Use these subagents when you need to:
- **Conduct comprehensive research** on any topic
- **Find specific information** across multiple sources
- **Analyze market dynamics** and opportunities
- **Track competitive intelligence** systematically
- **Identify emerging trends** before others
- **Gather and analyze data** for insights
- **Synthesize complex information** into clear findings
- **Make data-driven decisions** with confidence

## Available Subagents

### [**ab-test-analysis**](ab-test-analysis.md) - A/B test analysis and ship/no-ship decision specialist
Statistical analysis expert interpreting A/B test results, p-values, confidence intervals, and effect sizes. Makes principled ship/no-ship decisions using a structured framework and catches common analysis errors like peeking, multiple comparisons, and Simpson's Paradox.

**Use when:** Analyzing A/B or experiment results, interpreting p-values, making ship or no-ship decisions, evaluating statistical vs. practical significance, or validating test integrity.

### [**cohort-analysis**](cohort-analysis.md) - User cohort retention and behavioral analysis specialist
Retention analysis expert understanding how user groups behave over time. Diagnoses retention curve shapes, identifies activation metrics (the "Aha Moment"), and tracks whether product improvements are actually moving retention numbers.

**Use when:** Analyzing user retention, diagnosing where the retention curve drops, finding activation behaviors, comparing cohort performance over time, or assessing product-market fit signals.

### [**first-principles-thinking**](first-principles-thinking.md) - First principles problem-solving specialist
Strategic thinking specialist breaking complex problems down to irreducible truths and rebuilding solutions from scratch. Applies the 5-step first principles method and 5D structured problem-solving framework to cut through assumptions.

**Use when:** Challenging why things are done a certain way, rethinking a product or process from scratch, solving a recurring problem that conventional approaches haven't fixed, or pressure-testing assumptions before committing to a solution.

### [**research-analyst**](research-analyst.md) - Comprehensive research specialist
Research expert conducting thorough investigations across domains. Masters research methodologies, source validation, and insight synthesis. Delivers comprehensive research reports on any topic.

**Use when:** Conducting deep research, investigating complex topics, validating information, creating research reports, or synthesizing multiple sources.

### [**search-specialist**](search-specialist.md) - Advanced information retrieval expert
Search optimization expert finding needles in information haystacks. Masters advanced search techniques, query optimization, and source discovery. Locates hard-to-find information efficiently.

**Use when:** Finding specific information, optimizing search queries, discovering new sources, conducting systematic searches, or retrieving obscure data.

### [**trend-analyst**](trend-analyst.md) - Emerging trends and forecasting expert
Trend identification specialist spotting patterns before they become obvious. Expert in trend analysis, future forecasting, and weak signal detection. Helps organizations stay ahead of change.

**Use when:** Identifying emerging trends, forecasting future developments, analyzing pattern changes, monitoring industry evolution, or planning strategic responses.

### [**competitive-analyst**](competitive-analyst.md) - Competitive intelligence specialist
Competitive intelligence expert analyzing competitor strategies and market positioning. Masters competitive benchmarking, SWOT analysis, and strategic recommendations. Provides actionable competitive insights.

**Use when:** Analyzing competitors, benchmarking performance, identifying competitive advantages, monitoring competitor moves, or developing competitive strategies.

### [**market-researcher**](market-researcher.md) - Market analysis and consumer insights
Market analysis specialist understanding market dynamics and consumer behavior. Expert in market sizing, segmentation, and opportunity identification. Reveals market opportunities and risks.

**Use when:** Analyzing market opportunities, understanding consumer behavior, sizing markets, identifying segments, or evaluating market entry strategies.

### [**project-idea-validator**](project-idea-validator.md) - Brutal go or no-go idea validator
Adversarial product idea specialist pressure-testing concepts against competitors, demand signals, and adoption friction. Focuses on killing weak ideas early and sharpening strong ones into evidence-backed MVPs.

**Use when:** Stress-testing a startup or product idea, checking whether differentiation is real, finding hidden competitors, deciding whether to pivot, or getting a clear go/no-go recommendation before building.

### [**data-researcher**](data-researcher.md) - Data discovery and analysis expert
Data investigation specialist extracting insights from complex datasets. Masters data mining, statistical analysis, and pattern recognition. Transforms raw data into meaningful findings.

**Use when:** Analyzing datasets, discovering data patterns, performing statistical analysis, mining for insights, or investigating data anomalies.

### [**scientific-literature-researcher**](scientific-literature-researcher.md) - Scientific paper search and evidence synthesis
Scientific literature specialist using [BGPT MCP](https://github.com/connerlambden/bgpt-mcp) to search a database of papers with structured experimental data extracted from full-text studies. Retrieves methods, results, sample sizes, and quality scores to deliver evidence-grounded analysis.

**Use when:** Searching scientific literature, conducting systematic reviews, synthesizing experimental evidence, fact-checking claims against published data, or building evidence-grounded research reports.

## Quick Selection Guide

| If you need to... | Use this subagent |
|-------------------|-------------------|
| Analyze A/B test results | **ab-test-analysis** |
| Analyze user retention | **cohort-analysis** |
| Challenge assumptions from scratch | **first-principles-thinking** |
| Deep topic research | **research-analyst** |
| Find specific information | **search-specialist** |
| Identify future trends | **trend-analyst** |
| Analyze competitors | **competitive-analyst** |
| Understand markets | **market-researcher** |
| Pressure-test product ideas | **project-idea-validator** |
| Analyze data patterns | **data-researcher** |
| Search scientific papers | **scientific-literature-researcher** |

## Common Research Patterns

**Market Intelligence:**
- **market-researcher** for market analysis
- **competitive-analyst** for competitor insights
- **trend-analyst** for future directions
- **data-researcher** for data validation

**Strategic Research:**
- **research-analyst** for comprehensive analysis
- **search-specialist** for information gathering
- **trend-analyst** for future planning
- **competitive-analyst** for positioning

**Idea Validation:**
- **project-idea-validator** for go/no-go product scrutiny
- **competitive-analyst** for direct rival teardown
- **market-researcher** for market context
- **trend-analyst** for demand timing

**Data-Driven Insights:**
- **data-researcher** for data analysis
- **market-researcher** for market data
- **trend-analyst** for pattern identification
- **research-analyst** for synthesis

**Competitive Intelligence:**
- **competitive-analyst** for competitor analysis
- **market-researcher** for market context
- **search-specialist** for information discovery
- **trend-analyst** for industry evolution

## Getting Started

1. **Define research objectives** clearly
2. **Choose appropriate specialists** for your needs
3. **Provide context and constraints** for focused research
4. **Validate findings** through multiple sources
5. **Apply insights** to decision-making

## Best Practices

- **Start with clear questions:** Focus drives better research
- **Use multiple sources:** Single sources can mislead
- **Validate information:** Trust but verify
- **Document methodology:** Research should be reproducible
- **Consider biases:** All sources have perspectives
- **Synthesize findings:** Raw data needs interpretation
- **Update regularly:** Research has expiration dates
- **Share insights:** Knowledge multiplies when shared

Choose your research & analysis specialist and make better decisions today!

## New agents (JARVIS AI CITY, 2026-11)

Defined in `.claude/agents/<category>/`. Full registry: `.claude/jarvis/REGISTRY.md`.

### Specialized domains (`07-specialized-domains`)
- [**blockchain-developer**](.claude/agents/07-specialized-domains/blockchain-developer.md) - Smart contracts and wallet integrations with safety first
- [**ecommerce-developer**](.claude/agents/07-specialized-domains/ecommerce-developer.md) - Online stores: catalog, cart, checkout, orders
- [**fintech-engineer**](.claude/agents/07-specialized-domains/fintech-engineer.md) - Payments, ledgers and auditable money handling
- [**game-developer**](.claude/agents/07-specialized-domains/game-developer.md) - Game loops and Three.js / WebGL scenes
- [**healthtech-engineer**](.claude/agents/07-specialized-domains/healthtech-engineer.md) - FHIR/HL7 integrations with privacy and audit
- [**i18n-rtl-specialist**](.claude/agents/07-specialized-domains/i18n-rtl-specialist.md) - Russian, Hebrew, Arabic, English; RTL layouts
- [**iot-engineer**](.claude/agents/07-specialized-domains/iot-engineer.md) - MQTT telemetry, device provisioning, OTA updates
- [**maritime-weather-analyst**](.claude/agents/07-specialized-domains/maritime-weather-analyst.md) - Marine forecasts and go/no-go windows
- [**port-logistics-planner**](.claude/agents/07-specialized-domains/port-logistics-planner.md) - Container flows, documents, time and cost
- [**real-estate-analyst**](.claude/agents/07-specialized-domains/real-estate-analyst.md) - Listings, price per m², yields, property sites
- [**telegram-bot-developer**](.claude/agents/07-specialized-domains/telegram-bot-developer.md) - Telegram bots and Mini Apps with safe tokens

### Runtime-oriented agents
- [**code-executor**](.claude/agents/06-developer-experience/code-executor.md) - Answers by writing and running small programs (OpenHands runtime)
- [**local-assistant**](.claude/agents/09-meta-orchestration/local-assistant.md) - Quick free answers on a local model (Ollama runtime)
- [**web-researcher**](.claude/agents/10-research-analysis/web-researcher.md) - Sourced facts from live websites (browser-use runtime)
- [**workflow-planner**](.claude/agents/09-meta-orchestration/workflow-planner.md) - Step plans with owners and checks (LangGraph plan node)

## 300-agent expansion (JARVIS AI CITY, 2026-11)

159 more agents; every city district is now at its planned capacity (300 active agents). Full list with models and access levels: `.claude/jarvis/REGISTRY.md`.

### Core development (`01-core-development`)
- [**admin-panel-developer**](.claude/agents/01-core-development/admin-panel-developer.md) - Building internal admin panels and back-office tools
- [**api-gateway-engineer**](.claude/agents/01-core-development/api-gateway-engineer.md) - Configuring an API gateway or reverse-proxy layer
- [**astro-developer**](.claude/agents/01-core-development/astro-developer.md) - Building content-heavy, fast websites with Astro
- [**background-jobs-engineer**](.claude/agents/01-core-development/background-jobs-engineer.md) - Building background job processing with queues
- [**browser-extension-developer**](.claude/agents/01-core-development/browser-extension-developer.md) - Building Chrome/Firefox browser extensions with Manifest V3
- [**caching-engineer**](.claude/agents/01-core-development/caching-engineer.md) - Adding or fixing caching layers — Redis, HTTP caching, CDN — including invalidation, stampede protection and cache keys
- [**cli-tool-developer**](.claude/agents/01-core-development/cli-tool-developer.md) - Building command-line tools
- [**design-system-engineer**](.claude/agents/01-core-development/design-system-engineer.md) - Building or maintaining a component library/design system
- [**feature-flag-engineer**](.claude/agents/01-core-development/feature-flag-engineer.md) - Introducing feature flags, gradual rollouts, A/B switches and kill switches, and cleaning up stale flags
- [**geospatial-developer**](.claude/agents/01-core-development/geospatial-developer.md) - Building map and location features
- [**graphql-federation-implementer**](.claude/agents/01-core-development/graphql-federation-implementer.md) - Implementing
- [**htmx-developer**](.claude/agents/01-core-development/htmx-developer.md) - Building server-rendered interactive pages with htmx and minimal JavaScript
- [**media-upload-engineer**](.claude/agents/01-core-development/media-upload-engineer.md) - Implementing file and media uploads
- [**multi-tenancy-architect**](.claude/agents/01-core-development/multi-tenancy-architect.md) - Designing SaaS multi-tenancy
- [**notification-system-engineer**](.claude/agents/01-core-development/notification-system-engineer.md) - Building notification delivery across email, SMS, push and in-app channels with templates, preferences, batching and retries
- [**pwa-specialist**](.claude/agents/01-core-development/pwa-specialist.md) - Turning a web app into an installable Progressive Web App
- [**realtime-collaboration-engineer**](.claude/agents/01-core-development/realtime-collaboration-engineer.md) - Building collaborative real-time editing
- [**sdk-designer**](.claude/agents/01-core-development/sdk-designer.md) - Designing or building client SDKs/libraries for an API
- [**search-integration-engineer**](.claude/agents/01-core-development/search-integration-engineer.md) - Adding full-text search to an app with Elasticsearch, OpenSearch, Meilisearch or Typesense
- [**svelte-developer**](.claude/agents/01-core-development/svelte-developer.md) - Building or refactoring Svelte 5 / SvelteKit applications
- [**tauri-desktop-developer**](.claude/agents/01-core-development/tauri-desktop-developer.md) - Building small, secure desktop apps with Tauri
- [**webrtc-engineer**](.claude/agents/01-core-development/webrtc-engineer.md) - Building audio/video calls, screen sharing or peer-to-peer data channels with WebRTC, including signaling and TURN servers

### Language specialists (`02-language-specialists`)
- [**bash-scripting-expert**](.claude/agents/02-language-specialists/bash-scripting-expert.md) - Writing or hardening shell scripts
- [**c-systems-programmer**](.claude/agents/02-language-specialists/c-systems-programmer.md) - Writing or reviewing C code
- [**clojure-developer**](.claude/agents/02-language-specialists/clojure-developer.md) - Writing Clojure/ClojureScript
- [**cobol-modernization-specialist**](.claude/agents/02-language-specialists/cobol-modernization-specialist.md) - Analysing legacy COBOL systems
- [**deno-bun-developer**](.claude/agents/02-language-specialists/deno-bun-developer.md) - Building with Deno or Bun runtimes
- [**fortran-modernizer**](.claude/agents/02-language-specialists/fortran-modernizer.md) - Maintaining or modernising Fortran scientific code
- [**gradle-build-specialist**](.claude/agents/02-language-specialists/gradle-build-specialist.md) - Fixing or speeding up Gradle/Maven builds for JVM and Android projects
- [**haskell-developer**](.claude/agents/02-language-specialists/haskell-developer.md) - Working on Haskell code
- [**julia-developer**](.claude/agents/02-language-specialists/julia-developer.md) - Writing high-performance numerical or scientific code in Julia
- [**lua-developer**](.claude/agents/02-language-specialists/lua-developer.md) - Writing Lua for games, Neovim plugins, OpenResty/Nginx or embedded scripting
- [**nestjs-developer**](.claude/agents/02-language-specialists/nestjs-developer.md) - Building Node.js backends with NestJS
- [**nuxt-developer**](.claude/agents/02-language-specialists/nuxt-developer.md) - Building Nuxt 3/4 applications
- [**objective-c-maintainer**](.claude/agents/02-language-specialists/objective-c-maintainer.md) - Maintaining legacy Objective-C iOS/macOS code and bridging it with Swift
- [**perl-maintainer**](.claude/agents/02-language-specialists/perl-maintainer.md) - Maintaining or modernising legacy Perl scripts and applications safely
- [**r-statistician**](.claude/agents/02-language-specialists/r-statistician.md) - Doing statistics or data analysis in R
- [**scala-developer**](.claude/agents/02-language-specialists/scala-developer.md) - Writing or reviewing Scala 3 code
- [**webassembly-developer**](.claude/agents/02-language-specialists/webassembly-developer.md) - Compiling code to WebAssembly
- [**zig-developer**](.claude/agents/02-language-specialists/zig-developer.md) - Writing systems code in Zig

### Infrastructure (`03-infrastructure`)
- [**ansible-automation-engineer**](.claude/agents/03-infrastructure/ansible-automation-engineer.md) - Automating server configuration with Ansible
- [**aws-solutions-engineer**](.claude/agents/03-infrastructure/aws-solutions-engineer.md) - Building on AWS
- [**backup-recovery-specialist**](.claude/agents/03-infrastructure/backup-recovery-specialist.md) - Designing and testing backups and disaster recovery
- [**ci-pipeline-optimizer**](.claude/agents/03-infrastructure/ci-pipeline-optimizer.md) - Making CI pipelines
- [**dns-email-admin**](.claude/agents/03-infrastructure/dns-email-admin.md) - Configuring DNS and email deliverability
- [**edge-cdn-engineer**](.claude/agents/03-infrastructure/edge-cdn-engineer.md) - Configuring CDNs and edge compute
- [**finops-cost-optimizer**](.claude/agents/03-infrastructure/finops-cost-optimizer.md) - Reducing cloud and SaaS spend
- [**gcp-engineer**](.claude/agents/03-infrastructure/gcp-engineer.md) - Building on Google Cloud
- [**helm-chart-maintainer**](.claude/agents/03-infrastructure/helm-chart-maintainer.md) - Writing or maintaining Helm charts
- [**linux-sysadmin**](.claude/agents/03-infrastructure/linux-sysadmin.md) - Administering Linux servers
- [**observability-engineer**](.claude/agents/03-infrastructure/observability-engineer.md) - Setting up monitoring
- [**reverse-proxy-specialist**](.claude/agents/03-infrastructure/reverse-proxy-specialist.md) - Configuring Nginx, Caddy or Traefik
- [**self-hosting-admin**](.claude/agents/03-infrastructure/self-hosting-admin.md) - Self-hosting services on a home server or small VPS
- [**serverless-engineer**](.claude/agents/03-infrastructure/serverless-engineer.md) - Building serverless functions
- [**service-mesh-engineer**](.claude/agents/03-infrastructure/service-mesh-engineer.md) - Running a service mesh

### Quality & security (`04-quality-security`)
- [**api-contract-tester**](.claude/agents/04-quality-security/api-contract-tester.md) - Testing APIs against their contract
- [**auth-security-reviewer**](.claude/agents/04-quality-security/auth-security-reviewer.md) - Reviewing authentication and session security
- [**container-security-auditor**](.claude/agents/04-quality-security/container-security-auditor.md) - Auditing Docker images and Kubernetes workloads
- [**dependency-vulnerability-scanner**](.claude/agents/04-quality-security/dependency-vulnerability-scanner.md) - Auditing third-party dependencies for known vulnerabilities, abandoned packages and risky licences
- [**e2e-playwright-tester**](.claude/agents/04-quality-security/e2e-playwright-tester.md) - Writing end-to-end browser tests with Playwright
- [**flaky-test-hunter**](.claude/agents/04-quality-security/flaky-test-hunter.md) - Tests pass and fail intermittently
- [**fuzzing-engineer**](.claude/agents/04-quality-security/fuzzing-engineer.md) - Fuzzing parsers, protocols or APIs
- [**load-tester**](.claude/agents/04-quality-security/load-tester.md) - Running load and stress tests
- [**mobile-app-tester**](.claude/agents/04-quality-security/mobile-app-tester.md) - Testing iOS/Android apps
- [**mutation-testing-specialist**](.claude/agents/04-quality-security/mutation-testing-specialist.md) - Measuring test-suite strength with mutation testing
- [**release-qa-gatekeeper**](.claude/agents/04-quality-security/release-qa-gatekeeper.md) - A release needs a go/no-go decision
- [**secrets-leak-auditor**](.claude/agents/04-quality-security/secrets-leak-auditor.md) - Checking a repository, its history, logs or configs for leaked secrets
- [**supply-chain-security-reviewer**](.claude/agents/04-quality-security/supply-chain-security-reviewer.md) - Reviewing software supply chain risks
- [**test-data-manager**](.claude/agents/04-quality-security/test-data-manager.md) - Creating test data
- [**threat-modeler**](.claude/agents/04-quality-security/threat-modeler.md) - Threat-modelling a system or feature
- [**unit-test-writer**](.claude/agents/04-quality-security/unit-test-writer.md) - An existing module needs focused unit tests
- [**visual-regression-tester**](.claude/agents/04-quality-security/visual-regression-tester.md) - Catching unintended UI changes with screenshot comparison

### Data & AI (`05-data-ai`)
- [**ai-safety-evaluator**](.claude/agents/05-data-ai/ai-safety-evaluator.md) - Red-teaming an LLM feature
- [**analytics-engineer**](.claude/agents/05-data-ai/analytics-engineer.md) - Modelling analytics data with dbt or SQL
- [**bi-dashboard-developer**](.claude/agents/05-data-ai/bi-dashboard-developer.md) - Building BI dashboards
- [**computer-vision-engineer**](.claude/agents/05-data-ai/computer-vision-engineer.md) - Building image or video understanding
- [**data-quality-engineer**](.claude/agents/05-data-ai/data-quality-engineer.md) - Checking and enforcing data quality
- [**data-visualization-specialist**](.claude/agents/05-data-ai/data-visualization-specialist.md) - Turning data into clear charts and visual stories for reports, presentations or the web
- [**embedding-search-engineer**](.claude/agents/05-data-ai/embedding-search-engineer.md) - Building semantic search or similarity features with embeddings and vector databases
- [**etl-orchestration-engineer**](.claude/agents/05-data-ai/etl-orchestration-engineer.md) - Orchestrating batch pipelines with Airflow, Dagster or Prefect
- [**feature-engineering-specialist**](.claude/agents/05-data-ai/feature-engineering-specialist.md) - Creating model features
- [**llm-engineer**](.claude/agents/05-data-ai/llm-engineer.md) - Building features on large language models
- [**local-llm-ops**](.claude/agents/05-data-ai/local-llm-ops.md) - Running local models with Ollama or llama.cpp
- [**model-evaluation-specialist**](.claude/agents/05-data-ai/model-evaluation-specialist.md) - Evaluating ML or LLM models
- [**nlp-engineer**](.claude/agents/05-data-ai/nlp-engineer.md) - Processing text
- [**prompt-engineer**](.claude/agents/05-data-ai/prompt-engineer.md) - Writing, testing and improving prompts and system prompts for LLM agents, with examples and an evaluation set
- [**rag-architect**](.claude/agents/05-data-ai/rag-architect.md) - Designing retrieval-augmented generation
- [**recommendation-systems-engineer**](.claude/agents/05-data-ai/recommendation-systems-engineer.md) - Building recommendations
- [**speech-ai-engineer**](.claude/agents/05-data-ai/speech-ai-engineer.md) - Building speech features
- [**streaming-data-engineer**](.claude/agents/05-data-ai/streaming-data-engineer.md) - Building streaming pipelines with Kafka, Redpanda or Flink
- [**synthetic-data-generator**](.claude/agents/05-data-ai/synthetic-data-generator.md) - Generating synthetic datasets for testing or training
- [**time-series-forecaster**](.claude/agents/05-data-ai/time-series-forecaster.md) - Forecasting time series

### Developer experience (`06-developer-experience`)
- [**api-docs-generator**](.claude/agents/06-developer-experience/api-docs-generator.md) - Generating and improving API reference documentation from code or OpenAPI
- [**build-performance-optimizer**](.claude/agents/06-developer-experience/build-performance-optimizer.md) - Builds or dev servers are slow
- [**changelog-writer**](.claude/agents/06-developer-experience/changelog-writer.md) - Writing release notes and changelogs from commits and pull requests for users and developers
- [**dependency-upgrade-manager**](.claude/agents/06-developer-experience/dependency-upgrade-manager.md) - Upgrading dependencies or frameworks
- [**developer-onboarding-guide**](.claude/agents/06-developer-experience/developer-onboarding-guide.md) - Writing onboarding material for a codebase
- [**documentation-site-builder**](.claude/agents/06-developer-experience/documentation-site-builder.md) - Building documentation sites
- [**git-workflow-expert**](.claude/agents/06-developer-experience/git-workflow-expert.md) - Sorting out Git problems or workflows
- [**lint-format-configurator**](.claude/agents/06-developer-experience/lint-format-configurator.md) - Setting up or unifying linters and formatters
- [**monorepo-maintainer**](.claude/agents/06-developer-experience/monorepo-maintainer.md) - Managing monorepos
- [**project-scaffolder**](.claude/agents/06-developer-experience/project-scaffolder.md) - Starting a new project or module from scratch
- [**refactoring-specialist**](.claude/agents/06-developer-experience/refactoring-specialist.md) - Restructuring code without changing behaviour

### Specialized domains (`07-specialized-domains`)
- [**agritech-engineer**](.claude/agents/07-specialized-domains/agritech-engineer.md) - Building agriculture technology
- [**audio-music-developer**](.claude/agents/07-specialized-domains/audio-music-developer.md) - Building audio or music software
- [**automotive-telematics-engineer**](.claude/agents/07-specialized-domains/automotive-telematics-engineer.md) - Working with vehicle data
- [**construction-estimator**](.claude/agents/07-specialized-domains/construction-estimator.md) - Estimating construction or renovation work
- [**edtech-developer**](.claude/agents/07-specialized-domains/edtech-developer.md) - Building learning platforms
- [**event-ticketing-developer**](.claude/agents/07-specialized-domains/event-ticketing-developer.md) - Building event ticketing
- [**fleet-routing-engineer**](.claude/agents/07-specialized-domains/fleet-routing-engineer.md) - Optimising vehicle routes and fleets
- [**govtech-forms-developer**](.claude/agents/07-specialized-domains/govtech-forms-developer.md) - Digitising public-service forms and workflows
- [**hospitality-tech-specialist**](.claude/agents/07-specialized-domains/hospitality-tech-specialist.md) - Building hotel and short-stay rental software
- [**hr-tech-specialist**](.claude/agents/07-specialized-domains/hr-tech-specialist.md) - Building HR and recruiting software
- [**insurance-domain-analyst**](.claude/agents/07-specialized-domains/insurance-domain-analyst.md) - Analysing insurance products and processes
- [**legaltech-engineer**](.claude/agents/07-specialized-domains/legaltech-engineer.md) - Building legal-tech software
- [**media-streaming-engineer**](.claude/agents/07-specialized-domains/media-streaming-engineer.md) - Building video/audio streaming
- [**restaurant-ordering-developer**](.claude/agents/07-specialized-domains/restaurant-ordering-developer.md) - Building restaurant ordering and delivery
- [**retail-pos-specialist**](.claude/agents/07-specialized-domains/retail-pos-specialist.md) - Building retail point-of-sale and inventory systems
- [**smart-city-planner**](.claude/agents/07-specialized-domains/smart-city-planner.md) - Planning smart-city and urban solutions
- [**solar-energy-analyst**](.claude/agents/07-specialized-domains/solar-energy-analyst.md) - Assessing solar and energy projects
- [**sports-analytics-analyst**](.claude/agents/07-specialized-domains/sports-analytics-analyst.md) - Analysing sports data
- [**travel-booking-engineer**](.claude/agents/07-specialized-domains/travel-booking-engineer.md) - Building travel and booking systems

### Business & product (`08-business-product`)
- [**brand-strategist**](.claude/agents/08-business-product/brand-strategist.md) - Defining brand positioning, naming, voice and messaging for a product or company
- [**community-manager**](.claude/agents/08-business-product/community-manager.md) - Growing and moderating communities
- [**contract-clause-reviewer**](.claude/agents/08-business-product/contract-clause-reviewer.md) - Reviewing a contract's clauses for business risk
- [**customer-support-responder**](.claude/agents/08-business-product/customer-support-responder.md) - Drafting customer support replies and help-centre articles
- [**email-marketing-specialist**](.claude/agents/08-business-product/email-marketing-specialist.md) - Planning and writing email campaigns
- [**financial-modeler**](.claude/agents/08-business-product/financial-modeler.md) - Building financial models
- [**grant-writer**](.claude/agents/08-business-product/grant-writer.md) - Preparing grant or tender applications
- [**investor-update-writer**](.claude/agents/08-business-product/investor-update-writer.md) - Writing monthly or quarterly investor updates
- [**meeting-notes-summarizer**](.claude/agents/08-business-product/meeting-notes-summarizer.md) - Turning meeting transcripts or notes into summaries with decisions, action items, owners and deadlines
- [**okr-coach**](.claude/agents/08-business-product/okr-coach.md) - Setting goals and OKRs
- [**partnership-manager**](.claude/agents/08-business-product/partnership-manager.md) - Planning partnerships and business development
- [**pitch-deck-writer**](.claude/agents/08-business-product/pitch-deck-writer.md) - Writing investor pitch decks
- [**pricing-strategist**](.claude/agents/08-business-product/pricing-strategist.md) - Deciding prices and packaging
- [**procurement-vendor-evaluator**](.claude/agents/08-business-product/procurement-vendor-evaluator.md) - Choosing vendors or SaaS tools
- [**russian-hebrew-translator**](.claude/agents/08-business-product/russian-hebrew-translator.md) - Translating between Russian, Hebrew and English
- [**seo-specialist**](.claude/agents/08-business-product/seo-specialist.md) - Improving search visibility
- [**social-media-manager**](.claude/agents/08-business-product/social-media-manager.md) - Planning social media content

### Meta-orchestration (`09-meta-orchestration`)
- [**handoff-brief-writer**](.claude/agents/09-meta-orchestration/handoff-brief-writer.md) - Work passes from one agent to another
- [**quality-gate-reviewer**](.claude/agents/09-meta-orchestration/quality-gate-reviewer.md) - Another agent's output must be checked before it is used
- [**runtime-cost-router**](.claude/agents/09-meta-orchestration/runtime-cost-router.md) - Choosing which runtime and model should run a task

### Research & analysis (`10-research-analysis`)
- [**academic-paper-summarizer**](.claude/agents/10-research-analysis/academic-paper-summarizer.md) - Summarising academic papers
- [**cis-market-researcher**](.claude/agents/10-research-analysis/cis-market-researcher.md) - Researching Russian-speaking markets and audiences in the CIS and diaspora
- [**fact-checker**](.claude/agents/10-research-analysis/fact-checker.md) - Verifying claims, numbers and quotes in a text against reliable sources before publishing
- [**israel-market-researcher**](.claude/agents/10-research-analysis/israel-market-researcher.md) - Researching the Israeli market
- [**news-digest-monitor**](.claude/agents/10-research-analysis/news-digest-monitor.md) - Preparing a news digest on a topic
- [**open-source-scout**](.claude/agents/10-research-analysis/open-source-scout.md) - Looking for open-source projects to reuse
- [**patent-researcher**](.claude/agents/10-research-analysis/patent-researcher.md) - Searching patents and prior art
- [**policy-regulation-researcher**](.claude/agents/10-research-analysis/policy-regulation-researcher.md) - Researching laws, regulations and standards that affect a product
- [**price-monitoring-analyst**](.claude/agents/10-research-analysis/price-monitoring-analyst.md) - Tracking prices of products or services across sellers
- [**sentiment-analyst**](.claude/agents/10-research-analysis/sentiment-analyst.md) - Analysing opinions in reviews, social posts or support tickets
- [**statistics-consultant**](.claude/agents/10-research-analysis/statistics-consultant.md) - A question needs the right statistical method
- [**supply-chain-risk-analyst**](.claude/agents/10-research-analysis/supply-chain-risk-analyst.md) - Assessing supply chain risks
- [**survey-designer**](.claude/agents/10-research-analysis/survey-designer.md) - Designing surveys and questionnaires
- [**tech-stack-evaluator**](.claude/agents/10-research-analysis/tech-stack-evaluator.md) - Choosing technologies
- [**user-interview-synthesizer**](.claude/agents/10-research-analysis/user-interview-synthesizer.md) - Synthesising user interviews

### JARVIS tower (`00-jarvis`)
- [**budget-controller**](.claude/agents/00-jarvis/budget-controller.md) - Spending must be reviewed
- [**owner-briefing-writer**](.claude/agents/00-jarvis/owner-briefing-writer.md) - The owner needs a short daily or weekly briefing
