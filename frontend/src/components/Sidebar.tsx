import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Users, Cpu, FileText,
  LogOut, ChevronLeft, Shield, Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Students' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/processing', icon: Cpu, label: 'Processing' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-dark-900 border-r border-dark-700/60 transition-all duration-300 flex-shrink-0',
        open ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-dark-700/60 gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-shield-600/20 border border-shield-600/40 flex items-center justify-center">
          <Shield size={18} className="text-shield-400" />
        </div>
        {open && (
          <div className="min-w-0">
            <p className="text-xs font-bold text-shield-400 uppercase tracking-widest leading-none">
              Shield Protocol
            </p>
            <p className="text-[10px] text-dark-500 mt-0.5 truncate">QR &amp; Email System</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'ml-auto p-1 rounded text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-all',
            !open && 'ml-0 rotate-180'
          )}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Status indicator */}
      {open && (
        <div className="mx-3 my-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-medium">System Online</span>
          <Zap size={12} className="text-green-400 ml-auto" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-shield-600/20 text-shield-300 border border-shield-600/30'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
              )
            }
            title={!open ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={cn(
                    'flex-shrink-0 transition-colors',
                    isActive ? 'text-shield-400' : 'text-dark-400 group-hover:text-dark-200'
                  )}
                />
                {open && <span className="truncate">{label}</span>}
                {open && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 bg-shield-400 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-2 border-t border-dark-700/60">
        {open && user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-dark-200 truncate">{user.name}</p>
            <p className="text-xs text-dark-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium',
            'text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200'
          )}
          title={!open ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
