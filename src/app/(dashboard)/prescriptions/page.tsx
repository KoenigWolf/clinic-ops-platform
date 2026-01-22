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
import { Check, X, Pill, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { labels } from "@/lib/labels";
import { prescriptionStatusConfig } from "@/lib/design-tokens";
import { EmptyState, GenericStatusBadge, PageHeader, Pagination, SelectFilter } from "@/components/layout";

const { pages: { prescriptions: pageLabels }, common, messages } = labels;
const PAGE_SIZE = 20;

export default function PrescriptionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = trpc.prescription.list.useQuery({
    status: statusFilter !== "ALL" ? statusFilter as "PENDING" | "DISPENSED" | "CANCELLED" : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const dispenseMutation = trpc.prescription.dispense.useMutation({
    onSuccess: () => {
      toast.success(messages.success.dispensed);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || messages.error.recordUpdateFailed);
    },
  });

  const cancelMutation = trpc.prescription.cancel.useMutation({
    onSuccess: () => {
      toast.success(messages.success.cancelled);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || messages.error.recordUpdateFailed);
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader title={pageLabels.title} description={pageLabels.description} />

      {/* Filters */}
      <SelectFilter
        label={pageLabels.statusFilter}
        value={statusFilter}
        onChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        options={[
          { value: "ALL", label: pageLabels.filter.all },
          { value: "PENDING", label: pageLabels.filter.pending },
          { value: "DISPENSED", label: pageLabels.filter.dispensed },
          { value: "CANCELLED", label: pageLabels.filter.cancelled },
        ]}
      />

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{pageLabels.listTitle(data?.total || 0)}</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <EmptyState message={common.loadFailed} onRetry={refetch} />
          ) : isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24 hidden md:block" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : data?.prescriptions.length === 0 ? (
            <EmptyState message={pageLabels.empty} icon={Pill} />
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">{pageLabels.table.date}</TableHead>
                      <TableHead>{pageLabels.table.patient}</TableHead>
                      <TableHead>{pageLabels.table.medication}</TableHead>
                      <TableHead className="hidden md:table-cell">{pageLabels.table.dosage}</TableHead>
                      <TableHead className="hidden lg:table-cell">{pageLabels.table.days}</TableHead>
                      <TableHead className="hidden md:table-cell">{pageLabels.table.doctor}</TableHead>
                      <TableHead>{common.status}</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">{common.action}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.prescriptions.map((rx) => (
                      <TableRow key={rx.id}>
                        <TableCell className="hidden sm:table-cell">
                          {format(new Date(rx.prescriptionDate), "yyyy/MM/dd")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <Link
                              href={`/patients/${rx.patient.id}`}
                              className="font-medium hover:underline"
                            >
                              {rx.patient.lastName} {rx.patient.firstName}
                            </Link>
                            <p className="text-sm text-gray-500">
                              {rx.patient.patientNumber}
                            </p>
                            <p className="text-xs text-gray-400 sm:hidden">
                              {format(new Date(rx.prescriptionDate), "MM/dd")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {rx.medicationName}
                            <p className="text-xs text-gray-500 md:hidden">
                              {rx.dosage} / {rx.frequency}
                            </p>
                            <p className="text-xs text-gray-400 lg:hidden md:hidden">
                              {rx.duration}日分
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>
                            <p>{rx.dosage}</p>
                            <p className="text-sm text-gray-500">{rx.frequency}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {rx.duration}日分
                          <span className="text-sm text-gray-500 ml-1">
                            ({rx.quantity}{rx.unit})
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Link
                            href={`/staff/${rx.doctor.id}`}
                            className="hover:underline"
                          >
                            {rx.doctor.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <GenericStatusBadge
                            label={prescriptionStatusConfig[rx.status]?.label ?? rx.status}
                            variant={
                              rx.status === "DISPENSED"
                                ? "success"
                                : rx.status === "PENDING"
                                  ? "warning"
                                  : "neutral"
                            }
                          />
                          {/* Mobile actions */}
                          <div className="mt-2 sm:hidden">
                            {rx.status === "PENDING" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => dispenseMutation.mutate({ id: rx.id })}
                                  disabled={dispenseMutation.isPending}
                                >
                                  {dispenseMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4 mr-1" />
                                  )}
                                  {pageLabels.actions.dispensed}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => cancelMutation.mutate({ id: rx.id })}
                                  disabled={cancelMutation.isPending}
                                >
                                  {cancelMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                            {rx.status === "DISPENSED" && rx.dispensedAt && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(rx.dispensedAt), "MM/dd HH:mm")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          {rx.status === "PENDING" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => dispenseMutation.mutate({ id: rx.id })}
                                disabled={dispenseMutation.isPending}
                              >
                                {dispenseMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                {pageLabels.actions.dispensed}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => cancelMutation.mutate({ id: rx.id })}
                                disabled={cancelMutation.isPending}
                              >
                                {cancelMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
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
              </div>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {data.total}件中 {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, data.total)}件
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
    </div>
  );
}
