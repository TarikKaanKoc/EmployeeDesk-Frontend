/**
 * The three documentation screens. English only on purpose: these are the
 * engineering notes that live in the repository, shown beside their
 * diagram so a reviewer can read them without leaving the console.
 */
export type DocSlug = "architecture" | "ai" | "monitoring";

export interface DocCard {
  icon: "globe" | "lock" | "box" | "shield" | "wrench" | "check" | "eye" | "bell" | "map";
  title: string;
  body: string;
}

export interface DocPage {
  slug: DocSlug;
  title: string;
  description: string;
  image: string;
  /** Natural size of the PNG, for the viewer's fit calculation. */
  width: number;
  height: number;
  cards: DocCard[];
  source: string;
}

export const DOC_ORDER: DocSlug[] = ["architecture", "ai", "monitoring"];

export const DOCS: Record<DocSlug, DocPage> = {
  architecture: {
    slug: "architecture",
    title: "Platform architecture",
    description: "Where each part runs on Azure and what talks to what.",
    image: "/docs/architecture.png",
    width: 4000,
    height: 2320,
    cards: [
      {
        icon: "globe",
        title: "Only the console is public",
        body: "The web console is the single public HTTPS ingress. The API, the mock ERP and Redis sit behind internal ingress inside the VNet, and PostgreSQL has no public endpoint at all.",
      },
      {
        icon: "lock",
        title: "No secret in an image",
        body: "Images are built in Azure Container Registry and pulled with a managed identity. The same identity is the only principal allowed to read Key Vault, and the apps receive their secrets as Key Vault references.",
      },
      {
        icon: "box",
        title: "One set of images everywhere",
        body: "The same containers run locally with docker compose, in Azure Container Apps for the demo, and on AKS with the Kubernetes manifests in deploy/k8s. A one-off job runs the migrations and loads the synthetic workbook.",
      },
      {
        icon: "map",
        title: "Qatar data residency",
        body: "The design targets Qatar Central with a resource group policy that allows only that region. Qatar Central does not yet offer Container Apps or Azure Cache for Redis for this subscription and PostgreSQL needs a capacity request there, so the demo runs in UAE North with the same template. Moving is a change of the policy parameter and the region flag; the only call that would leave the region in production is Azure OpenAI, which receives prompt text only.",
      },
    ],
    source: "ARCHITECTURE.md · deploy/azure/DEPLOYMENT.md",
  },
  ai: {
    slug: "ai",
    title: "AI architecture",
    description: "One assistant turn: guardrails, tools and the confirmation gate.",
    image: "/docs/ai-architecture.png",
    width: 4000,
    height: 2300,
    cards: [
      {
        icon: "shield",
        title: "Input guardrails first",
        body: "The text is cleaned of hidden characters and role markers and checked against injection patterns in English and Arabic. A message that names another employee is refused before the model is called. The system prompt is rendered from a template in the language of the request with the employee facts from the session.",
      },
      {
        icon: "wrench",
        title: "Five scoped tools",
        body: "Three read leave balances, leave requests and policy clauses from PostgreSQL. One reads purchase request status from the mock ERP. One drafts a leave request and parks it in Redis with a TTL. Every tool is scoped to the signed-in employee at the boundary, so the model cannot reach another record even if asked to.",
      },
      {
        icon: "eye",
        title: "Output guardrails after the last token",
        body: "A policy answer without a citation becomes a refusal. Foreign identifiers are redacted and the answer language is checked against the request. Policy search embeds the question and ranks vector and keyword hits in one SQL query.",
      },
      {
        icon: "check",
        title: "Confirm before any write",
        body: "A parked draft is written only after an explicit confirm call from the console; a yes typed in chat is not a confirmation. Every step writes an audit event that the Activity page reads back. The evaluation set of 115 cases runs against the real model and all pass.",
      },
    ],
    source: "docs/AI_ARCHITECTURE.md",
  },
  monitoring: {
    slug: "monitoring",
    title: "Monitoring",
    description: "What is collected today, and what is defined but not yet switched on.",
    image: "/docs/monitoring.png",
    width: 4000,
    height: 1960,
    cards: [
      {
        icon: "check",
        title: "In place today",
        body: "Every app streams console and system logs to Log Analytics. Azure Monitor keeps the platform metrics for the apps and the database. Each app has startup, liveness and readiness probes, and the assistant writes an audit event for every step so refusals and injection attempts show up on the Activity page.",
      },
      {
        icon: "bell",
        title: "Defined, not switched on",
        body: "Application Insights telemetry from the API through OpenTelemetry, a token spend counter per turn, and alert rules for 5xx rate, failing readiness, replica restarts, database pressure and token budget that feed an e-mail action group. A single workbook would put traffic, errors, latency and guardrail counters on one page.",
      },
    ],
    source: "deploy/azure/DEPLOYMENT.md",
  },
};
