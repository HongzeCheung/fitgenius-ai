import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner } from '../../components/Spinner';

describe('Spinner Component', () => {
  it('should render spinner element', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should have correct structure', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.animate-spin');
    // Spinner 组件应该有动画元素
    expect(spinner).toBeTruthy();
    expect(spinner).toHaveClass('rounded-full');
  });

  it('should match snapshot', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
