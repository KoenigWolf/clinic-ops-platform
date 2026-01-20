"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import Link from "next/link";

interface AudiometryTest {
  id: string;
  testDate: Date;
  testType: string;
  interpretation: string | null;
  medicalRecordId: string | null;
}

interface EndoscopyExam {
  id: string;
  examDate: Date;
  examType: string;
  interpretation: string | null;
  medicalRecordId: string | null;
}

interface ENTTabProps {
  patientId: string;
  recordId: string | null;
  linkedAudiometry?: AudiometryTest[];
  linkedEndoscopy?: EndoscopyExam[];
}

export function ENTTab({
  patientId,
  recordId,
  linkedAudiometry,
  linkedEndoscopy,
}: ENTTabProps) {
  // Filter tests linked to this specific record
  const recordAudiometryTests = linkedAudiometry?.filter(
    test => test.medicalRecordId === recordId
  ) || [];
  const recordEndoscopyTests = linkedEndoscopy?.filter(
    exam => exam.medicalRecordId === recordId
  ) || [];

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case "NASAL": return "鼻腔内視鏡";
      case "PHARYNGEAL": return "咽頭内視鏡";
      case "LARYNGEAL": return "喉頭内視鏡";
      default: return "耳鏡検査";
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="text-center py-4">
        <p className="text-gray-500 mb-4">
          耳鼻科検査を記録に紐付けることができます
        </p>
        <Link href={`/ent?patientId=${patientId}`}>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            耳鼻科検査ページで検査を追加
          </Button>
        </Link>
      </div>

      {recordAudiometryTests.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">紐付けられた聴力検査</h4>
          {recordAudiometryTests.map((test) => (
            <Card key={test.id} className="bg-gray-50">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {new Date(test.testDate).toLocaleDateString("ja-JP")}
                    {" - "}
                    {test.testType === "PURE_TONE" ? "純音聴力検査" : test.testType}
                  </span>
                  <Badge variant="secondary">聴力検査</Badge>
                </div>
                {test.interpretation && (
                  <p className="text-sm text-gray-600 mt-1">{test.interpretation}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {recordEndoscopyTests.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">紐付けられた内視鏡検査</h4>
          {recordEndoscopyTests.map((exam) => (
            <Card key={exam.id} className="bg-gray-50">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {new Date(exam.examDate).toLocaleDateString("ja-JP")}
                    {" - "}
                    {getExamTypeLabel(exam.examType)}
                  </span>
                  <Badge variant="secondary">内視鏡</Badge>
                </div>
                {exam.interpretation && (
                  <p className="text-sm text-gray-600 mt-1">{exam.interpretation}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {recordAudiometryTests.length === 0 && recordEndoscopyTests.length === 0 && (
        <p className="text-gray-400 text-sm text-center">
          この診療記録に紐付けられた検査はありません
        </p>
      )}
    </div>
  );
}
