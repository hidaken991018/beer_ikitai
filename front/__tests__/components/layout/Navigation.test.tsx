import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navigation } from '@/components/layout/Navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock constants
jest.mock('@/lib/constants', () => ({
  ROUTES: {
    home: '/',
    breweries: '/brewery',
    visits: '/visits',
    profile: '/profile',
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Home: ({ className }: { className?: string }) => (
    <div data-testid='home-icon' className={className}>
      Home
    </div>
  ),
  MapPin: ({ className }: { className?: string }) => (
    <div data-testid='mappin-icon' className={className}>
      MapPin
    </div>
  ),
  History: ({ className }: { className?: string }) => (
    <div data-testid='history-icon' className={className}>
      History
    </div>
  ),
  User: ({ className }: { className?: string }) => (
    <div data-testid='user-icon' className={className}>
      User
    </div>
  ),
}));

const { usePathname } = require('next/navigation');

describe('Navigation Component', () => {
  beforeEach(() => {
    usePathname.mockReturnValue('/');
  });

  describe('when user is not authenticated', () => {
    it('renders public navigation items', () => {
      render(<Navigation isAuthenticated={false} />);

      expect(screen.getByText('ホーム')).toBeInTheDocument();
      expect(screen.getByText('醸造所')).toBeInTheDocument();
    });

    it('does not render authenticated-only items', () => {
      render(<Navigation isAuthenticated={false} />);

      expect(screen.queryByText('訪問履歴')).not.toBeInTheDocument();
      expect(screen.queryByText('プロフィール')).not.toBeInTheDocument();
    });

    it('renders correct icons for public items', () => {
      render(<Navigation isAuthenticated={false} />);

      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
    });

    it('has correct links for public items', () => {
      render(<Navigation isAuthenticated={false} />);

      const homeLink = screen.getByText('ホーム').closest('a');
      const breweryLink = screen.getByText('醸造所').closest('a');

      expect(homeLink).toHaveAttribute('href', '/');
      expect(breweryLink).toHaveAttribute('href', '/brewery');
    });
  });

  describe('when user is authenticated', () => {
    it('renders all navigation items', () => {
      render(<Navigation isAuthenticated={true} />);

      expect(screen.getByText('ホーム')).toBeInTheDocument();
      expect(screen.getByText('醸造所')).toBeInTheDocument();
      expect(screen.getByText('訪問履歴')).toBeInTheDocument();
      expect(screen.getByText('プロフィール')).toBeInTheDocument();
    });

    it('renders all icons for authenticated items', () => {
      render(<Navigation isAuthenticated={true} />);

      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
      expect(screen.getByTestId('history-icon')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('has correct links for all items', () => {
      render(<Navigation isAuthenticated={true} />);

      const homeLink = screen.getByText('ホーム').closest('a');
      const breweryLink = screen.getByText('醸造所').closest('a');
      const visitsLink = screen.getByText('訪問履歴').closest('a');
      const profileLink = screen.getByText('プロフィール').closest('a');

      expect(homeLink).toHaveAttribute('href', '/');
      expect(breweryLink).toHaveAttribute('href', '/brewery');
      expect(visitsLink).toHaveAttribute('href', '/visits');
      expect(profileLink).toHaveAttribute('href', '/profile');
    });
  });

  describe('active state styling', () => {
    it('applies active styles to current page', () => {
      usePathname.mockReturnValue('/brewery');
      render(<Navigation isAuthenticated={true} />);

      const breweryLink = screen.getByText('醸造所').closest('a');
      expect(breweryLink).toHaveClass('bg-primary/10', 'text-primary');
    });

    it('applies inactive styles to non-current pages', () => {
      usePathname.mockReturnValue('/brewery');
      render(<Navigation isAuthenticated={true} />);

      const homeLink = screen.getByText('ホーム').closest('a');
      expect(homeLink).toHaveClass('text-muted-foreground');
      expect(homeLink).not.toHaveClass('bg-primary/10', 'text-primary');
    });

    it('handles root path correctly', () => {
      usePathname.mockReturnValue('/');
      render(<Navigation isAuthenticated={true} />);

      const homeLink = screen.getByText('ホーム').closest('a');
      expect(homeLink).toHaveClass('bg-primary/10', 'text-primary');
    });
  });

  describe('responsive styling', () => {
    it('applies correct responsive classes to navigation', () => {
      render(<Navigation isAuthenticated={true} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass(
        'bg-background',
        'border-t',
        'md:border-t-0',
        'md:border-r'
      );
    });

    it('applies correct responsive classes to nav container', () => {
      render(<Navigation isAuthenticated={true} />);

      const navContainer = screen.getByRole('navigation').firstChild;
      expect(navContainer).toHaveClass('flex', 'md:flex-col');
    });

    it('applies correct responsive classes to nav items', () => {
      render(<Navigation isAuthenticated={true} />);

      const homeLink = screen.getByText('ホーム').closest('a');
      expect(homeLink).toHaveClass(
        'flex',
        'flex-1',
        'md:flex-none',
        'items-center',
        'justify-center',
        'md:justify-start'
      );
    });

    it('hides text on mobile, shows on desktop', () => {
      render(<Navigation isAuthenticated={true} />);

      const homeText = screen.getByText('ホーム');
      expect(homeText).toHaveClass('hidden', 'md:inline');
    });
  });

  describe('default props', () => {
    it('works with default isAuthenticated value', () => {
      render(<Navigation />);

      expect(screen.getByText('ホーム')).toBeInTheDocument();
      expect(screen.getByText('醸造所')).toBeInTheDocument();
      expect(screen.queryByText('訪問履歴')).not.toBeInTheDocument();
      expect(screen.queryByText('プロフィール')).not.toBeInTheDocument();
    });
  });

  describe('icon styling', () => {
    it('applies correct icon classes', () => {
      render(<Navigation isAuthenticated={true} />);

      const homeIcon = screen.getByTestId('home-icon');
      const mappinIcon = screen.getByTestId('mappin-icon');
      const historyIcon = screen.getByTestId('history-icon');
      const userIcon = screen.getByTestId('user-icon');

      expect(homeIcon).toHaveClass('h-5', 'w-5');
      expect(mappinIcon).toHaveClass('h-5', 'w-5');
      expect(historyIcon).toHaveClass('h-5', 'w-5');
      expect(userIcon).toHaveClass('h-5', 'w-5');
    });
  });
});
