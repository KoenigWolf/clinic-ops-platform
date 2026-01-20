"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Receipt, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { InvoiceDialog } from "@/components/billing/invoice-dialog";

const statusLabels = {
  DRAFT: "下書き",
  SENT: "送付済",
  PAID: "支払済",
  OVERDUE: "期限超過",
  CANCELLED: "キャンセル",
};

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function BillingPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, refetch } = trpc.billing.list.useQuery({
    status: statusFilter !== "ALL" ? statusFilter as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" : undefined,
    page,
    limit: 20,
  });

  const updateStatusMutation = trpc.billing.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("ステータスを更新しました");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新に失敗しました");
    },
  });

  const recordPaymentMutation = trpc.billing.recordPayment.useMutation({
    onSuccess: () => {
      toast.success("支払いを記録しました");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "記録に失敗しました");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">請求管理</h1>
          <p className="text-gray-500">請求書の作成・管理</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規請求書
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              今月の売上
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ¥{(data?.monthlyRevenue || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              未払い件数
            </CardTitle>
            <Receipt className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {data?.unpaidCount || 0}件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              期限超過
            </CardTitle>
            <Receipt className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {data?.overdueCount || 0}件
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">ステータス:</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">すべて</SelectItem>
                <SelectItem value="DRAFT">下書き</SelectItem>
                <SelectItem value="SENT">送付済</SelectItem>
                <SelectItem value="PAID">支払済</SelectItem>
                <SelectItem value="OVERDUE">期限超過</SelectItem>
                <SelectItem value="CANCELLED">キャンセル</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>請求書一覧 ({data?.total || 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              請求書がありません
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>請求番号</TableHead>
                    <TableHead>請求日</TableHead>
                    <TableHead>患者</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>支払期限</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoiceDate), "yyyy/MM/dd")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {invoice.patient.lastName} {invoice.patient.firstName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {invoice.patient.patientNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ¥{invoice.total.toLocaleString()}
                        <span className="text-sm text-gray-500 font-normal block">
                          (税込)
                        </span>
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate
                          ? format(new Date(invoice.dueDate), "yyyy/MM/dd")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[invoice.status]}>
                          {statusLabels[invoice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: invoice.id,
                                  status: "SENT",
                                })
                              }
                            >
                              送付
                            </Button>
                          )}
                          {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                            <Button
                              size="sm"
                              onClick={() =>
                                recordPaymentMutation.mutate({
                                  id: invoice.id,
                                  paymentMethod: "現金",
                                })
                              }
                            >
                              支払確認
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    {data.total}件中 {(page - 1) * 20 + 1}-{Math.min(page * 20, data.total)}件
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      前へ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                      disabled={page === data.pages}
                    >
                      次へ
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          refetch();
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
