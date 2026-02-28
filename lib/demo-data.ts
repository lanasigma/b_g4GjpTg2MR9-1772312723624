export const demoStartup = {
  name: "FlowAI",
  tagline: "AI workflow automation platform",
  industry: "Enterprise SaaS",
  stage: "Series A",
  geography: "San Francisco, CA",
  aiScore: 87,
  problem:
    "Enterprise teams waste 40% of their time on repetitive workflow tasks that could be automated. Existing automation tools require technical expertise and weeks of setup.",
  product:
    "FlowAI is an AI-native workflow automation platform that learns from team behavior patterns to suggest, build, and optimize workflows automatically. No code required.",
  targetCustomer:
    "Mid-market and enterprise operations teams (50-500 employees) in tech, finance, and healthcare verticals.",
  businessModel:
    "SaaS subscription with usage-based pricing. Core plans start at $49/user/month with enterprise custom pricing. 90% gross margins.",
}

export const demoCompetitors = [
  {
    name: "Zapier",
    positioning: "No-code automation leader",
    pricingTier: "Freemium",
    differentiation:
      "Massive integration library (5000+), but limited AI capabilities and primarily trigger-based.",
    targetCustomer: "SMBs and individual users",
    pricingModel: "Usage-based (tasks/month)",
    keyFeatures: "Pre-built integrations, Zaps, multi-step workflows",
    distribution: "Product-led growth, marketplace",
    marketMaturity: "Mature",
    moatStrength: "Strong",
  },
  {
    name: "Make (Integromat)",
    positioning: "Visual automation builder",
    pricingTier: "Mid-market",
    differentiation:
      "More powerful visual builder than Zapier, but steeper learning curve.",
    targetCustomer: "Technical teams and agencies",
    pricingModel: "Operations-based pricing",
    keyFeatures: "Visual scenarios, data transformation, branching logic",
    distribution: "Community-led, partner channel",
    marketMaturity: "Growing",
    moatStrength: "Moderate",
  },
  {
    name: "UiPath",
    positioning: "Enterprise RPA platform",
    pricingTier: "Enterprise",
    differentiation:
      "Deep enterprise RPA with desktop automation, but complex and expensive.",
    targetCustomer: "Large enterprises (1000+ employees)",
    pricingModel: "Per-robot licensing",
    keyFeatures: "Desktop automation, process mining, AI Center",
    distribution: "Enterprise sales, partner ecosystem",
    marketMaturity: "Mature",
    moatStrength: "Strong",
  },
  {
    name: "n8n",
    positioning: "Open-source workflow automation",
    pricingTier: "Free / Self-hosted",
    differentiation:
      "Open-source and self-hostable, appeals to developers who want full control.",
    targetCustomer: "Developers and technical teams",
    pricingModel: "Open source + cloud hosted plans",
    keyFeatures: "Self-hosting, custom nodes, code extensibility",
    distribution: "Open source community, developer marketing",
    marketMaturity: "Growing",
    moatStrength: "Moderate",
  },
]

export const demoAnalyses = [
  {
    name: "FlowAI",
    sector: "Enterprise SaaS",
    stage: "Series A",
    status: "Complete",
    aiScore: 87,
    lastUpdated: "2 hours ago",
  },
  {
    name: "NeuralShip",
    sector: "AI/ML Infrastructure",
    stage: "Seed",
    status: "Complete",
    aiScore: 72,
    lastUpdated: "1 day ago",
  },
  {
    name: "GreenLedger",
    sector: "Climate Tech",
    stage: "Series B",
    status: "In Progress",
    aiScore: 91,
    lastUpdated: "2 days ago",
  },
  {
    name: "MedAssist Pro",
    sector: "HealthTech",
    stage: "Series A",
    status: "Complete",
    aiScore: 68,
    lastUpdated: "3 days ago",
  },
  {
    name: "DataVault",
    sector: "Cybersecurity",
    stage: "Pre-seed",
    status: "Complete",
    aiScore: 54,
    lastUpdated: "5 days ago",
  },
  {
    name: "UrbanMove",
    sector: "Mobility",
    stage: "Series A",
    status: "Draft",
    aiScore: 0,
    lastUpdated: "1 week ago",
  },
]

export const demoActivities = [
  {
    action: "AI generated competitor map",
    target: "FlowAI",
    time: "2 hours ago",
  },
  {
    action: "Report exported",
    target: "NeuralShip",
    time: "5 hours ago",
  },
  {
    action: "Startup uploaded",
    target: "GreenLedger",
    time: "1 day ago",
  },
  {
    action: "Analysis completed",
    target: "MedAssist Pro",
    time: "2 days ago",
  },
  {
    action: "Pitch deck parsed",
    target: "DataVault",
    time: "5 days ago",
  },
]

export const demoMetrics = {
  startupsReviewed: 142,
  analysesGenerated: 89,
  avgTimeSaved: "4.2 hrs",
  activeDeals: 23,
}

export const demoCopilotMessages = [
  {
    role: "assistant" as const,
    content:
      "Welcome back! I've been analyzing the FlowAI pitch deck you uploaded. Here are some initial observations:",
  },
  {
    role: "assistant" as const,
    content:
      "FlowAI shows strong differentiation in the AI-native automation space. Their approach to learning from team behavior is unique compared to Zapier's trigger-based model. However, the enterprise sales cycle could be a challenge at their current stage.",
  },
]

export const demoSuggestedPrompts = [
  "What are the biggest risks?",
  "Is this investment defensible?",
  "Compare to market leaders",
  "What diligence questions should we ask?",
]

export const demoRiskSignals = {
  riskLevel: "Medium" as const,
  detectedRisks: [
    {
      title: "Unclear go-to-market strategy",
      detail:
        "The pitch deck outlines product-led growth combined with enterprise sales, but lacks specific channel economics, partnership pipeline, or clear GTM sequencing for the mid-market segment.",
    },
    {
      title: "TAM assumptions unsupported",
      detail:
        "Market sizing references broad workflow automation TAM ($26B) without adequately narrowing to serviceable addressable market. The $4.2B SAM claim needs third-party validation.",
    },
    {
      title: "Heavy founder dependency",
      detail:
        "CTO is sole architect of the AI learning engine. Key-person risk is elevated with no documented succession or knowledge transfer plan.",
    },
    {
      title: "Competitive market saturation",
      detail:
        "Four well-funded incumbents operate in adjacent segments. Zapier has announced AI features on their roadmap, which could narrow FlowAI's differentiation window.",
    },
  ],
  missingMetrics: [
    { label: "CAC not specified", present: false },
    { label: "Retention unclear", present: false },
    { label: "Revenue quality unknown", present: false },
    { label: "Unit economics incomplete", present: false },
    { label: "Gross margin documented", present: true },
    { label: "ARR disclosed", present: true },
  ],
  diligenceQuestions: [
    "How does customer acquisition scale beyond early adopters?",
    "What is the expected payback period on enterprise sales investments?",
    "How defensible is the AI learning engine if a competitor replicates the approach?",
    "What happens to product velocity if the founding CTO departs?",
    "Can you provide cohort-level retention data for the last 6 months?",
  ],
}

export const demoDealIntelligence = [
  { startup: "FlowAI", sector: "Enterprise SaaS", signal: 87, risk: "Medium" as const, outcome: "Under Review" },
  { startup: "NeuralShip", sector: "AI/ML Infrastructure", signal: 72, risk: "Low" as const, outcome: "Passed" },
  { startup: "GreenLedger", sector: "Climate Tech", signal: 91, risk: "Low" as const, outcome: "Term Sheet" },
  { startup: "MedAssist Pro", sector: "HealthTech", signal: 68, risk: "High" as const, outcome: "Declined" },
  { startup: "DataVault", sector: "Cybersecurity", signal: 54, risk: "High" as const, outcome: "Declined" },
  { startup: "UrbanMove", sector: "Mobility", signal: 0, risk: "Medium" as const, outcome: "Pending" },
  { startup: "CloudSync", sector: "Developer Tools", signal: 79, risk: "Low" as const, outcome: "Under Review" },
  { startup: "FarmIQ", sector: "AgriTech", signal: 63, risk: "Medium" as const, outcome: "Passed" },
]

export const demoInsights = {
  competitiveAdvantage:
    "FlowAI's AI-native approach to workflow learning creates a data flywheel that strengthens over time. Unlike Zapier's manual setup, FlowAI can reduce time-to-value from weeks to hours.",
  marketGaps:
    "The mid-market segment (50-500 employees) is underserved by both SMB tools (Zapier) and enterprise solutions (UiPath). FlowAI targets this gap effectively with appropriate pricing.",
  differentiationScore: 78,
  suggestedPositioning:
    "Position as the 'AI-first' alternative for teams who have outgrown Zapier but find UiPath too complex. Lead with the time-to-value narrative and behavioral learning differentiator.",
}
