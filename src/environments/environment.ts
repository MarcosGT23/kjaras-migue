// src/environments/environment.ts
export const environment = {
  production: false,
  supabase: {
    url: 'https://chtfqkriruyxvjxmmazl.supabase.co',
    // Llave pública (anon) para lectura
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNodGZxa3JpcnV5eHZqeG1tYXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzk1ODMsImV4cCI6MjA4Njk1NTU4M30.ql4JMrg9OcJ6DKNpFu3Q2ncw30NMT3ebAWVNT0dhQ18',
    // Service Role Key - solo para escritura en dev local, NO usar en producción
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNodGZxa3JpcnV5eHZqeG1tYXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM3OTU4MywiZXhwIjoyMDg2OTU1NTgzfQ.NScTGLzAYPgWz93t4xKKXK3Gr4NlBwHZ3-OYQIfGRNs'
  }
};