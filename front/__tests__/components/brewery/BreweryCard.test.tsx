import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  BreweryCard,
  BreweryCardCompact,
} from '@/components/brewery/BreweryCard';
import type { Brewery } from '@/types/brewery';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid='card' className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid='card-header' className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 data-testid='card-title' className={className}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, className }: any) => (
    <p data-testid='card-description' className={className}>
      {children}
    </p>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid='card-content' className={className}>
      {children}
    </div>
  ),
  CardFooter: ({ children, className }: any) => (
    <div data-testid='card-footer' className={className}>
      {children}
    </div>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MapPin: ({ className }: { className?: string }) => (
    <div data-testid='mappin-icon' className={className}>
      MapPin
    </div>
  ),
  Clock: ({ className }: { className?: string }) => (
    <div data-testid='clock-icon' className={className}>
      Clock
    </div>
  ),
}));

const mockBrewery: Brewery = {
  id: 1,
  name: 'Test Brewery',
  address: '123 Test Street, Test City',
  description: 'A great test brewery with excellent beers',
  latitude: 35.6762,
  longitude: 139.6503,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

describe('BreweryCard Component', () => {
  const defaultProps = {
    brewery: mockBrewery,
    onCheckin: jest.fn(),
    onViewDetails: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders brewery information correctly', () => {
    render(<BreweryCard {...defaultProps} />);

    expect(screen.getByText('Test Brewery')).toBeInTheDocument();
    expect(screen.getByText('123 Test Street, Test City')).toBeInTheDocument();
    expect(
      screen.getByText('A great test brewery with excellent beers')
    ).toBeInTheDocument();
  });

  it('renders without optional fields', () => {
    const breweryWithoutOptional: Brewery = {
      ...mockBrewery,
      address: '',
      description: '',
    };

    render(<BreweryCard {...defaultProps} brewery={breweryWithoutOptional} />);

    expect(screen.getByText('Test Brewery')).toBeInTheDocument();
    expect(screen.queryByTestId('card-description')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card-content')).not.toBeInTheDocument();
  });

  it('displays distance when provided', () => {
    render(<BreweryCard {...defaultProps} distance={2.5} />);

    expect(screen.getByText('2.5km')).toBeInTheDocument();
    expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
  });

  it('displays distance in meters for values less than 1km', () => {
    render(<BreweryCard {...defaultProps} distance={0.75} />);

    expect(screen.getByText('750m')).toBeInTheDocument();
  });

  it('does not display distance when not provided', () => {
    render(<BreweryCard {...defaultProps} />);

    expect(screen.queryByTestId('mappin-icon')).not.toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<BreweryCard {...defaultProps} />);

    expect(screen.getByText(/登録日: 2024年1月15日/)).toBeInTheDocument();
  });

  it('displays brewery ID', () => {
    render(<BreweryCard {...defaultProps} />);

    expect(screen.getByText('ID: 1')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<BreweryCard {...defaultProps} />);

    expect(screen.getByText('詳細を見る')).toBeInTheDocument();
    expect(screen.getByText('チェックイン')).toBeInTheDocument();
  });

  it('handles checkin button click', () => {
    const onCheckin = jest.fn();
    render(<BreweryCard {...defaultProps} onCheckin={onCheckin} />);

    const checkinButton = screen.getByText('チェックイン');
    fireEvent.click(checkinButton);

    expect(onCheckin).toHaveBeenCalledWith(1);
  });

  it('handles view details button click', () => {
    const onViewDetails = jest.fn();
    render(<BreweryCard {...defaultProps} onViewDetails={onViewDetails} />);

    const detailsButton = screen.getByText('詳細を見る');
    fireEvent.click(detailsButton);

    expect(onViewDetails).toHaveBeenCalledWith(1);
  });

  it('works without callback functions', () => {
    render(<BreweryCard brewery={mockBrewery} />);

    const checkinButton = screen.getByText('チェックイン');
    const detailsButton = screen.getByText('詳細を見る');

    expect(() => fireEvent.click(checkinButton)).not.toThrow();
    expect(() => fireEvent.click(detailsButton)).not.toThrow();
  });

  it('applies correct CSS classes', () => {
    render(<BreweryCard {...defaultProps} />);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('w-full', 'max-w-sm', 'hover:shadow-lg');
  });
});

describe('BreweryCardCompact Component', () => {
  const defaultProps = {
    brewery: mockBrewery,
    onCheckin: jest.fn(),
    onViewDetails: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders brewery information in compact format', () => {
    render(<BreweryCardCompact {...defaultProps} />);

    expect(screen.getByText('Test Brewery')).toBeInTheDocument();
    expect(screen.getByText('123 Test Street, Test City')).toBeInTheDocument();
  });

  it('displays distance when provided', () => {
    render(<BreweryCardCompact {...defaultProps} distance={1.2} />);

    expect(screen.getByText('1.2km')).toBeInTheDocument();
    expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
  });

  it('displays distance in meters for small values', () => {
    render(<BreweryCardCompact {...defaultProps} distance={0.3} />);

    expect(screen.getByText('300m')).toBeInTheDocument();
  });

  it('formats date in compact format', () => {
    render(<BreweryCardCompact {...defaultProps} />);

    expect(screen.getByText('2024/1/15')).toBeInTheDocument();
  });

  it('renders compact action buttons', () => {
    render(<BreweryCardCompact {...defaultProps} />);

    expect(screen.getByText('詳細')).toBeInTheDocument();
    expect(screen.getByText('チェックイン')).toBeInTheDocument();
  });

  it('handles checkin button click', () => {
    const onCheckin = jest.fn();
    render(<BreweryCardCompact {...defaultProps} onCheckin={onCheckin} />);

    const checkinButton = screen.getByText('チェックイン');
    fireEvent.click(checkinButton);

    expect(onCheckin).toHaveBeenCalledWith(1);
  });

  it('handles view details button click', () => {
    const onViewDetails = jest.fn();
    render(
      <BreweryCardCompact {...defaultProps} onViewDetails={onViewDetails} />
    );

    const detailsButton = screen.getByText('詳細');
    fireEvent.click(detailsButton);

    expect(onViewDetails).toHaveBeenCalledWith(1);
  });

  it('renders without address', () => {
    const breweryWithoutAddress: Brewery = {
      ...mockBrewery,
      address: '',
    };

    render(
      <BreweryCardCompact {...defaultProps} brewery={breweryWithoutAddress} />
    );

    expect(screen.getByText('Test Brewery')).toBeInTheDocument();
    expect(
      screen.queryByText('123 Test Street, Test City')
    ).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for compact layout', () => {
    render(<BreweryCardCompact {...defaultProps} />);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('w-full', 'hover:shadow-md');

    const content = screen.getByTestId('card-content');
    expect(content).toHaveClass('p-4');
  });

  it('does not display distance when not provided', () => {
    render(<BreweryCardCompact {...defaultProps} />);

    const mapPinIcons = screen.queryAllByTestId('mappin-icon');
    expect(mapPinIcons).toHaveLength(0);
  });

  it('works without callback functions', () => {
    render(<BreweryCardCompact brewery={mockBrewery} />);

    const checkinButton = screen.getByText('チェックイン');
    const detailsButton = screen.getByText('詳細');

    expect(() => fireEvent.click(checkinButton)).not.toThrow();
    expect(() => fireEvent.click(detailsButton)).not.toThrow();
  });
});
