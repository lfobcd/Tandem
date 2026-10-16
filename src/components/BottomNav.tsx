import React from 'react';
import { PageView } from '../types';
import { useTranslation } from '../lib/i18n';
import { Home, Search, MessageSquare, User, Settings } from 'lucide-react';

interface BottomNavProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  onNavigate,
  unreadCount = 0,
}) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'landing' as PageView, label: t.navHome, icon: Home },
    { id: 'discovery' as PageView, label: t.navDiscovery, icon: Search },
    {
      id: 'messages' as PageView,
      label: t.navMessages,
      icon: MessageSquare,
      badge: unreadCount,
    },
    { id: 'profile-create' as PageView, label: t.navProfile, icon: User },
    { id: 'settings' as PageView, label: t.navSettings, icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#E5E1D8] px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
              isActive
                ? 'text-[#2E4A3D] font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#2E4A3D]"></span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
