"use client";

import { Suspense, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Ear, Eye, Activity, FlaskConical } from "lucide-react";
import { AudiogramChart, getHearingLevel, calculateFourFrequencyAverage } from "@/components/ent/audiogram-chart";
import { AudiometryDialog } from "@/components/ent/audiometry-dialog";
import { TympanometryDialog } from "@/components/ent/tympanometry-dialog";
import { VestibularDialog } from "@/components/ent/vestibular-dialog";
import { EndoscopyDialog } from "@/components/ent/endoscopy-dialog";
import { AllergyDialog } from "@/components/ent/allergy-dialog";

function EntContent() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("audiometry");

  // Dialogs
  const [audiometryDialogOpen, setAudiometryDialogOpen] = useState(false);
  const [tympanometryDialogOpen, setTympanometryDialogOpen] = useState(false);
  const [vestibularDialogOpen, setVestibularDialogOpen] = useState(false);
  const [endoscopyDialogOpen, setEndoscopyDialogOpen] = useState(false);
  const [allergyDialogOpen, setAllergyDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const { data: patients } = trpc.patient.list.useQuery({ limit: 100 });

  const { data: audiometryTests, refetch: refetchAudiometry } = trpc.ent.audiometry.list.useQuery(
    { patientId: selectedPatientId || "" },
    { enabled: !!selectedPatientId }
  );

  const { data: tympanometryTests, refetch: refetchTympanometry } = trpc.ent.tympanometry.list.useQuery(
    { patientId: selectedPatientId || "" },
    { enabled: !!selectedPatientId }
  );

  const { data: vestibularTests, refetch: refetchVestibular } = trpc.ent.vestibular.list.useQuery(
    { patientId: selectedPatientId || "" },
    { enabled: !!selectedPatientId }
  );

  const { data: endoscopyExams, refetch: refetchEndoscopy } = trpc.ent.endoscopy.list.useQuery(
    { patientId: selectedPatientId || "" },
    { enabled: !!selectedPatientId }
  );

  const { data: allergyTests, refetch: refetchAllergy } = trpc.ent.allergy.list.useQuery(
    { patientId: selectedPatientId || "" },
    { enabled: !!selectedPatientId }
  );

  const openNewTest = () => {
    setSelectedTestId(null);
    switch (activeTab) {
      case "audiometry":
        setAudiometryDialogOpen(true);
        break;
      case "tympanometry":
        setTympanometryDialogOpen(true);
        break;
      case "vestibular":
        setVestibularDialogOpen(true);
        break;
      case "endoscopy":
        setEndoscopyDialogOpen(true);
        break;
      case "allergy":
        setAllergyDialogOpen(true);
        break;
    }
  };

  const getTabLabel = () => {
    switch (activeTab) {
      case "audiometry": return "聴力検査";
      case "tympanometry": return "ティンパノメトリー";
      case "vestibular": return "平衡機能検査";
      case "endoscopy": return "内視鏡検査";
      case "allergy": return "アレルギー検査";
      default: return "検査";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">耳鼻科検査</h1>
          <p className="text-gray-500">聴力検査・内視鏡・平衡機能検査など</p>
        </div>
        {selectedPatientId && (
          <Button onClick={openNewTest}>
            <Plus className="mr-2 h-4 w-4" />
            新規{getTabLabel()}
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

      {/* Tabs */}
      {selectedPatientId ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="audiometry" className="flex items-center gap-2">
              <Ear className="h-4 w-4" />
              聴力検査
            </TabsTrigger>
            <TabsTrigger value="tympanometry" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              ティンパノ
            </TabsTrigger>
            <TabsTrigger value="vestibular" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              平衡機能
            </TabsTrigger>
            <TabsTrigger value="endoscopy" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              内視鏡
            </TabsTrigger>
            <TabsTrigger value="allergy" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              アレルギー
            </TabsTrigger>
          </TabsList>

          {/* Audiometry Tab */}
          <TabsContent value="audiometry" className="space-y-4">
            {audiometryTests?.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <Ear className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>聴力検査データがありません</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSelectedTestId(null);
                        setAudiometryDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      最初の聴力検査を記録
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              audiometryTests?.map((test) => {
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
                    onClick={() => {
                      setSelectedTestId(test.id);
                      setAudiometryDialogOpen(true);
                    }}
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
                        <div className="flex gap-2">
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
              })
            )}
          </TabsContent>

          {/* Tympanometry Tab */}
          <TabsContent value="tympanometry" className="space-y-4">
            {tympanometryTests?.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>ティンパノメトリーデータがありません</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSelectedTestId(null);
                        setTympanometryDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      最初のティンパノメトリーを記録
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              tympanometryTests?.map((test) => (
                <Card
                  key={test.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedTestId(test.id);
                    setTympanometryDialogOpen(true);
                  }}
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
              ))
            )}
          </TabsContent>

          {/* Vestibular Tab */}
          <TabsContent value="vestibular" className="space-y-4">
            {vestibularTests?.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>平衡機能検査データがありません</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSelectedTestId(null);
                        setVestibularDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      最初の平衡機能検査を記録
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              vestibularTests?.map((test) => (
                <Card
                  key={test.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedTestId(test.id);
                    setVestibularDialogOpen(true);
                  }}
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
              ))
            )}
          </TabsContent>

          {/* Endoscopy Tab */}
          <TabsContent value="endoscopy" className="space-y-4">
            {endoscopyExams?.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <Eye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>内視鏡検査データがありません</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSelectedTestId(null);
                        setEndoscopyDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      最初の内視鏡検査を記録
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              endoscopyExams?.map((exam) => (
                <Card
                  key={exam.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedTestId(exam.id);
                    setEndoscopyDialogOpen(true);
                  }}
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
                        {exam.examType === "NASAL" ? "鼻腔" :
                         exam.examType === "PHARYNGEAL" ? "咽頭" :
                         exam.examType === "LARYNGEAL" ? "喉頭" : "耳鏡"}
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
              ))
            )}
          </TabsContent>

          {/* Allergy Tab */}
          <TabsContent value="allergy" className="space-y-4">
            {allergyTests?.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <FlaskConical className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>アレルギー検査データがありません</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSelectedTestId(null);
                        setAllergyDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      最初のアレルギー検査を記録
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              allergyTests?.map((test) => (
                <Card
                  key={test.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedTestId(test.id);
                    setAllergyDialogOpen(true);
                  }}
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
              ))
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              患者を選択してください
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {selectedPatientId && (
        <>
          <AudiometryDialog
            open={audiometryDialogOpen}
            onOpenChange={setAudiometryDialogOpen}
            patientId={selectedPatientId}
            testId={selectedTestId}
            onSuccess={() => {
              refetchAudiometry();
              setAudiometryDialogOpen(false);
            }}
          />
          <TympanometryDialog
            open={tympanometryDialogOpen}
            onOpenChange={setTympanometryDialogOpen}
            patientId={selectedPatientId}
            testId={selectedTestId}
            onSuccess={() => {
              refetchTympanometry();
              setTympanometryDialogOpen(false);
            }}
          />
          <VestibularDialog
            open={vestibularDialogOpen}
            onOpenChange={setVestibularDialogOpen}
            patientId={selectedPatientId}
            testId={selectedTestId}
            onSuccess={() => {
              refetchVestibular();
              setVestibularDialogOpen(false);
            }}
          />
          <EndoscopyDialog
            open={endoscopyDialogOpen}
            onOpenChange={setEndoscopyDialogOpen}
            patientId={selectedPatientId}
            examId={selectedTestId}
            onSuccess={() => {
              refetchEndoscopy();
              setEndoscopyDialogOpen(false);
            }}
          />
          <AllergyDialog
            open={allergyDialogOpen}
            onOpenChange={setAllergyDialogOpen}
            patientId={selectedPatientId}
            testId={selectedTestId}
            onSuccess={() => {
              refetchAllergy();
              setAllergyDialogOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}

export default function EntPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">読み込み中...</div>}>
      <EntContent />
    </Suspense>
  );
}
