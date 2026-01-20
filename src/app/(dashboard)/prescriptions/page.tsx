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
import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusLabels = {
  PENDING: "未処理",
  DISPENSED: "調剤済",
  CANCELLED: "キャンセル",
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-700",
  DISPENSED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function PrescriptionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, refetch } = trpc.prescription.list.useQuery({
    status: statusFilter !== "ALL" ? statusFilter as "PENDING" | "DISPENSED" | "CANCELLED" : undefined,
    page,
    limit: 20,
  });

  const dispenseMutation = trpc.prescription.dispense.useMutation({
    onSuccess: () => {
      toast.success("調剤済みに更新しました");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新に失敗しました");
    },
  });

  const cancelMutation = trpc.prescription.cancel.useMutation({
    onSuccess: () => {
      toast.success("キャンセルしました");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "キャンセルに失敗しました");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">処方管理</h1>
        <p className="text-gray-500">処方箋の管理・調剤状況の確認</p>
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
                <SelectItem value="PENDING">未処理</SelectItem>
                <SelectItem value="DISPENSED">調剤済</SelectItem>
                <SelectItem value="CANCELLED">キャンセル</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>処方一覧 ({data?.total || 0}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.prescriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              処方データがありません
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>処方日</TableHead>
                    <TableHead>患者</TableHead>
                    <TableHead>薬剤名</TableHead>
                    <TableHead>用法・用量</TableHead>
                    <TableHead>日数</TableHead>
                    <TableHead>担当医</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.prescriptions.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell>
                        {format(new Date(rx.prescriptionDate), "yyyy/MM/dd")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {rx.patient.lastName} {rx.patient.firstName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {rx.patient.patientNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {rx.medicationName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{rx.dosage}</p>
                          <p className="text-sm text-gray-500">{rx.frequency}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rx.duration}日分
                        <span className="text-sm text-gray-500 ml-1">
                          ({rx.quantity}{rx.unit})
                        </span>
                      </TableCell>
                      <TableCell>{rx.doctor.name}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[rx.status]}>
                          {statusLabels[rx.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {rx.status === "PENDING" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => dispenseMutation.mutate({ id: rx.id })}
                              disabled={dispenseMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              調剤済
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => cancelMutation.mutate({ id: rx.id })}
                              disabled={cancelMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {rx.status === "DISPENSED" && rx.dispensedAt && (
                          <span className="text-sm text-gray-500">
                            {format(new Date(rx.dispensedAt), "MM/dd HH:mm")}
                          </span>
                        )}
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
    </div>
  );
}
