import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Registration } from '@/types/registration';

export const useRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  const fetchRegistrations = async () => {
    try {
      const { data, error, count: totalCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
      setCount(totalCount || 0);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();

    // Real-time subscription
    const channel = supabase
      .channel('registrations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          fetchRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addRegistration = async (registration: Omit<Registration, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('registrations')
      .insert([registration])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return { registrations, loading, count, addRegistration, refetch: fetchRegistrations };
};
