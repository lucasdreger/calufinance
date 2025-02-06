import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeSubscription = (
  tables: string[],
  onUpdate: () => void
) => {
  const setupSubscription = useCallback(() => {
    const channels = tables.map(table => 
      supabase
        .channel(`${table}_changes_${Math.random()}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table },
          () => onUpdate()
        )
        .subscribe()
    );

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [tables, onUpdate]);

  useEffect(() => {
    return setupSubscription();
  }, [setupSubscription]);
}; 