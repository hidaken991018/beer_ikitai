import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

import { AppLayout } from '@/components/layout/AppLayout';


// Mock AuthProvider
// jest.mock('@/store/store', () => ({
//   useAuthContext: () => ({
//     authState: { isAuthenticated: false },
//     logout: jest.fn(),
//   }),
// }));

// Mock Footer component
jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid='footer'>Footer Component</footer>,
}));

describe('AppLayout Component', () => {
  it('renders children content', () => {
    render(
      <Provider store={jest.requireActual('@/store/store').store}>
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      </Provider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

});

it('renders footer component', () => {
  render(
    <Provider store={jest.requireActual('@/store/store').store}>
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    </Provider>
  );

  expect(screen.getByTestId('footer')).toBeInTheDocument();
  expect(screen.getByText('Footer Component')).toBeInTheDocument();
});

it('renders main content area with correct classes', () => {
  render(
    <Provider store={jest.requireActual('@/store/store').store}>
      <AppLayout>
        <div data-testid='test-content'>Test Content</div>
      </AppLayout>
    </Provider>
  );

  const main = screen.getByRole('main');
  expect(main).toBeInTheDocument();
  expect(main).toHaveClass('flex-1', 'container', 'mx-auto', 'px-4', 'py-6');
});


it('renders with multiple children', () => {
  render(
    <Provider store={jest.requireActual('@/store/store').store}>
      <AppLayout>
        <div>First Child</div>
        <div>Second Child</div>
        <span>Third Child</span>
      </AppLayout>
    </Provider>
  );

  expect(screen.getByText('First Child')).toBeInTheDocument();
  expect(screen.getByText('Second Child')).toBeInTheDocument();
  expect(screen.getByText('Third Child')).toBeInTheDocument();
});

it('renders with complex nested content', () => {
  render(
    <Provider store={jest.requireActual('@/store/store').store}>
      <AppLayout>
        <div>
          <h1>Page Title</h1>
          <section>
            <p>Page content</p>
            <button>Action Button</button>
          </section>
        </div>
      </AppLayout>
    </Provider>
  );

  expect(screen.getByText('Page Title')).toBeInTheDocument();
  expect(screen.getByText('Page content')).toBeInTheDocument();
  expect(screen.getByText('Action Button')).toBeInTheDocument();
});
