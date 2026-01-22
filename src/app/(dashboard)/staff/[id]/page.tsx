"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Avatar } from "@/components/layout";
import { labels } from "@/lib/labels";

const { pages: { staffDetail: pageLabels }, common } = labels;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "管理者",
  DOCTOR: "医師",
  NURSE: "看護師",
  STAFF: "スタッフ",
};

export default function StaffDetailPage() {
  const params = useParams<{ id: string }>();
  const staffId = params.id;

  const { data, isLoading, isError, refetch } = trpc.staff.get.useQuery(
    { id: staffId },
    { enabled: !!staffId }
  );

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">{common.loading}</div>;
  }

  if (isError || !data) {
    return (
      <EmptyState message={common.loadFailed} onRetry={refetch} />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={data.name}
        description={ROLE_LABELS[data.role] || data.role}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{pageLabels.sections.profile}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={data.name} size="lg" />
              <div>
                <p className="font-medium text-lg">{data.name}</p>
                <Badge>{ROLE_LABELS[data.role] || data.role}</Badge>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{pageLabels.labels.email}</span>
                <span>{data.email}</span>
              </div>
              {data.specialization && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{pageLabels.labels.specialization}</span>
                  <span>{data.specialization}</span>
                </div>
              )}
              {data.licenseNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{pageLabels.labels.licenseNumber}</span>
                  <span>{data.licenseNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">{pageLabels.labels.joinedAt}</span>
                <span>{new Date(data.createdAt).toLocaleDateString("ja-JP")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pageLabels.sections.stats}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-semibold">{data._count.appointments}</p>
                <p className="text-sm text-gray-500">{pageLabels.stats.appointments}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-semibold">{data._count.medicalRecords}</p>
                <p className="text-sm text-gray-500">{pageLabels.stats.records}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-semibold">{data._count.prescriptions}</p>
                <p className="text-sm text-gray-500">{pageLabels.stats.prescriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
