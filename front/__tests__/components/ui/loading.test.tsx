import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  LoadingSpinner,
  LoadingSkeleton,
  LoadingCard,
  LoadingList,
  LoadingPage,
  LoadingButton,
  LoadingOverlay,
} from '@/components/ui/loading';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid='loader2' className={className}>
      Loading...
    </div>
  ),
}));

describe('Loading Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByTestId('loader2');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('h-6', 'w-6', 'animate-spin');
    });

    it('applies different sizes', () => {
      const { rerender } = render(<LoadingSpinner size='sm' />);
      let spinner = screen.getByTestId('loader2');
      expect(spinner).toHaveClass('h-4', 'w-4');

      rerender(<LoadingSpinner size='lg' />);
      spinner = screen.getByTestId('loader2');
      expect(spinner).toHaveClass('h-8', 'w-8');

      rerender(<LoadingSpinner size='xl' />);
      spinner = screen.getByTestId('loader2');
      expect(spinner).toHaveClass('h-12', 'w-12');
    });

    it('applies custom className', () => {
      render(<LoadingSpinner className='custom-spinner' />);
      const spinner = screen.getByTestId('loader2');
      expect(spinner).toHaveClass('custom-spinner');
    });
  });

  describe('LoadingSkeleton', () => {
    it('renders single line by default', () => {
      render(<LoadingSkeleton data-testid='skeleton' />);
      const skeleton = screen.getByTestId('skeleton');
      const lines = skeleton.querySelectorAll('div');
      expect(lines).toHaveLength(1);
    });

    it('renders multiple lines', () => {
      render(<LoadingSkeleton lines={3} data-testid='skeleton' />);
      const container = screen.getByTestId('skeleton');
      const lines = container.querySelectorAll('div');
      expect(lines).toHaveLength(3);
    });

    it('applies custom className', () => {
      render(<LoadingSkeleton className='custom-skeleton' data-testid='skeleton' />);
      const container = screen.getByTestId('skeleton');
      expect(container).toHaveClass('custom-skeleton');
    });

    it('applies different width to last line when multiple lines', () => {
      render(<LoadingSkeleton lines={2} data-testid='skeleton' />);
      const container = screen.getByTestId('skeleton');
      const lines = container.querySelectorAll('div');
      expect(lines[0]).toHaveClass('w-full');
      expect(lines[1]).toHaveClass('w-3/4');
    });
  });

  describe('LoadingCard', () => {
    it('renders loading card structure', () => {
      render(<LoadingCard data-testid='loading-card' />);
      const container = screen.getByTestId('loading-card');
      expect(container).toHaveClass('border', 'rounded-lg', 'p-6', 'space-y-4');
    });

    it('applies custom className', () => {
      render(<LoadingCard className='custom-card' data-testid='loading-card' />);
      const container = screen.getByTestId('loading-card');
      expect(container).toHaveClass('custom-card');
    });

    it('contains loading elements with pulse animation', () => {
      render(<LoadingCard data-testid='loading-card' />);
      const container = screen.getByTestId('loading-card');
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe('LoadingList', () => {
    it('renders default number of items', () => {
      render(<LoadingList data-testid='loading-list' />);
      const container = screen.getByTestId('loading-list');
      const cardContainers = container.querySelectorAll('.border.rounded-lg');
      expect(cardContainers).toHaveLength(5);
    });

    it('renders specified number of items', () => {
      render(<LoadingList items={3} data-testid='loading-list' />);
      const container = screen.getByTestId('loading-list');
      const cardContainers = container.querySelectorAll('.border.rounded-lg');
      expect(cardContainers).toHaveLength(3);
    });

    it('applies custom className', () => {
      render(<LoadingList className='custom-list' data-testid='loading-list' />);
      const container = screen.getByTestId('loading-list');
      expect(container).toHaveClass('custom-list');
    });
  });

  describe('LoadingPage', () => {
    it('renders with default title', () => {
      render(<LoadingPage />);
      expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
      expect(screen.getByTestId('loader2')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(<LoadingPage title='Custom loading message' />);
      expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(
        <LoadingPage
          title='Loading'
          description='Please wait while we fetch your data'
        />
      );
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(
        screen.getByText('Please wait while we fetch your data')
      ).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<LoadingPage title='Loading' />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      // Should only have one text element (the title)
      const textElements = screen.getAllByText(/\w+/);
      expect(textElements).toHaveLength(2); // "Loading" + "Loading..." from icon
    });
  });

  describe('LoadingButton', () => {
    it('renders button with children', () => {
      render(<LoadingButton>Click me</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });

    it('shows loading spinner when loading', () => {
      render(<LoadingButton loading={true}>Loading</LoadingButton>);
      expect(screen.getByTestId('loader2')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('handles click events when not loading', () => {
      const handleClick = jest.fn();
      render(<LoadingButton onClick={handleClick}>Click me</LoadingButton>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when loading', () => {
      render(<LoadingButton loading={true}>Loading</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<LoadingButton disabled={true}>Disabled</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies different variants', () => {
      const { rerender } = render(
        <LoadingButton variant='destructive'>Destructive</LoadingButton>
      );
      let button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');

      rerender(<LoadingButton variant='outline'>Outline</LoadingButton>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    it('applies different sizes', () => {
      const { rerender } = render(
        <LoadingButton size='sm'>Small</LoadingButton>
      );
      let button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');

      rerender(<LoadingButton size='lg'>Large</LoadingButton>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
    });

    it('applies custom className', () => {
      render(<LoadingButton className='custom-btn'>Custom</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-btn');
    });
  });

  describe('LoadingOverlay', () => {
    it('renders when show is true', () => {
      render(<LoadingOverlay show={true} />);
      expect(screen.getByText('処理中...')).toBeInTheDocument();
      expect(screen.getByTestId('loader2')).toBeInTheDocument();
    });

    it('does not render when show is false', () => {
      render(<LoadingOverlay show={false} />);
      expect(screen.queryByText('処理中...')).not.toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<LoadingOverlay show={true} message='Saving data...' />);
      expect(screen.getByText('Saving data...')).toBeInTheDocument();
    });

    it('applies overlay styles', () => {
      render(<LoadingOverlay show={true} />);
      const overlay = screen
        .getByText('処理中...')
        .closest('div')?.parentElement;
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/50');
    });

    it('applies custom className', () => {
      render(<LoadingOverlay show={true} className='custom-overlay' />);
      const overlay = screen
        .getByText('処理中...')
        .closest('div')?.parentElement;
      expect(overlay).toHaveClass('custom-overlay');
    });
  });
});
