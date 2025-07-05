import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <div data-testid='chevron-down' className={className}>
      ↓
    </div>
  ),
  Check: ({ className }: { className?: string }) => (
    <div data-testid='check' className={className}>
      ✓
    </div>
  ),
}));

// Mock Radix UI Select components
jest.mock('@radix-ui/react-select', () => ({
  Root: ({ children, ...props }: any) => (
    <div data-testid='select-root' {...props}>
      {children}
    </div>
  ),
  Group: ({ children, ...props }: any) => (
    <div data-testid='select-group' {...props}>
      {children}
    </div>
  ),
  Value: ({ placeholder, ...props }: any) => (
    <div data-testid='select-value' {...props}>
      {placeholder}
    </div>
  ),
  Trigger: React.forwardRef<any, any>(
    ({ children, className, ...props }, ref) => (
      <button
        ref={ref}
        data-testid='select-trigger'
        className={className}
        {...props}
      >
        {children}
      </button>
    )
  ),
  Icon: ({ children, asChild }: any) => (
    <div data-testid='select-icon' data-as-child={asChild}>
      {children}
    </div>
  ),
  Portal: ({ children }: any) => (
    <div data-testid='select-portal'>{children}</div>
  ),
  Content: React.forwardRef<any, any>(
    ({ children, className, position, ...props }, ref) => (
      <div
        ref={ref}
        data-testid='select-content'
        className={className}
        data-position={position}
        {...props}
      >
        {children}
      </div>
    )
  ),
  Viewport: ({ children, className }: any) => (
    <div data-testid='select-viewport' className={className}>
      {children}
    </div>
  ),
  Label: React.forwardRef<any, any>(
    ({ children, className, ...props }, ref) => (
      <div
        ref={ref}
        data-testid='select-label'
        className={className}
        {...props}
      >
        {children}
      </div>
    )
  ),
  Item: React.forwardRef<any, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} data-testid='select-item' className={className} {...props}>
      {children}
    </div>
  )),
  ItemText: ({ children }: any) => (
    <span data-testid='select-item-text'>{children}</span>
  ),
  ItemIndicator: ({ children }: any) => (
    <span data-testid='select-item-indicator'>{children}</span>
  ),
  Separator: React.forwardRef<any, any>(({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-testid='select-separator'
      className={className}
      {...props}
    />
  )),
}));

describe('Select Components', () => {
  describe('Select (Root)', () => {
    it('renders select root', () => {
      render(<Select>Test content</Select>);
      expect(screen.getByTestId('select-root')).toBeInTheDocument();
    });

    it('passes props to root component', () => {
      render(<Select data-custom='test'>Content</Select>);
      const root = screen.getByTestId('select-root');
      expect(root).toHaveAttribute('data-custom', 'test');
    });
  });

  describe('SelectTrigger', () => {
    it('renders select trigger as button', () => {
      render(
        <SelectTrigger>
          <SelectValue placeholder='Select option' />
        </SelectTrigger>
      );
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger.tagName).toBe('BUTTON');
    });

    it('applies default classes', () => {
      render(<SelectTrigger>Content</SelectTrigger>);
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass(
        'flex',
        'h-10',
        'w-full',
        'items-center',
        'justify-between',
        'rounded-md',
        'border',
        'border-input',
        'bg-background'
      );
    });

    it('applies custom className', () => {
      render(<SelectTrigger className='custom-trigger'>Content</SelectTrigger>);
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('includes chevron down icon', () => {
      render(<SelectTrigger>Content</SelectTrigger>);
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<SelectTrigger ref={ref}>Content</SelectTrigger>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('SelectValue', () => {
    it('renders select value', () => {
      render(<SelectValue placeholder='Choose an option' />);
      const value = screen.getByTestId('select-value');
      expect(value).toBeInTheDocument();
    });

    it('displays placeholder', () => {
      render(<SelectValue placeholder='Choose an option' />);
      expect(screen.getByText('Choose an option')).toBeInTheDocument();
    });
  });

  describe('SelectContent', () => {
    it('renders select content', () => {
      render(<SelectContent>Content items</SelectContent>);
      expect(screen.getByTestId('select-content')).toBeInTheDocument();
      expect(screen.getByTestId('select-portal')).toBeInTheDocument();
      expect(screen.getByTestId('select-viewport')).toBeInTheDocument();
    });

    it('applies default classes', () => {
      render(<SelectContent>Content</SelectContent>);
      const content = screen.getByTestId('select-content');
      expect(content).toHaveClass(
        'relative',
        'z-50',
        'min-w-[8rem]',
        'overflow-hidden',
        'rounded-md',
        'border',
        'bg-popover'
      );
    });

    it('applies custom className', () => {
      render(<SelectContent className='custom-content'>Content</SelectContent>);
      const content = screen.getByTestId('select-content');
      expect(content).toHaveClass('custom-content');
    });

    it('sets position prop', () => {
      render(<SelectContent position='item-aligned'>Content</SelectContent>);
      const content = screen.getByTestId('select-content');
      expect(content).toHaveAttribute('data-position', 'item-aligned');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<SelectContent ref={ref}>Content</SelectContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('SelectLabel', () => {
    it('renders select label', () => {
      render(<SelectLabel>Label text</SelectLabel>);
      const label = screen.getByTestId('select-label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Label text');
    });

    it('applies default classes', () => {
      render(<SelectLabel>Label</SelectLabel>);
      const label = screen.getByTestId('select-label');
      expect(label).toHaveClass(
        'py-1.5',
        'pl-8',
        'pr-2',
        'text-sm',
        'font-semibold'
      );
    });

    it('applies custom className', () => {
      render(<SelectLabel className='custom-label'>Label</SelectLabel>);
      const label = screen.getByTestId('select-label');
      expect(label).toHaveClass('custom-label');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<SelectLabel ref={ref}>Label</SelectLabel>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('SelectItem', () => {
    it('renders select item', () => {
      render(<SelectItem value='item1'>Item 1</SelectItem>);
      const item = screen.getByTestId('select-item');
      expect(item).toBeInTheDocument();
      expect(screen.getByTestId('select-item-text')).toHaveTextContent(
        'Item 1'
      );
    });

    it('applies default classes', () => {
      render(<SelectItem value='item'>Item</SelectItem>);
      const item = screen.getByTestId('select-item');
      expect(item).toHaveClass(
        'relative',
        'flex',
        'w-full',
        'cursor-default',
        'select-none',
        'items-center',
        'rounded-sm'
      );
    });

    it('applies custom className', () => {
      render(
        <SelectItem className='custom-item' value='item'>
          Item
        </SelectItem>
      );
      const item = screen.getByTestId('select-item');
      expect(item).toHaveClass('custom-item');
    });

    it('includes item indicator with check icon', () => {
      render(<SelectItem value='item'>Item</SelectItem>);
      expect(screen.getByTestId('select-item-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('check')).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <SelectItem ref={ref} value='item'>
          Item
        </SelectItem>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('SelectSeparator', () => {
    it('renders select separator', () => {
      render(<SelectSeparator />);
      const separator = screen.getByTestId('select-separator');
      expect(separator).toBeInTheDocument();
    });

    it('applies default classes', () => {
      render(<SelectSeparator />);
      const separator = screen.getByTestId('select-separator');
      expect(separator).toHaveClass('-mx-1', 'my-1', 'h-px', 'bg-muted');
    });

    it('applies custom className', () => {
      render(<SelectSeparator className='custom-separator' />);
      const separator = screen.getByTestId('select-separator');
      expect(separator).toHaveClass('custom-separator');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<SelectSeparator ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Complete Select Structure', () => {
    it('renders complete select with all components', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder='Select an option' />
          </SelectTrigger>
          <SelectContent>
            <SelectLabel>Options</SelectLabel>
            <SelectItem value='option1'>Option 1</SelectItem>
            <SelectItem value='option2'>Option 2</SelectItem>
            <SelectSeparator />
            <SelectItem value='option3'>Option 3</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId('select-root')).toBeInTheDocument();
      expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
      expect(screen.getByText('Select an option')).toBeInTheDocument();
      expect(screen.getByTestId('select-content')).toBeInTheDocument();
      expect(screen.getByText('Options')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
      expect(screen.getByTestId('select-separator')).toBeInTheDocument();
    });
  });
});
