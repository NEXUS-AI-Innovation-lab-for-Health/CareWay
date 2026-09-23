const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = {};

wss.on('connection', (ws) => {
  console.log('Nouvelle connexion');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Message reçu:', data.type, 'de', data.username || data.from);
      
      if (data.type === 'join') {
        ws.roomId = data.roomId;
        ws.username = data.username;
        ws.userId = data.username; 
        
        if (!rooms[data.roomId]) {
          rooms[data.roomId] = [];
        }
        
        rooms[data.roomId].push(ws);
        
        console.log(`${data.username} a rejoint ${data.roomId}`);
        console.log(`Participants dans ${data.roomId}:`, rooms[data.roomId].length);
        
        rooms[data.roomId].forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'user-joined',
              username: data.username,
              userId: data.username
            }));
            
            ws.send(JSON.stringify({
              type: 'user-joined',
              username: client.username,
              userId: client.username
            }));
          }
        });
      }
      
      else if (data.type === 'offer') {
        console.log(`Offre de ${data.from} pour ${data.to}`);
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
        console.log(`Réponse de ${data.from} pour ${data.to}`);
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
        console.log(`Message de ${data.username}: ${data.text}`);
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
      
      else if (data.type === 'leave') {
        handleLeave(ws);
      }
      
    } catch (error) {
      console.error('Erreur parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    handleLeave(ws);
  });
  
  ws.on('error', (error) => {
    console.error('Erreur WebSocket:', error);
  });
});

function handleLeave(ws) {
  if (ws.roomId && rooms[ws.roomId]) {
    rooms[ws.roomId] = rooms[ws.roomId].filter(client => client !== ws);
    
    rooms[ws.roomId].forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'user-left',
          username: ws.username
        }));
      }
    });
    
    console.log(`${ws.username} a quitté ${ws.roomId}`);
    console.log(`Participants restants dans ${ws.roomId}:`, rooms[ws.roomId].length);
    
    if (rooms[ws.roomId].length === 0) {
      delete rooms[ws.roomId];
      console.log(`Salle ${ws.roomId} supprimée`);
    }
  }
}

console.log('Serveur WebSocket démarré sur le port 8080');
console.log('En attente de connexions...');