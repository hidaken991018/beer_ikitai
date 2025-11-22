'use client';

import { Map, History, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/map',
      label: 'マップ',
      icon: Map,
    },
    {
      href: '/visits',
      label: '履歴',
      icon: History,
    },
    {
      href: '/profile',
      label: 'プロフィール',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-center bg-gray-100 z-50">
      <div className="max-w-[448px] w-full bg-white border-t border-gray-200">
        <div className="flex items-center justify-between px-[30px] h-[77px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 w-[100px] h-[60px] rounded-[10px] transition-colors hover:bg-gray-50"
              >
                <Icon
                  className="w-6 h-6"
                  style={{
                    color: isActive ? '#e17100' : '#6a7282',
                  }}
                />
                <span
                  className="text-[12px] font-normal leading-4 text-center"
                  style={{
                    color: isActive ? '#e17100' : '#6a7282',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
