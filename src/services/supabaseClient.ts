import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://lediaqcbbdiesfvnmawo.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4Gg-31CLsKPP7VVYBRijuQ_iO_zbeif';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
