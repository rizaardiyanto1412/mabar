import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="flex space-x-4">
      <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
        Dashboard
      </Link>
      <Link href="/settings" className="text-gray-600 hover:text-gray-900">
        Settings
      </Link>
      <Link href="/archive" className="text-gray-600 hover:text-gray-900">
        Archive
      </Link>
    </nav>
  );
}