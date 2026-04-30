import {
  isSupabaseConfigured,
  proofsBucket,
  supabaseStorageClient,
} from './supabaseClient';

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function uploadProofImage(userId, file, options = {}) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase storage is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  if (!file) {
    throw new Error('Please choose an image to upload.');
  }

  if (!file.type?.startsWith('image/')) {
    throw new Error('Only image files can be uploaded as proof.');
  }

  const orderFolder = options.orderId ? `${options.orderId}/` : '';
  const filePath = `${userId}/${orderFolder}${Date.now()}-${sanitizeFileName(file.name)}`;

  const { data, error } = await supabaseStorageClient.storage
    .from(proofsBucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    if (error.message?.toLowerCase().includes('bucket')) {
      throw new Error(
        'Supabase bucket "proofs" was not found. Create the "proofs" bucket before uploading.'
      );
    }

    throw new Error(error.message || 'Proof image upload failed.');
  }

  const { data: publicUrlData } = supabaseStorageClient.storage
    .from(proofsBucket)
    .getPublicUrl(filePath);

  return {
    bucket: proofsBucket,
    path: data?.path || filePath,
    url: publicUrlData?.publicUrl || '',
  };
}

export function getProofPublicUrl(path) {
  if (!path) return '';

  const { data } = supabaseStorageClient.storage
    .from(proofsBucket)
    .getPublicUrl(path);

  return data?.publicUrl || '';
}
