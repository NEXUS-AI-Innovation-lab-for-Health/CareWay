/**
 * Test pour vérifier que getFormForRole retourne les bons formulaires
 * 
 * À exécuter dans la console du navigateur (F12) sur une page CareWay
 */

import * as api from './services/api';

async function testWorkflowForms() {
  console.log('=== TEST WORKFLOW FORMS ===\n');
  
  try {
    // 1. Récupérer le workflow complet
    console.log('1️⃣ Récupération du workflow RapportPatient...');
    const workflow = await api.getOlgaWorkflow('RapportPatient');
    console.log('✓ Workflow récupéré:', workflow.workflow_label);
    
    const formNodes = api.getFormNodesInOrder(workflow);
    console.log(`✓ ${formNodes.length} formulaires dans le workflow:\n`);
    formNodes.forEach((node, index) => {
      console.log(`   ${index + 1}. ${node.data.form_label} (${node.data.form_id})`);
      console.log(`      Groupes: ${node.data.form_groups?.join(', ')}\n`);
    });
    
    // 2. Test pour l'infirmier
    console.log('2️⃣ Test formulaire INFIRMIER...');
    const infirmierForm = await api.getFormForRole('RapportPatient', 'infirmier');
    if (infirmierForm) {
      console.log(`✓ Formulaire infirmier: ${infirmierForm.form_label} (${infirmierForm.form_id})`);
      console.log(`   Champs (${infirmierForm.form.length}):`);
      infirmierForm.form.forEach(field => {
        console.log(`   - ${field.field_label} (${field.field_type})`);
      });
      console.log('');
    } else {
      console.error('✗ Aucun formulaire trouvé pour l\'infirmier');
    }
    
    // 3. Test pour le médecin
    console.log('3️⃣ Test formulaire MÉDECIN...');
    const medecinForm = await api.getFormForRole('RapportPatient', 'medecin');
    if (medecinForm) {
      console.log(`✓ Formulaire médecin: ${medecinForm.form_label} (${medecinForm.form_id})`);
      console.log(`   Champs (${medecinForm.form.length}):`);
      medecinForm.form.forEach(field => {
        console.log(`   - ${field.field_label} (${field.field_type})`);
      });
      console.log('');
    } else {
      console.error('✗ Aucun formulaire trouvé pour le médecin');
    }
    
    // 4. Vérification
    console.log('4️⃣ Vérification...');
    if (infirmierForm?.form_id === medecinForm?.form_id) {
      console.error('❌ ERREUR: Les deux rôles ont le même formulaire!');
      console.error(`   Infirmier: ${infirmierForm.form_id}`);
      console.error(`   Médecin: ${medecinForm.form_id}`);
    } else {
      console.log('✅ SUCCÈS: Les formulaires sont différents!');
      console.log(`   Infirmier: ${infirmierForm?.form_id}`);
      console.log(`   Médecin: ${medecinForm?.form_id}`);
    }
    
    // 5. Vérification attendue
    console.log('\n5️⃣ Résultat attendu:');
    console.log('   Infirmier devrait avoir: Form_Patient1');
    console.log('   Médecin devrait avoir: Form_Patient2');
    
    const expectedInfirmier = infirmierForm?.form_id === 'Form_Patient1';
    const expectedMedecin = medecinForm?.form_id === 'Form_Patient2';
    
    if (expectedInfirmier && expectedMedecin) {
      console.log('\n🎉 TOUT EST CORRECT! 🎉');
    } else {
      console.error('\n⚠️ ATTENTION: Les formulaires ne correspondent pas à ce qui est attendu');
      if (!expectedInfirmier) {
        console.error(`   - Infirmier: attendu Form_Patient1, reçu ${infirmierForm?.form_id}`);
      }
      if (!expectedMedecin) {
        console.error(`   - Médecin: attendu Form_Patient2, reçu ${medecinForm?.form_id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ ERREUR lors du test:', error);
  }
}

// Auto-exécution si dans un environnement de test
if (typeof window !== 'undefined' && window.location) {
  console.log('Pour lancer le test, exécutez: testWorkflowForms()');
  (window as any).testWorkflowForms = testWorkflowForms;
}

export { testWorkflowForms };
