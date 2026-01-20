"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Activity } from "lucide-react";

interface VestibularTabProps {
  patientId: string;
  onEditTest: (testId: string | null) => void;
}

export function VestibularTab({ patientId, onEditTest }: VestibularTabProps) {
  const { data: vestibularTests } = trpc.ent.vestibular.list.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  if (vestibularTests?.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>平衡機能検査データがありません</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => onEditTest(null)}
            >
              <Plus className="mr-2 h-4 w-4" />
              最初の平衡機能検査を記録
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {vestibularTests?.map((test) => (
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
            {test.chiefComplaint && (
              <CardDescription>主訴: {test.chiefComplaint}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {test.vertigoType && (
                <div>
                  <span className="text-gray-500">めまいの種類:</span>
                  <p>{test.vertigoType}</p>
                </div>
              )}
              {test.nystagmusFindings && (
                <div>
                  <span className="text-gray-500">眼振所見:</span>
                  <p>{test.nystagmusFindings}</p>
                </div>
              )}
              {test.rombergTest && (
                <div>
                  <span className="text-gray-500">Romberg検査:</span>
                  <p>{test.rombergTest}</p>
                </div>
              )}
              {test.dixHallpikeResult && (
                <div>
                  <span className="text-gray-500">Dix-Hallpike検査:</span>
                  <p>{test.dixHallpikeResult}</p>
                </div>
              )}
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
