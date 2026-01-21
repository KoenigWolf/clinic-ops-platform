"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, StatusBadge } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { labels } from "@/lib/labels";
import {
  User,
  FileText,
  Pill,
  TestTube,
  Receipt,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Plus,
} from "lucide-react";
import { RecordDialog } from "@/components/records/record-dialog";

const { pages: { patients: patientsLabels }, common } = labels;

const prescriptionStatusLabels: Record<string, string> = {
  PENDING: "未処方",
  DISPENSED: "処方済",
  CANCELLED: "キャンセル",
};

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);

  const { data: patient, isLoading, isError, refetch } = trpc.patient.get.useQuery(
    { id: patientId },
    { enabled: !!patientId }
  );

  const { data: recordsData, refetch: refetchRecords } = trpc.record.listByPatient.useQuery(
    { patientId, limit: 50 },
    { enabled: !!patientId }
  );

  const { data: prescriptionsData } = trpc.prescription.list.useQuery(
    { patientId, limit: 50 },
    { enabled: !!patientId }
  );

  const { data: labResults } = trpc.portal.labResults.useQuery(
    { patientId, limit: 50 },
    { enabled: !!patientId }
  );

  const { data: billingData } = trpc.billing.list.useQuery(
    { patientId, limit: 50 },
    { enabled: !!patientId }
  );

  const { data: entAudiometry } = trpc.ent.audiometry.list.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  const { data: entEndoscopy } = trpc.ent.endoscopy.list.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <div className="lg:col-span-3">
            <Skeleton className="h-10 w-full mb-4" />
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <EmptyState
        message={common.loadFailed}
        action={
          <Button type="button" variant="outline" onClick={() => refetch()}>
            {common.retry}
          </Button>
        }
      />
    );
  }

  const fullName = `${patient.lastName} ${patient.firstName}`;
  const records = recordsData?.records || [];
  const prescriptions = prescriptionsData?.prescriptions || [];
  const invoices = billingData?.invoices || [];
  const audiometryTests = entAudiometry || [];
  const endoscopyExams = entEndoscopy || [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={fullName}
        description={`${patientsLabels.table.patientNumber}: ${patient.patientNumber}`}
        actions={
          <Button onClick={() => setIsRecordDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            カルテ作成
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(patient.dateOfBirth), "yyyy年M月d日", { locale: ja })}</span>
              <span>({patientsLabels.gender[patient.gender]})</span>
            </div>
            {patient.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span className="truncate">{patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{patient.address}</span>
              </div>
            )}
            {patient.allergies && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 rounded p-2 -mx-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-xs">アレルギー</div>
                  <div>{patient.allergies}</div>
                </div>
              </div>
            )}
            {patient.medicalHistory && (
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500 mb-1">既往歴</div>
                <div className="text-gray-700">{patient.medicalHistory}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Tabs defaultValue="records" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="records" className="gap-1.5">
                <FileText className="h-4 w-4" />
                カルテ
                {records.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{records.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="gap-1.5">
                <Pill className="h-4 w-4" />
                処方
                {prescriptions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{prescriptions.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tests" className="gap-1.5">
                <TestTube className="h-4 w-4" />
                検査
              </TabsTrigger>
              <TabsTrigger value="ent" className="gap-1.5">
                <Stethoscope className="h-4 w-4" />
                耳鼻科
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-1.5">
                <Receipt className="h-4 w-4" />
                請求
                {invoices.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{invoices.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {records.length === 0 ? (
                    <EmptyState message="診療記録がありません" />
                  ) : (
                    <div className="divide-y">
                      {records.map((record) => (
                        <div key={record.id} className="p-4 hover:bg-gray-50/50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-medium">
                                {format(new Date(record.recordDate), "yyyy年M月d日", { locale: ja })}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                {record.doctor.name}
                              </span>
                            </div>
                            {record.diagnosis && (
                              <Badge variant="outline">{record.diagnosis}</Badge>
                            )}
                          </div>
                          {record.chiefComplaint && (
                            <div className="text-sm text-gray-600 mb-2">
                              主訴: {record.chiefComplaint}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {record.subjective && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">S</span>
                                <p className="text-gray-700 line-clamp-2">{record.subjective}</p>
                              </div>
                            )}
                            {record.objective && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">O</span>
                                <p className="text-gray-700 line-clamp-2">{record.objective}</p>
                              </div>
                            )}
                            {record.assessment && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">A</span>
                                <p className="text-gray-700 line-clamp-2">{record.assessment}</p>
                              </div>
                            )}
                            {record.plan && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">P</span>
                                <p className="text-gray-700 line-clamp-2">{record.plan}</p>
                              </div>
                            )}
                          </div>
                          {record.prescriptions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {record.prescriptions.map((rx) => (
                                <Badge key={rx.id} variant="secondary" className="text-xs">
                                  {rx.medicationName}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {prescriptions.length === 0 ? (
                    <EmptyState message="処方履歴がありません" />
                  ) : (
                    <div className="divide-y">
                      {prescriptions.map((rx) => (
                        <div key={rx.id} className="p-4 hover:bg-gray-50/50">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-medium">{rx.medicationName}</span>
                              <div className="text-sm text-gray-500 mt-1">
                                {rx.dosage} / {rx.frequency} / {rx.duration}日分
                              </div>
                              {rx.instructions && (
                                <div className="text-sm text-gray-500">{rx.instructions}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={rx.status === "DISPENSED" ? "default" : "outline"}
                              >
                                {prescriptionStatusLabels[rx.status]}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {format(new Date(rx.prescriptionDate), "M/d", { locale: ja })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tests" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {(!labResults || labResults.length === 0) ? (
                    <EmptyState message="検査結果がありません" />
                  ) : (
                    <div className="divide-y">
                      {labResults.map((result) => (
                        <div key={result.id} className="p-4 hover:bg-gray-50/50">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-medium">{result.testName}</span>
                              <div className="text-lg font-semibold mt-1">
                                {result.result}
                                {result.unit && <span className="text-sm text-gray-500 ml-1">{result.unit}</span>}
                              </div>
                              {(result.referenceMin || result.referenceMax) && (
                                <div className="text-xs text-gray-500">
                                  基準値: {result.referenceMin ?? "-"} 〜 {result.referenceMax ?? "-"}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              {result.isAbnormal && (
                                <Badge variant="destructive">異常</Badge>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                {format(new Date(result.testDate), "M/d", { locale: ja })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ent" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">聴力検査</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {audiometryTests.length === 0 ? (
                    <EmptyState message="聴力検査の記録がありません" />
                  ) : (
                    <div className="divide-y">
                      {audiometryTests.map((test) => (
                        <div key={test.id} className="p-4 hover:bg-gray-50/50">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {format(new Date(test.testDate), "yyyy年M月d日", { locale: ja })}
                            </span>
                            <Link href={`/ent/report?patientId=${patientId}`}>
                              <Button variant="outline" size="sm">詳細</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">内視鏡検査</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {endoscopyExams.length === 0 ? (
                    <EmptyState message="内視鏡検査の記録がありません" />
                  ) : (
                    <div className="divide-y">
                      {endoscopyExams.map((exam) => (
                        <div key={exam.id} className="p-4 hover:bg-gray-50/50">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {format(new Date(exam.examDate), "yyyy年M月d日", { locale: ja })}
                            </span>
                            <Link href={`/ent/report?patientId=${patientId}`}>
                              <Button variant="outline" size="sm">詳細</Button>
                            </Link>
                          </div>
                          {exam.interpretation && (
                            <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {exam.interpretation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {invoices.length === 0 ? (
                    <EmptyState message="請求履歴がありません" />
                  ) : (
                    <div className="divide-y">
                      {invoices.map((invoice) => (
                        <div key={invoice.id} className="p-4 hover:bg-gray-50/50">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-medium">{invoice.invoiceNumber}</span>
                              <div className="text-lg font-semibold mt-1">
                                ¥{invoice.total.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <StatusBadge status={invoice.status} />
                              <div className="text-xs text-gray-500 mt-1">
                                {format(new Date(invoice.createdAt), "M/d", { locale: ja })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <RecordDialog
        open={isRecordDialogOpen}
        onOpenChange={setIsRecordDialogOpen}
        patientId={patientId}
        recordId={null}
        onSuccess={() => {
          refetchRecords();
          setIsRecordDialogOpen(false);
        }}
      />
    </div>
  );
}
