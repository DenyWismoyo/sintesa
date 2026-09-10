/**
 * Clario AI Unified Client Wrapper
 * Sintesa / Solo Technopark
 * 
 * Centralized client for all AI operations using CLARIO_API_KEY.
 * All models are mapped to their specific strengths.
 */

export const CLARIO_MODELS = {
  // Conversational & Interactive Fast Chat
  CHAT_FAST: 'clario/qwen3.8-27b',
  CHAT_FLAGSHIP: 'clario/glm-5.3',
  CHAT_STABLE: 'clario/glm-5.2',

  // Reasoning, Math & Finance
  FAST_REASONING: 'clario/deepseek-v4-flash',
  FAST_EXTRACTION: 'clario/deepseek-v4-flash',
  FINANCIAL_PRO: 'clario/deepseek-v4-pro-0813',

  // Multimodal Vision & OCR
  VISION_PRIMARY: 'clario/qwen3-vl-235b-a22b-instruct',
  VISION_OCR: 'clario/qwen3-vl-235b-a22b-instruct',
  VISION_MASSIVE: 'clario/ernie-4.5-vl-424b-a47b',

  // Language, Copywriting & Synthesis
  INDONESIAN_PRO: 'clario/qwen3.8-27b',
  CREATIVE_COPY: 'clario/minimax-m3',
  LONG_CONTEXT: 'clario/mimo-v2.5-pro',

  // Executive / High-Stakes (Restricted to Admin / Super Admin)
  LEGAL_OPUS: 'clario/claude-opus-5',
  SOLVER_PRO: 'clario/gpt-5.6-sol',

  // Image Generation
  IMAGE_BANNER: 'clario/flux-2-pro',
  IMAGE_REALISTIC: 'clario/imagen-4.0-ultra',
} as const;

export type ClarioModelType = (typeof CLARIO_MODELS)[keyof typeof CLARIO_MODELS];

export interface ClarioChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ClarioChatOptions {
  model: ClarioModelType;
  messages: ClarioChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface ClarioVisionOptions {
  model?: ClarioModelType;
  prompt: string;
  imageUrl: string;
  temperature?: number;
  jsonMode?: boolean;
}

export interface ClarioImageOptions {
  model?: ClarioModelType;
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  n?: number;
}

function getClarioConfig() {
  const apiKey = process.env.CLARIO_API_KEY || '';
  const primaryUrl = (process.env.CLARIO_BASE_URL || 'https://clario.apicloud.my.id/v1').replace(/\/+$/, '');
  const backupUrl = (process.env.CLARIO_BACKUP_BASE_URL || '').replace(/\/+$/, '');
  return { apiKey, primaryUrl, backupUrl };
}

/**
 * Panggilan HTTP tunggal ke endpoint Clario OpenAI-compatible
 */
async function sendClarioChatRequest(
  baseUrl: string,
  apiKey: string,
  options: ClarioChatOptions,
  modelName: string,
  timeoutMs: number = 30000
): Promise<string> {
  const bodyPayload: Record<string, any> = {
    model: modelName,
    messages: options.messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096,
  };

  // Catatan: Proxy Clario memicu 502 Proxy Error jika response_format dikirim pada model tertentu.
  // Format JSON dijamin oleh system prompt & regex extraction di sisi service/caller.


  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Clario API HTTP ${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('[Clario Error]: Tidak ada teks jawaban yang dikembalikan oleh model Clario.');
  }

  return content;
}

/**
 * Panggilan Chat / Teks Terstruktur Clario (100% Clario API)
 * Sesuai dokumentasi: https://clario.apicloud.my.id/docs
 * Mendukung failover otomatis ke backup direct-port jika terkena WAF / 403 / timeout,
 * serta rotasi cerdas antar-model jika server upstream sedang padat (503).
 */
export async function callClarioChat(options: ClarioChatOptions): Promise<string> {
  const { apiKey, primaryUrl, backupUrl } = getClarioConfig();
  if (!apiKey) {
    throw new Error('[Clario Error]: CLARIO_API_KEY tidak ditemukan di environment.');
  }

  const targetModel = options.model || CLARIO_MODELS.CHAT_FAST;
  // Cepat beralih ke model ekstraksi ringan jika model pertama lambat
  const fallbackModel = targetModel === CLARIO_MODELS.FAST_EXTRACTION
    ? CLARIO_MODELS.CHAT_FAST
    : CLARIO_MODELS.FAST_EXTRACTION;

  const urlsToTry = [primaryUrl, backupUrl].filter((v, idx, arr) => arr.indexOf(v) === idx);
  const activeUrl = urlsToTry[0];

  // Batasi timeout per percobaan ke 15 detik agar antarmuka tidak macet bermenit-menit
  const TIMEOUT_MS = 15000;

  try {
    return await sendClarioChatRequest(activeUrl, apiKey, options, targetModel, TIMEOUT_MS);
  } catch (err1: any) {
    console.warn(`[Clario Gateway]: Panggilan pertama (${targetModel}) gagal: ${err1.message}`);

    // Jika terjadi WAF/403 coba URL cadangan; jika overload coba model fallback
    const retryUrl = (err1.message.includes('403') || err1.message.includes('WAF')) && urlsToTry[1]
      ? urlsToTry[1]
      : activeUrl;

    try {
      console.log(`[Clario Gateway]: Mengaktifkan fast fallback (${fallbackModel}) di ${retryUrl}...`);
      return await sendClarioChatRequest(retryUrl, apiKey, options, fallbackModel, TIMEOUT_MS);
    } catch (err2: any) {
      console.warn(`[Clario Gateway]: Fast fallback (${fallbackModel}) gagal: ${err2.message}`);
      throw new Error(`[Clario Gateway]: ${err1.message} | Fallback: ${err2.message}`);
    }
  }
}

/**
 * Panggilan Vision / Multimodal Clario (100% Clario API)
 * Model: clario/qwen3-vl-235b-a22b-instruct
 */
export async function callClarioVision(options: ClarioVisionOptions): Promise<string> {
  const { apiKey, primaryUrl, backupUrl } = getClarioConfig();
  if (!apiKey) throw new Error('CLARIO_API_KEY tidak dikonfigurasi');

  const model = options.model || CLARIO_MODELS.VISION_PRIMARY;
  const urlsToTry = [primaryUrl, backupUrl];

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: options.prompt },
        { type: 'image_url', image_url: { url: options.imageUrl } },
      ],
    },
  ];

  const bodyPayload: Record<string, any> = {
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: 4096,
  };

  if (options.jsonMode) {
    bodyPayload.response_format = { type: 'json_object' };
  }

  let lastError: Error | null = null;
  for (const url of urlsToTry) {
    try {
      const response = await fetch(`${url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(60000),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      } else {
        const text = await response.text();
        lastError = new Error(`[Clario Vision HTTP ${response.status}]: ${text}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('[Clario Vision]: Gagal memproses gambar.');
}

/**
 * Panggilan Image Generation Clario (Poster Event & Mockup)
 */
export async function callClarioImage({
  model = CLARIO_MODELS.IMAGE_BANNER,
  prompt,
  size = '1024x1024',
  n = 1,
}: ClarioImageOptions): Promise<string[]> {
  const { apiKey, primaryUrl } = getClarioConfig();

  const response = await fetch(`${primaryUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      n,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Clario Image Error] (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const urls = (data.data || []).map((item: any) => item.url || item.b64_json);
  return urls;
}

