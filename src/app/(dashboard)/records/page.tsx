"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";
import { RecordDialog } from "@/components/records/record-dialog";

function RecordsContent() {
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId");

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patientIdParam);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const { data: patients } = trpc.patient.list.useQuery({ limit: 100 });

  const { data: records, refetch } = trpc.record.listByPatient.useQuery(
    { patientId: selectedPatientId || "" },
    { enabled: !!selectedPatientId }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">診療記録</h1>
          <p className="text-gray-500">カルテの閲覧・作成 (SOAP形式)</p>
        </div>
        {selectedPatientId && (
          <Button onClick={() => {
            setSelectedRecord(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            新規カルテ作成
          </Button>
        )}
      </div>

      {/* Patient Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">患者選択:</label>
            <Select
              value={selectedPatientId || ""}
              onValueChange={setSelectedPatientId}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="患者を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {patients?.patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.patientNumber} - {patient.lastName} {patient.firstName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {selectedPatientId ? (
        <div className="space-y-4">
          {records?.records.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>診療記録がありません</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSelectedRecord(null);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    最初のカルテを作成
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            records?.records.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader
                  onClick={() => {
                    setSelectedRecord(record.id);
                    setIsDialogOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {new Date(record.recordDate).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        担当医: {record.doctor.name}
                      </p>
                    </div>
                    {record.diagnosis && (
                      <Badge variant="secondary">{record.diagnosis}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {record.chiefComplaint && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-1">主訴</h4>
                      <p className="text-sm">{record.chiefComplaint}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {record.subjective && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-600 mb-1">S (Subjective)</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{record.subjective}</p>
                      </div>
                    )}
                    {record.objective && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-600 mb-1">O (Objective)</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{record.objective}</p>
                      </div>
                    )}
                    {record.assessment && (
                      <div>
                        <h4 className="text-sm font-semibold text-orange-600 mb-1">A (Assessment)</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{record.assessment}</p>
                      </div>
                    )}
                    {record.plan && (
                      <div>
                        <h4 className="text-sm font-semibold text-purple-600 mb-1">P (Plan)</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{record.plan}</p>
                      </div>
                    )}
                  </div>

                  {record.prescriptions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">処方</h4>
                      <div className="flex flex-wrap gap-2">
                        {record.prescriptions.map((rx) => (
                          <Badge key={rx.id} variant="outline">
                            {rx.medicationName} {rx.dosage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              患者を選択してください
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Dialog */}
      {selectedPatientId && (
        <RecordDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          patientId={selectedPatientId}
          recordId={selectedRecord}
          onSuccess={() => {
            refetch();
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">読み込み中...</div>}>
      <RecordsContent />
    </Suspense>
  );
}
