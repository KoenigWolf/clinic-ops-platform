"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, StatCard, StatGrid, EmptyState } from "@/components/layout";
import { labels } from "@/lib/labels";

const { portal: { results: pageLabels } } = labels;

export default function LabResultsPage() {
  const { data: labResults, isLoading } = trpc.portal.myLabResults.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5">
              <Skeleton className="h-3 w-14 mb-3" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={pageLabels.title} description={pageLabels.description} />

      <StatGrid columns={3}>
        <StatCard label={pageLabels.stats.total} value={labResults?.length || 0} />
        <StatCard label={pageLabels.stats.normal} value={labResults?.filter((r) => !r.isAbnormal).length || 0} />
        <StatCard label={pageLabels.stats.abnormal} value={labResults?.filter((r) => r.isAbnormal).length || 0} />
      </StatGrid>

      {/* Results List */}
      {!labResults?.length ? (
        <EmptyState message={pageLabels.empty} icon={FileText} />
      ) : (
        <div className="space-y-4">
          {labResults.map((result) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{result.testName}</CardTitle>
                    <CardDescription>
                      {format(new Date(result.testDate), "yyyy年M月d日", { locale: ja })}
                    </CardDescription>
                  </div>
                  <Badge
                    className={
                      result.isAbnormal
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {result.isAbnormal ? pageLabels.badge.abnormal : pageLabels.badge.normal}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{pageLabels.properties.resultLabel}</p>
                      {(result.referenceMin != null || result.referenceMax != null) && (
                        <p className="text-xs text-gray-500">
                          {pageLabels.properties.referenceRange} {result.referenceMin ?? "-"} ~ {result.referenceMax ?? "-"} {result.unit}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${result.isAbnormal ? "text-red-600" : ""}`}>
                        {result.result} {result.unit}
                      </span>
                      {result.isAbnormal ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  {result.notes && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>{pageLabels.properties.notes}</strong> {result.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
