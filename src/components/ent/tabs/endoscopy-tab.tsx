"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";

interface EndoscopyTabProps {
  patientId: string;
  onEditTest: (testId: string | null) => void;
}

export function EndoscopyTab({ patientId, onEditTest }: EndoscopyTabProps) {
  const { data: endoscopyExams } = trpc.ent.endoscopy.list.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  if (endoscopyExams?.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Eye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>内視鏡検査データがありません</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => onEditTest(null)}
            >
              <Plus className="mr-2 h-4 w-4" />
              最初の内視鏡検査を記録
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case "NASAL": return "鼻腔";
      case "PHARYNGEAL": return "咽頭";
      case "LARYNGEAL": return "喉頭";
      default: return "耳鏡";
    }
  };

  return (
    <div className="space-y-4">
      {endoscopyExams?.map((exam) => (
        <Card
          key={exam.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEditTest(exam.id)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {new Date(exam.examDate).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardTitle>
              <Badge variant="secondary">
                {getExamTypeLabel(exam.examType)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {exam.nasalFindings && (
                <div>
                  <span className="text-gray-500 font-medium">鼻腔所見:</span>
                  <p>{exam.nasalFindings}</p>
                </div>
              )}
              {exam.pharyngealFindings && (
                <div>
                  <span className="text-gray-500 font-medium">咽頭所見:</span>
                  <p>{exam.pharyngealFindings}</p>
                </div>
              )}
              {exam.laryngealFindings && (
                <div>
                  <span className="text-gray-500 font-medium">喉頭所見:</span>
                  <p>{exam.laryngealFindings}</p>
                </div>
              )}
              {(exam.otoscopyRight || exam.otoscopyLeft) && (
                <div className="grid grid-cols-2 gap-4">
                  {exam.otoscopyRight && (
                    <div className="p-2 bg-red-50 rounded">
                      <span className="text-red-700 font-medium">右耳:</span>
                      <p>{exam.otoscopyRight}</p>
                    </div>
                  )}
                  {exam.otoscopyLeft && (
                    <div className="p-2 bg-blue-50 rounded">
                      <span className="text-blue-700 font-medium">左耳:</span>
                      <p>{exam.otoscopyLeft}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {exam.interpretation && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-600 mb-1">所見</h4>
                <p className="text-sm">{exam.interpretation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
