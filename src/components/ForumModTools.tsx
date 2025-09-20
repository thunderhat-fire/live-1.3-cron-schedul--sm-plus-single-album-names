import React from 'react';
import { useSession } from 'next-auth/react';
import {
  EllipsisHorizontalIcon,
  LockClosedIcon,
  TrashIcon,
  FlagIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon as PinIcon
} from '@heroicons/react/24/outline';

interface ModToolsProps {
  threadId?: string;
  replyId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  onPin?: () => void;
  onLock?: () => void;
  onDelete?: () => void;
  onResolveReport?: () => void;
  onDismissReport?: () => void;
  isReported?: boolean;
}

const ForumModTools: React.FC<ModToolsProps> = ({
  threadId,
  replyId,
  isPinned,
  isLocked,
  onPin,
  onLock,
  onDelete,
  onResolveReport,
  onDismissReport,
  isReported
}) => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user?.isAdmin) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
        title="Moderator Tools"
      >
        <EllipsisHorizontalIcon className="w-6 h-6 text-neutral-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg z-50 py-1">
          {threadId && (
            <>
              <button
                onClick={() => {
                  onPin?.();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <PinIcon className="w-5 h-5" />
                <span>{isPinned ? 'Unpin Thread' : 'Pin Thread'}</span>
              </button>

              <button
                onClick={() => {
                  onLock?.();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <LockClosedIcon className="w-5 h-5" />
                <span>{isLocked ? 'Unlock Thread' : 'Lock Thread'}</span>
              </button>
            </>
          )}

          {isReported && (
            <>
              <button
                onClick={() => {
                  onResolveReport?.();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-green-600"
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span>Resolve Report</span>
              </button>

              <button
                onClick={() => {
                  onDismissReport?.();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-yellow-600"
              >
                <XCircleIcon className="w-5 h-5" />
                <span>Dismiss Report</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this? This action cannot be undone.')) {
                onDelete?.();
                setIsOpen(false);
              }
            }}
            className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-red-600"
          >
            <TrashIcon className="w-5 h-5" />
            <span>Delete {threadId ? 'Thread' : 'Reply'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ForumModTools; 