import { useState, useEffect, useRef } from 'react';
import { Phone, Mic, MicOff, Video, VideoOff, MessageCircle, Maximize2, Minimize2, Send, X } from 'lucide-react';

interface VisioModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  otherUserName: string;
  roomId: string;
  patientId?: string;
  nurseId?: string;
}

export function VisioModal({ isOpen, onClose, userName, otherUserName, roomId, patientId, nurseId }: VisioModalProps) {
  const [joined, setJoined] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [aloneCountdown, setAloneCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({});
  const remoteStreamsRef = useRef<{ [key: string]: MediaStream }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Serveur TURN de secours (relaie la vidéo quand une connexion directe est bloquée par le réseau)
      {
        urls: 'turn:global.relay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:global.relay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:global.relay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ]
  };

  useEffect(() => {
    if (isOpen && !joined) {
      initializeVisio();
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen]); 

  useEffect(() => {
    if (joined && localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      const p = localVideoRef.current.play && localVideoRef.current.play();
      if (p && p.catch) p.catch(err => console.warn('Video play failed:', err));
    }
  }, [joined]);

  const initializeVisio = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Initialiser WebSocket
      await initWebSocket();

      // Obtenir les flux média
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      });

      localStreamRef.current = stream;
      setJoined(true);
      setIsConnecting(false);
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de la visio:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'initialisation');
      setIsConnecting(false);
    }
  };

  const initWebSocket = () => {
    return new Promise<void>((resolve, reject) => {
      // Connexion directe au serveur WebSocket sur le port 8080
      // (évite les problèmes de proxy Vite avec les WebSockets)
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsHost = window.location.hostname;
      const wsUrl = import.meta.env.VITE_VISIO_WS_URL || `${wsProtocol}://${wsHost}:8080`;

      console.log('🔌 Tentative de connexion WebSocket à:', wsUrl);

      try {
        const ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          reject(new Error('Timeout de connexion WebSocket (5 secondes)'));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ Connecté au serveur WebSocket de signalisation');
          
          // Rejoindre la salle
          ws.send(JSON.stringify({
            type: 'join',
            roomId: roomId,
            username: userName,
            nurseId: nurseId
          }));

          // Notifier le patient d'un appel entrant (seulement si c'est l'infirmière qui initie)
          if (patientId && nurseId) {
            console.log('📞 Envoi de notification d\'appel au patient:', patientId);
            ws.send(JSON.stringify({
              type: 'incoming-call',
              from: userName,
              to: otherUserName,
              patientId: patientId,
              nurseId: nurseId,
              appointmentId: roomId,
              timestamp: Date.now()
            }));
          }

          resolve();
        };

        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          console.log('📨 Message WebSocket:', data.type);

          if (data.type === 'user-joined') {
            // Cancel alone countdown if someone joins
            setAloneCountdown(null);
            handleUserJoined(data, ws);
          } else if (data.type === 'user-left') {
            handleUserLeft(data);
          } else if (data.type === 'message') {
            if (data.username !== userName) {
              setMessages(prev => [...prev, { ...data, self: false }]);
            }
          } else if (data.type === 'call-accepted') {
            console.log('✅ Appel accepté par le patient');
          } else if (data.type === 'call-rejected') {
            console.log('❌ Appel refusé par le patient');
            setError('L\'appel a été refusé');
          } else if (data.type === 'offer' || data.type === 'answer' || data.type === 'ice-candidate') {
            await handleSignaling(data, ws);
          }
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ Erreur WebSocket:', error);
          reject(new Error('Impossible de connecter au serveur WebSocket sur le port 8080. Assurez-vous d\'avoir lancé "npm run dev"'));
        };

        ws.onclose = () => {
          clearTimeout(timeout);
          console.log('👋 Déconnecté du serveur WebSocket');
        };

        wsRef.current = ws;
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleUserJoined = async (data: any, ws: WebSocket) => {
    const newUserId = data.userId;

    if (newUserId !== userName) {
      setParticipants(prev => {
        if (!prev.find(p => p.id === newUserId)) {
          return [...prev, { id: newUserId, username: data.username }];
        }
        return prev;
      });

      // Seul le membre existant (shouldCreateOffer=true) crée l'offre
      // L'autre attend de recevoir l'offre pour éviter le "glare" WebRTC
      if (data.shouldCreateOffer) {
        setTimeout(async () => {
          const pc = createPeerConnection(newUserId, ws);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          ws.send(JSON.stringify({
            type: 'offer',
            offer: offer,
            from: userName,
            to: newUserId
          }));
        }, 500);
      }
    }
  };

  const handleUserLeft = (data: any) => {
    const leftUserId = data.userId || data.username;
    console.log('👋 Participant parti:', leftUserId, data);

    setParticipants(prev => {
      const remaining = prev.filter(p => p.id !== leftUserId);
      console.log('👥 Participants restants:', remaining.length, remaining);
      // If no participants left, start the alone countdown
      if (remaining.length === 0) {
        console.log('⏱️ Démarrage du compte à rebours (seul dans l\'appel)');
        setAloneCountdown(10);
      }
      return remaining;
    });

    if (peerConnectionsRef.current[leftUserId]) {
      peerConnectionsRef.current[leftUserId].close();
      delete peerConnectionsRef.current[leftUserId];
    }
  };

  // Countdown timer: when alone, count down from 10 then auto-leave
  useEffect(() => {
    if (aloneCountdown === null) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }
    if (aloneCountdown <= 0) {
      leaveRoom();
      return;
    }
    countdownRef.current = setInterval(() => {
      setAloneCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [aloneCountdown]);

  const handleSignaling = async (data: any, ws: WebSocket) => {
    const { from, type } = data;

    try {
      if (type === 'offer') {
        let pc = peerConnectionsRef.current[from];
        if (!pc) {
          pc = createPeerConnection(from, ws);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        ws.send(JSON.stringify({
          type: 'answer',
          answer: answer,
          to: from,
          from: userName
        }));
      } else if (type === 'answer') {
        const pc = peerConnectionsRef.current[from];
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else {
          console.warn(`⚠️ Answer ignorée de ${from} — état actuel: ${pc?.signalingState}`);
        }
      } else if (type === 'ice-candidate') {
        const pc = peerConnectionsRef.current[from];
        if (pc && data.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.warn('Erreur lors de l\'ajout du ICE candidate:', e);
          }
        }
      }
    } catch (err) {
      console.error('Erreur lors de la gestion du signaling:', err);
    }
  };

  const createPeerConnection = (peerId: string, ws: WebSocket) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[peerId] = pc;

    // Ajouter le flux local
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          pc.addTrack(track, localStreamRef.current);
        }
      });
    }

    // Gérer les flux distants
    pc.ontrack = (event) => {
      console.log('Track reçu:', event.track.kind);
      const stream = event.streams[0];
      remoteStreamsRef.current[peerId] = stream;

      if (remoteVideosRef.current[peerId]) {
        remoteVideosRef.current[peerId].srcObject = stream;
      }
    };

    // Envoyer les ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          to: peerId,
          from: userName
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('État de la connexion peer:', pc.connectionState);
    };

    return pc;
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setVideoEnabled(!videoEnabled);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setAudioEnabled(!audioEnabled);
  };

  const sendMessage = () => {
    if (messageInput.trim()) {
      const timestamp = new Date().toLocaleTimeString();
      setMessages(prev => [...prev, { username: userName, text: messageInput, self: true, timestamp }]);

      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          username: userName,
          text: messageInput,
          timestamp: timestamp,
          roomId: roomId
        }));
      }

      setMessageInput('');
    }
  };

  const leaveRoom = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    if (wsRef.current) {
      wsRef.current.close();
    }
    setJoined(false);
    onClose();
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current && showChat) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  // Track unread messages
  useEffect(() => {
    if (!showChat && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg.self) {
        setUnreadMessages(prev => prev + 1);
      }
    }
  }, [messages]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#111',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        backgroundColor: '#1a1a2e',
        borderBottom: '1px solid #333',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: joined ? '#22c55e' : '#ef4444',
          }} />
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
            Visio avec {otherUserName}
          </span>
          {joined && (
            <span style={{ color: '#999', fontSize: 13 }}>
              • {participants.length + 1} participant{participants.length > 0 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 8,
              padding: 8,
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={leaveRoom}
            style={{
              background: '#ef4444',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <X size={16} />
            Quitter
          </button>
        </div>
      </div>

      {/* Main content */}
      {error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 32,
            maxWidth: 420,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>⚠️ Erreur de connexion</p>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{error}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => { setError(null); initializeVisio(); }}
                style={{
                  backgroundColor: '#3b82f6', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600,
                }}
              >
                🔄 Réessayer
              </button>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#e5e7eb', color: '#333', border: 'none',
                  borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : isConnecting ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{
              width: 48, height: 48, border: '3px solid #555', borderTopColor: '#3b82f6',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ fontSize: 16 }}>Connexion en cours...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      ) : joined ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Video area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Videos grid */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: participants.length > 0 ? '1fr 1fr' : '1fr',
              gap: 4,
              padding: 4,
            }}>
              {/* Local video */}
              <div style={{
                position: 'relative',
                backgroundColor: '#000',
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  fontSize: 13,
                  padding: '4px 10px',
                  borderRadius: 6,
                }}>
                  {userName} (Vous)
                </div>
                {!videoEnabled && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundColor: '#1a1a2e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <VideoOff size={48} color="#666" />
                  </div>
                )}
              </div>

              {/* Remote video */}
              {participants.length > 0 ? (
                <div style={{
                  position: 'relative',
                  backgroundColor: '#000',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}>
                  <video
                    ref={el => {
                      if (el && participants[0]) {
                        remoteVideosRef.current[participants[0].id] = el;
                        if (remoteStreamsRef.current[participants[0].id]) {
                          el.srcObject = remoteStreamsRef.current[participants[0].id];
                        }
                      }
                    }}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    fontSize: 13,
                    padding: '4px 10px',
                    borderRadius: 6,
                  }}>
                    {participants[0]?.username || otherUserName}
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#1a1a2e',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    backgroundColor: '#333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Phone size={28} color="#888" />
                  </div>
                  <p style={{ color: '#888', fontSize: 14 }}>En attente de {otherUserName}...</p>
                </div>
              )}
            </div>

            {/* Bottom controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: '16px 0',
              backgroundColor: '#1a1a2e',
            }}>
              {/* Mic */}
              <button
                onClick={toggleAudio}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  backgroundColor: audioEnabled ? '#333' : '#ef4444',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', transition: 'background 0.2s',
                }}
                title={audioEnabled ? 'Couper le micro' : 'Activer le micro'}
              >
                {audioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
              </button>

              {/* Camera */}
              <button
                onClick={toggleVideo}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  backgroundColor: videoEnabled ? '#333' : '#ef4444',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', transition: 'background 0.2s',
                }}
                title={videoEnabled ? 'Couper la caméra' : 'Activer la caméra'}
              >
                {videoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
              </button>

              {/* Chat toggle */}
              <button
                onClick={() => { setShowChat(!showChat); setUnreadMessages(0); }}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  backgroundColor: showChat ? '#3b82f6' : '#333',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', position: 'relative', transition: 'background 0.2s',
                }}
                title="Chat"
              >
                <MessageCircle size={22} />
                {unreadMessages > 0 && !showChat && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    backgroundColor: '#ef4444', color: '#fff',
                    fontSize: 11, fontWeight: 700,
                    width: 20, height: 20, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {unreadMessages}
                  </span>
                )}
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  backgroundColor: '#333',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', transition: 'background 0.2s',
                }}
                title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
              >
                {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
              </button>

              {/* Hang up */}
              <button
                onClick={leaveRoom}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', transition: 'background 0.2s',
                }}
                title="Raccrocher"
              >
                <Phone size={22} style={{ transform: 'rotate(135deg)' }} />
              </button>
            </div>
          </div>

          {/* Chat panel */}
          {showChat && (
            <div style={{
              width: 360,
              backgroundColor: '#1e1e2f',
              borderLeft: '1px solid #333',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Chat header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>💬 Chat</span>
                <button
                  onClick={() => setShowChat(false)}
                  style={{
                    background: 'none', border: 'none', color: '#888',
                    cursor: 'pointer', padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                {messages.length === 0 && (
                  <p style={{ color: '#666', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                    Aucun message. Commencez la conversation !
                  </p>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: msg.self ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: msg.self ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      backgroundColor: msg.self ? '#3b82f6' : '#2d2d44',
                      color: '#fff',
                    }}>
                      {!msg.self && (
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc', marginBottom: 4 }}>
                          {msg.username}
                        </p>
                      )}
                      <p style={{ fontSize: 14, margin: 0, lineHeight: 1.4 }}>{msg.text}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' }}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: 12,
                borderTop: '1px solid #333',
                display: 'flex',
                gap: 8,
              }}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Votre message..."
                  style={{
                    flex: 1,
                    backgroundColor: '#2d2d44',
                    border: '1px solid #444',
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={sendMessage}
                  style={{
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Alone in call overlay */}
          {aloneCountdown !== null && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}>
              <div style={{
                backgroundColor: '#1e1e2f',
                borderRadius: 16,
                padding: '36px 48px',
                textAlign: 'center',
                border: '1px solid #333',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                maxWidth: 400,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <Phone size={28} style={{ color: '#ef4444', transform: 'rotate(135deg)' }} />
                </div>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  Vous êtes seul.e dans l'appel
                </p>
                <p style={{ color: '#aaa', fontSize: 14, marginBottom: 24 }}>
                  L'autre participant a quitté la conversation
                </p>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  border: '3px solid #ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                  fontSize: 32, fontWeight: 700, color: '#ef4444',
                }}>
                  {aloneCountdown}
                </div>
                <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
                  Déconnexion automatique dans {aloneCountdown} seconde{aloneCountdown > 1 ? 's' : ''}
                </p>
                <button
                  onClick={leaveRoom}
                  style={{
                    backgroundColor: '#ef4444', color: '#fff', border: 'none',
                    borderRadius: 10, padding: '10px 28px', fontSize: 15,
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Quitter maintenant
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <p style={{ fontSize: 16, marginBottom: 16 }}>Prêt à démarrer la visio ?</p>
            <button
              onClick={initializeVisio}
              style={{
                backgroundColor: '#3b82f6', color: '#fff', border: 'none',
                borderRadius: 10, padding: '12px 28px', fontSize: 16,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Démarrer la visio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
