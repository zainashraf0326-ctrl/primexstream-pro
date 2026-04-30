'use client';

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase-config';

/**
 * Custom hook to automatically save data to Supabase
 * 
 * Usage:
 * const { saveData, isSaving, error } = useSupabaseAutoSave('orders', userId);
 * 
 * Then call: saveData(orderData)
 */
export function useSupabaseAutoSave(tableName: string, userId?: string) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const saveData = useCallback(
    async (data: any, debounceDelay = 1000) => {
      return new Promise((resolve) => {
        // Clear previous timer
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        // Set new timer for debounced save
        debounceTimer.current = setTimeout(async () => {
          try {
            setIsSaving(true);
            setError(null);

            const dataToSave = userId 
              ? { ...data, user_id: userId }
              : data;

            const { error: saveError } = await supabase
              .from(tableName)
              .insert([dataToSave]);

            if (saveError) throw saveError;

            setIsSaving(false);
            resolve({ success: true });
          } catch (err) {
            const errorMessage = (err as any).message || 'Save failed';
            setError(errorMessage);
            setIsSaving(false);
            resolve({ success: false, error: errorMessage });
          }
        }, debounceDelay);
      });
    },
    [tableName, userId]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return { saveData, isSaving, error };
}

/**
 * Hook to listen to real-time updates from Supabase
 * 
 * Usage:
 * const { data, loading } = useSupabaseRealtime('orders', userId);
 */
export function useSupabaseRealtime(
  tableName: string,
  filter?: { column: string; value: any }
) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    let query = supabase
      .from(tableName)
      .on('*', (payload) => {
        // Handle real-time events
        if (payload.eventType === 'INSERT') {
          setData((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setData((prev) =>
            prev.map((item) =>
              item.id === payload.new.id ? payload.new : item
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setData((prev) => prev.filter((item) => item.id !== payload.old.id));
        }
      })
      .subscribe();

    // Initial fetch
    const fetchInitialData = async () => {
      try {
        let queryBuilder = supabase.from(tableName).select('*');

        if (filter) {
          queryBuilder = queryBuilder.eq(filter.column, filter.value);
        }

        const { data: initialData, error: fetchError } = await queryBuilder;

        if (fetchError) throw fetchError;
        setData(initialData || []);
        setLoading(false);
      } catch (err) {
        setError((err as any).message);
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      supabase.removeSubscription(query);
    };
  }, [tableName, filter]);

  return { data, loading, error };
}

/**
 * Hook to update a single record in Supabase
 * 
 * Usage:
 * const { updateRecord, isUpdating } = useSupabaseUpdate('users');
 * updateRecord(userId, { name: 'New Name' });
 */
export function useSupabaseUpdate(tableName: string) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const updateRecord = useCallback(
    async (id: string, updates: any) => {
      try {
        setIsUpdating(true);
        setError(null);

        const { error: updateError } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;

        setIsUpdating(false);
        return { success: true };
      } catch (err) {
        const errorMessage = (err as any).message || 'Update failed';
        setError(errorMessage);
        setIsUpdating(false);
        return { success: false, error: errorMessage };
      }
    },
    [tableName]
  );

  return { updateRecord, isUpdating, error };
}

/**
 * Hook to delete a record from Supabase
 * 
 * Usage:
 * const { deleteRecord, isDeleting } = useSupabaseDelete('orders');
 * deleteRecord(orderId);
 */
export function useSupabaseDelete(tableName: string) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const deleteRecord = useCallback(
    async (id: string) => {
      try {
        setIsDeleting(true);
        setError(null);

        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        setIsDeleting(false);
        return { success: true };
      } catch (err) {
        const errorMessage = (err as any).message || 'Delete failed';
        setError(errorMessage);
        setIsDeleting(false);
        return { success: false, error: errorMessage };
      }
    },
    [tableName]
  );

  return { deleteRecord, isDeleting, error };
}

/**
 * Import React at the top of this file
 */
import React from 'react';
