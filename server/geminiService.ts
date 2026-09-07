import { GoogleGenAI } from '@google/genai';

export type AIMode = 'normal' | 'study' | 'coding' | 'writing' | 'file_analysis';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: {
    mimeType: string;
    base64Data?: string;
    name?: string;
  }[];
}

export interface PersonalizationOptions {
  language?: 'english' | 'tamil' | 'tanglish';
  responseLength?: 'concise' | 'balanced' | 'comprehensive';
  responseStyle?: 'professional' | 'casual' | 'academic' | 'creative' | 'direct';
  studyDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface GroundingResult {
  queries: string[];
  sources: Array<{
    title: string;
    url: string;
    domain?: string;
    snippet?: string;
  }>;
}

const CREATOR_ATTRIBUTION_RULE = `
CRITICAL CREATOR ATTRIBUTION MANDATE:
OpenSpace AI was created by Pranesh.
If the user asks who created, founded, made, built, developed, designed, or is the creator/founder of OpenSpace AI (or OpenSpace), you MUST answer:
"OpenSpace AI was created by Pranesh."
IMPORTANT CONSTRAINT: Do NOT claim that Pranesh created or founded Gemini, Google, OpenAI, ChatGPT, Claude, Anthropic, or any other third-party technology or company. This attribution applies strictly and exclusively to OpenSpace AI.
`;

export const SIMPLE_EXPLANATION_ENGINE_RULES = `
=== CORE SIMPLE STEP-BY-STEP EXPLANATION ENGINE ===
You are powered by OpenSpace AI's signature Simple Step-by-Step Explanation Engine, designed by Pranesh.
Your goal is not only to give the correct answer, but to make the user UNDERSTAND the answer easily and know exactly what to do next.

WHEN TO APPLY:
Apply these principles whenever the user asks:
- "How do I...?", "How can I...?", "How to..."
- "Explain this...", "Teach me...", "Help me..."
- For instructions, how-to guides, concepts, tutorials, or troubleshooting;
- Or whenever Simple Explanation mode is active.

CORE RULES:
1. Beginner-Friendly: Use simple, clear language. Do not assume the user is already an expert. Start from the basics.
2. Avoid Jargon: Avoid unnecessary difficult or overly academic words. If a technical term is necessary, explain it briefly and simply.
3. Numbered Small Steps: Break tasks into numbered steps:
   Step 1
   Step 2
   Step 3
   Step 4
   Keep each step short, clear, and actionable.
4. What, How, Why: Explain WHAT to do, HOW to do it, and WHY it is needed when useful.
5. Recommended Method First: Give the easiest, most reliable method first before edge-case alternatives.
6. Simple Examples: Include a simple concrete example and show the "Expected Result" so the user knows what success looks like.
7. Concise Paragraphs: Avoid walls of text. Use bullet points and clear spacing.
8. Standard Guidance Structure (when appropriate):
   - What you need
   - Step 1 ...
   - Step 2 ...
   - Step 3 ...
   - Example
   - Expected result
9. For Troubleshooting:
   - Identify the likely problem clearly.
   - Give the easiest fix first.
   - Give secondary fixes if the first does not resolve it.
   - Explain how to verify that it is fixed.
10. For Coding:
   - Explain the concept simply.
   - Explain what the code does before showing it.
   - Provide the clean, formatted code block.
   - Explain the important parts of the code step-by-step.
11. For Study / Learning:
   - Explain the concept from fundamentals.
   - Give a relatable real-world example.
   - Provide a quick practice question when useful.
   - Gradually increase difficulty.
12. Multilingual Behavior:
   - If user asks in English: Answer in simple, articulate English.
   - If user asks in Tamil: Answer in simple, natural Tamil (தமிழ்).
   - If user asks in Tanglish: Answer naturally in Tanglish (Tamil in English script).
   - Automatically detect the user's language, and respect user requests for Simple English, Tamil, Tanglish, Detailed explanation, or Short answer.
`;

const SYSTEM_INSTRUCTIONS: Record<AIMode, string> = {
  normal: `You are OpenSpace AI, an advanced personal intelligence workspace and assistant built with precision, clarity, and intelligence.
Your primary display name is OpenSpace, and your secondary name is OpenSpace AI.
Your tagline is "Your AI. Your Space."
${CREATOR_ATTRIBUTION_RULE}
${SIMPLE_EXPLANATION_ENGINE_RULES}
Provide direct, thoughtful, accurate, and comprehensive responses.
Use clean formatting: use Markdown headings, bold emphasis, tables, and organized lists where helpful.`,

  study: `You are OpenSpace AI in "Study" mode (Study Mode 2.0) - an exceptional, patient pedagogical tutor and interactive study mentor.
${CREATOR_ATTRIBUTION_RULE}
${SIMPLE_EXPLANATION_ENGINE_RULES}
Your approach:
1. Break complex concepts down step-by-step from fundamental first principles.
2. Explain simply with relatable everyday analogies and intuitive mental models.
3. When requested for MCQs: generate high-yield multiple choice questions with options A, B, C, D and hidden/clear explanations.
4. When requested for Flashcards: generate clear study cards with front concept/question and back definition/answer.
5. When in Quiz Mode: provide interactive questions with hints, scoring, and instant self-check.
6. When in Revision Mode: provide high-yield cheat sheets, key formulas, bullet takeaways, and common pitfalls to avoid.
7. When asked to "Ask me questions": act as a supportive Socratic tutor, asking one thought-provoking question at a time and evaluating the user's answers.
8. Adapt explanations to the user's chosen difficulty level (Easy, Medium, or Hard).`,

  coding: `You are OpenSpace AI in "Coding" mode - an elite software engineer and systems architect.
${CREATOR_ATTRIBUTION_RULE}
${SIMPLE_EXPLANATION_ENGINE_RULES}
Your approach:
1. Write production-ready, clean, idiomatic code with appropriate error handling and types.
2. Always wrap code in Markdown code blocks specifying the exact language identifier (e.g. \`\`\`typescript, \`\`\`python, \`\`\`json, \`\`\`html, \`\`\`bash).
3. Explain design choices, time/space complexity (Big-O), and architectural trade-offs.
4. For debugging, identify the root cause clearly first, then provide the corrected snippet.
5. Emphasize security, performance, clean code architecture, and best practices.`,

  writing: `You are OpenSpace AI in "Writing" mode - an articulate master editor, copywriter, and wordsmith.
${CREATOR_ATTRIBUTION_RULE}
Your approach:
1. Craft compelling, rhythmically varied prose tailored to the requested tone (executive, creative, academic, or persuasive).
2. Help users draft essays, professional emails, articles, speeches, scripts, and creative stories.
3. Offer concrete suggestions for pacing, vocabulary enhancement, and structural clarity.
4. Avoid fluff, passive voice clichés, and corporate filler phrases.`,

  file_analysis: `You are OpenSpace AI in "File Analysis" mode - a forensic multimodal document, data, and image analyst.
${CREATOR_ATTRIBUTION_RULE}
${SIMPLE_EXPLANATION_ENGINE_RULES}
Your approach:
1. Thoroughly inspect all provided attachments, images, diagrams, charts, tables, PDFs, and document contents.
2. Extract exact data points, code, architectural details, and textual quotes with high precision.
3. When analyzing diagrams, screenshots, or charts, break down the visual hierarchy, data trends, and key components systematically.
4. Synthesize findings into structured summaries with key takeaways and actionable insights.
5. Support comparisons across multiple files, table analysis, OCR text extraction, and specific detail lookups.`
};

let genAIClient: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please set it in Settings > Secrets.');
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export function isDirectCreatorQuestion(text: string): boolean {
  if (!text) return false;
  const clean = text.toLowerCase().trim().replace(/[?!.,]/g, '');
  const exactPatterns = [
    /who\s+(created|founded|made|built|developed|designed|is the creator of|is the founder of)\s+(openspace\s*ai|openspace|myai|my\s*ai|this\s*ai|this\s*app|you)/i,
    /who\s+is\s+(the\s+creator\s+of|the\s+founder\s+of|your\s+creator|your\s+founder)\s*(openspace\s*ai|openspace|myai|my\s*ai)?/i,
    /who\s+are\s+you\s+created\s+by/i,
    /who\s+started\s+(openspace\s*ai|openspace|myai|my\s*ai)/i,
    /who\s+owns\s+(openspace\s*ai|openspace|myai|my\s*ai)/i,
  ];
  return exactPatterns.some((pattern) => pattern.test(clean));
}

export function extractFriendlyErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred while communicating with Gemini.';
  const raw = typeof err === 'string' ? err : err?.message || JSON.stringify(err);

  if (raw.includes('GEMINI_API_KEY')) {
    return 'Gemini API key is not configured on the server. Please set it in Settings > Secrets.';
  }

  // Try extracting message from nested JSON if present
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed?.error === 'string') {
        try {
          parsed.error = JSON.parse(parsed.error);
        } catch {}
      }
      const deepMessage = parsed?.error?.message || parsed?.message || parsed?.error;
      if (typeof deepMessage === 'string' && deepMessage.trim()) {
        if (deepMessage.includes('experiencing high demand') || deepMessage.includes('UNAVAILABLE')) {
          return 'The AI model is temporarily experiencing high demand. Please try again in a few moments.';
        }
        if (deepMessage.includes('RESOURCE_EXHAUSTED') || deepMessage.includes('quota')) {
          return 'The AI service quota is temporarily exceeded. Please wait a moment and try again.';
        }
        return deepMessage;
      }
    }
  } catch {}

  if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand') || raw.includes('Service Unavailable')) {
    return 'The AI model is temporarily experiencing high demand. Please try again in a few moments.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Request rate limit reached. Please wait a few seconds before trying again.';
  }

  return raw;
}

function isTransientError(err: any): boolean {
  const str = (
    (err?.message || '') +
    ' ' +
    (typeof err === 'string' ? err : JSON.stringify(err))
  ).toLowerCase();

  return (
    str.includes('503') ||
    str.includes('unavailable') ||
    str.includes('experiencing high demand') ||
    str.includes('spikes in demand') ||
    str.includes('service unavailable') ||
    str.includes('429') ||
    str.includes('resource_exhausted') ||
    str.includes('quota') ||
    str.includes('500') ||
    str.includes('internal') ||
    str.includes('overloaded') ||
    str.includes('econnreset') ||
    str.includes('etimedout')
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface StreamGenerationOptions {
  mode: AIMode;
  history: ChatHistoryMessage[];
  message: string;
  attachments?: {
    mimeType: string;
    base64Data?: string;
    name?: string;
  }[];
  webSearch?: boolean;
  personalization?: PersonalizationOptions;
  difficulty?: 'easy' | 'medium' | 'hard';
  memories?: string[];
  projectContext?: {
    name: string;
    description?: string;
    instructions?: string;
    notes?: string;
  };
  simpleExplanationMode?: boolean;
  onChunk: (text: string) => void;
  onGrounding?: (data: GroundingResult) => void;
  signal?: AbortSignal;
}

export interface StreamResult {
  text: string;
  webSearchUsed: boolean;
  searchQueries: string[];
  groundingSources: Array<{
    title: string;
    url: string;
    domain?: string;
    snippet?: string;
  }>;
}

export class GeminiProvider {
  // Primary model: gemini-3.1-flash-lite provides sub-second TTFT (600-800ms) with zero thinking lag.
  // Fallbacks: gemini-3.8-flash (with thinkingBudget: 0 to eliminate 20s+ delay) and gemini-flash-latest.
  private candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

  public async streamResponse(options: StreamGenerationOptions): Promise<StreamResult> {
    // 1. Check for direct creator question to guarantee immediate, accurate answer
    if (isDirectCreatorQuestion(options.message)) {
      let creatorAnswer = 'OpenSpace AI was created by Pranesh.';
      if (options.personalization?.language === 'tamil') {
        creatorAnswer = 'OpenSpace AI-ஐ உருவாக்கியவர் பிரனேஷ் (Pranesh).';
      }
      options.onChunk(creatorAnswer);
      return {
        text: creatorAnswer,
        webSearchUsed: false,
        searchQueries: [],
        groundingSources: [],
      };
    }

    const ai = getGenAIClient();
    let baseInstruction = SYSTEM_INSTRUCTIONS[options.mode] || SYSTEM_INSTRUCTIONS.normal;

    // Build personalization system prompts
    const personalizationRules: string[] = [];

    if (options.personalization?.language === 'tamil') {
      personalizationRules.push('LANGUAGE: Respond in natural, fluent Tamil (தமிழ்). Translate concepts clearly with English technical terms in parentheses where appropriate.');
    } else if (options.personalization?.language === 'tanglish') {
      personalizationRules.push('LANGUAGE: Respond in natural, conversational Tanglish (Tamil words written in English Latin script, as commonly spoken in Tamil Nadu chat) with an approachable, friendly tone.');
    } else if (options.personalization?.language === 'english') {
      personalizationRules.push('LANGUAGE: Respond in clear, articulate English.');
    }

    if (options.personalization?.responseLength === 'concise') {
      personalizationRules.push('LENGTH: Keep responses concise, direct, and compact without conversational fluff.');
    } else if (options.personalization?.responseLength === 'comprehensive') {
      personalizationRules.push('LENGTH: Provide deep, exhaustive, comprehensive explanations with extensive context, examples, and breakdown.');
    }

    if (options.personalization?.responseStyle === 'casual') {
      personalizationRules.push('STYLE: Adopt a warm, casual, approachable, and friendly conversational tone.');
    } else if (options.personalization?.responseStyle === 'academic') {
      personalizationRules.push('STYLE: Adopt an academic, rigorous, scholarly, and analytical tone.');
    } else if (options.personalization?.responseStyle === 'creative') {
      personalizationRules.push('STYLE: Adopt an imaginative, vivid, expressive, and engaging creative voice.');
    } else if (options.personalization?.responseStyle === 'direct') {
      personalizationRules.push('STYLE: Adopt a direct, no-nonsense factual tone that answers questions immediately.');
    }

    if (options.difficulty || options.personalization?.studyDifficulty) {
      const diff = options.difficulty || options.personalization?.studyDifficulty;
      personalizationRules.push(`DIFFICULTY LEVEL: ${diff.toUpperCase()}. Calibrate explanations, vocabulary, and quizzes to this target difficulty.`);
    }

    if (options.webSearch) {
      personalizationRules.push(
        'WEB SEARCH ACTIVE: You have live Google Web Search enabled. Search the web whenever up-to-date, current, real-time, or verifying information is required. Always cite the facts accurately.'
      );
    }

    if (options.simpleExplanationMode) {
      personalizationRules.push(
        'SIMPLE EXPLANATION MODE PRIORITY: The user has explicitly enabled Simple Step-by-Step Explanation Mode. Ensure your response is broken down into numbered steps (Step 1, Step 2, Step 3), clear "What you need", practical examples, and expected results. Keep language simple and beginner-friendly.'
      );
    }

    const contextAdditions: string[] = [];

    if (options.projectContext && options.projectContext.name) {
      contextAdditions.push(`\n--- ACTIVE PROJECT CONTEXT ---
Project: ${options.projectContext.name}
${options.projectContext.description ? `Description: ${options.projectContext.description}` : ''}
${options.projectContext.instructions ? `Project Custom Instructions: ${options.projectContext.instructions}` : ''}
${options.projectContext.notes ? `Project Reference Notes: ${options.projectContext.notes}` : ''}`);
    }

    if (options.memories && options.memories.length > 0) {
      contextAdditions.push(`\n--- USER SMART MEMORY (Personal Preferences & Context) ---
Remember these non-sensitive facts/preferences specified by the user:
${options.memories.map((m) => `- ${m}`).join('\n')}`);
    }

    const effectiveSystemInstruction = [
      baseInstruction,
      personalizationRules.length > 0 ? `\n--- PERSONALIZATION INSTRUCTIONS ---\n${personalizationRules.join('\n')}` : '',
      contextAdditions.join('\n'),
    ].filter(Boolean).join('\n');

    // Convert chat history into Gemini contents format (pruning to last 10 turns to avoid excessive context)
    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      >;
    }> = [];

    // Keep the most recent 10 turns of history to keep TTFT low and avoid memory bloat
    const trimmedHistory = (options.history || []).slice(-10);

    // Add previous history turns
    for (let i = 0; i < trimmedHistory.length; i++) {
      const item = trimmedHistory[i];
      const isImmediatePrevious = i === trimmedHistory.length - 1;
      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      // Only send base64 attachments for the immediate previous message to prevent multi-megabyte payloads
      if (item.attachments && item.attachments.length > 0) {
        for (const att of item.attachments) {
          if (att.base64Data && isImmediatePrevious) {
            const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64,
              },
            });
          } else if (att.name) {
            // Include lightweight text reference for earlier turns
            parts.push({ text: `[Previously referenced file: ${att.name}]` });
          }
        }
      }

      if (item.content) {
        parts.push({ text: item.content });
      }

      if (parts.length > 0) {
        contents.push({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts,
        });
      }
    }

    // Add current user message
    const currentParts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [];

    if (options.attachments && options.attachments.length > 0) {
      for (const att of options.attachments) {
        if (att.base64Data) {
          const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
          currentParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: cleanBase64,
            },
          });
        }
      }
    }

    if (options.message) {
      currentParts.push({ text: options.message });
    } else if (currentParts.length > 0) {
      currentParts.push({ text: 'Please analyze the attached file(s).' });
    }

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    let lastError: any = null;
    let chunksEmitted = 0;
    const searchQueries: string[] = [];
    const groundingSources: Array<{
      title: string;
      url: string;
      domain?: string;
      snippet?: string;
    }> = [];

    // Iterate through candidate models if high demand or transient 503 occurs
    for (let mIdx = 0; mIdx < this.candidateModels.length; mIdx++) {
      const currentModel = this.candidateModels[mIdx];
      const maxRetriesForModel = 2;

      for (let attempt = 1; attempt <= maxRetriesForModel; attempt++) {
        if (options.signal?.aborted) {
          return {
            text: '',
            webSearchUsed: false,
            searchQueries: [],
            groundingSources: [],
          };
        }

        try {
          const config: any = {
            systemInstruction: effectiveSystemInstruction,
            // Eliminate thinking latency on models that support thinking (e.g. gemini-3.8-flash)
            thinkingConfig: { thinkingBudget: 0 },
          };

          if (options.webSearch) {
            config.tools = [{ googleSearch: {} }];
          }

          const responseStream = await ai.models.generateContentStream({
            model: currentModel,
            contents,
            config,
          });

          let fullText = '';
          for await (const chunk of responseStream) {
            if (options.signal?.aborted) {
              break;
            }

            // Extract grounding metadata if search was utilized
            const candidate = chunk.candidates?.[0];
            const grounding = candidate?.groundingMetadata;
            if (grounding) {
              if (grounding.webSearchQueries && Array.isArray(grounding.webSearchQueries)) {
                for (const q of grounding.webSearchQueries) {
                  if (q && !searchQueries.includes(q)) {
                    searchQueries.push(q);
                  }
                }
              }

              if (grounding.groundingChunks && Array.isArray(grounding.groundingChunks)) {
                for (const gc of grounding.groundingChunks) {
                  const uri = gc.web?.uri;
                  if (uri && !groundingSources.some((s) => s.url === uri)) {
                    let domain = '';
                    try {
                      domain = new URL(uri).hostname.replace(/^www\./, '');
                    } catch {}
                    groundingSources.push({
                      title: gc.web?.title || domain || 'Web Source',
                      url: uri,
                      domain,
                    });
                  }
                }
              }

              if (options.onGrounding && (searchQueries.length > 0 || groundingSources.length > 0)) {
                options.onGrounding({
                  queries: searchQueries,
                  sources: groundingSources,
                });
              }
            }

            const text = chunk.text || '';
            if (text) {
              chunksEmitted++;
              fullText += text;
              options.onChunk(text);
            }
          }

          const webSearchUsed = Boolean(options.webSearch && (searchQueries.length > 0 || groundingSources.length > 0));

          return {
            text: fullText,
            webSearchUsed,
            searchQueries,
            groundingSources,
          };
        } catch (err: any) {
          lastError = err;
          const friendly = extractFriendlyErrorMessage(err);
          console.log(
            `[GeminiProvider] Notice: ${currentModel} attempt ${attempt}/${maxRetriesForModel} reported: ${friendly}`
          );

          if (chunksEmitted > 0) {
            throw new Error(friendly);
          }

          if (isTransientError(err) && attempt < maxRetriesForModel) {
            const backoffMs = attempt * 500;
            console.log(`[GeminiProvider] Retrying ${currentModel} after ${backoffMs}ms...`);
            await sleep(backoffMs);
            continue;
          }

          if (isTransientError(err) && mIdx < this.candidateModels.length - 1) {
            console.log(`[GeminiProvider] Trying alternative model ${this.candidateModels[mIdx + 1]}...`);
            break;
          }

          throw new Error(friendly);
        }
      }
    }

    throw new Error(extractFriendlyErrorMessage(lastError));
  }

  public async executeCanvasAction(options: {
    action: 'rewrite' | 'summarize' | 'expand' | 'simplify' | 'improve_grammar' | 'change_tone' | 'generate_content';
    text: string;
    customPrompt?: string;
    tone?: string;
  }): Promise<string> {
    const ai = getGenAIClient();
    let prompt = '';

    switch (options.action) {
      case 'rewrite':
        prompt = `Rewrite the following text to improve clarity, flow, and impact while maintaining its original core message:\n\n${options.text}`;
        break;
      case 'summarize':
        prompt = `Provide a clear, high-yield summary of the following text with bullet points and key takeaways:\n\n${options.text}`;
        break;
      case 'expand':
        prompt = `Expand the following text with more depth, relevant examples, supporting arguments, and practical details:\n\n${options.text}`;
        break;
      case 'simplify':
        prompt = `Simplify the following text using simple, easy-to-understand language so a beginner can grasp it immediately:\n\n${options.text}`;
        break;
      case 'improve_grammar':
        prompt = `Fix all grammar, punctuation, spelling, and phrasing errors in the following text while keeping its tone intact:\n\n${options.text}`;
        break;
      case 'change_tone':
        prompt = `Rewrite the following text in a ${options.tone || 'professional'} tone:\n\n${options.text}`;
        break;
      case 'generate_content':
        prompt = `Write a well-structured document section based on this instruction: ${options.customPrompt || options.text}\nContext:\n${options.text}`;
        break;
      default:
        prompt = `${options.customPrompt || 'Improve this document'}:\n\n${options.text}`;
    }

    const res = await ai.models.generateContent({
      model: this.candidateModels[0],
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are the OpenSpace AI Document Canvas Engine. Provide clean, well-formatted document text. Do NOT include conversational filler like "Here is the rewritten text:". Return only the edited or generated text directly.`,
      },
    });

    return res.text || '';
  }
}

export const geminiProvider = new GeminiProvider();
