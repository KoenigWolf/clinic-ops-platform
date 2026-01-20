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
import { labels } from "@/lib/labels";
import { invoiceStatusConfig } from "@/lib/design-tokens";

const { pages: { billing: pageLabels }, common, messages } = labels;

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
      toast.success(messages.success.statusUpdated);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || messages.error.recordUpdateFailed);
    },
  });

  const recordPaymentMutation = trpc.billing.recordPayment.useMutation({
    onSuccess: () => {
      toast.success(messages.success.paymentRecorded);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || messages.error.recordUpdateFailed);
    },
  });

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
              ¥{(data?.monthlyRevenue || 0).toLocaleString()}
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
            <label className="text-sm font-medium">{pageLabels.statusFilter}</label>
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
                <SelectItem value="ALL">{pageLabels.filter.all}</SelectItem>
                <SelectItem value="DRAFT">{pageLabels.filter.draft}</SelectItem>
                <SelectItem value="SENT">{pageLabels.filter.sent}</SelectItem>
                <SelectItem value="PAID">{pageLabels.filter.paid}</SelectItem>
                <SelectItem value="OVERDUE">{pageLabels.filter.overdue}</SelectItem>
                <SelectItem value="CANCELLED">{pageLabels.filter.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{pageLabels.listTitle(data?.total || 0)}</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.invoices.length === 0 ? (
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
                        ¥{invoice.total.toLocaleString()}
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
                          {invoiceStatusConfig[invoice.status]?.label}
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
                              {pageLabels.actions.send}
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
                    {data.total}件中 {(page - 1) * 20 + 1}-{Math.min(page * 20, data.total)}件
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
