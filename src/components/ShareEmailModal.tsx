import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import ButtonSecondary from '@/shared/Button/ButtonSecondary';
import Input from '@/shared/Input/Input';
import Textarea from '@/shared/Textarea/Textarea';

interface ShareEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, message: string) => void;
  nftName: string;
  isLoading?: boolean;
}

const ShareEmailModal: React.FC<ShareEmailModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  nftName,
  isLoading = false
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`Check out this vinyl: ${nftName}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, message);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop overlay */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="relative bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
          <Dialog.Title className="text-2xl font-semibold mb-4">
            Share via Email
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Recipient Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter recipient's email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Message
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <ButtonSecondary
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </ButtonSecondary>
              <ButtonPrimary
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </ButtonPrimary>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};

export default ShareEmailModal; 