import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import type { UserRole } from "@prisma/client";
import DashboardPage from "./page";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock tRPC
const mockUseQuery = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: {
    dashboard: {
      get: {
        useQuery: () => mockUseQuery(),
      },
    },
  },
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ローディング状態", () => {
    it("セッションロード中はスケルトンを表示", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "loading",
        update: vi.fn(),
      });
      mockUseQuery.mockReturnValue({ data: null, isLoading: false });

      render(<DashboardPage />);

      // スケルトンが表示されていることを確認
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("データロード中はスケルトンを表示", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "1",
            email: "test@example.com",
            name: "Test",
            role: "DOCTOR" as UserRole,
            tenantId: "tenant-1",
          },
          expires: "2025-01-01",
        },
        status: "authenticated",
        update: vi.fn(),
      });
      mockUseQuery.mockReturnValue({ data: null, isLoading: true });

      render(<DashboardPage />);

      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("データ表示", () => {
    const mockSession = {
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "田中先生",
          role: "DOCTOR" as UserRole,
          tenantId: "tenant-1",
        },
        expires: "2025-01-01",
      },
      status: "authenticated" as const,
      update: vi.fn(),
    };

    it("統計情報が正しく表示される", async () => {
      vi.mocked(useSession).mockReturnValue(mockSession);
      mockUseQuery.mockReturnValue({
        data: {
          totalPatients: 150,
          todayAppointments: [],
          pendingPrescriptions: 3,
          monthlyRevenue: 500000,
          recentPatients: [],
        },
        isLoading: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("150")).toBeInTheDocument();
        expect(screen.getByText("0")).toBeInTheDocument(); // todayAppointments count
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("¥500,000")).toBeInTheDocument();
      });
    });

    it("ユーザー名が表示される", async () => {
      vi.mocked(useSession).mockReturnValue(mockSession);
      mockUseQuery.mockReturnValue({
        data: {
          totalPatients: 0,
          todayAppointments: [],
          pendingPrescriptions: 0,
          monthlyRevenue: 0,
          recentPatients: [],
        },
        isLoading: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/田中先生さん/)).toBeInTheDocument();
      });
    });

    it("セッションにnameがない場合「ユーザー」を表示", async () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "1",
            email: "test@example.com",
            name: undefined as unknown as string,
            role: "DOCTOR" as UserRole,
            tenantId: "tenant-1",
          },
          expires: "2025-01-01",
        },
        status: "authenticated",
        update: vi.fn(),
      });
      mockUseQuery.mockReturnValue({
        data: {
          totalPatients: 0,
          todayAppointments: [],
          pendingPrescriptions: 0,
          monthlyRevenue: 0,
          recentPatients: [],
        },
        isLoading: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/ユーザーさん/)).toBeInTheDocument();
      });
    });
  });

  describe("空データ状態（正常）", () => {
    const mockSession = {
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test",
          role: "DOCTOR" as UserRole,
          tenantId: "tenant-1",
        },
        expires: "2025-01-01",
      },
      status: "authenticated" as const,
      update: vi.fn(),
    };

    it("予約がない場合は「本日の予約はありません」を表示", async () => {
      vi.mocked(useSession).mockReturnValue(mockSession);
      mockUseQuery.mockReturnValue({
        data: {
          totalPatients: 0,
          todayAppointments: [],
          pendingPrescriptions: 0,
          monthlyRevenue: 0,
          recentPatients: [],
        },
        isLoading: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("本日の予約はありません")).toBeInTheDocument();
      });
    });

    it("患者がいない場合は「患者データがありません」を表示", async () => {
      vi.mocked(useSession).mockReturnValue(mockSession);
      mockUseQuery.mockReturnValue({
        data: {
          totalPatients: 0,
          todayAppointments: [],
          pendingPrescriptions: 0,
          monthlyRevenue: 0,
          recentPatients: [],
        },
        isLoading: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("患者データがありません")).toBeInTheDocument();
      });
    });
  });

  describe("予約リスト表示", () => {
    const mockSession = {
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test",
          role: "DOCTOR" as UserRole,
          tenantId: "tenant-1",
        },
        expires: "2025-01-01",
      },
      status: "authenticated" as const,
      update: vi.fn(),
    };

    it("予約がある場合はリストを表示", async () => {
      vi.mocked(useSession).mockReturnValue(mockSession);
      mockUseQuery.mockReturnValue({
        data: {
          totalPatients: 1,
          todayAppointments: [
            {
              id: "apt-1",
              startTime: new Date("2025-01-20T09:00:00"),
              endTime: new Date("2025-01-20T09:30:00"),
              status: "SCHEDULED",
              isOnline: false,
              patient: { lastName: "山田", firstName: "太郎" },
            },
          ],
          pendingPrescriptions: 0,
          monthlyRevenue: 0,
          recentPatients: [],
        },
        isLoading: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("山田 太郎")).toBeInTheDocument();
        expect(screen.getByText("予約済")).toBeInTheDocument();
      });
    });

    it("オンライン診療の場合はバッジを表示", async () => {
      vi.mocked(useSession).mockReturnValue(mockSession);
      mockUseQuery.mockReturnValue({
        data: {
          totalPatients: 1,
          todayAppointments: [
            {
              id: "apt-1",
              startTime: new Date("2025-01-20T09:00:00"),
              endTime: new Date("2025-01-20T09:30:00"),
              status: "SCHEDULED",
              isOnline: true,
              patient: { lastName: "佐藤", firstName: "花子" },
            },
          ],
          pendingPrescriptions: 0,
          monthlyRevenue: 0,
          recentPatients: [],
        },
        isLoading: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("オンライン")).toBeInTheDocument();
      });
    });

    it("各ステータスが正しいラベルで表示される", async () => {
      vi.mocked(useSession).mockReturnValue(mockSession);

      const statuses = [
        { status: "SCHEDULED", label: "予約済" },
        { status: "CONFIRMED", label: "確認済" },
        { status: "WAITING", label: "待機中" },
        { status: "IN_PROGRESS", label: "診療中" },
        { status: "COMPLETED", label: "完了" },
        { status: "CANCELLED", label: "キャンセル" },
      ];

      for (const { status, label } of statuses) {
        mockUseQuery.mockReturnValue({
          data: {
            totalPatients: 1,
            todayAppointments: [
              {
                id: "apt-1",
                startTime: new Date("2025-01-20T09:00:00"),
                endTime: new Date("2025-01-20T09:30:00"),
                status,
                isOnline: false,
                patient: { lastName: "テスト", firstName: "患者" },
              },
            ],
            pendingPrescriptions: 0,
            monthlyRevenue: 0,
            recentPatients: [],
          },
          isLoading: false,
        });

        const { unmount } = render(<DashboardPage />);

        await waitFor(() => {
          expect(screen.getByText(label)).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe("最近の患者表示", () => {
    const mockSession = {
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test",
          role: "DOCTOR" as UserRole,
          tenantId: "tenant-1",
        },
        expires: "2025-01-01",
      },
      status: "authenticated" as const,
      update: vi.fn(),
    };

    it("最近の患者が表示される", async () => {
      vi.mocked(useSession).mockReturnValue(mockSession);
      mockUseQuery.mockReturnValue({
        data: {
          totalPatients: 1,
          todayAppointments: [],
          pendingPrescriptions: 0,
          monthlyRevenue: 0,
          recentPatients: [
            {
              id: "p-1",
              patientNumber: "P001",
              lastName: "鈴木",
              firstName: "一郎",
              updatedAt: new Date("2025-01-19"),
            },
          ],
        },
        isLoading: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("鈴木 一郎")).toBeInTheDocument();
        // 日付が表示されていることを確認（新UIでは患者番号ではなく日付を表示）
        expect(screen.getByText("1/19")).toBeInTheDocument();
      });
    });
  });

  describe("null/undefined 処理", () => {
    const mockSession = {
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test",
          role: "DOCTOR" as UserRole,
          tenantId: "tenant-1",
        },
        expires: "2025-01-01",
      },
      status: "authenticated" as const,
      update: vi.fn(),
    };

    it("dataがundefinedでもクラッシュしない", async () => {
      vi.mocked(useSession).mockReturnValue(mockSession);
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      // クラッシュせずにレンダリングできることを確認
      expect(() => render(<DashboardPage />)).not.toThrow();

      await waitFor(() => {
        // デフォルト値が使用される（複数の0が表示される）
        const zeros = screen.getAllByText("0");
        expect(zeros.length).toBeGreaterThan(0);
      });
    });

    it("各フィールドがundefinedでもデフォルト値で表示", async () => {
      vi.mocked(useSession).mockReturnValue(mockSession);
      mockUseQuery.mockReturnValue({
        data: {
          totalPatients: undefined,
          todayAppointments: undefined,
          pendingPrescriptions: undefined,
          monthlyRevenue: undefined,
          recentPatients: undefined,
        },
        isLoading: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        // デフォルト値として 0 が表示される
        const zeros = screen.getAllByText("0");
        expect(zeros.length).toBeGreaterThan(0);
        // 売上は ¥0
        expect(screen.getByText("¥0")).toBeInTheDocument();
      });
    });
  });
});
