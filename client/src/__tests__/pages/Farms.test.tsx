import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Farms from '../../pages/Farms';

// Mock tRPC
vi.mock('../../lib/trpc', () => ({
  trpc: {
    farms: {
      list: {
        useQuery: vi.fn(),
      },
      create: {
        useMutation: vi.fn(),
      },
      delete: {
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

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockFarms = [
  {
    id: 1,
    name: 'مزرعة الخير',
    area: 50,
    location: 'الرياض',
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    name: 'مزرعة النور',
    area: 75,
    location: 'القصيم',
    status: 'active',
    createdAt: new Date('2024-01-15'),
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

describe('Farms Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { trpc } = require('../../lib/trpc');

    (trpc.farms.list.useQuery as any).mockReturnValue({
      data: mockFarms,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    (trpc.farms.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    (trpc.farms.delete.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  describe('Rendering', () => {
    it('should render farms page title', () => {
      render(<Farms />, { wrapper });
      expect(screen.getByText('المزارع')).toBeInTheDocument();
    });

    it('should render add farm button', () => {
      render(<Farms />, { wrapper });
      expect(screen.getByText(/إضافة مزرعة/)).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<Farms />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/بحث/);
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Farm List', () => {
    it('should display list of farms', async () => {
      render(<Farms />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('مزرعة الخير')).toBeInTheDocument();
        expect(screen.getByText('مزرعة النور')).toBeInTheDocument();
      });
    });

    it('should display farm details', async () => {
      render(<Farms />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('الرياض')).toBeInTheDocument();
        expect(screen.getByText('القصيم')).toBeInTheDocument();
      });
    });

    it('should display farm count', async () => {
      render(<Farms />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/2.*مزرعة/)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter farms by name', async () => {
      render(<Farms />, { wrapper });

      const searchInput = screen.getByPlaceholderText(/بحث/);
      fireEvent.change(searchInput, { target: { value: 'الخير' } });

      await waitFor(() => {
        expect(screen.getByText('مزرعة الخير')).toBeInTheDocument();
        expect(screen.queryByText('مزرعة النور')).not.toBeInTheDocument();
      });
    });

    it('should show all farms when search is cleared', async () => {
      render(<Farms />, { wrapper });

      const searchInput = screen.getByPlaceholderText(/بحث/);
      fireEvent.change(searchInput, { target: { value: 'الخير' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('مزرعة الخير')).toBeInTheDocument();
        expect(screen.getByText('مزرعة النور')).toBeInTheDocument();
      });
    });

    it('should show no results message for invalid search', async () => {
      render(<Farms />, { wrapper });

      const searchInput = screen.getByPlaceholderText(/بحث/);
      fireEvent.change(searchInput, { target: { value: 'مزرعة غير موجودة' } });

      await waitFor(() => {
        expect(screen.getByText(/لا توجد نتائج/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator', () => {
      const { trpc } = require('../../lib/trpc');
      (trpc.farms.list.useQuery as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<Farms />, { wrapper });
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      const { trpc } = require('../../lib/trpc');
      (trpc.farms.list.useQuery as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch farms'),
      });

      render(<Farms />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/خطأ/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no farms exist', async () => {
      const { trpc } = require('../../lib/trpc');
      (trpc.farms.list.useQuery as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<Farms />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/لا توجد مزارع/)).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    it('should sort farms by name', async () => {
      render(<Farms />, { wrapper });

      const sortButton = screen.getByText(/ترتيب/);
      fireEvent.click(sortButton);

      await waitFor(() => {
        const farmNames = screen.getAllByRole('heading', { level: 3 });
        expect(farmNames[0]).toHaveTextContent('مزرعة الخير');
      });
    });

    it('should sort farms by area', async () => {
      render(<Farms />, { wrapper });

      const sortButton = screen.getByText(/المساحة/);
      fireEvent.click(sortButton);

      await waitFor(() => {
        const areas = screen.getAllByText(/هكتار/);
        expect(areas[0]).toHaveTextContent('50');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible farm cards', async () => {
      render(<Farms />, { wrapper });

      await waitFor(() => {
        const farmCards = screen.getAllByRole('article');
        expect(farmCards.length).toBe(2);
      });
    });

    it('should have accessible search input', () => {
      render(<Farms />, { wrapper });

      const searchInput = screen.getByPlaceholderText(/بحث/);
      expect(searchInput).toHaveAttribute('type', 'text');
    });
  });
});
