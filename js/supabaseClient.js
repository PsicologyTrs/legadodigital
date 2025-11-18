// js/supabaseClient.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Opción sencilla: pegar aquí URL y anon key
const SUPABASE_URL = 'https://efwolracovsplazrmhdv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd29scmFjb3ZzcGxhenJtaGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDIzNDIsImV4cCI6MjA3OTA3ODM0Mn0.chvbMlvsSJRhHP-nYkezCcSXXq_wnO74kfpL6aXV-0U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
