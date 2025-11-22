import { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function MobileLayout({
  children,
  showBottomNav = false,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Container */}
      <div className="max-w-[448px] mx-auto bg-white min-h-screen relative">
        {/* Main Content */}
        <main
          className={`h-screen overflow-auto ${showBottomNav ? 'pb-[77px]' : ''}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
