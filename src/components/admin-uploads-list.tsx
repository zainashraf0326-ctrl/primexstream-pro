'use client';

import { useEffect, useState } from 'react';
import { getAllUploads } from '@/lib/uploadImage';
import { deleteUpload } from '@/lib/supabase-user-service';
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
  [key: string]: any;
}

interface AdminUploadsListProps {
  onDelete?: (docId: string) => Promise<void>;
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to load uploads';
        setError(errorMessage);
        console.error('Error loading uploads:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUploads();
  }, []);

  const handleDelete = async (docId: string) => {
    setDeleting(docId);
    try {
      const deleteFunction = onDelete || deleteUpload;
      await deleteFunction(docId);
      setUploads((prev) => prev.filter((u) => u.id !== docId));
    } catch (err) {
      console.error('Error deleting upload:', err);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-400">Loading uploads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Error loading uploads</p>
          <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="pt-12 text-center pb-12">
          <p className="text-slate-600 dark:text-slate-400 text-lg">No uploads yet</p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Images will appear here once uploaded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {uploads.map((upload) => (
        <Card key={upload.id} className="glass overflow-hidden hover:scale-105 transition-transform">
          <div className="aspect-square overflow-hidden bg-slate-200 dark:bg-slate-800">
            <img
              src={upload.imageUrl}
              alt={upload.fileName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <CardContent className="pt-4">
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mb-2 truncate" title={upload.fileName}>
              {upload.fileName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
              {formatDate(upload.createdAt)} • {formatFileSize(upload.fileSize)}
            </p>
            <div className="flex gap-2">
              <a
                href={upload.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <button
                onClick={() => handleDelete(upload.id)}
                disabled={deleting === upload.id}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {deleting === upload.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
