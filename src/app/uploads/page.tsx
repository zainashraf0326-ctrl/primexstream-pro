'use client';

import { useState } from 'react';
import { useApp } from '@/components/providers/app-provider';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { ImageUploadWidget } from '@/components/image-upload-widget';
import { AdminUploadsList } from '@/components/admin-uploads-list';
import { deleteUploadImage } from '@/lib/uploadImage';

export default function UploadsPage() {
  const { user } = useApp();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const handleUploadSuccess = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  const handleDeleteUpload = async (uploadId: string, fileName?: string) => {
    try {
      const success = await deleteUploadImage(uploadId, fileName);
      if (success) {
        console.log('Upload deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting upload:', error);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="space-y-8">
          {/* Upload Section */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Upload Images</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Upload images to your gallery. They will be stored securely.
            </p>

            <Card className="glass">
              <CardContent className="pt-6">
                {user ? (
                  <ImageUploadWidget
                    userId={user.id}
                    onSuccess={handleUploadSuccess}
                    onError={handleUploadError}
                    metadata={{
                      userEmail: user.email,
                      userName: user.name,
                    }}
                  />
                ) : (
                  <p className="text-center text-slate-600 dark:text-slate-400">
                    Please log in to upload images
                  </p>
                )}
              </CardContent>
            </Card>

            {uploadedImageUrl && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Preview</h3>
                <div className="w-full max-w-md rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded preview"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Admin Uploads Gallery */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">All Uploads</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              View and manage all uploaded images.
            </p>

            <AdminUploadsList
              onDelete={async (upload: any) => {
                if (upload) {
                  await handleDeleteUpload(upload.id, upload.fileName);
                }
              }}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
