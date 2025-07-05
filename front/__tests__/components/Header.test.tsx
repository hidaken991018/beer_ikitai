import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '@/components/layout/Header';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock constants
jest.mock('@/lib/constants', () => ({
  APP_CONFIG: {
    name: 'My Beer Log',
  },
  ROUTES: {
    home: '/',
    breweries: '/brewery',
    nearbyBreweries: '/brewery/nearby',
    visits: '/visits',
    profile: '/profile',
    login: '/auth/login',
    register: '/auth/register',
  },
}));

describe('Header Component', () => {
  it('renders app name correctly', () => {
    render(<Header />);
    expect(screen.getByText('My Beer Log')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('醸造所')).toBeInTheDocument();
    expect(screen.getByText('近隣の醸造所')).toBeInTheDocument();
  });

  it('shows login and register buttons when not authenticated', () => {
    render(<Header isAuthenticated={false} />);
    expect(screen.getByText('ログイン')).toBeInTheDocument();
    expect(screen.getByText('新規登録')).toBeInTheDocument();
  });

  it('shows profile and logout buttons when authenticated', () => {
    const mockLogout = jest.fn();
    render(<Header isAuthenticated={true} onLogout={mockLogout} />);
    expect(screen.getByText('プロフィール')).toBeInTheDocument();
    expect(screen.getByText('ログアウト')).toBeInTheDocument();
  });

  it('shows visit history link when authenticated', () => {
    render(<Header isAuthenticated={true} />);
    expect(screen.getByText('訪問履歴')).toBeInTheDocument();
  });

  it('hides visit history link when not authenticated', () => {
    render(<Header isAuthenticated={false} />);
    expect(screen.queryByText('訪問履歴')).not.toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', () => {
    const mockLogout = jest.fn();
    render(<Header isAuthenticated={true} onLogout={mockLogout} />);

    const logoutButton = screen.getByText('ログアウト');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('has correct links for navigation items', () => {
    render(<Header isAuthenticated={true} />);

    const breweryLink = screen.getByText('醸造所').closest('a');
    const nearbyLink = screen.getByText('近隣の醸造所').closest('a');
    const visitsLink = screen.getByText('訪問履歴').closest('a');

    expect(breweryLink).toHaveAttribute('href', '/brewery');
    expect(nearbyLink).toHaveAttribute('href', '/brewery/nearby');
    expect(visitsLink).toHaveAttribute('href', '/visits');
  });

  it('has correct links for auth buttons', () => {
    render(<Header isAuthenticated={false} />);

    const loginLink = screen.getByText('ログイン').closest('a');
    const registerLink = screen.getByText('新規登録').closest('a');

    expect(loginLink).toHaveAttribute('href', '/auth/login');
    expect(registerLink).toHaveAttribute('href', '/auth/register');
  });
});
