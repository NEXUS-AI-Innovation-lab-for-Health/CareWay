/**
 * Olga API Service - Récupère les formulaires/workflows d'Olga MySQL
 * Pour réutilisation dans CareWay (rapports infirmier, validation médecin)
 */

const OLGA_API_BASE = 'http://localhost:9091';

// ============================================
// TYPES
// ============================================

export interface OlgaWorkflow {
  inventory_id: string;
  inventory_label: string;
  inventory_description: string;
  diagram?: string;
}

export interface OlgaTask {
  task_id: string;
  task_label: string;
  form_data?: OlgaForm[];
}

export interface OlgaForm {
  form_id: string;
  form_label: string;
  form_fields: OlgaFormField[];
  form_groups?: string[];
}

export interface OlgaFormField {
  field_id: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'signature' | 'file';
  required: boolean;
  options?: string[];
  validation?: any;
}

// ============================================
// GET ALL WORKFLOWS/INVENTORIES
// ============================================

/**
 * Récupère tous les workflows disponibles d'Olga pour un utilisateur
 * @param email Email de l'utilisateur Olga
 * @returns Liste des workflows disponibles
 */
export const getOlgaWorkflows = async (email: string): Promise<OlgaWorkflow[]> => {
  try {
    const response = await fetch(`${OLGA_API_BASE}/getAllInventoriesForUser?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching Olga workflows:', error);
    return [];
  }
};

// ============================================
// GET WORKFLOW DETAILS (DIAGRAM & FORMS)
// ============================================

/**
 * Récupère le diagramme/structure d'un workflow (toutes les tâches et formulaires)
 * @param inventoryId ID du workflow dans Olga
 * @returns Diagramme complet du workflow avec toutes les tâches
 */
export const getOlgaWorkflowDiagram = async (inventoryId: string): Promise<any> => {
  try {
    const response = await fetch(`${OLGA_API_BASE}/getDiagram?inventory_id=${encodeURIComponent(inventoryId)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching Olga workflow diagram:', error);
    return null;
  }
};

// ============================================
// EXTRACT FORMS FOR SPECIFIC ROLES
// ============================================

/**
 * Extrait les formulaires appropriés pour un rôle spécifique (infirmier, medecin, patient)
 * Note : Olga définit les rôles via les groupes (form_groups)
 * 
 * Exemple de structure :
 * - form_groups: ['infirmier', 'medecin'] → Visible aux 2 rôles
 * - form_groups: ['infirmier'] → Visible seulement à l'infirmier
 * 
 * @param diagram Diagramme du workflow
 * @param role Rôle utilisateur ('infirmier', 'medecin', 'patient')
 * @returns Formulaires filtrados pour ce rôle
 */
export const getFormsForRole = (diagram: any, role: 'infirmier' | 'medecin' | 'patient'): OlgaForm[] => {
  if (!diagram || !diagram.tasks) return [];

  const forms: OlgaForm[] = [];

  diagram.tasks.forEach((task: any) => {
    if (!task.form_data) return;

    // Si le tâche a un groupe (role), vérifier qu'il correspond
    const taskGroups = task.form_groups || [];
    if (taskGroups.length > 0 && !taskGroups.includes(role)) {
      return; // Cette tâche n'est pas pour ce rôle
    }

    task.form_data.forEach((form: any) => {
      // Aussi vérifier au niveau du formulaire
      const formGroups = form.form_groups || [];
      if (formGroups.length > 0 && !formGroups.includes(role)) {
        return; // Ce formulaire n'est pas pour ce rôle
      }

      forms.push({
        form_id: form.form_id || form.id,
        form_label: form.form_label || form.label,
        form_fields: (form.form_fields || form.fields || []).map((field: any) => ({
          field_id: field.field_id || field.id,
          field_label: field.field_label || field.label,
          field_type: field.field_type || 'text',
          required: field.required || false,
          options: field.options || [],
          validation: field.validation
        })),
        form_groups: form.form_groups || []
      });
    });
  });

  return forms;
};

// ============================================
// START A WORKFLOW TASK (Create Instance)
// ============================================

/**
 * Démarre une tâche/instance d'un workflow et retourne son ID
 * Utile pour créer un nouveau rapport post-RDV
 * 
 * @param inventoryId ID du workflow
 * @param taskId ID de la première tâche
 * @param userEmail Email de l'utilisateur qui lance la tâche
 * @returns Task ID pour le suivi
 */
export const startOlgaTask = async (
  inventoryId: string,
  taskId: string,
  userEmail: string
): Promise<string | null> => {
  try {
    const response = await fetch(`${OLGA_API_BASE}/startTask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inventory_id: inventoryId,
        task_id: taskId,
        user_email: userEmail
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.task_id || data.id;
  } catch (error) {
    console.error('❌ Error starting Olga task:', error);
    return null;
  }
};

// ============================================
// GET TASK STATUS & DATA
// ============================================

/**
 * Récupère le statut et les données actuelles d'une tâche en cours
 * @param taskId ID de la tâche
 * @returns Données complètes de la tâche
 */
export const getOlgaTaskStatus = async (taskId: string): Promise<any> => {
  try {
    const response = await fetch(`${OLGA_API_BASE}/status?task_id=${encodeURIComponent(taskId)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching Olga task status:', error);
    return null;
  }
};

// ============================================
// GET NEXT FORM IN WORKFLOW
// ============================================

/**
 * Récupère le formulaire suivant dans le workflow
 * (après que l'utilisateur complète et soumette le formulaire actuel)
 * 
 * @param taskId ID de la tâche
 * @returns Prochain formulaire ou null si workflow terminé
 */
export const getNextOlgaForm = async (taskId: string): Promise<OlgaForm | null> => {
  try {
    const response = await fetch(`${OLGA_API_BASE}/next?task_id=${encodeURIComponent(taskId)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    if (!data.form_data) return null;

    return {
      form_id: data.form_data.form_id || data.form_data.id,
      form_label: data.form_data.form_label || data.form_data.label,
      form_fields: (data.form_data.form_fields || data.form_data.fields || []).map((field: any) => ({
        field_id: field.field_id || field.id,
        field_label: field.field_label || field.label,
        field_type: field.field_type || 'text',
        required: field.required || false,
        options: field.options || [],
        validation: field.validation
      })),
      form_groups: data.form_data.form_groups || []
    };
  } catch (error) {
    console.error('❌ Error fetching next Olga form:', error);
    return null;
  }
};

// ============================================
// SUBMIT FORM DATA
// ============================================

/**
 * Soumet les données complétées d'un formulaire Olga
 * Et avance au formulaire suivant du workflow
 * 
 * @param taskId ID de la tâche
 * @param formData Données remplies de l'utilisateur
 * @returns Réponse du serveur
 */
export const submitOlgaFormData = async (
  taskId: string,
  formData: Record<string, any>
): Promise<any> => {
  try {
    const response = await fetch(`${OLGA_API_BASE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        form_data: formData
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('❌ Error submitting Olga form data:', error);
    throw error;
  }
};

// ============================================
// HELPER: GET FORMS MATCHING VISIT REPORT ROLE
// ============================================

/**
 * Helper pour obtenir les formulaires appropriés pour un rapport de visite
 * Combine les appels API avec le filtrage par rôle
 * 
 * @param workflowId ID du workflow Olga (ex: 'RapportPatient')
 * @param role Rôle ('infirmier' ou 'medecin')
 * @param userEmail Email de l'utilisateur
 * @returns Formulaires filtrés pour ce rôle
 */
export const getVisitReportForms = async (
  workflowId: string,
  role: 'infirmier' | 'medecin',
  userEmail: string
): Promise<OlgaForm[]> => {
  // 1. Récupérer tous les workflows
  const workflows = await getOlgaWorkflows(userEmail);
  const workflow = workflows.find(w => w.inventory_id === workflowId);
  
  if (!workflow) {
    console.error(`❌ Workflow "${workflowId}" not found`);
    return [];
  }

  // 2. Récupérer le diagramme complet
  const diagram = await getOlgaWorkflowDiagram(workflow.inventory_id);
  if (!diagram) {
    console.error(`❌ Cannot fetch diagram for workflow "${workflowId}"`);
    return [];
  }

  // 3. Filtrer les formulaires pour ce rôle
  return getFormsForRole(diagram, role);
};
