const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export type ContentType = 'post' | 'carousel' | 'story' | 'reel';
export type DraftStatus = 'draft' | 'ready' | 'scheduled' | 'published' | 'failed' | 'cancelled';
export type SourceMode = 'catalog' | 'libre';

// ── Frontend types (use friendly field names) ─────────────────────────────────

export interface InstagramAccount {
  id: string;               // DB: account_id
  company_id: string;
  user_id: string;          // DB: connected_by
  instagram_user_id: string;// DB: instagram_account_id
  username: string;
  name?: string;            // DB: account_name
  profile_picture_url?: string;
  access_token?: string;    // DB: access_token_encrypted
  token_expires_at?: string;
  follower_count: number;   // not in DB — defaults to 0
  following_count?: number;
  media_count?: number;
  is_connected: boolean;    // DB: is_active
  account_type?: string;
  page_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;               // DB: media_item_id
  draft_id: string;
  company_id: string;
  url: string;              // DB: media_url
  media_type: 'image' | 'video';
  order_index: number;      // DB: position
  storage_path?: string;
  created_at: string;
}

export interface InstagramDraft {
  id: string;               // DB: draft_id
  company_id: string;
  account_id?: string;
  caption?: string;
  content_type: ContentType;
  status: DraftStatus;
  source_mode: SourceMode;
  catalog_item_id?: string;
  scheduled_for?: string;   // not in DB — always undefined
  timezone?: string;
  published_at?: string;    // not in DB — always undefined
  error_message?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  media_items?: MediaItem[];
}

export interface ScheduleJob {
  id: string;            // DB: job_id
  draft_id: string;
  company_id: string;
  scheduled_time: string;
  status: 'pending' | 'published' | 'cancelled' | 'failed';
  attempts: number;
  created_at: string;
  executed_at?: string;
}

export interface PaginatedDrafts {
  data: InstagramDraft[];
  total: number;
  page: number;
  page_size: number;
}

// ── DB → frontend transforms ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformJob(raw: Record<string, any>): ScheduleJob {
  return {
    id:             raw.job_id,
    draft_id:       raw.draft_id,
    company_id:     raw.company_id,
    scheduled_time: raw.scheduled_time,
    status:         raw.status,
    attempts:       raw.attempts ?? 0,
    created_at:     raw.created_at,
    executed_at:    raw.executed_at ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformAccount(raw: Record<string, any>): InstagramAccount {
  return {
    id:                raw.account_id,
    company_id:        raw.company_id,
    user_id:           raw.connected_by ?? '',
    instagram_user_id: raw.instagram_account_id ?? '',
    username:          raw.username,
    name:              raw.account_name ?? undefined,
    profile_picture_url: raw.profile_picture_url ?? undefined,
    access_token:      raw.access_token_encrypted ?? undefined,
    token_expires_at:  raw.token_expires_at ?? undefined,
    follower_count:    0,                    // column not in DB
    is_connected:      raw.is_active ?? false,
    created_at:        raw.created_at,
    updated_at:        raw.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformMedia(raw: Record<string, any>): MediaItem {
  return {
    id:          raw.media_item_id,
    draft_id:    raw.draft_id,
    company_id:  '',                          // column not in DB
    url:         raw.media_url,
    media_type:  raw.media_type ?? 'image',
    order_index: raw.position ?? 0,
    created_at:  raw.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformDraft(raw: Record<string, any>): InstagramDraft {
  return {
    id:              raw.draft_id,
    company_id:      raw.company_id,
    account_id:      raw.account_id ?? undefined,
    caption:         raw.caption ?? undefined,
    content_type:    raw.content_type as ContentType,
    status:          raw.status as DraftStatus,
    source_mode:     raw.source_mode as SourceMode,
    catalog_item_id: raw.catalog_item_id ?? undefined,
    scheduled_for:   undefined,              // column not in DB
    published_at:    undefined,              // column not in DB
    error_message:   undefined,
    created_by:      raw.created_by ?? '',
    created_at:      raw.created_at,
    updated_at:      raw.updated_at,
    media_items:     Array.isArray(raw.media_items)
                       ? raw.media_items.map(transformMedia)
                       : undefined,
  };
}

// ── HTTP client ───────────────────────────────────────────────────────────────

async function call<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) {
    // ApiError.to_JSON() raises HTTPException with detail as a nested object:
    // { "detail": { "message": "SERVER_ERROR", "detail": "real message", "http_status": 500 } }
    // Direct HTTPException raises have detail as a plain string.
    const raw = json?.detail;
    const msg =
      typeof raw === 'string'
        ? raw
        : typeof raw?.detail === 'string'
          ? raw.detail
          : raw?.message ?? json?.message ?? 'Erreur serveur';
    throw new Error(msg);
  }
  return json as T;
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export async function fetchAccounts(companyId: string): Promise<InstagramAccount[]> {
  const res = await call<{ data: Record<string, unknown>[] }>(`${API}/instagram/accounts?company_id=${companyId}`);
  return (res.data ?? []).map(transformAccount);
}

export async function connectAccount(payload: {
  company_id: string;
  instagram_user_id: string;
  username: string;
  name?: string;
  access_token: string;
  page_id?: string;
  account_type?: string;
}): Promise<InstagramAccount> {
  // Remap frontend field names → real DB column names
  const body = {
    company_id:              payload.company_id,
    instagram_account_id:    payload.instagram_user_id,
    username:                payload.username,
    ...(payload.name        ? { account_name:           payload.name }         : {}),
    access_token_encrypted:  payload.access_token,
    // page_id and account_type don't exist in the DB table — omit
  };
  const res = await call<{ data: Record<string, unknown> }>(`${API}/instagram/accounts`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return transformAccount(res.data);
}

export async function disconnectAccount(accountId: string): Promise<void> {
  await call(`${API}/instagram/accounts/${accountId}`, { method: 'DELETE' });
}

// ── Drafts ────────────────────────────────────────────────────────────────────

export async function fetchDrafts(params: {
  company_id: string;
  status?: string;
  account_id?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedDrafts> {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, String(v));
  }
  const raw = await call<{ data: Record<string, unknown>[]; total: number; page: number; page_size: number }>(
    `${API}/instagram/drafts?${q}`
  );
  return {
    data:      Array.isArray(raw?.data) ? raw.data.map(transformDraft) : [],
    total:     raw?.total     ?? 0,
    page:      raw?.page      ?? 1,
    page_size: raw?.page_size ?? 20,
  };
}

export async function fetchDraft(draftId: string): Promise<InstagramDraft> {
  const res = await call<{ data: Record<string, unknown> }>(`${API}/instagram/drafts/${draftId}`);
  return transformDraft(res.data);
}

export async function createDraft(payload: {
  company_id: string;
  account_id?: string;
  caption?: string;
  content_type?: ContentType;
  source_mode?: SourceMode;
  catalog_item_id?: string;
}): Promise<InstagramDraft> {
  const res = await call<{ data: Record<string, unknown> }>(`${API}/instagram/drafts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return transformDraft(res.data);
}

export async function updateDraft(
  draftId: string,
  payload: Partial<{
    account_id: string;
    caption: string;
    content_type: ContentType;
    source_mode: SourceMode;
    catalog_item_id: string;
    status: DraftStatus;
  }>,
): Promise<InstagramDraft> {
  const res = await call<{ data: Record<string, unknown> }>(`${API}/instagram/drafts/${draftId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return transformDraft(res.data);
}

export async function deleteDraft(draftId: string): Promise<void> {
  await call(`${API}/instagram/drafts/${draftId}`, { method: 'DELETE' });
}

export async function addMedia(
  draftId: string,
  payload: { url: string; media_type: 'image' | 'video'; order_index: number; storage_path?: string },
): Promise<MediaItem> {
  // Remap frontend field names → real DB column names
  const body = {
    media_url:  payload.url,
    media_type: payload.media_type,
    position:   payload.order_index,
  };
  const res = await call<{ data: Record<string, unknown> }>(`${API}/instagram/drafts/${draftId}/media`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return transformMedia(res.data);
}

export async function removeMedia(draftId: string, mediaItemId: string): Promise<void> {
  await call(`${API}/instagram/drafts/${draftId}/media/${mediaItemId}`, { method: 'DELETE' });
}

export async function publishDraft(draftId: string): Promise<InstagramDraft> {
  const res = await call<{ data: Record<string, unknown> }>(`${API}/instagram/drafts/${draftId}/publish`, {
    method: 'POST',
  });
  return transformDraft(res.data);
}

// ── Schedule jobs ─────────────────────────────────────────────────────────────

export async function scheduleDraft(
  draftId: string,
  scheduledTime: string,
): Promise<ScheduleJob> {
  const res = await call<{ data: Record<string, unknown> }>(`${API}/instagram/drafts/${draftId}/schedule`, {
    method: 'POST',
    body: JSON.stringify({ scheduled_time: scheduledTime }),
  });
  return transformJob(res.data);
}

export async function fetchJobs(params: {
  company_id: string;
  status?: string;
  draft_id?: string;
}): Promise<ScheduleJob[]> {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, String(v));
  }
  const res = await call<{ data: Record<string, unknown>[] }>(`${API}/instagram/jobs?${q}`);
  return (res.data ?? []).map(transformJob);
}

export async function cancelJob(jobId: string): Promise<void> {
  await call(`${API}/instagram/jobs/${jobId}`, { method: 'DELETE' });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface MetricsByDate {
  date: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface MetricsByPost {
  draft_id: string;
  caption?: string;
  content_type?: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  updated_at?: string;
}

export interface MetricsTotals {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface PostAnalytics {
  by_date: MetricsByDate[];
  by_post: MetricsByPost[];
  totals: MetricsTotals;
}

export interface AccountMetricsByDate {
  date: string;
  followers_count: number;
  following_count: number;
  media_count: number;
}

export interface AccountAnalytics {
  by_date: AccountMetricsByDate[];
  latest: AccountMetricsByDate | null;
  follower_change: number;
}

export interface AnalyticsSummaryPeriod {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface AnalyticsSummary {
  current: AnalyticsSummaryPeriod;
  previous: AnalyticsSummaryPeriod;
  changes: {
    impressions_pct: number | null;
    reach_pct: number | null;
    likes_pct: number | null;
    comments_pct: number | null;
  };
  date_from: string;
  date_to: string;
}

type AnalyticsParams = {
  company_id: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
};

function _analyticsQ(params: AnalyticsParams): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, v);
  }
  return q.toString();
}

export async function fetchAnalyticsSummary(params: AnalyticsParams): Promise<AnalyticsSummary> {
  const res = await call<{ data: AnalyticsSummary }>(`${API}/instagram/analytics/summary?${_analyticsQ(params)}`);
  return res.data;
}

export async function fetchAnalyticsPosts(params: AnalyticsParams): Promise<PostAnalytics> {
  const res = await call<{ data: PostAnalytics }>(`${API}/instagram/analytics/posts?${_analyticsQ(params)}`);
  return res.data;
}

export async function fetchAnalyticsAccount(params: AnalyticsParams): Promise<AccountAnalytics> {
  const res = await call<{ data: AccountAnalytics }>(`${API}/instagram/analytics/account?${_analyticsQ(params)}`);
  return res.data;
}

// ── Recommendations ───────────────────────────────────────────────────────────

export interface PostingSlot {
  day: string;       // e.g. "Mardi"
  hour: number;      // 0-23
  label: string;     // e.g. "Mardi 8h"
  score: number;
}

export interface PostingTimeData {
  top_slots: PostingSlot[];
  heatmap: number[];  // 24-element array indexed by hour
  data_based: boolean;
}

export interface CaptionTip {
  tip: string;
  reason: string;
}

export interface TopCaption {
  caption: string;
  engagement_rate: number;
}

export interface CaptionRecommendations {
  tips: CaptionTip[];
  top_captions: TopCaption[];
  data_based: boolean;
}

export interface WeeklyBestPost {
  draft_id: string;
  caption?: string;
  impressions: number;
  engagement_rate: number;
}

export interface WeeklyReportData {
  current_week: { impressions: number; reach: number; likes: number; comments: number; shares: number };
  previous_week: { impressions: number; reach: number; likes: number; comments: number; shares: number };
  changes: { impressions_pct: number | null; reach_pct: number | null; likes_pct: number | null };
  best_post: WeeklyBestPost | null;
  tips: string[];
  date_from: string;
  date_to: string;
}

type RecoParams = { company_id: string; account_id?: string };

function _recoQ(params: RecoParams): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, v);
  }
  return q.toString();
}

export async function fetchRecommendationsPostingTime(params: RecoParams): Promise<PostingTimeData> {
  const res = await call<{ data: PostingTimeData }>(`${API}/instagram/recommendations/posting-time?${_recoQ(params)}`);
  return res.data;
}

export async function fetchRecommendationsCaptions(params: RecoParams): Promise<CaptionRecommendations> {
  const res = await call<{ data: CaptionRecommendations }>(`${API}/instagram/recommendations/captions?${_recoQ(params)}`);
  return res.data;
}

export async function fetchWeeklyReport(params: RecoParams): Promise<WeeklyReportData> {
  const res = await call<{ data: WeeklyReportData }>(`${API}/instagram/recommendations/weekly-report?${_recoQ(params)}`);
  return res.data;
}
