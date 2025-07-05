import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navigation } from '@/components/layout/Navigation';

// Mock Next.js navigation
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock Next.js Link to forward className
jest.mock('next/link', () => {
  const MockLink = ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Home: (props: any) => (
    <div data-testid='home-icon' {...props}>
      Home
    </div>
  ),
  MapPin: (props: any) => (
    <div data-testid='mappin-icon' {...props}>
      MapPin
    </div>
  ),
  History: (props: any) => (
    <div data-testid='history-icon' {...props}>
      History
    </div>
  ),
  User: (props: any) => (
    <div data-testid='user-icon' {...props}>
      User
    </div>
  ),
}));

// Mock constants
jest.mock('@/lib/constants', () => ({
  ROUTES: {
    home: '/',
    breweries: '/brewery',
    visits: '/visits',
    profile: '/profile',
  },
}));

// Mock utils to ensure cn function works
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => {
    const validClasses = classes.flat().filter(Boolean).join(' ');
    return validClasses;
  },
}));

describe('Navigation Component', () => {
  beforeEach(() => {
    mockUsePathname.mockClear();
  });

  describe('basic rendering', () => {
    it('renders navigation element', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navigation isAuthenticated={false} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('renders home and brewery links for unauthenticated users', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navigation isAuthenticated={false} />);

      expect(screen.getByText('ホーム')).toBeInTheDocument();
      expect(screen.getByText('醸造所')).toBeInTheDocument();
      expect(screen.queryByText('訪問履歴')).not.toBeInTheDocument();
      expect(screen.queryByText('プロフィール')).not.toBeInTheDocument();
    });

    it('renders all links for authenticated users', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navigation isAuthenticated={true} />);

      expect(screen.getByText('ホーム')).toBeInTheDocument();
      expect(screen.getByText('醸造所')).toBeInTheDocument();
      expect(screen.getByText('訪問履歴')).toBeInTheDocument();
      expect(screen.getByText('プロフィール')).toBeInTheDocument();
    });
  });

  describe('link attributes', () => {
    it('sets correct href attributes', () => {
      mockUsePathname.mockReturnValue('/');
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

  describe('active state logic', () => {
    it('correctly identifies active page based on pathname', () => {
      // Test brewery page active
      mockUsePathname.mockReturnValue('/brewery');
      const { rerender } = render(<Navigation isAuthenticated={true} />);

      const breweryLink = screen.getByText('醸造所').closest('a');
      const homeLink = screen.getByText('ホーム').closest('a');

      // Brewery should have active classes
      expect(breweryLink?.className).toMatch(/bg-primary.*10/); // matches bg-primary/10
      expect(breweryLink?.className).toMatch(/text-primary/);

      // Home should have inactive classes
      expect(homeLink?.className).toMatch(/text-muted-foreground/);
      expect(homeLink?.className).not.toMatch(/bg-primary/);

      // Test home page active
      mockUsePathname.mockReturnValue('/');
      rerender(<Navigation isAuthenticated={true} />);

      const newHomeLink = screen.getByText('ホーム').closest('a');
      const newBreweryLink = screen.getByText('醸造所').closest('a');

      // Home should have active classes
      expect(newHomeLink?.className).toMatch(/bg-primary.*10/);
      expect(newHomeLink?.className).toMatch(/text-primary/);

      // Brewery should have inactive classes
      expect(newBreweryLink?.className).toMatch(/text-muted-foreground/);
      expect(newBreweryLink?.className).not.toMatch(/bg-primary/);
    });
  });

  describe('styling classes', () => {
    it('applies base layout classes to links', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navigation isAuthenticated={true} />);

      const homeLink = screen.getByText('ホーム').closest('a');

      // Check for essential layout classes
      expect(homeLink?.className).toMatch(/flex/);
      expect(homeLink?.className).toMatch(/items-center/);
      expect(homeLink?.className).toMatch(/px-4/);
      expect(homeLink?.className).toMatch(/py-3/);
    });

    it('applies responsive classes to nav container', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navigation isAuthenticated={true} />);

      const nav = screen.getByRole('navigation');
      expect(nav.className).toMatch(/bg-background/);
      expect(nav.className).toMatch(/border-t/);

      const container = nav.querySelector('div');
      expect(container?.className).toMatch(/flex/);
      expect(container?.className).toMatch(/md:flex-col/);
    });
  });

  describe('icon rendering', () => {
    it('renders icons for each navigation item', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navigation isAuthenticated={true} />);

      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
      expect(screen.getByTestId('history-icon')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
  });
});
