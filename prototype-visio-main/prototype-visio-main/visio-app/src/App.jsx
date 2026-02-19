import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function VisioApp() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [participants, setParticipants] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const remoteStreamsRef = useRef({});   // stocke les streams avant que le DOM soit prêt
  const localStreamRef = useRef(null);
  const wsRef = useRef(null);
  const peerConnectionsRef = useRef({});

  const turnHost = window.location.hostname;
  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: `turn:${turnHost}:3478`,
        username: 'admin',
        credential: 'password',
      },
    ]
  };

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      console.log('useEffect(joined): attaching local stream to video', { joined, hasStream: !!localStreamRef.current, hasVideoEl: !!localVideoRef.current });
      localVideoRef.current.srcObject = localStreamRef.current;
      const p = localVideoRef.current.play && localVideoRef.current.play();
      if (p && p.catch) p.catch(err => console.warn('Video play failed in effect:', err));
    }
  }, [joined]);

  const initWebSocket = () => {
    return new Promise((resolve, reject) => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        console.log('Connecté au serveur WebSocket');
        resolve(ws);
      };

      ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('Message reçu:', data.type, data);
      
      if (data.type === 'user-joined') {
        const newUserId = data.userId;
        
        setParticipants(prev => {
          if (!prev.find(p => p.id === newUserId) && newUserId !== username) {
            console.log('Nouvel utilisateur:', data.username);
            
            // Créer une connexion peer et envoyer une offre
            setTimeout(async () => {
              const pc = createPeerConnection(newUserId);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              
              ws.send(JSON.stringify({
                type: 'offer',
                offer: offer,
                from: username,
                to: newUserId
              }));
              console.log('Offre envoyée à', newUserId);
            }, 1000);
            
            return [...prev, { id: newUserId, username: data.username }];
          }
          return prev;
        });
      } 
      else if (data.type === 'user-left') {
        setParticipants(prev => prev.filter(p => p.username !== data.username));
        
        // Fermer la connexion peer
        if (peerConnectionsRef.current[data.username]) {
          peerConnectionsRef.current[data.username].close();
          delete peerConnectionsRef.current[data.username];
        }
      }
      else if (data.type === 'message') {
        // Ne pas afficher nos propres messages (déjà ajoutés localement)
        if (data.username !== username) {
          setMessages(prev => [...prev, { ...data, self: false }]);
        }
      } 
      else if (data.type === 'offer' || data.type === 'answer' || data.type === 'ice-candidate') {
        await handleSignaling(data);
      }
    };
    
      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        // If the websocket hasn't opened yet, reject the init promise
        // Note: after resolve, rejecting has no effect, so this is safe.
        reject(error);
      };

      ws.onclose = () => {
        console.log('Déconnecté du serveur');
      };

      wsRef.current = ws;
    });
  };

  const handleSignaling = async (data) => {
    const { from, type } = data;
    console.log('Signaling reçu:', type, 'de', from);
    
    try {
      if (type === 'offer') {
        let pc = peerConnectionsRef.current[from];
        if (!pc) {
          pc = createPeerConnection(from);
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        wsRef.current.send(JSON.stringify({
          type: 'answer',
          answer: answer,
          to: from,
          from: username
        }));
        console.log('Réponse envoyée à', from);
      } 
      else if (type === 'answer') {
        const pc = peerConnectionsRef.current[from];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('Réponse reçue de', from);
        }
      } 
      else if (type === 'ice-candidate') {
        const pc = peerConnectionsRef.current[from];
        if (pc && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('ICE candidate ajouté de', from);
        }
      }
    } catch (error) {
      console.error('Erreur signaling:', error);
    }
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (err) {
      console.error('Erreur accès média:', err);
      alert('Impossible d\'accéder à la caméra/micro. Vérifiez les permissions.');
      return null;
    }
  };

  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          to: userId,
          from: username
        }));
      }
    };
    
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      remoteStreamsRef.current[userId] = stream;  // stocké même si le DOM n'est pas prêt
      const remoteVideo = remoteVideosRef.current[userId];
      if (remoteVideo) {
        remoteVideo.srcObject = stream;
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
    };
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }
    
    peerConnectionsRef.current[userId] = pc;
    return pc;
  };

  const joinRoom = async () => {
    if (!roomId.trim() || !username.trim()) {
      alert('Veuillez entrer un nom de salle et un nom d\'utilisateur');
      return;
    }

    const stream = await startLocalStream();
    if (!stream) return;

    // Wait for the websocket to be connected before sending the join message
    let ws;
    try {
      ws = await initWebSocket();
    } catch (err) {
      console.error('Impossible de se connecter au serveur WebSocket:', err);
      alert('Impossible de se connecter au serveur de visioconférence. Vérifiez que le serveur est démarré.');
      return;
    }

    ws.send(JSON.stringify({
      type: 'join',
      roomId,
      username
    }));

    setJoined(true);
    setParticipants([{ id: 'me', username }]);
  };

  const leaveRoom = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'leave', roomId }));
      wsRef.current.close();
    }
    
    setJoined(false);
    setParticipants([]);
    setMessages([]);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    const msg = {
      type: 'message',
      username,
      text: messageInput,
      timestamp: new Date().toLocaleTimeString()
    };
    
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify(msg));
    }
    
    setMessages(prev => [...prev, { ...msg, self: true }]);
    setMessageInput('');
  };

  if (!joined) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="video-icon">📹</div>
            <h1>Visio WebRTC</h1>
            <p>Rejoignez ou créez une salle</p>
          </div>
          
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
          
          <div className="form-group">
            <label>ID de la salle</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="ex: reunion-123"
            />
          </div>
          
          <button className="btn-primary" onClick={joinRoom}>
            Rejoindre la salle
          </button>
          
        </div>
      </div>
    );
  }

  const totalVideos = participants.length; // inclut "me"
  const cols = totalVideos <= 1 ? 1 : totalVideos <= 4 ? 2 : totalVideos <= 9 ? 3 : 4;
  const gridStyle = {
    gridTemplateColumns: totalVideos === 1 ? 'minmax(auto, 720px)' : `repeat(${cols}, 1fr)`,
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="videos-grid" style={gridStyle}>
          <div className="video-wrapper">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
              />
            <div className="video-label">
              <span>{username} (Vous)</span>
            </div>
            {!videoEnabled && (
              <div className="video-disabled">
                <span>📹</span>
              </div>
            )}
          </div>
          
          {participants.filter(p => p.id !== 'me').map(participant => (
            <div key={participant.id} className="video-wrapper">
              <video
                ref={el => {
                  remoteVideosRef.current[participant.id] = el;
                  if (el && remoteStreamsRef.current[participant.id]) {
                    el.srcObject = remoteStreamsRef.current[participant.id];
                  }
                }}
                autoPlay
                playsInline
                className="video-element"
              />
              <div className="video-label">
                <span>{participant.username}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="controls-bar">
          <button
            onClick={toggleVideo}
            className={`control-btn ${!videoEnabled ? 'btn-danger' : ''}`}
          >
            {videoEnabled ? '📹' : '🚫📹'}
          </button>
          
          <button
            onClick={toggleAudio}
            className={`control-btn ${!audioEnabled ? 'btn-danger' : ''}`}
          >
            {audioEnabled ? '🎤' : '🚫🎤'}
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className="control-btn"
          >
            💬 {messages.length > 0 && <span className="badge">{messages.length}</span>}
          </button>
          
          <button onClick={leaveRoom} className="control-btn btn-danger">
            📞
          </button>
        </div>
      </div>
      
      {showChat && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>💬 Chat</h3>
            <div className="participants-count">
              👥 {participants.length}
            </div>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.self ? 'message-self' : 'message-other'}`}>
                <div className="message-bubble">
                  <p className="message-username">{msg.username}</p>
                  <p className="message-text">{msg.text}</p>
                  <p className="message-time">{msg.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Tapez un message..."
            />
            <button onClick={sendMessage}>Envoyer</button>
          </div>
        </div>
      )}
    </div>
  );
}