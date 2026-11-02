export interface Article {
  id: string;
  url: string;
  outlet: string;
  title: string;
  publishedAt: string;
  sourceType: 'wire' | 'primary' | 'opinion' | 'state_media' | 'aggregator' | 'unknown';
  snippet: string;
  imageUrl?: string;
  outletCount?: number;
}

export interface Citation {
  url: string;
  outlet: string;
  publishedAt: string;
  quoteSnippet: string;
}

export interface OutletCoverage {
  outlet: string;
  headline: string;
  keyClaims: string[];
  framingNotes: string;
  omissions: string[];
  citations: Citation[];
}

export interface Comparison {
  event: string;
  outlets: OutletCoverage[];
  agreements: string[];
  disagreements: string[];
  singleSourceFlags: string[];
}

export interface TimelineEvent {
  date: string;
  description: string;
  citations: Citation[];
}

export interface Timeline {
  story: string;
  events: TimelineEvent[];
  gaps: string[];
}

export interface VerifyResult {
  claim: string;
  factcheckHits: Array<{ title: string; url: string; rating: string }>;
  checklist: string[];
  relatedSources: Citation[];
  verdict: 'verified' | 'disputed' | 'unverified';
}

export interface Claim {
  id: string;
  text: string;
  status: 'verified' | 'disputed' | 'unverified';
  supportingArticleIds: string[];
}

export interface SourceLogEntry {
  url: string;
  outlet: string;
  accessDate: string;
  whatItSupports: string;
  investigationId: string;
}

export interface Case {
  id: string;
  title: string;
  topic: string;
  createdAt: string;
  ownerId: string;
  pinnedArticles: Article[];
  claims: Claim[];
  sourceLog: SourceLogEntry[];
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  isUnsourced?: boolean;
  notFound?: boolean;
  comparison?: Comparison;
  timeline?: Timeline;
  verifyResult?: VerifyResult;
  isStreaming?: boolean;
  error?: string;
}

export type QuickAction =
  | 'summarize'
  | 'compare'
  | 'verify'
  | 'timeline'
  | 'angles'
  | 'interview';

export interface AiAskPayload {
  action: QuickAction | 'chat';
  prompt: string;
  articleId?: string;
  caseId?: string;
}

export interface NewsFilters {
  topic?: string;
  country?: string;
  outlet?: string;
  dateFrom?: string;
  dateTo?: string;
  sourceType?: Article['sourceType'];
  query?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export type ApiError = {
  message: string;
  status: number;
};
