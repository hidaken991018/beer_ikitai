'use client';

import { Home, MapPin, History, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface NavigationProps {
  isAuthenticated?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requireAuth?: boolean;
}

const navItems: NavItem[] = [
  {
    href: ROUTES.home,
    label: 'ホーム',
    icon: Home,
  },
  {
    href: ROUTES.breweries,
    label: '醸造所',
    icon: MapPin,
  },
  {
    href: ROUTES.visits,
    label: '訪問履歴',
    icon: History,
    requireAuth: true,
  },
  {
    href: ROUTES.profile,
    label: 'プロフィール',
    icon: User,
    requireAuth: true,
  },
];

export function Navigation({ isAuthenticated = false }: NavigationProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(
    item => !item.requireAuth || isAuthenticated
  );

  return (
    <nav className='bg-background border-t md:border-t-0 md:border-r'>
      <div className='flex md:flex-col'>
        {filteredNavItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 md:flex-none items-center justify-center md:justify-start space-x-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className='h-5 w-5' />
              <span className='hidden md:inline'>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
