"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/layout";
import { labels } from "@/lib/labels";

const { pages: { patientDetail: pageLabels, patients: patientsLabels, records: recordsLabels }, common } = labels;

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const { data, isLoading, isError, refetch } = trpc.patient.get.useQuery(
    { id: patientId },
    { enabled: !!patientId }
  );

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">{common.loading}</div>;
  }

  if (isError || !data) {
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

  const fullName = `${data.lastName} ${data.firstName}`;

  return (
    <div className="space-y-4">
      <PageHeader
        title={fullName}
        description={`${patientsLabels.table.patientNumber}: ${data.patientNumber}`}
        actions={
          <Link href={`/records?patientId=${data.id}`}>
            <Button variant="outline">{recordsLabels.title}</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{pageLabels.sections.profile}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{patientsLabels.table.gender}</span>
              <span>{patientsLabels.gender[data.gender]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{patientsLabels.table.birthDate}</span>
              <span>{new Date(data.dateOfBirth).toLocaleDateString("ja-JP")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">血液型</span>
              <span>{data.bloodType ?? "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pageLabels.sections.contact}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{patientsLabels.table.phone}</span>
              <span>{data.phone || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">メールアドレス</span>
              <span>{data.email || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">住所</span>
              <span className="text-right">{data.address || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pageLabels.sections.insurance}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{patientsLabels.table.insuranceNumber}</span>
              <span>{data.insuranceNumber || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">保険種別</span>
              <span>{data.insuranceType || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pageLabels.sections.medical}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">アレルギー</p>
              <p>{data.allergies || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">既往歴</p>
              <p>{data.medicalHistory || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">備考</p>
              <p>{data.notes || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{pageLabels.sections.recentRecords}</CardTitle>
          </CardHeader>
          <CardContent>
            {!data.medicalRecords.length ? (
              <EmptyState message={pageLabels.empty.records} />
            ) : (
              <div className="space-y-2 text-sm">
                {data.medicalRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between">
                    <span>{new Date(record.recordDate).toLocaleDateString("ja-JP")}</span>
                    <Link href={`/staff/${record.doctor.id}`}>
                      <Badge variant="outline" className="hover:bg-gray-100 cursor-pointer">
                        {record.doctor.name}
                      </Badge>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pageLabels.sections.recentAppointments}</CardTitle>
          </CardHeader>
          <CardContent>
            {!data.appointments.length ? (
              <EmptyState message={pageLabels.empty.appointments} />
            ) : (
              <div className="space-y-2 text-sm">
                {data.appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between">
                    <span>{new Date(appointment.appointmentDate).toLocaleDateString("ja-JP")}</span>
                    <Link href={`/staff/${appointment.doctor.id}`}>
                      <Badge variant="outline" className="hover:bg-gray-100 cursor-pointer">
                        {appointment.doctor.name}
                      </Badge>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pageLabels.sections.recentPrescriptions}</CardTitle>
          </CardHeader>
          <CardContent>
            {!data.prescriptions.length ? (
              <EmptyState message={pageLabels.empty.prescriptions} />
            ) : (
              <div className="space-y-2 text-sm">
                {data.prescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-center justify-between">
                    <span>{new Date(rx.prescriptionDate).toLocaleDateString("ja-JP")}</span>
                    <Badge variant="outline">{rx.medicationName}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
