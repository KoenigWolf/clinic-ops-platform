"use client";

import { useMemo, useState } from "react";
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
import { labels } from "@/lib/labels";
import { invoiceStatusConfig } from "@/lib/design-tokens";
import { EmptyState } from "@/components/layout";

const { pages: { billing: pageLabels }, common, messages } = labels;
const PAGE_SIZE = 20;
const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export default function BillingPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = trpc.billing.list.useQuery({
    status: statusFilter !== "ALL" ? statusFilter as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const updateStatusMutation = trpc.billing.updateStatus.useMutation({
    onSuccess: () => {
      toast.success(messages.success.statusUpdated);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || messages.error.invoiceUpdateFailed);
    },
  });

  const recordPaymentMutation = trpc.billing.recordPayment.useMutation({
    onSuccess: () => {
      toast.success(messages.success.paymentRecorded);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || messages.error.paymentRecordFailed);
    },
  });

  const totalCount = data?.total ?? 0;
  const rangeStart = (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);
  const statusOptions = useMemo(() => ([
    { value: "ALL", label: pageLabels.filter.all },
    { value: "DRAFT", label: pageLabels.filter.draft },
    { value: "SENT", label: pageLabels.filter.sent },
    { value: "PAID", label: pageLabels.filter.paid },
    { value: "OVERDUE", label: pageLabels.filter.overdue },
    { value: "CANCELLED", label: pageLabels.filter.cancelled },
  ]), [pageLabels.filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageLabels.title}</h1>
          <p className="text-gray-500">{pageLabels.description}</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {pageLabels.newInvoice}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {pageLabels.stats.monthlyRevenue}
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {currencyFormatter.format(data?.monthlyRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {pageLabels.stats.unpaidCount}
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
              {pageLabels.stats.overdueCount}
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
            <label className="text-sm font-medium" htmlFor="invoice-status-filter">
              {pageLabels.statusFilter}
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="invoice-status-filter" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{pageLabels.listTitle(totalCount)}</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <EmptyState
              message={common.loadFailed}
              action={
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  {common.retry}
                </Button>
              }
            />
          ) : isLoading ? (
            <div className="text-center py-8 text-gray-500">{common.loading}</div>
          ) : data?.invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {pageLabels.empty}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{pageLabels.table.invoiceNumber}</TableHead>
                    <TableHead>{pageLabels.table.date}</TableHead>
                    <TableHead>{pageLabels.table.patient}</TableHead>
                    <TableHead>{pageLabels.table.amount}</TableHead>
                    <TableHead>{pageLabels.table.dueDate}</TableHead>
                    <TableHead>{common.status}</TableHead>
                    <TableHead className="text-right">{common.action}</TableHead>
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
                        {currencyFormatter.format(invoice.total)}
                        <span className="text-sm text-gray-500 font-normal block">
                          {common.taxIncluded}
                        </span>
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate
                          ? format(new Date(invoice.dueDate), "yyyy/MM/dd")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${invoiceStatusConfig[invoice.status]?.bg} ${invoiceStatusConfig[invoice.status]?.text}`}>
                          {invoiceStatusConfig[invoice.status]?.label ?? invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updateStatusMutation.isPending}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: invoice.id,
                                  status: "SENT",
                                })
                              }
                            >
                              {pageLabels.actions.send}
                            </Button>
                          )}
                          {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                            <Button
                              size="sm"
                              disabled={recordPaymentMutation.isPending}
                              onClick={() =>
                                recordPaymentMutation.mutate({
                                  id: invoice.id,
                                  paymentMethod: "現金",
                                })
                              }
                            >
                              {pageLabels.actions.confirmPayment}
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
                    {totalCount}件中 {rangeStart}-{rangeEnd}件
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {common.prev}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                      disabled={page === data.pages}
                    >
                      {common.next}
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
