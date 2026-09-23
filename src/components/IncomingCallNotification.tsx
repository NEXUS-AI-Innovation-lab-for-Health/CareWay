import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Phone, PhoneOff, User } from 'lucide-react';

export interface IncomingCall {
  id: string;
  from: string;
  fromUserId: string;
  nurseName: string;
  appointmentId: string;
  timestamp: number;
}

interface IncomingCallNotificationProps {
  call: IncomingCall;
  onAccept: (call: IncomingCall) => void;
  onReject: (call: IncomingCall) => void;
}

export function IncomingCallNotification({ call, onAccept, onReject }: IncomingCallNotificationProps) {
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRinging(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      backgroundColor: 'rgba(0,0,0,0.4)',
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 32,
        width: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center' as const,
        transform: isRinging ? 'scale(1)' : 'scale(0.97)',
        transition: 'transform 0.3s ease',
      }}>
        {/* Avatar */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Phone style={{ width: 36, height: 36, color: '#fff' }} />
        </div>

        {/* Caller info */}
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>
          {call.nurseName}
        </h2>
        <p style={{ fontSize: 15, color: '#666', margin: '0 0 24px' }}>
          Appel visio entrant...
        </p>

        {/* Ringing dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6',
            opacity: isRinging ? 1 : 0.3, transition: 'opacity 0.3s',
            display: 'inline-block',
          }} />
          <span style={{
            width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6',
            opacity: isRinging ? 0.3 : 1, transition: 'opacity 0.3s',
            display: 'inline-block',
          }} />
          <span style={{
            width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6',
            opacity: 0.3, display: 'inline-block',
          }} />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={() => { console.log('❌ REJECT', call); onReject(call); }}
            style={{
              flex: 1,
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 16px',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <PhoneOff style={{ width: 20, height: 20 }} />
            Refuser
          </button>

          <button
            onClick={() => { console.log('✅ ACCEPT', call); onAccept(call); }}
            style={{
              flex: 1,
              backgroundColor: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 16px',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Phone style={{ width: 20, height: 20 }} />
            Répondre
          </button>
        </div>
      </div>
    </div>
  );
}
