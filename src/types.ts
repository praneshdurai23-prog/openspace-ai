export type AIMode = 'normal' | 'study' | 'coding' | 'writing' | 'file_analysis';

export type WorkspaceTab = 'chat' | 'files' | 'study' | 'notes' | 'code' | 'canvas' | 'projects' | 'data' | 'prompts';

export interface AIModeConfig {
  id: AIMode;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  placeholder: string;
  systemInstruction: string;
  suggestedPrompts: string[];
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  dataUrl?: string; // For client-side preview
  base64Data?: string; // For Gemini payload
  extractedText?: string; // Parsed text from DOCX/TXT/CSV
  createdAt: number;
}

export interface GroundingSource {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface StudyCard {
  id: string;
  type: 'flashcard' | 'mcq' | 'quiz' | 'revision';
  front?: string;
  back?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  answer?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface WrongAnswerRecord {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  topic?: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  mode?: AIMode;
  attachments?: FileAttachment[];
  isStreaming?: boolean;
  error?: string;
  webSearchUsed?: boolean;
  searchQueries?: string[];
  groundingSources?: GroundingSource[];
  feedback?: 'like' | 'dislike' | null;
}

export interface Conversation {
  id: string;
  title: string;
  mode: AIMode;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  pinned?: boolean;
  archived?: boolean;
  projectId?: string;
  notes?: string;
  studyCards?: StudyCard[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  notes?: string;
  conversationIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SmartMemory {
  id: string;
  content: string;
  category?: string;
  createdAt: number;
}

export type PromptCategory =
  | 'study'
  | 'coding'
  | 'writing'
  | 'productivity'
  | 'research'
  | 'file_analysis'
  | 'data_analysis'
  | 'career'
  | 'general';

export interface PromptItem {
  id: string;
  title: string;
  category: PromptCategory;
  prompt: string;
  description?: string;
  isFavorite?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type LanguagePreference = 'english' | 'tamil' | 'tanglish';
export type LanguageOption = LanguagePreference;

export type ResponseLengthPreference = 'concise' | 'balanced' | 'comprehensive';

export type ResponseStylePreference = 'professional' | 'casual' | 'academic' | 'creative' | 'direct';
export type ResponseStyleOption = ResponseStylePreference;

export type AIPersonality = 'friendly' | 'professional' | 'teacher' | 'concise' | 'detailed' | 'beginner_friendly';

export type FontSizePreference = 'small' | 'medium' | 'large';
export type FontSizeOption = FontSizePreference;

export type StudyDifficulty = 'easy' | 'medium' | 'hard';

export interface UserSettings {
  theme: ThemeMode;
  defaultMode: AIMode;
  sendOnEnter: boolean;
  streamResponses: boolean;
  codeWrap: boolean;
  // Personalization settings
  language: LanguagePreference;
  responseLength: ResponseLengthPreference;
  responseStyle: ResponseStylePreference;
  personality: AIPersonality;
  fontSize: FontSizePreference;
  webSearchDefault: boolean;
  simpleExplanationDefault: boolean;
  defaultWebSearch?: boolean;
  defaultSimpleExplanations?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'password' | 'google';
  createdAt: number;
  lastLoginAt?: number;
}

export interface UserStats {
  conversationCount: number;
  messageCount: number;
  fileCount: number;
  memoryCount: number;
  projectCount: number;
}

