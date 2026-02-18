-- Script pour initialiser les types de soins dans la base de données
-- À exécuter dans l'éditeur SQL de Supabase

INSERT INTO care_types (name) VALUES
  ('Injection'),
  ('Prise de sang'),
  ('Administration de médicaments'),
  ('Gestion des pansements'),
  ('Suivi d''une maladie chronique'),
  ('Vaccination'),
  ('Soins post-opératoires'),
  ('Perfusion')
ON CONFLICT (name) DO NOTHING;
