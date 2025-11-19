// js/supabaseClient.js
// Cliente global de Supabase para todo el sitio

(function () {
  'use strict';

  const SUPABASE_URL = 'https://efwolracovsplazrmhdv.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd29scmFjb3ZzcGxhenJtaGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDIzNDIsImV4cCI6MjA3OTA3ODM0Mn0.chvbMlvsSJRhHP-nYkezCcSXXq_wnO74kfpL6aXV-0U';

  // Verificamos que la librería de Supabase (CDN) esté cargada
  if (typeof supabase === 'undefined') {
    console.error(
      'Supabase JS no está cargado. Asegúrate de tener:\n' +
      '<script src="https://unpkg.com/@supabase/supabase-js@2"></script>\n' +
      'antes de incluir js/supabaseClient.js'
    );
    // Exponemos null para evitar errores si alguien intenta usarlo
    window.supabaseClient = null;
    return;
  }

  const { createClient } = supabase;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Lo exponemos en window para reutilizarlo en otros scripts
  window.supabaseClient = client;
})();

