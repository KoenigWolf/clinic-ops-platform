"use client";

import { useDeferredValue, useMemo, useState } from "react";
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
import { EmptyState, PageHeader, ResponsiveTable } from "@/components/layout";
import { labels } from "@/lib/labels";

const { pages: { patients: pageLabels }, common } = labels;
const PAGE_SIZE = 20;

export default function PatientsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchInput);
  const searchValue = useMemo(() => deferredSearch.trim(), [deferredSearch]);

  const { data, isLoading, isError, refetch } = trpc.patient.list.useQuery({
    search: searchValue || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const totalCount = data?.total ?? 0;
  const patientCountLabel = pageLabels.listTitle(totalCount);
  const rangeStart = (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {pageLabels.newPatient}
          </Button>
        }
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={pageLabels.searchPlaceholder}
                className="pl-10"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                aria-label={pageLabels.searchPlaceholder}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>{patientCountLabel}</CardTitle>
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
          ) : data?.patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {pageLabels.empty}
            </div>
          ) : (
            <>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">{pageLabels.table.patientNumber}</TableHead>
                      <TableHead>{pageLabels.table.name}</TableHead>
                      <TableHead className="hidden md:table-cell">{pageLabels.table.gender}</TableHead>
                      <TableHead className="hidden lg:table-cell">{pageLabels.table.birthDate}</TableHead>
                      <TableHead className="hidden md:table-cell">{pageLabels.table.phone}</TableHead>
                      <TableHead className="hidden lg:table-cell">{pageLabels.table.insuranceNumber}</TableHead>
                      <TableHead className="text-right">{common.action}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-mono hidden sm:table-cell">
                          {patient.patientNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/patients/${patient.id}`} className="hover:underline">
                            <span className="sm:hidden text-xs text-gray-500 block">{patient.patientNumber}</span>
                            {patient.lastName} {patient.firstName}
                            {patient.lastNameKana && (
                              <span className="block text-xs text-gray-400">
                                {patient.lastNameKana} {patient.firstNameKana}
                              </span>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">
                            {pageLabels.gender[patient.gender]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {new Date(patient.dateOfBirth).toLocaleDateString("ja-JP")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{patient.phone || "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{patient.insuranceNumber || "-"}</TableCell>
                        <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/patients/${patient.id}`} aria-label="患者詳細を表示">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/records?patientId=${patient.id}`} aria-label="診療記録を表示">
                              <FileText className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    {totalCount}件中 {rangeStart}-{rangeEnd}件を表示
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
