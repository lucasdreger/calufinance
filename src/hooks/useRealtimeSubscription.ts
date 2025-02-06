import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeSubscription = (
  tables: string[],
  onUpdate: () => void
) => {
  useEffect(() => {
    const channels = tables.map(table => 
      supabase
        .channel(`${table}_changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table },
          () => onUpdate()
        )
        .subscribe()
    );

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);
}; 