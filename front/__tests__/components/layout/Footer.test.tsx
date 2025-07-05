import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Footer } from '@/components/layout/Footer';

// Mock constants
jest.mock('@/lib/constants', () => ({
  APP_CONFIG: {
    name: 'My Beer Log',
    version: '1.0.0',
  },
}));

describe('Footer Component', () => {
  it('renders footer element', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('applies correct footer classes', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('border-t', 'bg-background');
  });

  it('displays app name from config', () => {
    render(<Footer />);
    const appNames = screen.getAllByText('My Beer Log');
    expect(appNames).toHaveLength(2); // One in logo area, one in copyright
  });

  it('displays app version from config', () => {
    render(<Footer />);
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('displays copyright year', () => {
    render(<Footer />);
    expect(screen.getByText('© 2024 My Beer Log')).toBeInTheDocument();
  });

  it('renders logo element', () => {
    render(<Footer />);
    const container = screen.getByRole('contentinfo');
    const logo = container.querySelector('.h-6.w-6.rounded-full.bg-primary');
    expect(logo).toBeInTheDocument();
  });

  it('applies correct container classes', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    const container = footer.firstChild;
    expect(container).toHaveClass('container', 'mx-auto', 'px-4', 'py-6');
  });

  it('applies correct flex layout classes', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    const flexContainer = footer.querySelector(
      '.flex.flex-col.items-center.justify-between'
    );
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-between',
      'space-y-4',
      'md:flex-row',
      'md:space-y-0'
    );
  });

  it('renders logo section with correct structure', () => {
    render(<Footer />);
    const logoSection = screen
      .getByText('My Beer Log')
      .closest('.flex.items-center.space-x-2');
    expect(logoSection).toBeInTheDocument();

    const logo = logoSection?.querySelector('.h-6.w-6.rounded-full.bg-primary');
    const text = logoSection?.querySelector('.text-sm.font-medium');

    expect(logo).toBeInTheDocument();
    expect(text).toBeInTheDocument();
    expect(text).toHaveTextContent('My Beer Log');
  });

  it('renders info section with correct structure', () => {
    render(<Footer />);
    const infoSection = screen
      .getByText('© 2024 My Beer Log')
      .closest('.flex.items-center');
    expect(infoSection).toBeInTheDocument();
    expect(infoSection).toHaveClass(
      'flex',
      'items-center',
      'space-x-6',
      'text-sm',
      'text-muted-foreground'
    );
  });

  it('separates copyright and version with correct spacing', () => {
    render(<Footer />);
    const copyright = screen.getByText('© 2024 My Beer Log');
    const version = screen.getByText('v1.0.0');

    const infoContainer = copyright.closest('.flex.items-center.space-x-6');
    expect(infoContainer).toContain(copyright);
    expect(infoContainer).toContain(version);
  });

  it('applies responsive classes correctly', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    const mainContainer = footer.querySelector('.md\\:flex-row');
    expect(mainContainer).toHaveClass('md:flex-row', 'md:space-y-0');
  });

  it('maintains accessibility with contentinfo role', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer.tagName).toBe('FOOTER');
  });

  it('has correct text styling for different elements', () => {
    render(<Footer />);

    const appName = screen.getByText('My Beer Log');
    expect(appName).toHaveClass('text-sm', 'font-medium');

    const copyright = screen.getByText('© 2024 My Beer Log');
    expect(copyright).toHaveClass('text-sm', 'text-muted-foreground');

    const version = screen.getByText('v1.0.0');
    expect(version).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('uses semantic HTML structure', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');

    // Should be a footer element
    expect(footer.tagName).toBe('FOOTER');

    // Should contain div elements for layout
    const divs = footer.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);

    // Should contain span elements for text content
    const spans = footer.querySelectorAll('span');
    expect(spans.length).toBeGreaterThan(0);
  });
});
