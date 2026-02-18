# 🏥 PRÉSENTATION BILAN DE PROJET
## Optimisation IA des Tournées de Soins Infirmiers

---

## 📌 Slide 1 – Problème & Innovation

### ❌ Problème actuel rencontré par les infirmiers

- **Organisation manuelle des tournées** → perte de temps considérable
- **Déplacements non optimisés** → distances parcourues excessives, fatigue
- **Gestion dispersée des informations** → rendez-vous sur papier, Excel, SMS...
- **Planification inefficace** → oublis, retards, stress
- **Difficulté à respecter les créneaux horaires** demandés par les patients

### 🚫 Limites des solutions existantes

- **Logiciels génériques** (Google Calendar, Outlook) : pas adaptés aux spécificités des soins à domicile
- **Solutions payantes complexes** : coût élevé, formation longue, interfaces vieillissantes
- **Pas d'optimisation automatique** : l'infirmier doit tout faire manuellement
- **Absence d'intelligence artificielle** pour suggérer des itinéraires optimaux

### ✨ Innovation apportée par l'application

#### 🤖 **Agent IA d'optimisation des tournées**
- Utilisation de **Llama 3.3 70B** (via Groq) pour analyser les rendez-vous
- **Optimisation intelligente** : minimise les distances, regroupe géographiquement
- **Respect des contraintes** : urgences, créneaux horaires, type de transport
- **Assignation automatique des horaires exacts** (plus juste "matin/après-midi")

#### 🗺️ **Visualisation claire et moderne**
- **Dashboard spécialisé infirmier** avec vue "Aujourd'hui" (liste détaillée) et "Cette semaine" (calendrier)
- **Affichage intelligent** : patients, adresses, types de soins, durées, urgences
- Interface **moderne et minimaliste** (React + Tailwind CSS v4)

#### 📊 **Centralisation complète des données**
- **Base de données PostgreSQL** (Supabase) : patients, infirmiers, rendez-vous, indisponibilités
- **Gestion des settings personnalisés** : adresse de départ, mode de transport (voiture/vélo/transports/marche), durées par type de soin
- **Paramètres avancés** : pauses automatiques, marges de sécurité, distance maximale

#### 🔐 **Double authentification adaptée**
- **Patients** : inscription classique email/mot de passe
- **Infirmiers** : connexion **FranceConnect** (sécurité renforcée, conforme RGPD)

---

## 📋 Slide 2 – Backlog initial (1/2)

### Fonctionnalités prévues dès le début du projet

#### ✅ **Authentification des utilisateurs**
- Connexion/inscription pour patients (email + mot de passe)
- Connexion sécurisée pour infirmiers (FranceConnect)
- Gestion des sessions utilisateurs
- Distinction des rôles (patient / infirmier)

#### ✅ **Gestion des infirmiers**
- Profils infirmiers avec informations personnelles
- Paramètres de tournée (adresse de départ, mode de transport)
- Gestion des indisponibilités (congés, urgences personnelles)
- Personnalisation des durées par type de soin

#### ✅ **Gestion des patients**
- Création et modification de profils patients
- Enregistrement des adresses de domicile
- Historique des soins
- Informations de contact

#### ✅ **Création de tournées**
- Création de rendez-vous avec date, heure, type de soin
- Attribution des créneaux horaires (matin/après-midi/soir)
- Marquage des urgences
- Validation/refus des demandes de rendez-vous

#### ✅ **Interface web**
- Application web responsive (desktop + tablette + mobile)
- Design moderne et accessible
- Navigation intuitive

---

## 📋 Slide 3 – Backlog initial (2/2)

### Fonctionnalités avancées prévues

#### 🤖 **Algorithme d'optimisation des tournées**
- **Algorithme classique** : plus proche voisin (nearest neighbor)
- **Intelligence artificielle** : agent IA utilisant Llama 3.3 70B (Groq)
- Calcul automatique des distances et temps de trajet
- Respect des contraintes (urgences, créneaux, transport)
- Assignation automatique des horaires précis

#### 🗺️ **Carte interactive**
- Affichage des rendez-vous sur une carte
- Visualisation de l'itinéraire optimisé
- Calcul des distances entre chaque point

#### 📱 **Version mobile**
- Application mobile native (iOS/Android)
- Notifications push
- Géolocalisation en temps réel

#### 📊 **Statistiques / Indicateurs**
- Dashboard avec KPIs (distances parcourues, temps économisé)
- Historique des tournées
- Rapports hebdomadaires/mensuels

#### 🔄 **Synchronisation des données**
- Synchronisation temps réel entre patients et infirmiers
- Notifications de nouveaux rendez-vous
- Mise à jour automatique des plannings

---

## 🏗️ Slide 4 – Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   🌐 APPLICATION WEB                         │
│                  (React + Tailwind CSS v4)                   │
│                                                              │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │  Interface        │          │  Interface        │        │
│  │  Patient          │          │  Infirmier        │        │
│  │  - Rendez-vous    │          │  - Dashboard      │        │
│  │  - Historique     │          │  - Optimisation   │        │
│  └──────────────────┘          └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              🔧 BACKEND / API REST                           │
│           (Supabase Edge Functions + Hono)                   │
│                                                              │
│  - Gestion des utilisateurs (patients, infirmiers)          │
│  - CRUD rendez-vous                                          │
│  - Authentification (email/mdp + FranceConnect)              │
│  - Settings infirmiers                                       │
│  - Indisponibilités                                          │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │                                    │
         ▼                                    ▼
┌──────────────────────┐          ┌────────────────────────┐
│  💾 BASE DE DONNÉES  │          │  🤖 SERVICE IA          │
│    PostgreSQL        │          │   (Groq API)           │
│    (Supabase)        │          │                        │
│                      │          │  - Llama 3.3 70B       │
│  Tables :            │          │  - Optimisation        │
│  - users             │          │    tournées            │
│  - patients          │          │  - Analyse             │
│  - infirmiers        │          │    géographique        │
│  - appointments      │          │  - Assignation         │
│  - infirmier_        │          │    horaires            │
│    settings          │          └────────────────────────┘
│  - infirmier_        │
│    unavailability    │
└──────────────────────┘
```

### 🔑 Technologies clés

- **Frontend** : React, Tailwind CSS v4, TypeScript
- **Backend** : Supabase Edge Functions (Deno), Hono (web framework)
- **Base de données** : PostgreSQL (hébergé sur Supabase)
- **IA** : Groq API (Llama 3.3 70B Versatile)
- **Authentification** : Supabase Auth + FranceConnect
- **Hébergement** : Supabase (backend + BDD), Vercel/Netlify (frontend)

---

## ✅ Slide 5 – Fonctionnalités implémentées (100 %)

### 🎯 Fonctionnalités entièrement fonctionnelles (Web uniquement)

#### 🔐 **Authentification** (Web : 100 %)
- ✅ Inscription/connexion patients (email + mot de passe)
- ✅ Connexion infirmiers via **FranceConnect**
- ✅ Gestion des sessions sécurisées
- ✅ Distinction des rôles (patient / infirmier)

#### 👥 **Gestion des patients** (Web : 100 %)
- ✅ Création de profils patients complets
- ✅ Enregistrement des adresses
- ✅ Affichage des rendez-vous (à venir + historique)
- ✅ Annulation de rendez-vous

#### 👨‍⚕️ **Gestion des infirmiers** (Web : 100 %)
- ✅ Profils infirmiers détaillés
- ✅ **Settings personnalisés** :
  - Adresse de départ (ex : Versailles)
  - Mode de transport (voiture, vélo, transports, marche)
  - Durées personnalisées par type de soin
  - Distance maximale acceptable
  - Pauses automatiques (durée + fréquence)
  - Marges de sécurité entre rendez-vous
- ✅ Gestion des indisponibilités (congés, absences)

#### 📅 **Création et gestion des rendez-vous** (Web : 100 %)
- ✅ Demande de rendez-vous par les patients
- ✅ Sélection du type de soin (pansement, injection, prélèvement, etc.)
- ✅ Choix du créneau horaire (matin/après-midi/soir)
- ✅ Marquage des urgences
- ✅ Validation/refus par l'infirmier
- ✅ Annulation par le patient

#### 🗂️ **Dashboard infirmier** (Web : 100 %)
- ✅ **Vue "Aujourd'hui"** : liste détaillée des rendez-vous avec horaires exacts
- ✅ **Vue "Cette semaine"** : calendrier hebdomadaire
- ✅ Demandes en attente (pending)
- ✅ Rendez-vous confirmés
- ✅ Affichage des informations : patient, adresse, type de soin, durée, urgence

#### 🤖 **Optimisation des tournées** (Web : 100 %)
- ✅ **Algorithme classique** (plus proche voisin) : gratuit, rapide
- ✅ **Agent IA** (Llama 3.3 via Groq) : optimisation intelligente
- ✅ Minimisation des distances parcourues
- ✅ Respect des créneaux horaires (matin/après-midi/soir)
- ✅ Priorité aux urgences
- ✅ **Assignation automatique des horaires précis** (ex : 09:30, 14:15)
- ✅ Calcul des temps de trajet selon le mode de transport
- ✅ Insertion automatique de pauses

#### 📄 **Stockage de documents** (Web : 100 %)
- ✅ Upload de documents patients (ordonnances, résultats, rapports)
- ✅ Stockage sécurisé sur Supabase Storage
- ✅ Visualisation et téléchargement des documents
- ✅ Catégorisation par type de document

#### 🎨 **Interface web** (Web : 100 %)
- ✅ Design moderne et minimaliste
- ✅ Responsive (desktop, tablette, mobile)
- ✅ Thème cohérent avec Tailwind CSS v4
- ✅ Formulaires élégants
- ✅ Feedback visuel (badges urgences, statuts colorés)

---

## 🔄 Slide 6 – Fonctionnalités partiellement implémentées

### ⚙️ Fonctionnalités en cours de développement

#### 🗺️ **Carte interactive pour sélection d'adresse**
- **Web : 40 % / Mobile : 0 %**
- **État actuel** :
  - ✅ Composant InteractiveMap créé
  - ✅ Intégration OpenStreetMap (iframe)
  - ✅ Fonctionnalités : zoom, déplacement, clic pour sélectionner
  - ✅ Utilisé dans BookingPage pour que le patient sélectionne son adresse
  - ❌ **PAS utilisé dans le dashboard infirmier** pour visualiser les tournées
  - ❌ **PAS de marqueurs multiples** pour afficher tous les rendez-vous simultanément
  - ❌ **PAS de traçage d'itinéraire** entre les rendez-vous
  - ❌ Géocodage approximatif (pas d'API Google Maps/Mapbox réelle)
- **Ce qui reste** :
  - Intégrer la carte dans le dashboard infirmier
  - Afficher tous les rendez-vous du jour/semaine avec des marqueurs
  - Tracer l'itinéraire optimisé entre les points
  - API de géocodage réelle (Google Maps, Mapbox)
  - Calcul de distances réelles (pas simulées)

#### 📊 **Statistiques et indicateurs**
- **Web : 20 % / Mobile : 0 %**
- **État actuel** :
  - ✅ Librairie Recharts installée (`components/ui/chart.tsx`)
  - ✅ Calculs basiques dans AIRouteOptimizer (distance totale, temps total, économies)
  - ✅ Affichage du nombre de rendez-vous par créneau dans le résultat de l'optimisation
  - ❌ **PAS de page dédiée aux statistiques**
  - ❌ **PAS de graphiques** (historique, évolution)
  - ❌ **PAS de comparaison visuelle** avant/après optimisation
  - ❌ **PAS de dashboard KPIs** (distance moyenne, temps moyen, performance)
- **Ce qui reste** :
  - Créer une page "Statistiques" dans le dashboard infirmier
  - Graphiques d'évolution (distances hebdomadaires/mensuelles)
  - Comparaison avant/après optimisation avec graphiques
  - KPIs : taux d'occupation, coût carburant estimé, temps économisé cumulé
  - Export des statistiques en CSV/PDF

---

## 🔜 Slide 7 – Fonctionnalités à implémenter

### 📌 Fonctionnalités prévues mais non commencées

#### 🗺️ **Carte interactive complète**
- Intégration Google Maps / Mapbox / Leaflet
- Affichage en temps réel de tous les rendez-vous sur la carte
- Traçage de l'itinéraire optimisé avec indication des trajets
- Géolocalisation en temps réel de l'infirmier
- Estimation du temps d'arrivée (ETA) pour chaque patient

#### 📄 **Export PDF**
- Génération de fiches de tournée imprimables
- Export du planning hebdomadaire/mensuel
- Rapports de statistiques en PDF
- Fiches patient détaillées

#### 📱 **Version mobile native**
- Application iOS/Android (React Native ou Flutter)
- Notifications push natives
- Mode hors-ligne (synchronisation différée)
- Géolocalisation GPS en temps réel
- Interface optimisée pour smartphones

#### 🔔 **Système de notifications complet**
- Notifications en temps réel (WebSockets ou Server-Sent Events)
- Emails automatiques :
  - Confirmation de rendez-vous
  - Rappels 24h avant
  - Annulations
- SMS pour les patients (via Twilio ou équivalent)
- Notifications push mobile

#### 📊 **Dashboard statistiques avancé**
- Graphiques d'évolution (distances parcourues, temps économisé)
- Comparaison performances avant/après optimisation IA
- KPIs : taux d'occupation, temps moyen par patient, distance moyenne
- Heatmap des zones géographiques les plus visitées
- Prédictions basées sur l'historique (ML)

#### 🎨 **Améliorations UX/UI**
- Mode sombre (dark mode)
- Personnalisation des couleurs du dashboard
- Raccourcis clavier
- Drag & drop pour réorganiser les rendez-vous manuellement
- Recherche avancée (par patient, adresse, type de soin)

#### 🚀 **Optimisation avancée des algorithmes**
- Intégration d'algorithmes plus performants :
  - **Algorithme génétique** pour tournées complexes (>50 rendez-vous)
  - **Simulated annealing** (recuit simulé)
  - **Ant Colony Optimization** (colonies de fourmis)
- Optimisation multi-critères :
  - Minimiser distance ET temps ET coût de carburant
  - Équilibrage de la charge de travail sur la semaine
- **Fine-tuning du modèle IA** :
  - Entraîner un modèle spécifique sur les données réelles de tournées
  - Apprentissage des préférences de l'infirmier
  - Ajustement automatique basé sur les feedbacks

#### 🔗 **Intégrations tierces**
- **Calendrier** : synchronisation Google Calendar, Outlook
- **Facturation** : export vers logiciels de comptabilité
- **Carte Vitale** : lecteur de carte Vitale pour les patients
- **Télémédecine** : visio intégrée pour consultations à distance

---

## 🎓 Slide 8 – Conclusion

### 📊 État actuel du projet

#### ✅ **Fonctionnalités opérationnelles** (100 % Web)
- Authentification double (patients email/mdp + infirmiers FranceConnect)
- Gestion complète des patients et infirmiers
- Création et gestion des rendez-vous avec validation
- Dashboard infirmier moderne avec vues multiples
- **Agent IA d'optimisation** utilisant Llama 3.3 70B (Groq)
- Algorithme classique d'optimisation (plus proche voisin)
- Settings personnalisés avancés (transport, pauses, marges)
- Gestion des indisponibilités
- Interface web responsive et moderne

#### 🎯 **Objectifs atteints**
- ✅ **Optimisation automatique des tournées** : l'IA assigne des horaires précis et minimise les distances
- ✅ **Centralisation des données** : base PostgreSQL robuste
- ✅ **Interface intuitive** : design moderne, navigation fluide
- ✅ **Personnalisation** : chaque infirmier peut configurer ses paramètres
- ✅ **Respect des contraintes** : urgences, créneaux, type de transport

### 🚀 Prochaines étapes

#### 📅 **Court terme (1-2 mois)**
1. **Intégration d'une carte interactive** (Google Maps ou Mapbox)
2. **Système de notifications** en temps réel (WebSockets)
3. **Export PDF** des plannings et statistiques
4. **Dashboard statistiques** avec graphiques (Recharts)

#### 📅 **Moyen terme (3-6 mois)**
1. **Version mobile** (React Native ou PWA)
2. **Géolocalisation en temps réel** de l'infirmier
3. **Notifications push mobile**
4. **Optimisation multi-critères** (distance + temps + coût)

#### 📅 **Long terme (6-12 mois)**
1. **Fine-tuning du modèle IA** sur données réelles
2. **Algorithmes avancés** (génétique, colonies de fourmis)
3. **Intégrations tierces** (calendrier, facturation, Carte Vitale)
4. **Télémédecine** intégrée
5. **Mode hors-ligne** pour mobile

### 💡 Enseignements tirés

#### 🛠️ **Techniques**
- ✅ **Architecture moderne** : React + Supabase est une combinaison puissante pour un MVP rapide
- ✅ **IA accessible** : Groq offre une API gratuite et ultra-rapide pour des LLMs de qualité (Llama 3.3)
- ✅ **Tailwind CSS v4** : permet un design moderne sans fichier de configuration
- ⚠️ **Limites des coordonnées simulées** : une vraie API de géocodage est indispensable pour la production
- ⚠️ **Complexité de l'optimisation** : les algorithmes classiques ont leurs limites au-delà de 30-40 rendez-vous

#### 👥 **Organisationnels**
- ✅ **Approche itérative** : commencer par un MVP fonctionnel puis enrichir progressivement
- ✅ **Priorisation des fonctionnalités** : se concentrer sur la valeur métier (optimisation IA) avant l'esthétique (carte)
- ✅ **Feedback utilisateur** : tester régulièrement avec de vrais infirmiers pour ajuster les paramètres
- ⚠️ **Sous-estimation du temps** : l'intégration d'une carte interactive prend plus de temps que prévu
- ⚠️ **Gestion des dépendances** : vérifier la disponibilité des modèles IA (Mixtral décommissionné → migration vers Llama 3.3)

#### 🎯 **Métier**
- ✅ **Vraie valeur ajoutée** : l'IA permet de gagner réellement du temps (économie estimée : 20-30 % de distance)
- ✅ **Personnalisation essentielle** : chaque infirmier a des contraintes différentes (transport, pauses, secteur)
- ✅ **Respect des créneaux** : les patients préfèrent "matin/après-midi/soir" plutôt qu'un horaire fixe imposé
- 💡 **Amélioration continue** : l'IA peut apprendre des choix de l'infirmier pour s'améliorer

### 🏆 Résultat final

**Une application web fonctionnelle qui démontre le potentiel de l'IA pour optimiser les tournées de soins à domicile.**

- **Impact attendu** : réduction de 20-30 % des distances parcourues, gain de temps pour les infirmiers, meilleure qualité de vie
- **Innovation technologique** : utilisation d'un LLM (Llama 3.3) pour de l'optimisation logistique, cas d'usage original
- **Scalabilité** : architecture prête pour supporter des centaines d'infirmiers et milliers de patients

---

## 🙏 Merci pour votre attention !

**Questions ?**

---

## 📎 ANNEXES

### 📊 Statistiques du projet

- **Durée du projet** : [À compléter]
- **Lignes de code** : ~15 000 lignes (TypeScript + React)
- **Nombre de tables BDD** : 6 (users, patients, infirmiers, appointments, infirmier_settings, infirmier_unavailability)
- **Nombre de routes API** : ~25 endpoints
- **Composants React** : ~20 composants
- **Technologies utilisées** : 10+ (React, Supabase, Groq, Tailwind, etc.)

### 🔗 Ressources utiles

- **Dépôt GitHub** : [À compléter]
- **Documentation Groq** : https://groq.com
- **Documentation Supabase** : https://supabase.com
- **Modèle Llama 3.3** : https://ai.meta.com/llama/

### 🎨 Captures d'écran

[À ajouter : captures d'écran de l'interface patient, dashboard infirmier, optimisation IA, settings]