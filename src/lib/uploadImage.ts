import { get, push, ref as databaseRef, remove, set } from 'firebase/database';
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import {
  database,
  isFirebaseConfigured,
  storage as firebaseStorage,
} from '@/services/firebaseClient';
import { supabase, isSupabaseConfigured } from './supabase-config';
import { deleteImageFromStorage } from './storage-service';

interface UploadResult {
  success: boolean;
  url?: string;
  docId?: string;
  error?: string;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function sortUploads(rows: any[]) {
  return [...rows].sort((first, second) => {
    const firstTime = new Date(first.createdAt || 0).getTime();
    const secondTime = new Date(second.createdAt || 0).getTime();
    return secondTime - firstTime;
  });
}

export async function uploadImage(
  file: File,
  userId: string,
  metadata?: Record<string, any>
): Promise<UploadResult> {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file selected');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (isFirebaseConfigured && firebaseStorage && database) {
      try {
        const uploadId = push(databaseRef(database, 'uploads')).key;

        if (!uploadId) {
          throw new Error('Could not create an upload record.');
        }

        const fileName = `${Date.now()}_${sanitizeFileName(file.name)}`;
        const filePath = `images/${userId}/${fileName}`;

        const uploadSnapshot = await uploadBytes(
          storageRef(firebaseStorage, filePath),
          file,
          {
            contentType: file.type,
          }
        );
        const publicUrl = await getDownloadURL(uploadSnapshot.ref);

        try {
          await set(databaseRef(database, `uploads/${uploadId}`), {
            userId,
            fileName,
            imageUrl: publicUrl,
            fileType: file.type,
            fileSize: file.size,
            bucket: 'images',
            source: 'gallery',
            storagePath: filePath,
            createdAt: new Date().toISOString(),
            metadata: metadata || {},
          });
        } catch (metadataError) {
          console.warn('Upload metadata sync failed:', metadataError);
        }

        return {
          success: true,
          url: publicUrl,
          docId: uploadId,
        };
      } catch (firebaseError) {
        console.warn(
          'Firebase gallery upload failed, falling back to Supabase:',
          firebaseError
        );
      }
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Image storage is not configured. Please try again later.');
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      throw new Error('Failed to get public URL');
    }

    const { data: uploadRow, error: rowError } = await supabase
      .from('uploads')
      .insert({
        user_id: userId,
        file_name: fileName,
        image_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        metadata: metadata || {},
      })
      .select('id')
      .single();

    if (rowError) throw rowError;

    return {
      success: true,
      url: publicUrl,
      docId: uploadRow.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Image upload failed:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getUserUploads(userId: string) {
  try {
    if (isFirebaseConfigured && database) {
      const snapshot = await get(databaseRef(database, 'uploads'));
      const uploads = Object.entries(snapshot.val() || {})
        .map(([id, row]) => mapUploadRow({ id, ...(row as any) }))
        .filter((row) => row.userId === userId);

      return sortUploads(uploads);
    }

    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapUploadRow);
  } catch (error) {
    console.error('Get uploads failed:', error);
    return [];
  }
}

export async function getAllUploads() {
  try {
    if (isFirebaseConfigured && database) {
      const snapshot = await get(databaseRef(database, 'uploads'));
      const uploads = Object.entries(snapshot.val() || {}).map(([id, row]) =>
        mapUploadRow({ id, ...(row as any) })
      );

      return sortUploads(uploads);
    }

    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapUploadRow);
  } catch (error) {
    console.error('Get all uploads failed:', error);
    return [];
  }
}

export async function deleteUploadImage(
  uploadId: string,
  fileName?: string
): Promise<boolean> {
  try {
    if (isFirebaseConfigured && database && firebaseStorage) {
      const uploadSnapshot = await get(databaseRef(database, `uploads/${uploadId}`));
      const upload = uploadSnapshot.val();

      if (upload?.storagePath) {
        await deleteObject(storageRef(firebaseStorage, upload.storagePath));
      }

      await remove(databaseRef(database, `uploads/${uploadId}`));
      return true;
    }

    const { error } = await supabase.from('uploads').delete().eq('id', uploadId);
    if (error) throw error;

    // Delete from Supabase Storage
    if (fileName) {
      await deleteImageFromStorage(fileName);
    }

    return true;
  } catch (error) {
    console.error('Delete upload failed:', error);
    return false;
  }
}

function mapUploadRow(row: any) {
  return {
    id: row.id,
    userId: row.userId || row.user_id,
    fileName: row.fileName || row.file_name,
    imageUrl: row.imageUrl || row.image_url,
    fileType: row.fileType || row.file_type,
    fileSize: row.fileSize || row.file_size,
    createdAt: row.createdAt || row.created_at,
    bucket: row.bucket || row?.metadata?.bucket || '',
    source: row.source || row?.metadata?.source || '',
    storagePath: row.storagePath || row.storage_path || '',
    ...(row.metadata || {}),
  };
}
