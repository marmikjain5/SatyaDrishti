/**
 * SatyaDrishti Supabase Storage Service
 * Uploads evidence images to Supabase Storage REST API.
 * Returns a persistent public URL that survives page refresh.
 */

const SUPABASE_PROJECT_REF = 'lucooynvpxytykrnrxhx';
const SUPABASE_STORAGE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1`;

// Service role / anon key from .env (VITE_ prefix exposes to Vite frontend)
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SECRET_ACCESS_KEY || '';

// Public bucket  -  create in Supabase dashboard → Storage → New bucket → "evidence-images" (public)
export const EVIDENCE_BUCKET = 'evidence-images';

/** Converts a base64 data URL to a Blob */
function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mimeType }), mimeType };
}

/**
 * Uploads an evidence image to Supabase Storage.
 * Accepts a base64 data URL or a File object.
 * Returns the persistent public URL. Falls back to original on error.
 */
export async function uploadEvidenceImage(
  imageInput: string | File,
  fileName: string
): Promise<string> {
  if (!SERVICE_KEY) {
    console.warn('[SupabaseStorage] No service key configured  -  skipping upload.');
    return typeof imageInput === 'string' ? imageInput : URL.createObjectURL(imageInput);
  }

  try {
    let blob: Blob;
    let mimeType: string;

    if (typeof imageInput === 'string') {
      if (!imageInput.startsWith('data:')) return imageInput; // Already a URL
      const conv = dataUrlToBlob(imageInput);
      blob = conv.blob;
      mimeType = conv.mimeType;
    } else {
      blob = imageInput;
      mimeType = imageInput.type || 'image/jpeg';
    }

    const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 60);
    const path = `complaints/${Date.now()}-${sanitized}.${ext}`;

    const uploadUrl = `${SUPABASE_STORAGE_URL}/object/${EVIDENCE_BUCKET}/${path}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'x-upsert': 'true',
      },
      body: blob,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[SupabaseStorage] Upload failed (${res.status}): ${errText}`);
      return typeof imageInput === 'string' ? imageInput : URL.createObjectURL(imageInput);
    }

    const publicUrl = `${SUPABASE_STORAGE_URL}/object/public/${EVIDENCE_BUCKET}/${path}`;
    console.log(`✅ [SupabaseStorage] Uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.warn('[SupabaseStorage] Upload error, using local fallback:', err);
    return typeof imageInput === 'string' ? imageInput : URL.createObjectURL(imageInput as File);
  }
}

/** True if Supabase Storage service key is configured */
export function isStorageConfigured(): boolean {
  return !!SERVICE_KEY;
}
