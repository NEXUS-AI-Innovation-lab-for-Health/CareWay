// @ts-nocheck
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as db from "./database.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Get Supabase client for auth
const getSupabaseClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
);

// Get Supabase client for admin
const getSupabaseAdminClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Health check endpoint
app.get("/make-server-1b83ce4c/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// DEBUG ROUTES
// ============================================

// List all patients (for debugging)
app.get("/make-server-1b83ce4c/debug/patients", async (c) => {
  try {
    console.log('🔍 Fetching all patients from database');
    const patients = await db.getAllPatients();
    console.log(`✅ Found ${patients.length} patients`);
    
    return c.json({ 
      success: true, 
      count: patients.length,
      patients 
    });
  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    return c.json({ error: 'Failed to fetch patients' }, 500);
  }
});

// List all infirmiers (for debugging)
app.get("/make-server-1b83ce4c/debug/infirmiers", async (c) => {
  try {
    console.log('🔍 Fetching all infirmiers from database');
    const infirmiers = await db.getAllInfirmiers();
    console.log(`✅ Found ${infirmiers.length} infirmiers`);
    
    return c.json({ 
      success: true, 
      count: infirmiers.length,
      infirmiers 
    });
  } catch (error) {
    console.error('❌ Error fetching infirmiers:', error);
    return c.json({ error: 'Failed to fetch infirmiers' }, 500);
  }
});

// Get all users (for debugging)
app.get("/make-server-1b83ce4c/debug/users", async (c) => {
  try {
    console.log('🔍 Fetching all users from database');
    const users = await db.getAllUsers();
    console.log(`✅ Found ${users.length} users`);
    
    return c.json({ 
      success: true, 
      count: users.length,
      users 
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Confirm all unconfirmed users (for debugging/setup)
app.post("/make-server-1b83ce4c/debug/confirm-users", async (c) => {
  try {
    console.log('🔧 Confirming all unconfirmed users in Supabase Auth');
    
    const supabase = getSupabaseAdminClient();
    
    // Get all users from Auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error listing users:', error);
      return c.json({ error: error.message }, 500);
    }
    
    let confirmedCount = 0;
    
    // Confirm each unconfirmed user
    for (const user of users) {
      if (!user.email_confirmed_at) {
        console.log(`📧 Confirming user: ${user.email}`);
        await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true
        });
        confirmedCount++;
      }
    }
    
    console.log(`✅ Confirmed ${confirmedCount} users`);
    
    return c.json({ 
      success: true, 
      message: `Confirmed ${confirmedCount} users`,
      totalUsers: users.length,
      confirmedCount
    });
  } catch (error) {
    console.error('❌ Error confirming users:', error);
    return c.json({ error: 'Failed to confirm users' }, 500);
  }
});

// Clean all users (DANGER: deletes everything!)
app.post("/make-server-1b83ce4c/debug/clean-all-users", async (c) => {
  try {
    console.log('🧹 CLEANING ALL USERS - This will delete everything!');
    
    const supabase = getSupabaseAdminClient();
    
    // 1. Delete all users from auth.users
    console.log('🗑️ Deleting all auth users...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return c.json({ error: listError.message }, 500);
    }
    
    let deletedAuthUsers = 0;
    for (const user of users) {
      console.log(`   Deleting auth user: ${user.email}`);
      await supabase.auth.admin.deleteUser(user.id);
      deletedAuthUsers++;
    }
    
    // 2. Delete all appointments
    console.log('🗑️ Deleting all appointments...');
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (appointmentsError) console.warn('⚠️ Appointments delete warning:', appointmentsError);
    
    // 3. Delete all patients
    console.log('🗑️ Deleting all patients...');
    const { error: patientsError } = await supabase
      .from('patients')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (patientsError) console.warn('⚠️ Patients delete warning:', patientsError);
    
    // 4. Delete all infirmier settings
    console.log('🗑️ Deleting all infirmier settings...');
    const { error: settingsError } = await supabase
      .from('infirmier_settings')
      .delete()
      .neq('infirmier_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (settingsError) console.warn('⚠️ Settings delete warning:', settingsError);
    
    // 5. Delete all infirmier unavailabilities
    console.log('🗑️ Deleting all unavailabilities...');
    const { error: unavailError } = await supabase
      .from('infirmier_unavailability')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (unavailError) console.warn('⚠️ Unavailabilities delete warning:', unavailError);
    
    // 6. Delete all infirmiers
    console.log('🗑️ Deleting all infirmiers...');
    const { error: infirmiersError } = await supabase
      .from('infirmiers')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (infirmiersError) console.warn('⚠️ Infirmiers delete warning:', infirmiersError);
    
    // 7. Delete all users from public.users
    console.log('🗑️ Deleting all public users...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (usersError) console.warn('⚠️ Users delete warning:', usersError);
    
    console.log('✅ ALL DATA CLEANED!');
    
    return c.json({ 
      success: true, 
      message: 'All users and data deleted successfully',
      deletedAuthUsers,
      note: 'Database is now clean - you can create new accounts'
    });
  } catch (error) {
    console.error('❌ Error cleaning users:', error);
    return c.json({ error: 'Failed to clean users' }, 500);
  }
});

// ============================================
// PATIENT AUTHENTICATION (Supabase Auth)
// ============================================

// Patient Signup with Supabase Auth
app.post("/make-server-1b83ce4c/api/patient/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { firstName, lastName, email, password, phone, address } = body;

    console.log('📝 Patient signup attempt:', { firstName, lastName, email, phone });

    if (!firstName || !lastName || !email || !password) {
      console.log('❌ Missing required fields');
      return c.json({ error: "Prénom, nom, email et mot de passe requis" }, 400);
    }

    // Create user in Supabase Auth using ADMIN API
    const supabase = getSupabaseAdminClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since we don't have email server configured
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: 'patient'
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return c.json({ error: authError.message }, 400);
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth');
      return c.json({ error: "Erreur lors de la création du compte" }, 500);
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Create user in users table with the same ID as auth.users
    const user = await db.createUser({
      id: authData.user.id, // Use the same UUID from auth.users
      role: 'patient',
      email,
      phone: phone || null,
      first_name: firstName,
      last_name: lastName
    });

    console.log('✅ User record created:', user.id);

    // Create patient record
    const patient = await db.createPatient(user.id, {
      default_address: address || null
    });

    console.log('✅ Patient record created');

    return c.json({ 
      success: true, 
      message: "Compte patient créé avec succès",
      userId: user.id 
    });
  } catch (error) {
    console.error("❌ Patient signup error:", error);
    return c.json({ error: "Erreur lors de l'inscription" }, 500);
  }
});

// Patient Login with Supabase Auth
app.post("/make-server-1b83ce4c/api/patient/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    console.log('🔐 Patient login attempt for:', email);

    if (!email || !password) {
      console.log('❌ Missing credentials');
      return c.json({ error: "Email et mot de passe requis" }, 400);
    }

    // Authenticate with Supabase Auth
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      console.log('❌ Authentication failed');
      return c.json({ error: "Email ou mot de passe incorrect" }, 401);
    }

    console.log('✅ Auth successful');

    // Get user from database
    const user = await db.getUserByEmail(email);
    if (!user) {
      console.log('❌ User not found in database');
      return c.json({ error: "Utilisateur non trouvé" }, 404);
    }

    // Get patient data
    const patient = await db.getPatientByUserId(user.id);
    if (!patient) {
      console.log('❌ Patient record not found');
      return c.json({ error: "Compte patient non trouvé" }, 404);
    }

    console.log('✅ Login successful');

    return c.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        address: patient.default_address,
        type: 'patient'
      },
      session: authData.session
    });
  } catch (error) {
    console.error("❌ Patient login error:", error);
    return c.json({ error: "Erreur lors de la connexion" }, 500);
  }
});

// Get patient profile details
app.get("/make-server-1b83ce4c/api/patient/:patientId/profile", async (c) => {
  try {
    const patientId = c.req.param('patientId');
    console.log('📋 Fetching patient profile for ID:', patientId);

    // Get user from database
    const user = await db.getUserById(patientId);
    if (!user) {
      console.log('❌ User not found');
      return c.json({ error: "Utilisateur non trouvé" }, 404);
    }

    // Get patient data
    const patient = await db.getPatientByUserId(user.id);
    if (!patient) {
      console.log('❌ Patient record not found');
      return c.json({ error: "Données patient non trouvées" }, 404);
    }

    console.log('✅ Patient profile fetched successfully');

    return c.json({ 
      success: true,
      profile: {
        email: user.email,
        phone: user.phone,
        address: patient.default_address,
        birthDate: patient.birthdate,
        preferredLanguage: patient.preferred_language,
        bloodType: patient.blood_type,
        allergies: patient.allergies || [],
        chronicConditions: patient.chronic_conditions || [],
        medicalNotes: patient.medical_notes
      }
    });
  } catch (error) {
    console.error("❌ Error fetching patient profile:", error);
    return c.json({ error: "Erreur lors de la récupération du profil" }, 500);
  }
});

// Update patient profile
app.patch("/make-server-1b83ce4c/api/patient/:patientId/profile", async (c) => {
  try {
    const patientId = c.req.param('patientId');
    const body = await c.req.json();
    const { phone, address, birthDate, preferredLanguage, bloodType, allergies, chronicConditions, medicalNotes } = body;

    console.log('🔄 Updating patient profile for ID:', patientId);

    // Update user data (phone)
    if (phone !== undefined) {
      await db.updateUser(patientId, { phone });
    }

    // Update patient data (address, birthdate, language, medical info)
    const patientUpdates: any = {};
    if (address !== undefined) patientUpdates.default_address = address;
    // Convert empty string to null for birthDate
    if (birthDate !== undefined) {
      patientUpdates.birthdate = birthDate === '' ? null : birthDate;
    }
    if (preferredLanguage !== undefined) patientUpdates.preferred_language = preferredLanguage;
    if (bloodType !== undefined) patientUpdates.blood_type = bloodType === '' ? null : bloodType;
    if (allergies !== undefined) patientUpdates.allergies = allergies;
    if (chronicConditions !== undefined) patientUpdates.chronic_conditions = chronicConditions;
    if (medicalNotes !== undefined) patientUpdates.medical_notes = medicalNotes === '' ? null : medicalNotes;

    if (Object.keys(patientUpdates).length > 0) {
      await db.updatePatient(patientId, patientUpdates);
    }

    console.log('✅ Patient profile updated successfully');

    return c.json({ 
      success: true,
      message: "Profil mis à jour avec succès"
    });
  } catch (error) {
    console.error("❌ Error updating patient profile:", error);
    return c.json({ error: "Erreur lors de la mise à jour du profil" }, 500);
  }
});

// ============================================
// NURSE AUTHENTICATION (FranceConnect)
// ============================================

// Nurse FranceConnect Login/Signup
app.post("/make-server-1b83ce4c/api/nurse/franceconnect", async (c) => {
  try {
    const body = await c.req.json();
    const { firstName, lastName, email, franceConnectId } = body;

    console.log('🔐 Nurse FranceConnect login:', { firstName, lastName, email });

    if (!firstName || !lastName || !email || !franceConnectId) {
      return c.json({ error: "Données FranceConnect manquantes" }, 400);
    }

    // Check if user exists
    let user = await db.getUserByEmail(email);

    if (!user) {
      console.log('📝 Creating new nurse account');
      
      // Create user
      user = await db.createUser({
        role: 'infirmier',
        email,
        first_name: firstName,
        last_name: lastName
      });

      // Create infirmier record
      await db.createInfirmier(user.id);

      // Create default settings
      await db.createInfirmierSettings(user.id);

      console.log('✅ New nurse account created:', user.id);
    } else {
      console.log('✅ Existing nurse found:', user.id);
    }

    // Get infirmier data
    const infirmier = await db.getInfirmierByUserId(user.id);
    const settings = await db.getInfirmierSettings(user.id);

    return c.json({ 
      success: true, 
      nurse: {  // Changed from "user" to "nurse" to match frontend expectations
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        type: 'nurse'
      },
      settings
    });
  } catch (error) {
    console.error("❌ Nurse FranceConnect error:", error);
    return c.json({ error: "Erreur lors de l'authentification FranceConnect" }, 500);
  }
});

// ============================================
// INFIRMIER SETTINGS
// ============================================

// Get infirmier settings
app.get("/make-server-1b83ce4c/infirmier/:infirmierId/settings", async (c) => {
  try {
    const infirmierId = c.req.param("infirmierId");
    const settings = await db.getInfirmierSettings(infirmierId);
    
    if (!settings) {
      // Create default settings if not found
      const newSettings = await db.createInfirmierSettings(infirmierId);
      return c.json({ success: true, settings: newSettings });
    }
    
    return c.json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return c.json({ error: "Failed to fetch settings" }, 500);
  }
});

// Update infirmier settings
app.put("/make-server-1b83ce4c/infirmier/:infirmierId/settings", async (c) => {
  try {
    const infirmierId = c.req.param("infirmierId");
    const body = await c.req.json();
    
    const settings = await db.updateInfirmierSettings(infirmierId, body);
    return c.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return c.json({ error: "Failed to update settings" }, 500);
  }
});

// ============================================
// AI ROUTE OPTIMIZATION
// ============================================

// Optimize route with AI (Groq + Mixtral)
app.post("/make-server-1b83ce4c/ai/optimize-route", async (c) => {
  try {
    const body = await c.req.json();
    const { appointments, nurseSettings, date } = body;

    console.log('🤖 AI Optimization requested for', appointments.length, 'appointments on', date);

    // Validate input
    if (!appointments || appointments.length === 0) {
      return c.json({ error: "No appointments to optimize" }, 400);
    }

    // Get Groq API key
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      console.error('❌ GROQ_API_KEY not configured');
      return c.json({ 
        error: "L'API Groq n'est pas configurée. Veuillez ajouter votre clé API Groq dans les variables d'environnement." 
      }, 500);
    }

    // Build prompt for AI
    const prompt = buildOptimizationPrompt(appointments, nurseSettings, date);

    console.log('📤 Sending request to Groq API...');

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en optimisation de tournées de soins infirmiers. Tu analyses les rendez-vous et proposes le meilleur itinéraire possible en minimisant les distances et en respectant les contraintes. Tu réponds UNIQUEMENT en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('❌ Groq API error:', groqResponse.status, errorText);
      return c.json({ 
        error: `Erreur API Groq: ${groqResponse.status}`,
        details: errorText 
      }, 500);
    }

    const groqData = await groqResponse.json();
    console.log('✅ Received response from Groq');

    // Extract AI response
    const aiResponse = groqData.choices[0]?.message?.content;
    if (!aiResponse) {
      console.error('❌ No content in Groq response');
      return c.json({ error: "Pas de réponse de l'IA" }, 500);
    }

    // Parse JSON response
    let optimizedResult;
    try {
      // Remove markdown code blocks if present
      const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      optimizedResult = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('Raw response:', aiResponse);
      return c.json({ 
        error: "Erreur de parsing de la réponse IA",
        rawResponse: aiResponse 
      }, 500);
    }

    console.log('🎉 AI optimization successful');

    return c.json({
      success: true,
      optimizedRoute: optimizedResult,
      model: 'llama-3.3-70b-versatile',
      provider: 'groq'
    });

  } catch (error) {
    console.error('❌ AI optimization error:', error);
    return c.json({ 
      error: "Erreur lors de l'optimisation IA",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Helper function to build the optimization prompt
function buildOptimizationPrompt(appointments: any[], nurseSettings: any, date: string): string {
  const startAddress = nurseSettings?.start_address || 'Adresse de départ non définie';
  const transport = nurseSettings?.transport || 'car';
  const maxDistance = nurseSettings?.max_distance_km || 20;

  const appointmentsInfo = appointments.map((apt, index) => ({
    id: apt.id,
    patient: apt.patientName,
    address: apt.location,
    type: apt.type,
    duration: apt.duration,
    isUrgent: apt.isUrgent || false,
    timeSlot: apt.timeSlot || 'matin',
    notes: apt.notes || ''
  }));

  return `Tu dois optimiser une tournée de soins infirmiers pour le ${date}.

**POINT DE DÉPART** : ${startAddress}
**MODE DE TRANSPORT** : ${transport}
**DISTANCE MAXIMALE** : ${maxDistance} km

**RENDEZ-VOUS À OPTIMISER** :
${JSON.stringify(appointmentsInfo, null, 2)}

**CRÉNEAUX HORAIRES** :
- Matin : 08h00 - 12h00
- Après-midi : 14h00 - 18h00
- Soir : 18h00 - 20h00

**TES OBJECTIFS** :
1. Minimiser la distance totale parcourue
2. Regrouper géographiquement les visites proches
3. Respecter les urgences en priorité
4. Assigner des horaires réalistes dans les créneaux appropriés
5. Prévoir des temps de trajet réalistes entre chaque visite

**FORMAT DE RÉPONSE ATTENDU (JSON strict)** :
{
  "optimizedAppointments": [
    {
      "id": "id-du-rdv",
      "suggestedTime": "09:30",
      "order": 1,
      "reasoning": "Explication courte"
    }
  ],
  "summary": {
    "totalDistance": 25.5,
    "totalTime": 240,
    "explanation": "Explication générale de ta stratégie d'optimisation"
  },
  "stats": {
    "morningVisits": 3,
    "afternoonVisits": 2,
    "eveningVisits": 1
  }
}

Réponds UNIQUEMENT avec le JSON, sans texte additionnel.`;
}

// ============================================
// INFIRMIER UNAVAILABILITIES
// ============================================

// Get unavailabilities
app.get("/make-server-1b83ce4c/unavailabilities/:infirmierId", async (c) => {
  try {
    const infirmierId = c.req.param("infirmierId");
    const unavailabilities = await db.getUnavailabilities(infirmierId);
    return c.json({ success: true, unavailabilities });
  } catch (error) {
    console.error("Error fetching unavailabilities:", error);
    return c.json({ error: "Failed to fetch unavailabilities" }, 500);
  }
});

// Add unavailability
app.post("/make-server-1b83ce4c/unavailabilities/:infirmierId", async (c) => {
  try {
    const infirmierId = c.req.param("infirmierId");
    const body = await c.req.json();
    const { date, startTime, endTime, reason } = body;

    if (!date || !startTime || !endTime) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Combine date and time into ISO timestamps
    const start_at = `${date}T${startTime}:00`;
    const end_at = `${date}T${endTime}:00`;

    const unavailability = await db.createUnavailability({
      infirmier_id: infirmierId,
      start_at,
      end_at,
      reason
    });

    return c.json({ success: true, unavailability });
  } catch (error) {
    console.error("Error adding unavailability:", error);
    return c.json({ error: "Failed to add unavailability" }, 500);
  }
});

// Delete unavailability
app.delete("/make-server-1b83ce4c/unavailabilities/:infirmierId/:unavailabilityId", async (c) => {
  try {
    const unavailabilityId = c.req.param("unavailabilityId");
    await db.deleteUnavailability(unavailabilityId);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting unavailability:", error);
    return c.json({ error: "Failed to delete unavailability" }, 500);
  }
});

// ============================================
// CARE TYPES
// ============================================

// Get all care types
app.get("/make-server-1b83ce4c/care-types", async (c) => {
  try {
    const careTypes = await db.getAllCareTypes();
    return c.json({ success: true, careTypes });
  } catch (error) {
    console.error("Error fetching care types:", error);
    return c.json({ error: "Failed to fetch care types" }, 500);
  }
});

// Get or create care type by name
app.post("/make-server-1b83ce4c/care-types/get-or-create", async (c) => {
  try {
    const { name } = await c.req.json();
    
    if (!name) {
      return c.json({ error: "Care type name is required" }, 400);
    }
    
    // Try to get existing care type
    let careType = await db.getCareTypeByName(name);
    
    // If not found, create it
    if (!careType) {
      console.log(`Creating new care type: ${name}`);
      careType = await db.createCareType(name);
    }
    
    return c.json({ success: true, careType });
  } catch (error) {
    console.error("Error getting or creating care type:", error);
    return c.json({ error: "Failed to get or create care type" }, 500);
  }
});

// ============================================
// APPOINTMENTS
// ============================================

// Get appointments for patient
app.get("/make-server-1b83ce4c/appointments/patient/:patientId", async (c) => {
  try {
    const patientId = c.req.param("patientId");
    const appointments = await db.getAppointmentsByPatient(patientId);
    return c.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return c.json({ error: "Failed to fetch appointments" }, 500);
  }
});

// Get appointments for infirmier
app.get("/make-server-1b83ce4c/appointments/infirmier/:infirmierId", async (c) => {
  try {
    const infirmierId = c.req.param("infirmierId");
    const appointments = await db.getAppointmentsByInfirmier(infirmierId);
    return c.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return c.json({ error: "Failed to fetch appointments" }, 500);
  }
});

// Get pending appointments
app.get("/make-server-1b83ce4c/appointments/pending/:infirmierId", async (c) => {
  try {
    const infirmierId = c.req.param("infirmierId");
    // Si "all", récupérer toutes les demandes sans infirmier assigné
    const appointments = infirmierId === 'all' 
      ? await db.getPendingAppointments()
      : await db.getPendingAppointments(infirmierId);
    return c.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching pending appointments:", error);
    return c.json({ error: "Failed to fetch pending appointments" }, 500);
  }
});

// Create appointment
app.post("/make-server-1b83ce4c/appointments", async (c) => {
  try {
    const body = await c.req.json();
    const appointment = await db.createAppointment(body);
    return c.json({ success: true, appointment });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return c.json({ error: "Failed to create appointment" }, 500);
  }
});

// Update appointment
app.patch("/make-server-1b83ce4c/appointments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const appointment = await db.updateAppointment(id, body);
    return c.json({ success: true, appointment });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return c.json({ error: "Failed to update appointment" }, 500);
  }
});

// Delete/Cancel appointment
app.delete("/make-server-1b83ce4c/appointments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    // Instead of deleting, we update status to cancelled
    const appointment = await db.updateAppointment(id, { status: 'cancelled' });
    return c.json({ success: true, appointment });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return c.json({ error: "Failed to cancel appointment" }, 500);
  }
});

// ============================================
// HEALTH DOCUMENTS
// ============================================

// Get health documents for patient
app.get("/make-server-1b83ce4c/health-documents/:patientId", async (c) => {
  try {
    const patientId = c.req.param("patientId");
    const documents = await db.getHealthDocumentsByPatient(patientId);
    
    // Generate signed URLs for documents that have file_path
    const supabase = getSupabaseAdminClient();
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        if (doc.file_path) {
          const { data: signedUrlData } = await supabase.storage
            .from('make-1b83ce4c-health-documents')
            .createSignedUrl(doc.file_path, 3600); // 1 hour expiry
          
          return {
            ...doc,
            downloadUrl: signedUrlData?.signedUrl || null
          };
        }
        return doc;
      })
    );
    
    return c.json({ success: true, documents: documentsWithUrls });
  } catch (error) {
    console.error("Error fetching health documents:", error);
    return c.json({ error: "Failed to fetch health documents" }, 500);
  }
});

// Upload health document
app.post("/make-server-1b83ce4c/health-documents/:patientId", async (c) => {
  try {
    const patientId = c.req.param("patientId");
    const formData = await c.req.formData();
    
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const documentType = formData.get('documentType') as string;
    const notes = formData.get('notes') as string | null;
    
    if (!file || !name || !documentType) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const supabase = getSupabaseAdminClient();
    
    // Create bucket if it doesn't exist
    const bucketName = 'make-1b83ce4c-health-documents';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760 // 10MB
      });
    }
    
    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${patientId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return c.json({ error: "Failed to upload file" }, 500);
    }
    
    // Create document record in database
    const document = await db.createHealthDocument({
      patient_id: patientId,
      name,
      document_type: documentType,
      file_path: fileName,
      file_size_bytes: file.size,
      mime_type: file.type,
      notes: notes || undefined
    });
    
    return c.json({ success: true, document });
  } catch (error) {
    console.error("Error uploading health document:", error);
    return c.json({ error: "Failed to upload health document" }, 500);
  }
});

// Delete health document
app.delete("/make-server-1b83ce4c/health-documents/:patientId/:documentId", async (c) => {
  try {
    const documentId = c.req.param("documentId");
    
    // Get document to find file_path
    const documents = await db.getHealthDocumentsByPatient(c.req.param("patientId"));
    const document = documents.find(doc => doc.id === documentId);
    
    if (document?.file_path) {
      // Delete file from storage
      const supabase = getSupabaseAdminClient();
      await supabase.storage
        .from('make-1b83ce4c-health-documents')
        .remove([document.file_path]);
    }
    
    // Delete record from database
    await db.deleteHealthDocument(documentId);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting health document:", error);
    return c.json({ error: "Failed to delete health document" }, 500);
  }
});

// ============================================
// PRESCRIPTIONS
// ============================================

// Get prescriptions for patient
app.get("/make-server-1b83ce4c/prescriptions/:patientId", async (c) => {
  try {
    const patientId = c.req.param("patientId");
    const prescriptions = await db.getPrescriptionsByPatient(patientId);
    
    // Generate signed URLs for prescriptions that have file_path
    const supabase = getSupabaseAdminClient();
    const prescriptionsWithUrls = await Promise.all(
      prescriptions.map(async (prescription) => {
        if (prescription.file_path) {
          const { data: signedUrlData } = await supabase.storage
            .from('make-1b83ce4c-prescriptions')
            .createSignedUrl(prescription.file_path, 3600); // 1 hour expiry
          
          return {
            ...prescription,
            downloadUrl: signedUrlData?.signedUrl || null
          };
        }
        return prescription;
      })
    );
    
    return c.json({ success: true, prescriptions: prescriptionsWithUrls });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return c.json({ error: "Failed to fetch prescriptions" }, 500);
  }
});

// Create prescription
app.post("/make-server-1b83ce4c/prescriptions/:patientId", async (c) => {
  try {
    const patientId = c.req.param("patientId");
    const body = await c.req.json();
    const { appointmentId, infirmierId, prescriptionDate, medications, instructions, notes } = body;
    
    if (!prescriptionDate || !medications || medications.length === 0) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    // Create prescription
    const prescription = await db.createPrescription({
      patient_id: patientId,
      appointment_id: appointmentId || undefined,
      infirmier_id: infirmierId || undefined,
      prescription_date: prescriptionDate,
      instructions: instructions || undefined,
      notes: notes || undefined
    });
    
    // Add medications
    for (const med of medications) {
      await db.addPrescriptionMedication({
        prescription_id: prescription.id,
        medication_name: med.name,
        dosage: med.dosage || undefined,
        frequency: med.frequency || undefined,
        duration: med.duration || undefined,
        instructions: med.instructions || undefined
      });
    }
    
    return c.json({ success: true, prescription });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return c.json({ error: "Failed to create prescription" }, 500);
  }
});

// Delete prescription
app.delete("/make-server-1b83ce4c/prescriptions/:patientId/:prescriptionId", async (c) => {
  try {
    const prescriptionId = c.req.param("prescriptionId");
    
    // Get prescription to find file_path
    const prescriptions = await db.getPrescriptionsByPatient(c.req.param("patientId"));
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    
    if (prescription?.file_path) {
      // Delete file from storage
      const supabase = getSupabaseAdminClient();
      await supabase.storage
        .from('make-1b83ce4c-prescriptions')
        .remove([prescription.file_path]);
    }
    
    // Delete record from database (medications will be deleted automatically via CASCADE)
    await db.deletePrescription(prescriptionId);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return c.json({ error: "Failed to delete prescription" }, 500);
  }
});

// Get patient medical information (for infirmier dashboard)
app.get("/make-server-1b83ce4c/api/patient/:patientId/medical-info", async (c) => {
  try {
    const patientId = c.req.param('patientId');
    console.log('📋 Fetching medical info for patient ID:', patientId);

    // Get user from database
    const user = await db.getUserById(patientId);
    if (!user) {
      console.log('❌ User not found');
      return c.json({ error: "Utilisateur non trouvé" }, 404);
    }

    // Get patient data
    const patient = await db.getPatientByUserId(user.id);
    if (!patient) {
      console.log('❌ Patient record not found');
      return c.json({ error: "Données patient non trouvées" }, 404);
    }

    // Calculate age from birthdate
    let age = null;
    if (patient.birthdate) {
      const birthDate = new Date(patient.birthdate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Get the most recent prescription
    const prescriptions = await db.getPrescriptionsByPatient(user.id);
    const latestPrescription = prescriptions && prescriptions.length > 0 ? prescriptions[0] : null;

    console.log('✅ Medical info fetched successfully');

    return c.json({ 
      success: true,
      medicalInfo: {
        age,
        bloodType: patient.blood_type,
        allergies: patient.allergies || [],
        chronicConditions: patient.chronic_conditions || [],
        medicalNotes: patient.medical_notes,
        latestPrescription: latestPrescription ? {
          doctor: latestPrescription.infirmier ? 
            `${latestPrescription.infirmier.first_name} ${latestPrescription.infirmier.last_name}` : 
            'Non renseigné',
          date: latestPrescription.prescription_date,
          medications: latestPrescription.medications || [],
          instructions: latestPrescription.instructions
        } : null
      }
    });
  } catch (error) {
    console.error("❌ Error fetching medical info:", error);
    return c.json({ error: "Erreur lors de la récupération des informations médicales" }, 500);
  }
});

// ============================================
// MÉDECIN AUTHENTICATION (FranceConnect)
// ============================================

app.post("/make-server-1b83ce4c/api/medecin/franceconnect", async (c) => {
  try {
    const body = await c.req.json();
    const { firstName, lastName, email, franceConnectId } = body;

    if (!firstName || !lastName || !email || !franceConnectId) {
      return c.json({ error: "Données FranceConnect manquantes" }, 400);
    }

    let user = await db.getUserByEmail(email);

    if (!user) {
      user = await db.createUser({
        role: 'medecin',
        email,
        first_name: firstName,
        last_name: lastName
      });
      // Les médecins partagent la table infirmiers pour l'instant
      // (même structure, le rôle dans users distingue)
      await db.createInfirmier(user.id);
      await db.createInfirmierSettings(user.id);
    }

    return c.json({
      success: true,
      medecin: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        type: 'medecin'
      }
    });
  } catch (error) {
    console.error("❌ Medecin FranceConnect error:", error);
    return c.json({ error: "Erreur lors de l'authentification" }, 500);
  }
});

// ============================================
// VISIT REPORTS — Workflow de validation de visite
// ============================================

// Créer un compte-rendu (infirmier/médecin marque la visite terminée)
app.post("/make-server-1b83ce4c/visit-reports", async (c) => {
  try {
    const body = await c.req.json();
    const { appointment_id, actes_realises, observations, medicaments_administres, suite_a_donner, pm_role, pm_id } = body;

    if (!appointment_id || !pm_role || !pm_id) {
      return c.json({ error: "appointment_id, pm_role et pm_id requis" }, 400);
    }

    // Marquer le RDV comme 'done'
    const supabase = getSupabaseAdminClient();
    await supabase.from('appointments').update({ status: 'done' }).eq('id', appointment_id);

    // Créer le compte-rendu
    const report = await db.createVisitReport({
      appointment_id,
      actes_realises: actes_realises || null,
      observations: observations || null,
      medicaments_administres: medicaments_administres || null,
      suite_a_donner: suite_a_donner || null,
      pm_role,
      pm_id,
      workflow_data: body.workflow_data || null,
    });

    return c.json({ success: true, report });
  } catch (error) {
    console.error("❌ Error creating visit report:", error);
    return c.json({ error: "Erreur lors de la création du compte-rendu" }, 500);
  }
});

// Récupérer les comptes-rendus en attente de validation médecin
app.get("/make-server-1b83ce4c/visit-reports/awaiting-medecin", async (c) => {
  try {
    const reports = await db.getVisitReportsAwaitingMedecin();
    return c.json({ success: true, reports });
  } catch (error) {
    console.error("❌ Error fetching reports:", error);
    return c.json({ error: "Erreur lors de la récupération" }, 500);
  }
});

// Récupérer les comptes-rendus en attente d'approbation patient
app.get("/make-server-1b83ce4c/visit-reports/patient/:patientId", async (c) => {
  try {
    const patientId = c.req.param('patientId');
    const reports = await db.getVisitReportsForPatient(patientId);
    return c.json({ success: true, reports });
  } catch (error) {
    console.error("❌ Error fetching patient reports:", error);
    return c.json({ error: "Erreur lors de la récupération" }, 500);
  }
});

// Médecin valide un compte-rendu
app.patch("/make-server-1b83ce4c/visit-reports/:id/medecin-validate", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { medecin_id, medecin_form_data } = body;

    if (!medecin_id) return c.json({ error: "medecin_id requis" }, 400);

    const report = await db.validateVisitReportByMedecin(id, medecin_id, medecin_form_data);
    return c.json({ success: true, report });
  } catch (error) {
    console.error("❌ Error validating report:", error);
    return c.json({ error: "Erreur lors de la validation" }, 500);
  }
});

// Patient approuve un compte-rendu
app.patch("/make-server-1b83ce4c/visit-reports/:id/patient-approve", async (c) => {
  try {
    const id = c.req.param('id');
    const report = await db.approveVisitReportByPatient(id);
    return c.json({ success: true, report });
  } catch (error) {
    console.error("❌ Error approving report:", error);
    return c.json({ error: "Erreur lors de l'approbation" }, 500);
  }
});

// Compte-rendu d'un RDV spécifique
app.get("/make-server-1b83ce4c/visit-reports/appointment/:appointmentId", async (c) => {
  try {
    const appointmentId = c.req.param('appointmentId');
    const report = await db.getVisitReportByAppointment(appointmentId);
    return c.json({ success: true, report });
  } catch (error) {
    console.error("❌ Error fetching report:", error);
    return c.json({ error: "Erreur lors de la récupération" }, 500);
  }
});

Deno.serve(app.fetch);