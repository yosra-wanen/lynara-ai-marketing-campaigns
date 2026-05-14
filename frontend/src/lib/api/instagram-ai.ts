const AI_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

async function post<T>(path: string, body: object): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${AI_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Service IA non disponible — vérifiez que le serveur est démarré sur ${AI_URL}`
    );
  }
  const json = await res.json();
  if (!res.ok) {
    const raw = json?.detail;
    const msg =
      typeof raw === 'string'
        ? raw
        : typeof raw?.detail === 'string'
          ? raw.detail
          : json?.message ?? 'Erreur serveur IA';
    throw new Error(msg);
  }
  return json as T;
}

export interface CaptionResult {
  caption: string;
  hashtags: string[];
  cta: string;
}

export interface CaptionResponse {
  data: CaptionResult;
  mock?: boolean;
}

export interface ImageResult {
  url: string;
  prompt: string;
  style: string;
  width: number;
  height: number;
}

export interface ImageResponse {
  data: ImageResult;
  mock?: boolean;
  note?: string;
}

export type CaptionTone = 'professionnel' | 'enthousiaste' | 'informatif' | 'persuasif';
export type CaptionLanguage = 'fr' | 'en' | 'ar';
export type ImageStyle = 'moderne' | 'lumineux' | 'élégant' | 'minimaliste';

export function generateCaption(params: {
  company_id: string;
  draft_id?: string;
  context: string;
  tone?: CaptionTone;
  language?: CaptionLanguage;
  catalog_item_id?: string;
}): Promise<CaptionResponse> {
  return post('/instagram/generate/caption', params);
}

export function improveCaption(params: {
  company_id: string;
  draft_id?: string;
  existing_caption: string;
  instructions: string;
  language?: CaptionLanguage;
}): Promise<CaptionResponse> {
  return post('/instagram/generate/improve-caption', params);
}

export function generateImage(params: {
  company_id: string;
  draft_id?: string;
  prompt: string;
  style?: ImageStyle;
  content_type?: string;
}): Promise<ImageResponse> {
  return post('/instagram/generate/image', params);
}
