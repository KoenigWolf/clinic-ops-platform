"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Activity } from "lucide-react";

interface TympanometryTabProps {
  patientId: string;
  onEditTest: (testId: string | null) => void;
}

export function TympanometryTab({ patientId, onEditTest }: TympanometryTabProps) {
  const { data: tympanometryTests } = trpc.ent.tympanometry.list.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  if (tympanometryTests?.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>ティンパノメトリーデータがありません</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => onEditTest(null)}
            >
              <Plus className="mr-2 h-4 w-4" />
              最初のティンパノメトリーを記録
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tympanometryTests?.map((test) => (
        <Card
          key={test.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEditTest(test.id)}
        >
          <CardHeader>
            <CardTitle className="text-lg">
              {new Date(test.testDate).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-red-700 mb-2">右耳</h4>
                {test.rightType && (
                  <Badge className="mb-2">Type {test.rightType}</Badge>
                )}
                <div className="text-sm space-y-1">
                  {test.rightPeakPressure !== null && (
                    <p>中耳圧: {test.rightPeakPressure} daPa</p>
                  )}
                  {test.rightCompliance !== null && (
                    <p>コンプライアンス: {test.rightCompliance} ml</p>
                  )}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">左耳</h4>
                {test.leftType && (
                  <Badge className="mb-2">Type {test.leftType}</Badge>
                )}
                <div className="text-sm space-y-1">
                  {test.leftPeakPressure !== null && (
                    <p>中耳圧: {test.leftPeakPressure} daPa</p>
                  )}
                  {test.leftCompliance !== null && (
                    <p>コンプライアンス: {test.leftCompliance} ml</p>
                  )}
                </div>
              </div>
            </div>
            {test.interpretation && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-600 mb-1">所見</h4>
                <p className="text-sm">{test.interpretation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
