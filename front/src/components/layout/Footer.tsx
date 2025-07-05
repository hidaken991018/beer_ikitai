import { APP_CONFIG } from '@/lib/constants';

export function Footer() {
  return (
    <footer className='border-t bg-background'>
      <div className='container mx-auto px-4 py-6'>
        <div className='flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0'>
          <div className='flex items-center space-x-2'>
            <div className='h-6 w-6 rounded-full bg-primary' />
            <span className='text-sm font-medium'>{APP_CONFIG.name}</span>
          </div>

          <div className='flex items-center space-x-6 text-sm text-muted-foreground'>
            <span>© 2024 {APP_CONFIG.name}</span>
            <span>v{APP_CONFIG.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
