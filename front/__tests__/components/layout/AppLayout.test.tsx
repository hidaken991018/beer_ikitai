import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppLayout } from '@/components/layout/AppLayout';

// Mock AuthProvider
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuthContext: () => ({
    authState: { isAuthenticated: false },
    logout: jest.fn(),
  }),
}));

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
  Header: ({
    isAuthenticated,
    onLogout,
  }: {
    isAuthenticated: boolean;
    onLogout: () => void;
  }) => (
    <header data-testid='header'>
      <div>Header Component</div>
      {isAuthenticated && <button onClick={onLogout}>Logout</button>}
    </header>
  ),
}));

// Mock Footer component
jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid='footer'>Footer Component</footer>,
}));

describe('AppLayout Component', () => {
  it('renders children content', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders header component', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Header Component')).toBeInTheDocument();
  });

  it('renders footer component', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText('Footer Component')).toBeInTheDocument();
  });

  it('renders main content area with correct classes', () => {
    render(
      <AppLayout>
        <div data-testid='test-content'>Test Content</div>
      </AppLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'container', 'mx-auto', 'px-4', 'py-6');
  });

  it('passes authentication state to header', () => {
    // Mock authenticated state
    const mockUseAuthContext = jest.fn(() => ({
      authState: { isAuthenticated: true },
      logout: jest.fn(),
    }));

    jest.doMock('@/components/auth/AuthProvider', () => ({
      useAuthContext: mockUseAuthContext,
    }));

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('contains all layout sections in correct order', () => {
    render(
      <AppLayout>
        <div data-testid='main-content'>Main Content</div>
      </AppLayout>
    );

    const container = screen.getByTestId('header').parentElement;
    const children = Array.from(container?.children || []);

    expect(children[0]).toEqual(screen.getByTestId('header'));
    expect(children[1]).toEqual(screen.getByRole('main'));
    expect(children[2]).toEqual(screen.getByTestId('footer'));
  });

  it('renders with multiple children', () => {
    render(
      <AppLayout>
        <div>First Child</div>
        <div>Second Child</div>
        <span>Third Child</span>
      </AppLayout>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Third Child')).toBeInTheDocument();
  });

  it('renders with complex nested content', () => {
    render(
      <AppLayout>
        <div>
          <h1>Page Title</h1>
          <section>
            <p>Page content</p>
            <button>Action Button</button>
          </section>
        </div>
      </AppLayout>
    );

    expect(screen.getByText('Page Title')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });
});
