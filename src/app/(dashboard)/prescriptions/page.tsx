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
import { labels } from "@/lib/labels";
import { prescriptionStatusConfig } from "@/lib/design-tokens";

const { pages: { prescriptions: pageLabels }, common, messages } = labels;

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{pageLabels.title}</h1>
        <p className="text-gray-500">{pageLabels.description}</p>
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
                <SelectItem value="PENDING">{pageLabels.filter.pending}</SelectItem>
                <SelectItem value="DISPENSED">{pageLabels.filter.dispensed}</SelectItem>
                <SelectItem value="CANCELLED">{pageLabels.filter.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{pageLabels.listTitle(data?.total || 0)}</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.prescriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {pageLabels.empty}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{pageLabels.table.date}</TableHead>
                    <TableHead>{pageLabels.table.patient}</TableHead>
                    <TableHead>{pageLabels.table.medication}</TableHead>
                    <TableHead>{pageLabels.table.dosage}</TableHead>
                    <TableHead>{pageLabels.table.days}</TableHead>
                    <TableHead>{pageLabels.table.doctor}</TableHead>
                    <TableHead>{common.status}</TableHead>
                    <TableHead className="text-right">{common.action}</TableHead>
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
                        <Badge className={`${prescriptionStatusConfig[rx.status]?.bg} ${prescriptionStatusConfig[rx.status]?.text}`}>
                          {prescriptionStatusConfig[rx.status]?.label}
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
                              {pageLabels.actions.dispensed}
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
    </div>
  );
}
