import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const AdminNav = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="space-y-1">
      <Link
        href="/admin/dashboard"
        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          isActive('/admin/dashboard')
            ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <ChartBarIcon className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" />
        Dashboard
      </Link>

      <Link
        href="/admin/users"
        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          isActive('/admin/users')
            ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <UserGroupIcon className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" />
        Users
      </Link>

      <Link
        href="/admin/reports"
        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          isActive('/admin/reports')
            ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <ShieldCheckIcon className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" />
        Reports
      </Link>

      <Link
        href="/admin/modlogs"
        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          isActive('/admin/modlogs')
            ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <ClipboardDocumentListIcon className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" />
        Moderation Logs
      </Link>

      <Link
        href="/admin/content"
        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          isActive('/admin/content')
            ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
            : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <DocumentTextIcon className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" />
        Content
      </Link>
    </nav>
  );
};

export default AdminNav; 