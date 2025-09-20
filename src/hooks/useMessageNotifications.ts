import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  fromUser: {
    name: string;
    image: string;
  };
}

export const useMessageNotifications = () => {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const previousUnreadCount = useRef(0);
  const previousMessages = useRef<Message[]>([]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages?unreadOnly=true');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newUnreadCount = data.unreadCount;
          const newMessages = data.messages;
          
          // Check if we have new messages
          if (newUnreadCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
            setHasNewMessages(true);
            // Clear the new message indicator after 3 seconds
            setTimeout(() => setHasNewMessages(false), 3000);
            
            // Show toast notification for new messages
            const newMessageCount = newUnreadCount - previousUnreadCount.current;
            if (newMessageCount === 1) {
              const latestMessage = newMessages[0];
              toast.success(`New message from ${latestMessage.fromUser.name}`, {
                duration: 4000,
                icon: '💬',
              });
            } else {
              toast.success(`${newMessageCount} new messages`, {
                duration: 4000,
                icon: '💬',
              });
            }
          }
          
          setMessages(newMessages);
          setUnreadCount(newUnreadCount);
          previousUnreadCount.current = newUnreadCount;
          previousMessages.current = newMessages;
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchMessages();
      
      // Poll for new messages every 15 seconds for more responsive updates
      const interval = setInterval(fetchMessages, 15000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update local state
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        previousUnreadCount.current = Math.max(0, previousUnreadCount.current - 1);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return {
    unreadCount,
    messages,
    loading,
    hasNewMessages,
    refetch: fetchMessages,
    markAsRead,
  };
}; 