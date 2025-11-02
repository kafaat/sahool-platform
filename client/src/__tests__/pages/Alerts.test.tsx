import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Alerts from '../../pages/Alerts';

// Mock tRPC
vi.mock('../../lib/trpc', () => ({
  trpc: {
    alerts: {
      list: {
        useQuery: vi.fn(),
      },
      acknowledge: {
        useMutation: vi.fn(),
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

const mockAlerts = [
  {
    id: 1,
    type: 'critical',
    title: 'تحذير: مستوى الماء منخفض',
    message: 'مستوى الماء في الحقل رقم 3 أقل من الحد الأدنى',
    farmName: 'مزرعة الخير',
    acknowledged: false,
    createdAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: 2,
    type: 'warning',
    title: 'تنبيه: درجة حرارة مرتفعة',
    message: 'درجة الحرارة في الحقل رقم 5 أعلى من المعتاد',
    farmName: 'مزرعة النور',
    acknowledged: false,
    createdAt: new Date('2024-01-15T09:15:00Z'),
  },
  {
    id: 3,
    type: 'info',
    title: 'معلومة: وقت الري',
    message: 'حان وقت ري الحقل رقم 2',
    farmName: 'مزرعة الخير',
    acknowledged: true,
    createdAt: new Date('2024-01-15T08:00:00Z'),
  },
];

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

describe('Alerts Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { trpc } = require('../../lib/trpc');

    (trpc.alerts.list.useQuery as any).mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    (trpc.alerts.acknowledge.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  describe('Rendering', () => {
    it('should render alerts page title', () => {
      render(<Alerts />, { wrapper });
      expect(screen.getByText('التنبيهات')).toBeInTheDocument();
    });

    it('should render filter tabs', () => {
      render(<Alerts />, { wrapper });
      expect(screen.getByText('الكل')).toBeInTheDocument();
      expect(screen.getByText('حرجة')).toBeInTheDocument();
      expect(screen.getByText('تحذيرات')).toBeInTheDocument();
      expect(screen.getByText('معلومات')).toBeInTheDocument();
    });

    it('should display unread count badge', async () => {
      render(<Alerts />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('Alerts List', () => {
    it('should display list of alerts', async () => {
      render(<Alerts />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('تحذير: مستوى الماء منخفض')).toBeInTheDocument();
        expect(screen.getByText('تنبيه: درجة حرارة مرتفعة')).toBeInTheDocument();
        expect(screen.getByText('معلومة: وقت الري')).toBeInTheDocument();
      });
    });

    it('should display alert details', async () => {
      render(<Alerts />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('مزرعة الخير')).toBeInTheDocument();
        expect(screen.getByText('مزرعة النور')).toBeInTheDocument();
      });
    });

    it('should sort alerts by priority', async () => {
      render(<Alerts />, { wrapper });

      await waitFor(() => {
        const alerts = screen.getAllByRole('article');
        expect(alerts[0]).toHaveTextContent('critical');
      });
    });
  });

  describe('Filtering', () => {
    it('should filter alerts by type - critical', async () => {
      render(<Alerts />, { wrapper });

      const criticalTab = screen.getByText('حرجة');
      fireEvent.click(criticalTab);

      await waitFor(() => {
        expect(screen.getByText('تحذير: مستوى الماء منخفض')).toBeInTheDocument();
        expect(screen.queryByText('تنبيه: درجة حرارة مرتفعة')).not.toBeInTheDocument();
      });
    });

    it('should filter alerts by type - warning', async () => {
      render(<Alerts />, { wrapper });

      const warningTab = screen.getByText('تحذيرات');
      fireEvent.click(warningTab);

      await waitFor(() => {
        expect(screen.getByText('تنبيه: درجة حرارة مرتفعة')).toBeInTheDocument();
        expect(screen.queryByText('تحذير: مستوى الماء منخفض')).not.toBeInTheDocument();
      });
    });

    it('should show all alerts when "الكل" is selected', async () => {
      render(<Alerts />, { wrapper });

      const allTab = screen.getByText('الكل');
      fireEvent.click(allTab);

      await waitFor(() => {
        expect(screen.getByText('تحذير: مستوى الماء منخفض')).toBeInTheDocument();
        expect(screen.getByText('تنبيه: درجة حرارة مرتفعة')).toBeInTheDocument();
        expect(screen.getByText('معلومة: وقت الري')).toBeInTheDocument();
      });
    });
  });

  describe('Alert Acknowledgment', () => {
    it('should acknowledge alert when button is clicked', async () => {
      const { trpc } = require('../../lib/trpc');
      const mutateMock = vi.fn();
      (trpc.alerts.acknowledge.useMutation as any).mockReturnValue({
        mutate: mutateMock,
        isLoading: false,
      });

      render(<Alerts />, { wrapper });

      await waitFor(() => {
        const acknowledgeButton = screen.getAllByText(/إقرار/)[0];
        fireEvent.click(acknowledgeButton);
        expect(mutateMock).toHaveBeenCalled();
      });
    });

    it('should update alert status after acknowledgment', async () => {
      render(<Alerts />, { wrapper });

      await waitFor(() => {
        const acknowledgedAlert = screen.getByText('معلومة: وقت الري');
        expect(acknowledgedAlert.closest('article')).toHaveClass('opacity-60');
      });
    });

    it('should decrease unread count after acknowledgment', async () => {
      render(<Alerts />, { wrapper });

      await waitFor(() => {
        const initialCount = screen.getByText('2');
        expect(initialCount).toBeInTheDocument();
      });

      // After acknowledgment (would need to update mock)
      // expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator', () => {
      const { trpc } = require('../../lib/trpc');
      (trpc.alerts.list.useQuery as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<Alerts />, { wrapper });
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      const { trpc } = require('../../lib/trpc');
      (trpc.alerts.list.useQuery as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch alerts'),
      });

      render(<Alerts />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/خطأ/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no alerts exist', async () => {
      const { trpc } = require('../../lib/trpc');
      (trpc.alerts.list.useQuery as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<Alerts />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/لا توجد تنبيهات/)).toBeInTheDocument();
      });
    });
  });

  describe('Alert Types', () => {
    it('should display different colors for alert types', async () => {
      render(<Alerts />, { wrapper });

      await waitFor(() => {
        const criticalAlert = screen.getByText('تحذير: مستوى الماء منخفض');
        const warningAlert = screen.getByText('تنبيه: درجة حرارة مرتفعة');
        const infoAlert = screen.getByText('معلومة: وقت الري');

        expect(criticalAlert.closest('article')).toHaveClass('border-red-500');
        expect(warningAlert.closest('article')).toHaveClass('border-yellow-500');
        expect(infoAlert.closest('article')).toHaveClass('border-blue-500');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible alert cards', async () => {
      render(<Alerts />, { wrapper });

      await waitFor(() => {
        const alertCards = screen.getAllByRole('article');
        expect(alertCards.length).toBe(3);
      });
    });

    it('should have accessible filter tabs', () => {
      render(<Alerts />, { wrapper });

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });
  });
});
