import { Menu, Bell, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-dark-700/60 bg-dark-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-all lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-dark-200">
            The Shield Protocol
            <span className="ml-2 text-xs text-dark-500 font-normal">QR &amp; Email Automation System</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Timestamp */}
        <span className="hidden md:block text-xs text-dark-500 font-mono">
          {formatDate(new Date().toISOString())}
        </span>

        {/* Notification bell placeholder */}
        <button className="p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-all relative">
          <Bell size={18} />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-dark-700">
          <div className="w-8 h-8 rounded-full bg-shield-600/30 border border-shield-600/50 flex items-center justify-center">
            <Shield size={14} className="text-shield-400" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-dark-200">{user?.name || 'Admin'}</p>
            <p className="text-xs text-dark-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
