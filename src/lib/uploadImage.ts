import { supabase, isSupabaseConfigured } from './supabase-config';
import { deleteImageFromStorage } from './storage-service';

interface UploadResult {
  success: boolean;
  url?: string;
  docId?: string;
  error?: string;
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

export async function deleteUploadImage(uploadId: string, fileName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('uploads').delete().eq('id', uploadId);
    if (error) throw error;

    // Delete from Supabase Storage
    await deleteImageFromStorage(fileName);

    return true;
  } catch (error) {
    console.error('Delete upload failed:', error);
    return false;
  }
}

function mapUploadRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name,
    imageUrl: row.image_url,
    fileType: row.file_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
    ...(row.metadata || {}),
  };
}
