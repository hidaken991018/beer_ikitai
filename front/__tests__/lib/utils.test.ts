import { cn } from '@/lib/utils';

describe('cn Utility Function', () => {
  it('combines class names correctly', () => {
    const result = cn('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('handles conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'hidden');
    expect(result).toBe('base conditional');
  });

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });

  it('handles empty strings', () => {
    const result = cn('base', '', 'end');
    expect(result).toBe('base end');
  });

  it('merges tailwind classes correctly', () => {
    // This tests the tailwind-merge functionality
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toBe('bg-blue-500'); // Later class should override
  });

  it('handles complex combinations', () => {
    const result = cn(
      'base-class',
      true && 'conditional-class',
      false && 'hidden-class',
      undefined,
      null,
      '',
      'final-class'
    );
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
    expect(result).toContain('final-class');
    expect(result).not.toContain('hidden-class');
  });

  it('returns empty string for no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('returns empty string for all falsy arguments', () => {
    const result = cn(false, null, undefined, '', 0);
    expect(result).toBe('');
  });

  it('merges padding classes correctly', () => {
    const result = cn('p-4', 'p-6');
    expect(result).toBe('p-6');
  });

  it('merges margin classes correctly', () => {
    const result = cn('m-2', 'm-4', 'mt-8');
    expect(result).toBe('m-4 mt-8');
  });

  it('preserves non-conflicting classes', () => {
    const result = cn('bg-red-500', 'text-white', 'rounded', 'shadow');
    expect(result).toBe('bg-red-500 text-white rounded shadow');
  });
});
