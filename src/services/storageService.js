import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { push, ref as databaseRef, set } from 'firebase/database';
import {
  database,
  isFirebaseConfigured,
  storage as firebaseStorage,
} from './firebaseClient';
import {
  imagesBucket,
  proofsBucket,
  isSupabaseConfigured,
  supabaseStorageClient,
  taskProofsBucket,
} from './supabaseClient';

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function uploadProofImage(userId, file, options = {}) {
  if (!file) {
    throw new Error('Please choose an image to upload.');
  }

  if (!file.type?.startsWith('image/')) {
    throw new Error('Only image files can be uploaded as proof.');
  }

  const targetBucket = options.bucket || proofsBucket;
  const orderFolder = options.orderId ? `${options.orderId}/` : '';
  const relativePath = `${userId}/${orderFolder}${Date.now()}-${sanitizeFileName(file.name)}`;
  const filePath = `${targetBucket}/${relativePath}`;

  if (isFirebaseConfigured && firebaseStorage) {
    try {
      const uploadSnapshot = await uploadBytes(
        storageRef(firebaseStorage, filePath),
        file,
        {
          contentType: file.type,
        }
      );
      const publicUrl = await getDownloadURL(uploadSnapshot.ref);

      if (database && !String(userId).startsWith('guest_')) {
        const uploadId = push(databaseRef(database, 'uploads')).key;

        if (uploadId) {
          void set(databaseRef(database, `uploads/${uploadId}`), {
              userId,
              fileName: sanitizeFileName(file.name),
              imageUrl: publicUrl,
              fileType: file.type,
              fileSize: file.size,
              bucket: targetBucket,
              source:
                targetBucket === proofsBucket
                  ? 'payment-proof'
                  : targetBucket === taskProofsBucket
                  ? 'task-proof'
                  : 'gallery',
              storagePath: filePath,
              orderId: options.orderId || '',
              createdAt: new Date().toISOString(),
              metadata: {
                bucket: targetBucket,
                orderId: options.orderId || '',
              },
            }).catch((metadataError) => {
              console.warn('Proof upload metadata sync failed:', metadataError);
            });
        }
      }

      return {
        bucket: targetBucket,
        path: filePath,
        url: publicUrl,
      };
    } catch (firebaseError) {
      console.warn(
        'Firebase proof upload failed, falling back to Supabase storage:',
        firebaseError
      );
    }
  }

  if (!isSupabaseConfigured) {
    throw new Error(
      'Image storage is not configured. Add either Firebase storage settings or Supabase storage settings.'
    );
  }

  const { data, error } = await supabaseStorageClient.storage
    .from(targetBucket)
    .upload(relativePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    if (error.message?.toLowerCase().includes('bucket')) {
      throw new Error(
        `Supabase bucket "${targetBucket}" was not found. Create the "${targetBucket}" bucket before uploading.`
      );
    }

    throw new Error(error.message || 'Proof image upload failed.');
  }

  const { data: publicUrlData } = supabaseStorageClient.storage
    .from(targetBucket)
    .getPublicUrl(filePath);

  return {
    bucket: targetBucket,
    path: data?.path || relativePath,
    url: publicUrlData?.publicUrl || '',
  };
}

export function uploadTaskProofImage(userId, file, options = {}) {
  return uploadProofImage(userId, file, {
    ...options,
    bucket: taskProofsBucket,
  });
}

export function uploadGalleryImage(userId, file, options = {}) {
  return uploadProofImage(userId, file, {
    ...options,
    bucket: imagesBucket,
  });
}

export function getProofPublicUrl(path) {
  if (!path) return '';

  const { data } = supabaseStorageClient.storage
    .from(proofsBucket)
    .getPublicUrl(path);

  return data?.publicUrl || '';
}
