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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { InvoiceDialog } from "@/components/billing/invoice-dialog";
import { labels } from "@/lib/labels";
import { invoiceStatusConfig } from "@/lib/design-tokens";
import { EmptyState, GenericStatusBadge, PageHeader, Pagination, StatCard, StatGrid } from "@/components/layout";

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
  const statusOptions = [
    { value: "ALL", label: pageLabels.filter.all },
    { value: "DRAFT", label: pageLabels.filter.draft },
    { value: "SENT", label: pageLabels.filter.sent },
    { value: "PAID", label: pageLabels.filter.paid },
    { value: "OVERDUE", label: pageLabels.filter.overdue },
    { value: "CANCELLED", label: pageLabels.filter.cancelled },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {pageLabels.newInvoice}
          </Button>
        }
      />

      {/* Stats */}
      <StatGrid columns={3}>
        <StatCard
          label={pageLabels.stats.monthlyRevenue}
          value={currencyFormatter.format(data?.monthlyRevenue || 0)}
        />
        <StatCard
          label={pageLabels.stats.unpaidCount}
          value={`${data?.unpaidCount || 0}件`}
        />
        <StatCard
          label={pageLabels.stats.overdueCount}
          value={`${data?.overdueCount || 0}件`}
        />
      </StatGrid>

      {/* Filters */}
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

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{pageLabels.listTitle(totalCount)}</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <EmptyState message={common.loadFailed} onRetry={refetch} />
          ) : isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="h-4 w-20 hidden sm:block" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20 hidden lg:block" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : data?.invoices.length === 0 ? (
            <EmptyState message={pageLabels.empty} icon={Receipt} />
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">{pageLabels.table.invoiceNumber}</TableHead>
                      <TableHead className="hidden md:table-cell">{pageLabels.table.date}</TableHead>
                      <TableHead>{pageLabels.table.patient}</TableHead>
                      <TableHead>{pageLabels.table.amount}</TableHead>
                      <TableHead className="hidden lg:table-cell">{pageLabels.table.dueDate}</TableHead>
                      <TableHead>{common.status}</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">{common.action}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono hidden sm:table-cell">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(invoice.invoiceDate), "yyyy/MM/dd")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <Link
                              href={`/patients/${invoice.patient.id}`}
                              className="font-medium hover:underline"
                            >
                              {invoice.patient.lastName} {invoice.patient.firstName}
                            </Link>
                            <p className="text-sm text-gray-500">
                              {invoice.patient.patientNumber}
                            </p>
                            <p className="text-xs text-gray-400 sm:hidden">
                              {invoice.invoiceNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {currencyFormatter.format(invoice.total)}
                          <span className="text-xs text-gray-500 font-normal block md:hidden">
                            {format(new Date(invoice.invoiceDate), "MM/dd")}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {invoice.dueDate
                            ? format(new Date(invoice.dueDate), "yyyy/MM/dd")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <GenericStatusBadge
                            label={invoiceStatusConfig[invoice.status]?.label ?? invoice.status}
                            variant={
                              invoice.status === "PAID"
                                ? "success"
                                : invoice.status === "OVERDUE"
                                  ? "error"
                                  : invoice.status === "SENT"
                                    ? "info"
                                    : "neutral"
                            }
                          />
                          {/* Mobile actions */}
                          <div className="mt-2 sm:hidden">
                            {invoice.status === "DRAFT" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
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
                                className="w-full"
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
                        <TableCell className="text-right hidden sm:table-cell">
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
              </div>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {totalCount}件中 {rangeStart}-{rangeEnd}件
                  </p>
                  <Pagination
                    currentPage={page}
                    totalPages={data.pages}
                    onPageChange={setPage}
                  />
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
