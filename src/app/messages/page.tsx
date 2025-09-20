'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Avatar from '@/shared/Avatar/Avatar';
import { formatDistanceToNow } from 'date-fns';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  fromUserId: string;
  toUserId: string;
  fromUser: {
    id: string;
    name: string;
    image: string;
  };
  toUser: {
    id: string;
    name: string;
    image: string;
  };
}

interface Conversation {
  userId: string;
  userName: string;
  userImage: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

const MessagesPage = () => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages);
          
          // Group messages by conversation
          const conversationsMap = data.messages.reduce((acc: { [key: string]: Conversation }, message: Message) => {
            const otherUser = message.fromUser.id === session.user?.id ? message.toUser : message.fromUser;
            
            if (!acc[otherUser.id]) {
              acc[otherUser.id] = {
                userId: otherUser.id,
                userName: otherUser.name,
                userImage: otherUser.image,
                lastMessage: message.content,
                lastMessageDate: message.createdAt,
                unreadCount: (!message.read && message.toUserId === session.user.id) ? 1 : 0
              };
            } else {
              if (!message.read && message.toUserId === session.user.id) {
                acc[otherUser.id].unreadCount++;
              }
              // Update last message if this one is more recent
              if (new Date(message.createdAt) > new Date(acc[otherUser.id].lastMessageDate)) {
                acc[otherUser.id].lastMessage = message.content;
                acc[otherUser.id].lastMessageDate = message.createdAt;
              }
            }
            return acc;
          }, {});

          setConversations(Object.values(conversationsMap));
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user) {
      fetchMessages();
      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const markMessagesAsRead = async (messages: Message[]) => {
    const unreadMessages = messages.filter(m => !m.read && m.toUserId === session?.user?.id);
    
    for (const message of unreadMessages) {
      try {
        await fetch(`/api/messages/${message.id}/read`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
    
    if (unreadMessages.length > 0) {
      fetchMessages(); // Refresh messages to update read status
    }
  };

  const handleConversationSelect = async (userId: string) => {
    setSelectedConversation(userId);
    
    // Mark messages from this user as read
    const conversationMessages = messages.filter(
      message =>
        (message.fromUser.id === userId && message.toUser.id === session?.user?.id) ||
        (message.toUser.id === userId && message.fromUser.id === session?.user?.id)
    );
    
    await markMessagesAsRead(conversationMessages);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          toUserId: selectedConversation,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages(); // Refresh messages
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!session) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-semibold">Please log in to view your messages</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-16 text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-neutral-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <div className="flex rounded-2xl overflow-hidden border dark:border-neutral-700">
        {/* Conversations List */}
        <div className="w-1/3 border-r dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
          <div className="p-4 border-b dark:border-neutral-700">
            <h2 className="text-xl font-semibold">Messages</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-300px)]">
            {conversations.map((conversation) => (
              <div
                key={conversation.userId}
                className={`p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-200 ${
                  selectedConversation === conversation.userId ? 'bg-neutral-200 dark:bg-neutral-600' : ''
                } ${
                  conversation.unreadCount > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleConversationSelect(conversation.userId)}
              >
                <div className="flex items-center space-x-4">
                  <Avatar imgUrl={conversation.userImage} sizeClass="w-12 h-12" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate ${
                        conversation.unreadCount > 0 ? 'font-semibold text-blue-600 dark:text-blue-400' : ''
                      }`}>
                        {conversation.userName}
                      </p>
                      <span className="text-xs text-neutral-500">
                        {formatDistanceToNow(new Date(conversation.lastMessageDate), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${
                      conversation.unreadCount > 0 ? 'font-medium text-neutral-700 dark:text-neutral-300' : 'text-neutral-500'
                    }`}>
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-green-500 text-white text-xs font-semibold rounded-full px-2 py-1 animate-pulse">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages View */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-400px)]">
                {messages
                  .filter(
                    (message) =>
                      (message.fromUser.id === selectedConversation && message.toUser.id === session.user?.id) ||
                      (message.toUser.id === selectedConversation && message.fromUser.id === session.user?.id)
                  )
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.fromUser.id === session.user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.fromUser.id === session.user?.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-700'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-neutral-700">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2"
                    disabled={sending}
                  />
                  <ButtonPrimary 
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </ButtonPrimary>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-center px-4">
              Select a conversation to start messaging, or to start a conversation with a fellow author - click the chat icon on their author profile page
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage; 