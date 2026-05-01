'use client';

import { useEffect, useState } from 'react';
import { deleteUploadImage, getAllUploads } from '@/lib/uploadImage';
import { Card, CardContent } from './ui/card';
import { Download, Trash2, AlertCircle } from 'lucide-react';

interface Upload {
  id: string;
  userId: string;
  fileName: string;
  imageUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  bucket?: string;
  source?: string;
  storagePath?: string;
  [key: string]: any;
}

interface AdminUploadsListProps {
  onDelete?: (upload: Upload) => Promise<void>;
}

export function AdminUploadsList({ onDelete }: AdminUploadsListProps) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const loadUploads = async () => {
      try {
        setLoading(true);
        const data = await getAllUploads();
        setUploads(data as Upload[]);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load uploads';
        setError(errorMessage);
        console.error('Error loading uploads:', err);
      } finally {
        setLoading(false);
      }
    };

    void loadUploads();
  }, []);

  const handleDelete = async (upload: Upload) => {
    setDeleting(upload.id);
    try {
      if (onDelete) {
        await onDelete(upload);
      } else {
        await deleteUploadImage(upload.id, upload.fileName);
      }

      setUploads((prev) => prev.filter((item) => item.id !== upload.id));
    } catch (err) {
      console.error('Error deleting upload:', err);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Loading uploads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            Error loading uploads
          </p>
          <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="pb-12 pt-12 text-center">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            No uploads yet
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
            Images will appear here once uploaded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {uploads.map((upload) => (
        <Card
          key={upload.id}
          className="glass overflow-hidden transition-shadow hover:shadow-md"
        >
          <div className="aspect-square overflow-hidden bg-slate-200 dark:bg-slate-800">
            <img
              src={upload.imageUrl}
              alt={upload.fileName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <CardContent className="pt-4">
            <p
              className="mb-2 truncate font-mono text-xs text-slate-600 dark:text-slate-400"
              title={upload.fileName}
            >
              {upload.fileName}
            </p>
            {(upload.bucket || upload.source) && (
              <div className="mb-2 flex flex-wrap gap-2">
                {upload.bucket && (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {upload.bucket}
                  </span>
                )}
                {upload.source && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {upload.source}
                  </span>
                )}
              </div>
            )}
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-500">
              {formatDate(upload.createdAt)} • {formatFileSize(upload.fileSize)}
            </p>
            <div className="flex gap-2">
              <a
                href={upload.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
              <button
                onClick={() => handleDelete(upload)}
                disabled={deleting === upload.id}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting === upload.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
