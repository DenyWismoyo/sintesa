/**
 * Server-side Firestore helper using Google Cloud Firestore REST API.
 * Bypasses the Node.js gRPC / WebChannel connection hang issue when running in SSR/Edge.
 * Provides ultra-fast (sub-200ms) fetches with Next.js revalidation cache.
 */

function parseFirestoreValue(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(parseFirestoreValue);
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    for (const k in (val.mapValue.fields || {})) {
      res[k] = parseFirestoreValue(val.mapValue.fields[k]);
    }
    return res;
  }
  if ('timestampValue' in val) return new Date(val.timestampValue).getTime();
  if ('nullValue' in val) return null;
  return null;
}

function parseFirestoreDoc<T>(doc: any, fallbackId?: string): T {
  const docId = fallbackId || doc.name?.split('/').pop() || '';
  const result: Record<string, any> = { id: docId };
  for (const k in (doc.fields || {})) {
    result[k] = parseFirestoreValue(doc.fields[k]);
  }
  return result as T;
}

export async function getServerDocRest<T = any>(
  collectionName: string,
  docId: string,
  revalidateSeconds: number = 60
): Promise<T | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'katalog-solo-technopark';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${docId}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: revalidateSeconds },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      console.warn(`[SERVER REST] HTTP ${res.status} when fetching ${collectionName}/${docId}`);
      return null;
    }

    const json = await res.json();
    if (!json.fields) return null;

    return parseFirestoreDoc<T>(json, docId);
  } catch (error) {
    console.warn(`[SERVER REST ERROR] Gagal fetch ${collectionName}/${docId}:`, error);
    return null;
  }
}
