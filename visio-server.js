const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = {};
const clients = {}; // Stocker les clients par leur ID utilisateur

wss.on('connection', (ws) => {
  console.log('✅ Nouvelle connexion WebSocket');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Message reçu:', data.type, 'de', data.username || data.from);
      
      if (data.type === 'join') {
        ws.roomId = data.roomId;
        ws.username = data.username;
        ws.userId = data.username;
        ws.patientId = data.patientId;
        ws.nurseId = data.nurseId;
        
        // Stocker le client par patientId et nurseId pour les appels entrants
        if (data.patientId) {
          clients[data.patientId] = ws;
          console.log(`👤 Patient ${data.patientId} connecté`);
          console.log(`📋 Clients registry:`, Object.keys(clients));
        }
        if (data.nurseId) {
          clients[data.nurseId] = ws;
          console.log(`👨‍⚕️ Infirmière ${data.nurseId} connectée`);
          console.log(`📋 Clients registry:`, Object.keys(clients));
        }
        
        if (!rooms[data.roomId]) {
          rooms[data.roomId] = [];
        }
        
        rooms[data.roomId].push(ws);
        
        console.log(`👤 ${data.username} a rejoint la salle ${data.roomId}`);
        console.log(`👥 Participants: ${rooms[data.roomId].length}`);
        
        // Notifier les autres participants
        rooms[data.roomId].forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            // Dire au membre existant qu'un nouveau est arrivé → il doit initier l'offre
            client.send(JSON.stringify({
              type: 'user-joined',
              username: data.username,
              userId: data.username,
              shouldCreateOffer: true
            }));
            
            // Dire au nouveau qui est déjà là → il attend l'offre, pas besoin d'en créer
            ws.send(JSON.stringify({
              type: 'user-joined',
              username: client.username,
              userId: client.username,
              shouldCreateOffer: false
            }));
          }
        });
      }
      
      else if (data.type === 'incoming-call') {
        console.log(`📞 Appel entrant de ${data.from} (nurseId: ${data.nurseId}) vers patient ${data.patientId}`);
        console.log(`📋 Cherchant le patient dans registry:`, Object.keys(clients));
        
        // Chercher le patient par son ID
        const patientWs = clients[data.patientId];
        
        if (patientWs) {
          console.log(`✅ Patient trouvé, état WebSocket:`, patientWs.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED');
        } else {
          console.log(`❌ Patient ${data.patientId} NON TROUVÉ dans la registry`);
        }
        
        if (patientWs && patientWs.readyState === WebSocket.OPEN) {
          console.log(`✅ Notification d'appel envoyée au patient ${data.patientId}`);
          const messageToSend = {
            type: 'incoming-call',
            from: data.from,
            to: data.to,
            patientId: data.patientId,
            nurseId: data.nurseId,
            appointmentId: data.appointmentId,
            timestamp: data.timestamp
          };
          console.log(`📨 Message envoyé:`, messageToSend);
          patientWs.send(JSON.stringify(messageToSend));
        } else {
          console.log(`⚠️ Patient ${data.patientId} non connecté ou indisponible`);
        }
      }
      
      else if (data.type === 'offer') {
        console.log(`📤 Offre WebRTC de ${data.from} vers ${data.to}`);
        rooms[ws.roomId]?.forEach(client => {
          if (client.username === data.to && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'offer',
              offer: data.offer,
              from: data.from
            }));
          }
        });
      }
      
      else if (data.type === 'answer') {
        console.log(`📥 Réponse WebRTC de ${data.from} vers ${data.to}`);
        rooms[ws.roomId]?.forEach(client => {
          if (client.username === data.to && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'answer',
              answer: data.answer,
              from: data.from
            }));
          }
        });
      }
      
      else if (data.type === 'ice-candidate') {
        console.log(`🧊 ICE candidate de ${data.from} vers ${data.to}`);
        rooms[ws.roomId]?.forEach(client => {
          if (client.username === data.to && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'ice-candidate',
              candidate: data.candidate,
              from: data.from
            }));
          }
        });
      }
      
      else if (data.type === 'message') {
        console.log(`💬 Chat de ${data.username}: ${data.text}`);
        if (ws.roomId && rooms[ws.roomId]) {
          rooms[ws.roomId].forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'message',
                username: data.username,
                text: data.text,
                timestamp: data.timestamp
              }));
            }
          });
        }
      }
      
      else if (data.type === 'call-accepted') {
        console.log(`✅ Appel accepté par le patient ${data.patientId} pour l'infirmière ${data.to}`);
        
        // Envoyer une notification à l'infirmière que l'appel a été accepté
        const nurseWs = clients[data.to];
        if (nurseWs && nurseWs.readyState === WebSocket.OPEN) {
          nurseWs.send(JSON.stringify({
            type: 'call-accepted',
            appointmentId: data.appointmentId,
            from: data.patientId,
            timestamp: new Date().toISOString()
          }));
        } else {
          console.log(`⚠️ Infirmière ${data.to} non connectée`);
        }
      }
      
      else if (data.type === 'call-rejected') {
        console.log(`❌ Appel refusé par le patient ${data.patientId} pour l'infirmière ${data.to}`);
        
        // Envoyer une notification à l'infirmière que l'appel a été refusé
        const nurseWs = clients[data.to];
        if (nurseWs && nurseWs.readyState === WebSocket.OPEN) {
          nurseWs.send(JSON.stringify({
            type: 'call-rejected',
            appointmentId: data.appointmentId,
            from: data.patientId,
            timestamp: new Date().toISOString()
          }));
        } else {
          console.log(`⚠️ Infirmière ${data.to} non connectée`);
        }
      }
      
      else if (data.type === 'leave') {
        handleLeave(ws);
      }
      
    } catch (error) {
      console.error('❌ Erreur parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    handleLeave(ws);
  });
  
  ws.on('error', (error) => {
    console.error('❌ Erreur WebSocket:', error);
  });
});

function handleLeave(ws) {
  if (ws.roomId && rooms[ws.roomId]) {
    rooms[ws.roomId] = rooms[ws.roomId].filter(client => client !== ws);
    
    rooms[ws.roomId].forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'user-left',
          username: ws.username,
          userId: ws.userId
        }));
      }
    });
    
    console.log(`👋 ${ws.username} a quitté la salle ${ws.roomId}`);
    console.log(`👥 Participants restants: ${rooms[ws.roomId].length}`);
    
    if (rooms[ws.roomId].length === 0) {
      delete rooms[ws.roomId];
      console.log(`🗑️  Salle ${ws.roomId} supprimée`);
    }
  }
  
  // Supprimer du registre des clients
  if (ws.patientId) {
    delete clients[ws.patientId];
  }
  if (ws.nurseId) {
    delete clients[ws.nurseId];
  }
}

console.log('🚀 Serveur WebSocket de signalisation démarré');
console.log('📡 Port 8080 - En attente de connexions...');
