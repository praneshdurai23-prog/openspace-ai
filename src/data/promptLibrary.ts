import { PromptItem } from '../types.ts';

export const INITIAL_PROMPT_LIBRARY: PromptItem[] = [
  // Study
  {
    id: 'study-feynman',
    title: 'Feynman Technique Explainer',
    category: 'study',
    prompt: 'Explain [concept] to me as if I were a 12-year-old. Use an everyday analogy, break it down into 3 simple steps, and highlight common misconceptions.',
    description: 'Master any difficult concept through intuitive analogies and simple language.',
    isFavorite: true,
  },
  {
    id: 'study-quiz-generator',
    title: 'Interactive Practice Quiz',
    category: 'study',
    prompt: 'Generate 5 high-yield multiple-choice questions on [topic]. Include 4 options per question, mark the correct option with a detailed explanation, and state why each incorrect option is wrong.',
    description: 'Test your understanding with realistic test-style questions and rationales.',
    isFavorite: true,
  },
  {
    id: 'study-summary-sheet',
    title: '1-Page Exam Cheat Sheet',
    category: 'study',
    prompt: 'Create a dense, structured revision sheet for [subject/chapter]. Group into Core Definitions, Formulas/Key Rules, Step-by-step Procedures, and 5 High-Yield Traps to Avoid.',
    description: 'Condense an entire chapter or unit into high-impact review notes.',
  },
  {
    id: 'study-spaced-repetition',
    title: 'Flashcard Deck Generator',
    category: 'study',
    prompt: 'Create 10 active-recall flashcards for [topic]. Format each with a precise Question (Front) and a concise, memorable Answer with a mnemonic (Back).',
    description: 'Generate high-retention flashcards for rapid spaced repetition.',
  },

  // Coding
  {
    id: 'code-review',
    title: 'Senior Engineer Code Review',
    category: 'coding',
    prompt: 'Review the following code for: 1) Performance bottlenecks, 2) Security flaws/edge cases, 3) Readability & idiomatic patterns. Provide the refactored code with explanatory comments:\n\n```\n[paste code here]\n```',
    description: 'Get deep architectural and clean code feedback on any function or snippet.',
    isFavorite: true,
  },
  {
    id: 'code-debug',
    title: 'Systematic Bug Diagnoser',
    category: 'coding',
    prompt: 'I have a bug where [describe unexpected behavior]. Here is my code and error trace:\n\n[code / error]\n\nDiagnose the exact root cause, explain why it happened in simple terms, and show the fixed code.',
    description: 'Find root causes of crashes, edge conditions, or silent logical errors.',
  },
  {
    id: 'code-api-design',
    title: 'Clean REST/GraphQL API Design',
    category: 'coding',
    prompt: 'Design a clean, RESTful API specification for [system/feature]. Include endpoints, HTTP methods, request payloads, response schemas, status codes, and security considerations.',
    description: 'Spec out clean endpoints with standard error handling and pagination.',
  },
  {
    id: 'code-regex-sql',
    title: 'SQL Query & Index Optimizer',
    category: 'coding',
    prompt: 'Write an optimized SQL query to [goal]. Explain the execution plan considerations, recommend optimal indexes, and show an example with sample data.',
    description: 'Craft high-performance relational queries with appropriate indexing strategy.',
  },

  // Writing
  {
    id: 'writing-executive-summary',
    title: 'Executive Brief / Memo',
    category: 'writing',
    prompt: 'Draft an executive briefing memo on [topic]. Structure with: Context & Problem Statement, Key Data Points, Proposed Strategy, Trade-offs & Risks, and Immediate Next Steps.',
    description: 'Deliver crisp, decision-ready memos for leaders and stakeholders.',
    isFavorite: true,
  },
  {
    id: 'writing-copy-refiner',
    title: 'Persuasive Landing Page Copy',
    category: 'writing',
    prompt: 'Write compelling copy for [product/service]. Include: 1 punchy Hero Headline, 1 subhead, 3 benefit bullets (outcome-focused, not feature-focused), and a high-converting CTA button text.',
    description: 'Convert visitors with clear, benefit-driven product positioning.',
  },
  {
    id: 'writing-email-difficult',
    title: 'Diplomatic Professional Email',
    category: 'writing',
    prompt: 'Draft a polite yet firm email to [recipient] regarding [sensitive situation/boundary/delay]. Keep the tone respectful, collaborative, and solutions-oriented.',
    description: 'Navigate sensitive work communications with clarity and tact.',
  },

  // Productivity
  {
    id: 'prod-action-plan',
    title: '80/20 Action Roadmap',
    category: 'productivity',
    prompt: 'Break down the project [project/goal] using the Pareto principle (80/20 rule). What are the 20% of high-leverage tasks that yield 80% of the progress? Provide a day-by-day 2-week roadmap.',
    description: 'Cut out busywork and focus directly on highest-impact milestones.',
    isFavorite: true,
  },
  {
    id: 'prod-meeting-notes',
    title: 'Meeting Notes to Action Items',
    category: 'productivity',
    prompt: 'Turn these messy raw meeting notes into: 1) Executive Summary (2 sentences), 2) Decisions Made, 3) Action Items Table (Owner, Task, Deadline), 4) Open Questions:\n\n[paste notes]',
    description: 'Transform messy transcripts into crisp accountable deliverables.',
  },

  // Research & Data Analysis
  {
    id: 'data-insights',
    title: 'Data Pattern & Trend Analyzer',
    category: 'data_analysis',
    prompt: 'Analyze this dataset or summary table: [paste data]. Identify the 3 most significant patterns, outliers, anomalies, and 3 actionable business recommendations based strictly on the figures.',
    description: 'Extract actionable intelligence, anomalies, and growth opportunities.',
    isFavorite: true,
  },
  {
    id: 'research-literature',
    title: 'Comparative Analysis Matrix',
    category: 'research',
    prompt: 'Compare and contrast [Option A] versus [Option B] across 5 key dimensions: Cost, Scalability, Implementation Effort, Long-term Maintenance, and Risk. Conclude with a recommendation matrix.',
    description: 'Unbiased evaluation table for choosing between architectures, tools, or vendors.',
  },

  // Career
  {
    id: 'career-interview-prep',
    title: 'Mock Technical Interviewer',
    category: 'career',
    prompt: 'You are an interviewer at a top technology company. Ask me 3 challenging situational questions and 1 technical problem for a [Job Title] role. Wait for my answer to each before asking the next, and provide constructive feedback after my response.',
    description: 'Practice realistic behavioral and technical interview scenarios.',
  },
];

export const PROMPT_LIBRARY = INITIAL_PROMPT_LIBRARY;
