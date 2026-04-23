'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import RouteGuard from '@/app/components/RouteGuard';
import { getConversations, getMessages, markMessagesRead } from '@/app/lib/api';
import { useSocket } from '@/app/hooks/useSocket';

export default function MessagesPage() {
  return (
    <RouteGuard>
      <MessagesContent />
    </RouteGuard>
  );
}

function MessagesContent() {
  const { user } = useAuth();
  const { socket } = useSocket(user?._id);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (msg.senderId === selectedUserId || msg.receiverId === selectedUserId) {
        setMessages((prev) => [...prev, msg]);
      }
      loadConversations();
    };

    const handleTyping = (senderId: string) => {
      if (senderId === selectedUserId) {
        setTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTyping(false), 2000);
      }
    };

    const handleStoppedTyping = (senderId: string) => {
      if (senderId === selectedUserId) {
        setTyping(false);
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleTyping);
    socket.on('user-stopped-typing', handleStoppedTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleTyping);
      socket.off('user-stopped-typing', handleStoppedTyping);
    };
  }, [socket, selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: any) => {
    setSelectedUserId(conv.userId);
    setSelectedUser(conv);
    try {
      const msgs = await getMessages(conv.userId);
      setMessages(msgs || []);
      await markMessagesRead(conv.userId);
      loadConversations();
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !selectedUserId) return;
    socket.emit('send-message', { receiverId: selectedUserId, content: newMessage });
    setMessages((prev) => [
      ...prev,
      { senderId: user?._id, receiverId: selectedUserId, content: newMessage, createdAt: new Date().toISOString() },
    ]);
    setNewMessage('');
    socket.emit('stop-typing', selectedUserId);
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (socket && selectedUserId) {
      socket.emit('typing', selectedUserId);
    }
  };

  return (
    <main style={{ paddingTop: 80, height: '100vh', display: 'flex' }}>
      <div
        style={{
          width: 320,
          minWidth: 320,
          borderRight: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Messages</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</p>
          ) : conversations.length === 0 ? (
            <p style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No conversations yet.</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.userId}
                onClick={() => selectConversation(conv)}
                style={{
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: selectedUserId === conv.userId ? 'var(--surface-light)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={conv.photos?.[0]?.url || '/logos/top-left-logo-for-website/CamConnect.png'}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{conv.username}</span>
                      {conv.unreadCount > 0 && (
                        <span
                          style={{
                            background: 'var(--primary-color)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: 10,
                          }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {conv.lastMessage || 'No messages'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#12121a' }}>
        {selectedUserId ? (
          <>
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <img
                src={selectedUser?.photos?.[0]?.url || '/logos/top-left-logo-for-website/CamConnect.png'}
                alt=""
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedUser?.username}</div>
                <div style={{ fontSize: '0.75rem', color: selectedUser?.isOnline ? 'var(--secondary-color)' : 'var(--text-secondary)' }}>
                  {selectedUser?.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user?._id;
                return (
                  <div
                    key={i}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '60%',
                      background: isMe ? 'var(--primary-color)' : 'var(--surface)',
                      color: isMe ? '#fff' : 'var(--text-primary)',
                      padding: '0.75rem 1rem',
                      borderRadius: 12,
                      borderBottomRightRadius: isMe ? 4 : 12,
                      borderBottomLeftRadius: isMe ? 12 : 4,
                    }}
                  >
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{msg.content}</p>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: 'var(--surface)',
                    padding: '0.75rem 1rem',
                    borderRadius: 12,
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                  }}
                >
                  typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: 'var(--surface-light)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                }}
              />
              <button className="btn btn-primary" onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </main>
  );
}
