-- ============================================
-- SCRIPT SQL - DONNÉES DE DÉMONSTRATION POUR MARIE DUBOIS
-- À exécuter dans la console SQL de Supabase
-- ============================================

-- ============================================
-- ÉTAPE 1 : CRÉER LES TYPES DE SOINS
-- ============================================

-- Créer les types de soins s'ils n'existent pas déjà
INSERT INTO care_types (name)
VALUES 
  ('pansement'),
  ('prise-sang'),
  ('injection'),
  ('perfusion'),
  ('toilette')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ÉTAPE 2 : CRÉER DES PATIENTS FICTIFS DANS LE 78
-- ============================================

-- Insérer les utilisateurs patients avec des UUIDs valides
INSERT INTO users (id, role, email, phone, first_name, last_name, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'patient', 'jean.martin@example.com', '0612345601', 'Jean', 'Martin', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'patient', 'sophie.bernard@example.com', '0612345602', 'Sophie', 'Bernard', NOW()),
  ('00000000-0000-0000-0000-000000000003', 'patient', 'pierre.petit@example.com', '0612345603', 'Pierre', 'Petit', NOW()),
  ('00000000-0000-0000-0000-000000000004', 'patient', 'marie.durand@example.com', '0612345604', 'Marie', 'Durand', NOW()),
  ('00000000-0000-0000-0000-000000000005', 'patient', 'luc.moreau@example.com', '0612345605', 'Luc', 'Moreau', NOW()),
  ('00000000-0000-0000-0000-000000000006', 'patient', 'claire.laurent@example.com', '0612345606', 'Claire', 'Laurent', NOW()),
  ('00000000-0000-0000-0000-000000000007', 'patient', 'paul.simon@example.com', '0612345607', 'Paul', 'Simon', NOW()),
  ('00000000-0000-0000-0000-000000000008', 'patient', 'julie.michel@example.com', '0612345608', 'Julie', 'Michel', NOW()),
  ('00000000-0000-0000-0000-000000000009', 'patient', 'thomas.leroy@example.com', '0612345609', 'Thomas', 'Leroy', NOW()),
  ('00000000-0000-0000-0000-000000000010', 'patient', 'isabelle.garnier@example.com', '0612345610', 'Isabelle', 'Garnier', NOW()),
  ('00000000-0000-0000-0000-000000000011', 'patient', 'francois.roux@example.com', '0612345611', 'François', 'Roux', NOW()),
  ('00000000-0000-0000-0000-000000000012', 'patient', 'nathalie.blanc@example.com', '0612345612', 'Nathalie', 'Blanc', NOW())
ON CONFLICT (id) DO NOTHING;

-- Créer les enregistrements patients avec adresses dans le 78
INSERT INTO patients (user_id, default_address)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '12 rue de la Paroisse, 78000 Versailles'),
  ('00000000-0000-0000-0000-000000000002', '45 avenue de Paris, 78150 Le Chesnay'),
  ('00000000-0000-0000-0000-000000000003', '8 rue du Général Leclerc, 78220 Viroflay'),
  ('00000000-0000-0000-0000-000000000004', '23 boulevard de la République, 78140 Vélizy-Villacoublay'),
  ('00000000-0000-0000-0000-000000000005', '67 avenue de Saint-Cloud, 78000 Versailles'),
  ('00000000-0000-0000-0000-000000000006', '15 rue de Joinville, 78350 Jouy-en-Josas'),
  ('00000000-0000-0000-0000-000000000007', '3 place de l''Église, 78380 Bougival'),
  ('00000000-0000-0000-0000-000000000008', '89 rue de Versailles, 78150 Le Chesnay'),
  ('00000000-0000-0000-0000-000000000009', '41 avenue Paul Doumer, 78170 La Celle-Saint-Cloud'),
  ('00000000-0000-0000-0000-000000000010', '28 rue du Général de Gaulle, 78160 Marly-le-Roi'),
  ('00000000-0000-0000-0000-000000000011', '52 avenue de la Division Leclerc, 78210 Saint-Cyr-l''École'),
  ('00000000-0000-0000-0000-000000000012', '19 rue de la Villedieu, 78280 Guyancourt')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- ÉTAPE 3 : CONFIGURER LES PARAMÈTRES DE L'INFIRMIÈRE
-- ============================================

-- Créer ou mettre à jour les paramètres de Marie Dubois
-- Adresse de départ : Cabinet à Versailles (centre du secteur 78)
INSERT INTO infirmier_settings (
  infirmier_id, 
  start_address, 
  start_lat, 
  start_lng, 
  transport, 
  max_distance_km, 
  working_days, 
  preferred_slots, 
  disliked_slots, 
  break_every_minutes, 
  break_duration_minutes, 
  safety_margin_minutes, 
  notifications_enabled
)
VALUES (
  '19e73865-1677-46c1-a982-648feae25dc3',
  '5 rue de la Chancellerie, 78000 Versailles',
  48.8049,
  2.1204,
  'car',
  30,
  ARRAY[1, 2, 3, 4, 5],
  ARRAY['morning', 'afternoon'],
  ARRAY[]::text[],
  180,
  15,
  10,
  true
)
ON CONFLICT (infirmier_id) 
DO UPDATE SET
  start_address = EXCLUDED.start_address,
  start_lat = EXCLUDED.start_lat,
  start_lng = EXCLUDED.start_lng;

-- ============================================
-- ÉTAPE 4 : RENDEZ-VOUS EN ATTENTE (PENDING)
-- ============================================

DO $$
DECLARE
  care_type_pansement UUID;
  care_type_prise_sang UUID;
  care_type_injection UUID;
  care_type_perfusion UUID;
  care_type_toilette UUID;
BEGIN
  -- Récupérer les IDs des care_types
  SELECT id INTO care_type_pansement FROM care_types WHERE name = 'pansement';
  SELECT id INTO care_type_prise_sang FROM care_types WHERE name = 'prise-sang';
  SELECT id INTO care_type_injection FROM care_types WHERE name = 'injection';
  SELECT id INTO care_type_perfusion FROM care_types WHERE name = 'perfusion';
  SELECT id INTO care_type_toilette FROM care_types WHERE name = 'toilette';

  -- Rendez-vous en attente pour le 30 janvier 2026
  INSERT INTO appointments (patient_id, infirmier_id, care_type_id, date, slot, address, status, patient_comment, created_at)
  VALUES
    ('00000000-0000-0000-0000-000000000001', '19e73865-1677-46c1-a982-648feae25dc3', care_type_pansement, '2026-01-30', 'morning', '12 rue de la Paroisse, 78000 Versailles', 'pending', 'Pansement post-opératoire', NOW()),
    ('00000000-0000-0000-0000-000000000002', '19e73865-1677-46c1-a982-648feae25dc3', care_type_prise_sang, '2026-01-30', 'morning', '45 avenue de Paris, 78150 Le Chesnay', 'pending', 'Prise de sang à jeun', NOW()),
    ('00000000-0000-0000-0000-000000000003', '19e73865-1677-46c1-a982-648feae25dc3', care_type_injection, '2026-01-30', 'afternoon', '8 rue du Général Leclerc, 78220 Viroflay', 'pending', 'Injection insuline - URGENT', NOW()),
    ('00000000-0000-0000-0000-000000000004', '19e73865-1677-46c1-a982-648feae25dc3', care_type_perfusion, '2026-01-30', 'afternoon', '23 boulevard de la République, 78140 Vélizy-Villacoublay', 'pending', 'Perfusion antibiotique', NOW());

  -- Rendez-vous confirmés pour le 29 janvier (DISPERSÉS GÉOGRAPHIQUEMENT)
  INSERT INTO appointments (patient_id, infirmier_id, care_type_id, date, slot, address, status, duration_minutes, patient_comment, created_at)
  VALUES
    -- MATIN - Dispersés géographiquement
    ('00000000-0000-0000-0000-000000000005', '19e73865-1677-46c1-a982-648feae25dc3', care_type_pansement, '2026-01-29', 'morning', '67 avenue de Saint-Cloud, 78000 Versailles', 'confirmed', 30, 'Pansement quotidien - 08:00', NOW()),
    ('00000000-0000-0000-0000-000000000006', '19e73865-1677-46c1-a982-648feae25dc3', care_type_injection, '2026-01-29', 'morning', '15 rue de Joinville, 78350 Jouy-en-Josas', 'confirmed', 20, 'Injection urgente diabète - 08:30', NOW()),
    ('00000000-0000-0000-0000-000000000007', '19e73865-1677-46c1-a982-648feae25dc3', care_type_prise_sang, '2026-01-29', 'morning', '3 place de l''Église, 78380 Bougival', 'confirmed', 15, 'Bilan sanguin mensuel - 09:00', NOW()),
    ('00000000-0000-0000-0000-000000000008', '19e73865-1677-46c1-a982-648feae25dc3', care_type_perfusion, '2026-01-29', 'morning', '89 rue de Versailles, 78150 Le Chesnay', 'confirmed', 45, 'Perfusion de confort - 09:30', NOW()),
    ('00000000-0000-0000-0000-000000000009', '19e73865-1677-46c1-a982-648feae25dc3', care_type_toilette, '2026-01-29', 'morning', '41 avenue Paul Doumer, 78170 La Celle-Saint-Cloud', 'confirmed', 60, 'Toilette personne âgée - 10:00', NOW()),
    
    -- APRÈS-MIDI - Également dispersés
    ('00000000-0000-0000-0000-000000000010', '19e73865-1677-46c1-a982-648feae25dc3', care_type_pansement, '2026-01-29', 'afternoon', '28 rue du Général de Gaulle, 78160 Marly-le-Roi', 'confirmed', 40, 'Changement pansement complexe - 14:00', NOW()),
    ('00000000-0000-0000-0000-000000000011', '19e73865-1677-46c1-a982-648feae25dc3', care_type_injection, '2026-01-29', 'afternoon', '52 avenue de la Division Leclerc, 78210 Saint-Cyr-l''École', 'confirmed', 20, 'Injection hebdomadaire - 14:30', NOW()),
    ('00000000-0000-0000-0000-000000000012', '19e73865-1677-46c1-a982-648feae25dc3', care_type_prise_sang, '2026-01-29', 'afternoon', '19 rue de la Villedieu, 78280 Guyancourt', 'confirmed', 15, 'Contrôle post-traitement - 15:00', NOW()),
    ('00000000-0000-0000-0000-000000000001', '19e73865-1677-46c1-a982-648feae25dc3', care_type_perfusion, '2026-01-29', 'afternoon', '12 rue de la Paroisse, 78000 Versailles', 'confirmed', 60, 'Perfusion urgente chimiothérapie - 15:30', NOW()),
    ('00000000-0000-0000-0000-000000000002', '19e73865-1677-46c1-a982-648feae25dc3', care_type_toilette, '2026-01-29', 'afternoon', '45 avenue de Paris, 78150 Le Chesnay', 'confirmed', 45, 'Aide à la toilette - 16:00', NOW()),
    
    -- SOIR - Quelques rendez-vous supplémentaires
    ('00000000-0000-0000-0000-000000000003', '19e73865-1677-46c1-a982-648feae25dc3', care_type_injection, '2026-01-29', 'evening', '8 rue du Général Leclerc, 78220 Viroflay', 'confirmed', 15, 'Injection insuline du soir - 18:00', NOW()),
    ('00000000-0000-0000-0000-000000000004', '19e73865-1677-46c1-a982-648feae25dc3', care_type_pansement, '2026-01-29', 'evening', '23 boulevard de la République, 78140 Vélizy-Villacoublay', 'confirmed', 30, 'Pansement de soirée - 18:30', NOW());

  -- Rendez-vous terminés (HISTORIQUE)
  INSERT INTO appointments (patient_id, infirmier_id, care_type_id, date, slot, address, status, duration_minutes, infirmier_comment, created_at)
  VALUES
    -- 27 janvier 2026
    ('00000000-0000-0000-0000-000000000005', '19e73865-1677-46c1-a982-648feae25dc3', care_type_pansement, '2026-01-27', 'morning', '67 avenue de Saint-Cloud, 78000 Versailles', 'confirmed', 30, 'Pansement effectué', NOW() - INTERVAL '1 day'),
    ('00000000-0000-0000-0000-000000000006', '19e73865-1677-46c1-a982-648feae25dc3', care_type_prise_sang, '2026-01-27', 'morning', '15 rue de Joinville, 78350 Jouy-en-Josas', 'confirmed', 15, 'Prélèvement réussi', NOW() - INTERVAL '1 day'),
    ('00000000-0000-0000-0000-000000000007', '19e73865-1677-46c1-a982-648feae25dc3', care_type_injection, '2026-01-27', 'afternoon', '3 place de l''Église, 78380 Bougival', 'confirmed', 20, 'Injection réalisée', NOW() - INTERVAL '1 day'),
    ('00000000-0000-0000-0000-000000000008', '19e73865-1677-46c1-a982-648feae25dc3', care_type_perfusion, '2026-01-27', 'afternoon', '89 rue de Versailles, 78150 Le Chesnay', 'confirmed', 45, 'Perfusion terminée', NOW() - INTERVAL '1 day'),
    
    -- 26 janvier 2026
    ('00000000-0000-0000-0000-000000000009', '19e73865-1677-46c1-a982-648feae25dc3', care_type_toilette, '2026-01-26', 'morning', '41 avenue Paul Doumer, 78170 La Celle-Saint-Cloud', 'confirmed', 60, 'Toilette effectuée', NOW() - INTERVAL '2 days'),
    ('00000000-0000-0000-0000-000000000010', '19e73865-1677-46c1-a982-648feae25dc3', care_type_pansement, '2026-01-26', 'morning', '28 rue du Général de Gaulle, 78160 Marly-le-Roi', 'confirmed', 30, 'Pansement changé', NOW() - INTERVAL '2 days'),
    ('00000000-0000-0000-0000-000000000011', '19e73865-1677-46c1-a982-648feae25dc3', care_type_injection, '2026-01-26', 'afternoon', '52 avenue de la Division Leclerc, 78210 Saint-Cyr-l''École', 'confirmed', 20, 'Injection administrée', NOW() - INTERVAL '2 days'),
    ('00000000-0000-0000-0000-000000000012', '19e73865-1677-46c1-a982-648feae25dc3', care_type_prise_sang, '2026-01-26', 'afternoon', '19 rue de la Villedieu, 78280 Guyancourt', 'confirmed', 15, 'Échantillon prélevé', NOW() - INTERVAL '2 days'),
    
    -- 25 janvier 2026
    ('00000000-0000-0000-0000-000000000001', '19e73865-1677-46c1-a982-648feae25dc3', care_type_perfusion, '2026-01-25', 'morning', '12 rue de la Paroisse, 78000 Versailles', 'confirmed', 45, 'Perfusion réussie', NOW() - INTERVAL '3 days'),
    ('00000000-0000-0000-0000-000000000002', '19e73865-1677-46c1-a982-648feae25dc3', care_type_toilette, '2026-01-25', 'morning', '45 avenue de Paris, 78150 Le Chesnay', 'confirmed', 45, 'Soins d''hygiène', NOW() - INTERVAL '3 days'),
    ('00000000-0000-0000-0000-000000000003', '19e73865-1677-46c1-a982-648feae25dc3', care_type_injection, '2026-01-25', 'afternoon', '8 rue du Général Leclerc, 78220 Viroflay', 'confirmed', 20, 'Traitement administré', NOW() - INTERVAL '3 days'),
    ('00000000-0000-0000-0000-000000000004', '19e73865-1677-46c1-a982-648feae25dc3', care_type_pansement, '2026-01-25', 'evening', '23 boulevard de la République, 78140 Vélizy-Villacoublay', 'confirmed', 30, 'Pansement renouvelé', NOW() - INTERVAL '3 days');
END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Compter les rendez-vous par statut
SELECT status, COUNT(*) as count
FROM appointments
WHERE infirmier_id = '19e73865-1677-46c1-a982-648feae25dc3'
GROUP BY status;

-- Voir tous les rendez-vous du 29 janvier (pour optimisation)
SELECT 
  a.date,
  a.slot,
  u.first_name || ' ' || u.last_name as patient_name,
  ct.name as care_type,
  a.address,
  a.duration_minutes,
  a.patient_comment
FROM appointments a
JOIN users u ON a.patient_id = u.id
JOIN care_types ct ON a.care_type_id = ct.id
WHERE a.infirmier_id = '19e73865-1677-46c1-a982-648feae25dc3'
  AND a.date = '2026-01-29'
  AND a.status = 'confirmed'
ORDER BY a.slot, a.patient_comment;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 
-- 📍 POINT DE DÉPART : Versailles (78000)
-- 
-- 📊 RÉPARTITION DES DONNÉES :
-- - 4 rendez-vous en attente (pending) pour le 30/01
-- - 12 rendez-vous confirmés (confirmed) pour le 29/01 - DISPERSÉS GÉOGRAPHIQUEMENT
-- - 12 rendez-vous terminés (confirmed) pour l'historique (25-27/01)
--
-- 🎯 OBJECTIF DE LA DÉMO :
-- Les rendez-vous du 29 janvier sont VOLONTAIREMENT mal optimisés :
-- - Trajets croisés (Versailles → Jouy → Bougival → Le Chesnay → La Celle...)
-- - Retours en arrière inutiles
-- - Pas de regroupement géographique
--
-- L'IA devra les réorganiser pour montrer :
-- ✅ Regroupement géographique intelligent
-- ✅ Minimisation des distances
-- ✅ Respect des créneaux horaires demandés
-- ✅ Priorisation des urgences
-- ✅ Assignation d'horaires optimaux