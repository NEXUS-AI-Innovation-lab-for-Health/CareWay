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

    // Create user in Supabase Auth
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          role: 'patient'
        }
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

    // Create user in users table
    const user = await db.createUser({
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

// ============================================
// NURSE AUTHENTICATION (FranceConnect)
// ============================================

// Nurse FranceConnect Login/Signup
app.post("/make-server-1b83ce4c/api/nurse/franceconnect", async (c) => {
  try {
    const body = await c.req.json();
    const { firstName, lastName, email, franceConnectId } = body;

    console.log('🔐 Nurse FranceConnect login attempt:', { firstName, lastName, email, franceConnectId });

    if (!firstName || !lastName || !email || !franceConnectId) {
      console.error('❌ Missing required FranceConnect data');
      return c.json({ success: false, error: "Données FranceConnect manquantes" }, 400);
    }

    // Check if user exists
    console.log('🔍 Checking if user exists with email:', email);
    let user = await db.getUserByEmail(email);
    console.log('User lookup result:', user ? `Found user ${user.id}` : 'No user found');

    if (!user) {
      console.log('📝 Creating new nurse account...');
      
      // Create user
      user = await db.createUser({
        role: 'infirmier',
        email,
        first_name: firstName,
        last_name: lastName
      });
      console.log('✅ User created:', user.id);

      // Create infirmier record
      const infirmier = await db.createInfirmier(user.id);
      console.log('✅ Infirmier record created:', infirmier.user_id);

      // Create default settings
      const settings = await db.createInfirmierSettings(user.id);
      console.log('✅ Infirmier settings created for:', settings.infirmier_id);

      console.log('✅ New nurse account fully created:', user.id);
    } else {
      console.log('✅ Existing nurse found:', user.id);
    }

    // Get infirmier data
    console.log('🔍 Fetching infirmier data for user:', user.id);
    const infirmier = await db.getInfirmierByUserId(user.id);
    console.log('Infirmier data:', infirmier ? 'Found' : 'Not found');
    
    const settings = await db.getInfirmierSettings(user.id);
    console.log('Settings data:', settings ? 'Found' : 'Not found');

    const responseData = { 
      success: true, 
      nurse: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        type: 'nurse'
      },
      settings
    };

    console.log('✅ Sending successful response:', JSON.stringify(responseData, null, 2));
    return c.json(responseData);
  } catch (error) {
    console.error("❌ Nurse FranceConnect error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ success: false, error: `Erreur lors de l'authentification FranceConnect: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
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

// ============================================
// APPOINTMENTS (TO BE IMPLEMENTED)
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
    const appointments = await db.getPendingAppointments(infirmierId);
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

Deno.serve(app.fetch);