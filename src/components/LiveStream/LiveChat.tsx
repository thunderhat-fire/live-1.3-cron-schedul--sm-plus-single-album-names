'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useStream } from '@/contexts/StreamContext';

interface LiveChatProps {
  onSendMessage?: (message: string) => void;
}

const LiveChat: React.FC<LiveChatProps> = ({ onSendMessage }) => {
  const { data: session, status } = useSession();
  const { messages, addMessage, streamId } = useStream();
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user || !streamId) return;

    const message = {
      id: Math.random().toString(36).substr(2, 9), // Temporary ID
      streamId,
      content: newMessage.trim(),
      userId: session.user.id,
      username: session.user.name || 'Anonymous',
      timestamp: new Date().toISOString(),
    };

    addMessage(message);
    if (onSendMessage) onSendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-100 dark:bg-neutral-800 rounded-xl">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold">Live Chat</h3>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: '400px' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex items-start space-x-3"
          >
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
              {message.username[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{message.username}</span>
                <span className="text-xs text-neutral-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm mt-1">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      {status === 'loading' ? (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="animate-pulse flex justify-center">
            <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          </div>
        </div>
      ) : !session ? (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-primary-50 dark:bg-primary-900">
          <p className="text-sm text-center mb-2">Sign in to join the conversation</p>
          <button
            onClick={() => signIn()}
            className="block w-full px-4 py-2 text-center rounded-full bg-primary-500 text-white font-medium hover:bg-primary-600"
          >
            Sign In
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-neutral-200 dark:border-neutral-700"
        >
          <div className="flex space-x-2 items-stretch">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-1 text-sm rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="h-full px-6 rounded-full bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LiveChat; 