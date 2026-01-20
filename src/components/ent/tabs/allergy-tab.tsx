"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FlaskConical } from "lucide-react";

interface AllergyTabProps {
  patientId: string;
  onEditTest: (testId: string | null) => void;
}

export function AllergyTab({ patientId, onEditTest }: AllergyTabProps) {
  const { data: allergyTests } = trpc.ent.allergy.list.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  if (allergyTests?.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <FlaskConical className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>アレルギー検査データがありません</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => onEditTest(null)}
            >
              <Plus className="mr-2 h-4 w-4" />
              最初のアレルギー検査を記録
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {allergyTests?.map((test) => (
        <Card
          key={test.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEditTest(test.id)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {new Date(test.testDate).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardTitle>
              <Badge variant="secondary">{test.testType}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {test.totalIgE !== null && (
              <div className="mb-3">
                <span className="text-gray-500 text-sm">総IgE:</span>
                <span className="ml-2 font-medium">{test.totalIgE} IU/mL</span>
              </div>
            )}
            {test.interpretation && (
              <div className="p-3 bg-gray-50 rounded-lg">
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
