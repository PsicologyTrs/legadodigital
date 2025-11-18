// js/supabaseClient.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Opción sencilla: pegar aquí URL y anon key
const SUPABASE_URL = 'https://TU-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
