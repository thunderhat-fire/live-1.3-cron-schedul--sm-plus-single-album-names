'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface StreamEmailNotificationProps {
  streamId: string;
  authorName: string;
  streamTitle?: string;
}

const StreamEmailNotification: React.FC<StreamEmailNotificationProps> = ({
  streamId,
  authorName,
  streamTitle = 'Live Stream',
}) => {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSendNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emails.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      const emailList = emails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.includes('@'));

      const response = await fetch('/api/streams/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId,
          emails: emailList,
          authorName,
          streamTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notifications');
      }

      const data = await response.json();
      setSentCount(data.sentCount);
      setEmails('');
    } catch (err) {
      setError('Failed to send notifications. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Notify Viewers</h3>
      
      <form onSubmit={handleSendNotifications} className="space-y-3">
        <div>
          <label htmlFor="emails" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Email Addresses
          </label>
          <textarea
            id="emails"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="Enter email addresses separated by commas"
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700"
            rows={3}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Separate multiple email addresses with commas
          </p>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {sentCount > 0 && (
          <div className="text-green-500 text-sm">
            Successfully sent notifications to {sentCount} email addresses
          </div>
        )}

        <button
          type="submit"
          disabled={isSending || !emails.trim()}
          className="w-full px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? 'Sending...' : 'Send Notifications'}
        </button>
      </form>
    </div>
  );
};

export default StreamEmailNotification; 