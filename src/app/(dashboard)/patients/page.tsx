"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers";
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
import { Plus, Search, Eye, FileText, Users, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientDialog } from "@/components/patients/patient-dialog";
import { EmptyState, PageHeader, ResponsiveTable } from "@/components/layout";
import { labels } from "@/lib/labels";
import type { PatientForEdit } from "@/domain/patient/schema";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Patient = RouterOutputs["patient"]["list"]["patients"][number];

const { pages: { patients: pageLabels }, common } = labels;
const PAGE_SIZE = 20;

// UTC安全な日付フォーマット（YYYY-MM-DD）
const toDateInput = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 患者データを編集用に変換する関数
const formatPatientForEdit = (patient: Patient): PatientForEdit => {
  return {
    ...patient,
    dateOfBirth: toDateInput(patient.dateOfBirth) ?? "",
    firstVisitDate: toDateInput(patient.firstVisitDate),
    lastVisitDate: toDateInput(patient.lastVisitDate),
    insuranceExpiration: toDateInput(patient.insuranceExpiration),
    publicExpiration: toDateInput(patient.publicExpiration),
  };
};

export default function PatientsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientForEdit | null>(null);
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

  // 新規登録ダイアログを開く
  const handleOpenCreateDialog = () => {
    setSelectedPatient(null);
    setIsDialogOpen(true);
  };

  // 編集ダイアログを開く
  const handleOpenEditDialog = (patient: Patient) => {
    setSelectedPatient(formatPatientForEdit(patient));
    setIsDialogOpen(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPatient(null);
  };

  // 保存成功時の処理
  const handleSuccess = () => {
    refetch();
    handleCloseDialog();
  };

  return (
    <div className="space-y-4 sm:space-y-4">
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={
          <Button onClick={handleOpenCreateDialog} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {pageLabels.newPatient}
          </Button>
        }
      />

      {/* Search */}
      <div className="relative">
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
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="h-4 w-20 hidden sm:block" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-12 hidden md:block" />
                  <Skeleton className="h-4 w-24 hidden lg:block" />
                  <Skeleton className="h-4 w-24 hidden md:block" />
                  <Skeleton className="h-8 w-16 ml-auto" />
                </div>
              ))}
            </div>
          ) : data?.patients.length === 0 ? (
            <EmptyState message={pageLabels.empty} icon={Users} />
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenEditDialog(patient)}
                              aria-label="患者情報を編集"
                            >
                              <Pencil className="h-4 w-4" />
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

      {/* Create/Edit Patient Dialog */}
      <PatientDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        onSuccess={handleSuccess}
        initialData={selectedPatient}
      />
    </div>
  );
}
