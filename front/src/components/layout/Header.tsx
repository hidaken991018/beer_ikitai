'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { APP_CONFIG, ROUTES } from '@/lib/constants';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export function Header({ isAuthenticated = false, onLogout }: HeaderProps) {
  return (
    <header className='border-b bg-background'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        <Link href={ROUTES.home} className='flex items-center space-x-2'>
          <div className='h-8 w-8 rounded-full bg-primary' />
          <span className='text-xl font-bold'>{APP_CONFIG.name}</span>
        </Link>

        <nav className='hidden md:flex items-center space-x-6'>
          <Link
            href={ROUTES.breweries}
            className='text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            醸造所
          </Link>
          <Link
            href={ROUTES.nearbyBreweries}
            className='text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            近隣の醸造所
          </Link>
          {isAuthenticated && (
            <Link
              href={ROUTES.visits}
              className='text-sm font-medium text-muted-foreground hover:text-foreground'
            >
              訪問履歴
            </Link>
          )}
        </nav>

        <div className='flex items-center space-x-2'>
          {isAuthenticated ? (
            <>
              <Link href={ROUTES.profile}>
                <Button variant='ghost' size='sm'>
                  プロフィール
                </Button>
              </Link>
              <Button variant='outline' size='sm' onClick={onLogout}>
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <Link href={ROUTES.login}>
                <Button variant='ghost' size='sm'>
                  ログイン
                </Button>
              </Link>
              <Link href={ROUTES.register}>
                <Button size='sm'>新規登録</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
