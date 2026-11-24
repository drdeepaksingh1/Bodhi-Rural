import type { SupabaseClient } from '@supabase/supabase-js';

const PHOTO_BUCKET = 'bodhimart-product-images';

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function marketplaceProductPhotoPathFromUrl(
  url: string,
  userId: string
) {
  try {
    const pathname = new URL(url).pathname;
    const marker = `/storage/v1/object/public/${PHOTO_BUCKET}/`;
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const encodedPath = pathname.slice(markerIndex + marker.length);
    const path = decodeURIComponent(encodedPath);
    return path.startsWith(`${userId}/`) ? path : null;
  } catch {
    return null;
  }
}

export async function uploadMarketplaceProductPhoto(
  supabase: SupabaseClient,
  userId: string,
  file: File
) {
  const extension = EXTENSION_BY_TYPE[file.type];

  if (!extension) {
    throw new Error('Choose a JPG, PNG, or WebP product photo.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Product photos must be 5 MB or smaller.');
  }

  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  return {
    path: data.path,
    publicUrl: supabase.storage.from(PHOTO_BUCKET).getPublicUrl(data.path)
      .data.publicUrl,
  };
}

export async function removeMarketplaceProductPhotos(
  supabase: SupabaseClient,
  paths: string[]
) {
  if (paths.length === 0) return;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove(paths);

  if (error) throw error;
}
