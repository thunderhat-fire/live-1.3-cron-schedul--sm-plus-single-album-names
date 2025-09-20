'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useStream } from '@/contexts/StreamContext';
import type { StreamMessage } from '@/types/stream';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
}

const LiveStreamChat: React.FC = () => {
  const { data: session } = useSession();
  const { addMessage } = useStream();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !session?.user) return;
    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: session.user.name || 'Anonymous',
      timestamp: new Date(),
    };
    setMessages([...messages, message]);
    setNewMessage('');

    const streamMessage: StreamMessage = {
      id: Math.random().toString(36).substr(2, 9),
      streamId: 'local',
      userId: session.user.id,
      username: session.user.name || 'Anonymous',
      content: newMessage,
      timestamp: message.timestamp.toISOString(),
    };

    addMessage(streamMessage);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-2">
            <span className="font-semibold">{message.sender}: </span>
            <span>{message.text}</span>
            <span className="text-xs text-gray-500 ml-2">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default LiveStreamChat; 