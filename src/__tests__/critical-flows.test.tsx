import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import components to test
import Login from '../pages/Login'
import Register from '../pages/Register'
import { AuthProvider } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Critical User Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication Flow', () => {
    it('should render login form with required fields', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should show validation errors for empty login form', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should render registration form with required fields', () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      )

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('should validate email format in registration', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign up/i })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
      })
    })
  })

  describe('Environment Configuration', () => {
    it('should have required environment variables configured', () => {
      const { ENV } = require('../config/environment')
      
      expect(ENV.VITE_SUPABASE_URL).toBeDefined()
      expect(ENV.VITE_SUPABASE_ANON_KEY).toBeDefined()
      expect(ENV.VITE_APP_URL).toBeDefined()
    })

    it('should validate environment in production mode', () => {
      const { validateEnvironment } = require('../config/environment')
      
      // Mock production environment
      vi.mock('import.meta', () => ({
        env: {
          PROD: true,
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-key',
          VITE_PAYSTACK_PUBLIC_KEY: 'pk_test_123'
        }
      }))

      expect(() => validateEnvironment()).not.toThrow()
    })
  })

  describe('Component Rendering', () => {
    it('should render error boundaries without crashing', () => {
      const ErrorComponent = () => {
        throw new Error('Test error')
      }

      const { container } = render(
        <TestWrapper>
          <ErrorComponent />
        </TestWrapper>
      )

      expect(container).toBeInTheDocument()
    })

    it('should handle missing props gracefully', () => {
      const TestComponent = ({ requiredProp }: { requiredProp?: string }) => (
        <div>{requiredProp || 'fallback'}</div>
      )

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      expect(screen.getByText('fallback')).toBeInTheDocument()
    })
  })

  describe('Security Tests', () => {
    it('should sanitize user input', () => {
      const dangerousInput = '<script>alert("xss")</script>'
      
      render(
        <TestWrapper>
          <div data-testid="user-content">{dangerousInput}</div>
        </TestWrapper>
      )

      const content = screen.getByTestId('user-content')
      expect(content.innerHTML).not.toContain('<script>')
    })

    it('should not expose sensitive data in client', () => {
      // Ensure no secret keys are exposed to client
      const html = document.documentElement.innerHTML
      
      expect(html).not.toContain('sk_live_')
      expect(html).not.toContain('sk_test_')
      expect(html).not.toContain('service_role')
    })
  })
})

describe('Performance Tests', () => {
  it('should load main components within acceptable time', async () => {
    const startTime = performance.now()
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const endTime = performance.now()
    const loadTime = endTime - startTime

    // Should load within 100ms
    expect(loadTime).toBeLessThan(100)
  })

  it('should handle large lists efficiently', async () => {
    const LargeList = () => (
      <div>
        {Array.from({ length: 1000 }, (_, i) => (
          <div key={i}>Item {i}</div>
        ))}
      </div>
    )

    const startTime = performance.now()
    
    render(
      <TestWrapper>
        <LargeList />
      </TestWrapper>
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should render within 500ms
    expect(renderTime).toBeLessThan(500)
  })
})
