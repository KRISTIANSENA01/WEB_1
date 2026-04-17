import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://sspemzwjzcykhajcotfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HBELHoyICTN4EdXSeGo7cQ_3xi410ic';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
