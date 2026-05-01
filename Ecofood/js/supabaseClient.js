import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://uzamffsbckljxoytcbtz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LI5I9H6eULDyYJ0N8PHA-Q_56oY51uC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
