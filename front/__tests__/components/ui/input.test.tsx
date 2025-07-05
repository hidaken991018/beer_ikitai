import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('renders input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('applies default type when not specified', () => {
    render(<Input data-testid='input' />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('applies specified type', () => {
    render(<Input type='email' data-testid='input' />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('applies default classes', () => {
    render(<Input data-testid='input' />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass(
      'flex',
      'h-9',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-transparent',
      'px-3',
      'py-1',
      'text-sm',
      'shadow-sm'
    );
  });

  it('applies custom className', () => {
    render(<Input className='custom-class' data-testid='input' />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-class');
  });

  it('handles value and onChange', () => {
    const handleChange = jest.fn();
    render(<Input value='test value' onChange={handleChange} />);
    const input = screen.getByDisplayValue('test value');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('handles placeholder', () => {
    render(<Input placeholder='Enter text here' />);
    const input = screen.getByPlaceholderText('Enter text here');
    expect(input).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Input disabled data-testid='input' />);
    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');

    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('spreads other props correctly', () => {
    render(
      <Input
        data-testid='input'
        aria-label='Test input'
        maxLength={10}
        autoComplete='off'
      />
    );
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('aria-label', 'Test input');
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('autoComplete', 'off');
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input type='password' data-testid='input' />);
    let input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input type='number' data-testid='input' />);
    input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'number');

    rerender(<Input type='email' data-testid='input' />);
    input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('handles required attribute', () => {
    render(<Input required data-testid='input' />);
    const input = screen.getByTestId('input');
    expect(input).toBeRequired();
  });

  it('handles readonly attribute', () => {
    render(<Input readOnly data-testid='input' />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('readonly');
  });

  it('handles form attributes', () => {
    render(
      <Input
        name='username'
        id='username-input'
        form='login-form'
        data-testid='input'
      />
    );
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('name', 'username');
    expect(input).toHaveAttribute('id', 'username-input');
    expect(input).toHaveAttribute('form', 'login-form');
  });

  it('maintains focus styles classes', () => {
    render(<Input data-testid='input' />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-1',
      'focus-visible:ring-ring'
    );
  });

  it('maintains disabled styles classes', () => {
    render(<Input disabled data-testid='input' />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass(
      'disabled:cursor-not-allowed',
      'disabled:opacity-50'
    );
  });
});
