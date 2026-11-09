
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

const SUPABASE_URL = 'https://akajjixdfqyipfqgocuz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_szO9MQ8TPfMbpqLhgYx7zQ_SQOYTSDT';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
