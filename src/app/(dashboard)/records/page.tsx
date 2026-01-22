"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText } from "lucide-react";
import { RecordDialog } from "@/components/records/record-dialog";
import { EmptyState, PageHeader } from "@/components/layout";
import { labels } from "@/lib/labels";

const { pages: { records: pageLabels }, common } = labels;

function RecordsContent() {
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId");

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patientIdParam);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const {
    data: patients,
    isLoading: isPatientsLoading,
    isError: isPatientsError,
  } = trpc.patient.list.useQuery({ limit: 100 });

  const {
    data: records,
    isLoading: isRecordsLoading,
    isError: isRecordsError,
    refetch,
  } = trpc.record.listByPatient.useQuery(
    { patientId: selectedPatientId || "" },
    { enabled: !!selectedPatientId }
  );

  const patientOptions = useMemo(() => patients?.patients ?? [], [patients]);

  const handlePatientChange = (value: string) => {
    setSelectedPatientId(value);
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={selectedPatientId ? (
          <Button
            onClick={() => {
              setSelectedRecord(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {pageLabels.newRecord}
          </Button>
        ) : null}
      />

      {/* Patient Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium" htmlFor="patient-select">
          {pageLabels.patientSelect}
        </label>
        <Select
          value={selectedPatientId || ""}
          onValueChange={handlePatientChange}
        >
          <SelectTrigger id="patient-select" className="w-[300px]">
            <SelectValue placeholder={pageLabels.patientPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {isPatientsLoading && (
              <SelectItem value="__loading__" disabled>
                {common.loading}
              </SelectItem>
            )}
            {isPatientsError && (
              <SelectItem value="__error__" disabled>
                {common.loadFailed}
              </SelectItem>
            )}
            {patientOptions.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.patientNumber} - {patient.lastName} {patient.firstName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records List */}
      {selectedPatientId ? (
        <div className="space-y-4">
          {isRecordsError ? (
            <EmptyState
              message={common.loadFailed}
              action={
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  {common.retry}
                </Button>
              }
            />
          ) : isRecordsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : records?.records.length === 0 ? (
            <EmptyState
              message={pageLabels.empty}
              icon={FileText}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRecord(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {pageLabels.createFirst}
                </Button>
              }
            />
          ) : (
            records?.records.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => {
                            setSelectedRecord(record.id);
                            setIsDialogOpen(true);
                          }}
                        >
                          {new Date(record.recordDate).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </button>
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {common.doctor}:{" "}
                        <Link
                          href={`/staff/${record.doctor.id}`}
                          className="hover:underline"
                        >
                          {record.doctor.name}
                        </Link>
                      </p>
                    </div>
                    {record.diagnosis && (
                      <Badge variant="secondary">{record.diagnosis}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {record.chiefComplaint && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-1">{pageLabels.soap.chiefComplaint}</h4>
                      <p className="text-sm">{record.chiefComplaint}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {record.subjective && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-600 mb-1">{pageLabels.soap.subjective}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{record.subjective}</p>
                      </div>
                    )}
                    {record.objective && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-600 mb-1">{pageLabels.soap.objective}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{record.objective}</p>
                      </div>
                    )}
                    {record.assessment && (
                      <div>
                        <h4 className="text-sm font-semibold text-orange-600 mb-1">{pageLabels.soap.assessment}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{record.assessment}</p>
                      </div>
                    )}
                    {record.plan && (
                      <div>
                        <h4 className="text-sm font-semibold text-purple-600 mb-1">{pageLabels.soap.plan}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{record.plan}</p>
                      </div>
                    )}
                  </div>

                  {record.prescriptions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">{pageLabels.soap.prescription}</h4>
                      <div className="flex flex-wrap gap-2">
                        {record.prescriptions.map((rx) => (
                          <Badge key={rx.id} variant="outline">
                            {rx.medicationName} {rx.dosage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <EmptyState message={pageLabels.patientPlaceholder} icon={FileText} />
      )}

      {/* Record Dialog */}
      {selectedPatientId && (
        <RecordDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          patientId={selectedPatientId}
          recordId={selectedRecord}
          onSuccess={() => {
            refetch();
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}

function RecordsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-[300px]" />
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<RecordsLoadingSkeleton />}>
      <RecordsContent />
    </Suspense>
  );
}
