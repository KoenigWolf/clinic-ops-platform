"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Ear, Printer } from "lucide-react";
import Link from "next/link";
import { AudiogramChart, getHearingLevel, calculateFourFrequencyAverage } from "@/components/ent/audiogram-chart";
import { HearingProgressChart } from "@/components/ent/hearing-progress-chart";

interface AudiometryTabProps {
  patientId: string;
  onEditTest: (testId: string | null) => void;
}

export function AudiometryTab({ patientId, onEditTest }: AudiometryTabProps) {
  const { data: audiometryTests } = trpc.ent.audiometry.list.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  if (audiometryTests?.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Ear className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>聴力検査データがありません</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => onEditTest(null)}
            >
              <Plus className="mr-2 h-4 w-4" />
              最初の聴力検査を記録
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {audiometryTests && audiometryTests.length >= 2 && (
        <HearingProgressChart tests={audiometryTests} />
      )}

      {audiometryTests?.map((test) => {
        const rightAvg = calculateFourFrequencyAverage(
          test.rightAir500, test.rightAir1000, test.rightAir2000, test.rightAir4000
        );
        const leftAvg = calculateFourFrequencyAverage(
          test.leftAir500, test.leftAir1000, test.leftAir2000, test.leftAir4000
        );
        const rightLevel = rightAvg !== null ? getHearingLevel(rightAvg) : null;
        const leftLevel = leftAvg !== null ? getHearingLevel(leftAvg) : null;

        return (
          <Card
            key={test.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onEditTest(test.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {new Date(test.testDate).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                  <CardDescription>
                    {test.testType === "PURE_TONE" ? "純音聴力検査" : test.testType}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {rightLevel && (
                    <Badge variant="outline" className={rightLevel.color}>
                      右: {rightLevel.level} ({rightAvg?.toFixed(1)}dB)
                    </Badge>
                  )}
                  {leftLevel && (
                    <Badge variant="outline" className={leftLevel.color}>
                      左: {leftLevel.level} ({leftAvg?.toFixed(1)}dB)
                    </Badge>
                  )}
                  <Link
                    href={`/ent/report?patientId=${patientId}&testId=${test.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="outline" size="sm">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AudiogramChart data={test} width={500} height={350} />
              {test.interpretation && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-600 mb-1">所見</h4>
                  <p className="text-sm">{test.interpretation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
