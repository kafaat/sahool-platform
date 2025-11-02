import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../../pages/Dashboard';
import { trpc } from '../../lib/trpc';

// Mock tRPC
vi.mock('../../lib/trpc', () => ({
  trpc: {
    farms: {
      list: {
        useQuery: vi.fn(),
      },
    },
    fields: {
      list: {
        useQuery: vi.fn(),
      },
    },
    equipment: {
      list: {
        useQuery: vi.fn(),
      },
    },
    alerts: {
      list: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// Mock useAuth
vi.mock('../../_core/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'مستخدم تجريبي', role: 'admin' },
    loading: false,
    isAuthenticated: true,
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful data
    (trpc.farms.list.useQuery as any).mockReturnValue({
      data: [
        { id: 1, name: 'مزرعة الخير', area: 50, status: 'active' },
        { id: 2, name: 'مزرعة النور', area: 75, status: 'active' },
      ],
      isLoading: false,
      error: null,
    });

    (trpc.fields.list.useQuery as any).mockReturnValue({
      data: [
        { id: 1, name: 'حقل 1', area: 10 },
        { id: 2, name: 'حقل 2', area: 15 },
        { id: 3, name: 'حقل 3', area: 20 },
      ],
      isLoading: false,
      error: null,
    });

    (trpc.equipment.list.useQuery as any).mockReturnValue({
      data: [
        { id: 1, name: 'جرار 1', status: 'active' },
        { id: 2, name: 'جرار 2', status: 'maintenance' },
      ],
      isLoading: false,
      error: null,
    });

    (trpc.alerts.list.useQuery as any).mockReturnValue({
      data: [
        { id: 1, type: 'critical', message: 'تنبيه حرج' },
        { id: 2, type: 'warning', message: 'تحذير' },
        { id: 3, type: 'info', message: 'معلومة' },
      ],
      isLoading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('should render dashboard title', () => {
      render(<Dashboard />, { wrapper });
      expect(screen.getByText('لوحة التحكم')).toBeInTheDocument();
    });

    it('should render welcome message', () => {
      render(<Dashboard />, { wrapper });
      expect(screen.getByText(/مرحباً/)).toBeInTheDocument();
    });

    it('should render all KPI cards', async () => {
      render(<Dashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('المزارع')).toBeInTheDocument();
        expect(screen.getByText('الحقول')).toBeInTheDocument();
        expect(screen.getByText('المعدات')).toBeInTheDocument();
        expect(screen.getByText('التنبيهات')).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('should display correct farm count', async () => {
      render(<Dashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should display correct field count', async () => {
      render(<Dashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should display correct equipment count', async () => {
      render(<Dashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should display correct alert count', async () => {
      render(<Dashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicators', () => {
      (trpc.farms.list.useQuery as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<Dashboard />, { wrapper });
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data fetch fails', async () => {
      (trpc.farms.list.useQuery as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(<Dashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/خطأ/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', async () => {
      (trpc.farms.list.useQuery as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<Dashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });
  });
});
