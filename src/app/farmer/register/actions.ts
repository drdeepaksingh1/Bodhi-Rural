'use server';

import { randomUUID } from 'crypto';
import { createClient } from '../../../lib/supabase/server';

type FarmerDocumentBucket =
  | 'farmer-photos'
  | 'farmer-aadhaar'
  | 'farmer-bank-documents';

type UploadResult =
  | { path: string }
  | { error: string };

function hasSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3 &&
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 &&
      bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a &&
      bytes[6] === 0x1a && bytes[7] === 0x0a;
  }

  if (mimeType === 'image/webp') {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }

  if (mimeType === 'application/pdf') {
    return bytes.length >= 5 &&
      String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  }

  return false;
}

export async function uploadFarmerApplicationDocument(
  formData: FormData
): Promise<UploadResult> {
  const bucket = String(formData.get('bucket') || '') as FarmerDocumentBucket;
  const file = formData.get('file');

  const isPhoto = bucket === 'farmer-photos';
  const isKycDocument =
    bucket === 'farmer-aadhaar' || bucket === 'farmer-bank-documents';

  if (!isPhoto && !isKycDocument) {
    return { error: 'Unsupported document category.' };
  }

  if (!(file instanceof File) || file.size <= 0) {
    return { error: 'Please select a valid document.' };
  }

  const maxBytes = isPhoto ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  const allowedTypes = isPhoto
    ? ['image/jpeg', 'image/png', 'image/webp']
    : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (file.size > maxBytes) {
    return {
      error: `File is too large. Maximum allowed size is ${isPhoto ? '5 MB' : '10 MB'}.`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return { error: 'Allowed formats are JPG, PNG, WebP, and PDF for KYC documents.' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasSignature(bytes, file.type)) {
    return { error: 'The selected file content does not match its declared file type.' };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Please sign in before uploading farmer documents.' };
  }

  const extensionByType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };
  const path = `${user.id}/${randomUUID()}.${extensionByType[file.type]}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { error: `Unable to upload document: ${error.message}` };
  }

  return { path };
}
