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

export default function LabResultsPage() {
  const { data: labResults, isLoading } = trpc.portal.myLabResults.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">検査結果</h1>
        <p className="text-gray-500">過去の検査結果を確認できます</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{labResults?.length || 0}</p>
                <p className="text-xs text-gray-500">検査件数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {labResults?.filter((r) => !r.isAbnormal).length || 0}
                </p>
                <p className="text-xs text-gray-500">正常</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {labResults?.filter((r) => r.isAbnormal).length || 0}
                </p>
                <p className="text-xs text-gray-500">要確認</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      {!labResults?.length ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>検査結果はありません</p>
            </div>
          </CardContent>
        </Card>
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
                    {result.isAbnormal ? "要確認" : "正常"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">検査結果</p>
                      {(result.referenceMin != null || result.referenceMax != null) && (
                        <p className="text-xs text-gray-500">
                          基準値: {result.referenceMin ?? "-"} ~ {result.referenceMax ?? "-"} {result.unit}
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
                        <strong>備考:</strong> {result.notes}
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
