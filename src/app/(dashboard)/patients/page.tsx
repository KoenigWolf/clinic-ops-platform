"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, FileText } from "lucide-react";
import { PatientDialog } from "@/components/patients/patient-dialog";
import { labels } from "@/lib/labels";

const { pages: { patients: pageLabels }, common } = labels;

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.patient.list.useQuery({
    search: search || undefined,
    page,
    limit: 20,
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
          {pageLabels.newPatient}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={pageLabels.searchPlaceholder}
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>{pageLabels.listTitle(data?.total || 0)}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">{common.loading}</div>
          ) : data?.patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {pageLabels.empty}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{pageLabels.table.patientNumber}</TableHead>
                    <TableHead>{pageLabels.table.name}</TableHead>
                    <TableHead>{pageLabels.table.gender}</TableHead>
                    <TableHead>{pageLabels.table.birthDate}</TableHead>
                    <TableHead>{pageLabels.table.phone}</TableHead>
                    <TableHead>{pageLabels.table.insuranceNumber}</TableHead>
                    <TableHead className="text-right">{common.action}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono">
                        {patient.patientNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {patient.lastName} {patient.firstName}
                        {patient.lastNameKana && (
                          <span className="block text-xs text-gray-400">
                            {patient.lastNameKana} {patient.firstNameKana}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {pageLabels.gender[patient.gender]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(patient.dateOfBirth).toLocaleDateString("ja-JP")}
                      </TableCell>
                      <TableCell>{patient.phone || "-"}</TableCell>
                      <TableCell>{patient.insuranceNumber || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/patients/${patient.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/records?patientId=${patient.id}`}>
                              <FileText className="h-4 w-4" />
                            </Link>
                          </Button>
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
                    {data.total}件中 {(page - 1) * 20 + 1}-{Math.min(page * 20, data.total)}件を表示
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

      {/* Create Patient Dialog */}
      <PatientDialog
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
