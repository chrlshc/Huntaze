-- Test de connexion PostgreSQL
SELECT 
  current_database() as database_name,
  current_user as user_name,
  version() as postgres_version,
  now() as current_time;

-- Vérifier les tables existantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;