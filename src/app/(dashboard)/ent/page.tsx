"use client";

import { Suspense, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Ear, Eye, Activity, FlaskConical, FileText, BarChart3 } from "lucide-react";
import Link from "next/link";
import {
  AudiometryTab,
  TympanometryTab,
  VestibularTab,
  EndoscopyTab,
  AllergyTab,
} from "@/components/ent/tabs";
import { AudiometryDialog } from "@/components/ent/audiometry-dialog";
import { TympanometryDialog } from "@/components/ent/tympanometry-dialog";
import { VestibularDialog } from "@/components/ent/vestibular-dialog";
import { EndoscopyDialog } from "@/components/ent/endoscopy-dialog";
import { AllergyDialog } from "@/components/ent/allergy-dialog";

type TabType = "audiometry" | "tympanometry" | "vestibular" | "endoscopy" | "allergy";

const TAB_LABELS: Record<TabType, string> = {
  audiometry: "聴力検査",
  tympanometry: "ティンパノメトリー",
  vestibular: "平衡機能検査",
  endoscopy: "内視鏡検査",
  allergy: "アレルギー検査",
};

function EntContent() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("audiometry");
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  // Dialog states
  const [audiometryDialogOpen, setAudiometryDialogOpen] = useState(false);
  const [tympanometryDialogOpen, setTympanometryDialogOpen] = useState(false);
  const [vestibularDialogOpen, setVestibularDialogOpen] = useState(false);
  const [endoscopyDialogOpen, setEndoscopyDialogOpen] = useState(false);
  const [allergyDialogOpen, setAllergyDialogOpen] = useState(false);

  const { data: patients } = trpc.patient.list.useQuery({ limit: 100 });
  const utils = trpc.useUtils();

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

  // Memoized callbacks for each tab
  const handleAudiometryEdit = useCallback((testId: string | null) => {
    setSelectedTestId(testId);
    setAudiometryDialogOpen(true);
  }, []);

  const handleTympanometryEdit = useCallback((testId: string | null) => {
    setSelectedTestId(testId);
    setTympanometryDialogOpen(true);
  }, []);

  const handleVestibularEdit = useCallback((testId: string | null) => {
    setSelectedTestId(testId);
    setVestibularDialogOpen(true);
  }, []);

  const handleEndoscopyEdit = useCallback((testId: string | null) => {
    setSelectedTestId(testId);
    setEndoscopyDialogOpen(true);
  }, []);

  const handleAllergyEdit = useCallback((testId: string | null) => {
    setSelectedTestId(testId);
    setAllergyDialogOpen(true);
  }, []);

  // Dialog success handlers with cache invalidation
  const handleAudiometrySuccess = useCallback(() => {
    utils.ent.audiometry.list.invalidate();
    setAudiometryDialogOpen(false);
  }, [utils]);

  const handleTympanometrySuccess = useCallback(() => {
    utils.ent.tympanometry.list.invalidate();
    setTympanometryDialogOpen(false);
  }, [utils]);

  const handleVestibularSuccess = useCallback(() => {
    utils.ent.vestibular.list.invalidate();
    setVestibularDialogOpen(false);
  }, [utils]);

  const handleEndoscopySuccess = useCallback(() => {
    utils.ent.endoscopy.list.invalidate();
    setEndoscopyDialogOpen(false);
  }, [utils]);

  const handleAllergySuccess = useCallback(() => {
    utils.ent.allergy.list.invalidate();
    setAllergyDialogOpen(false);
  }, [utils]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">耳鼻科検査</h1>
          <p className="text-gray-500">聴力検査・内視鏡・平衡機能検査など</p>
        </div>
        <div className="flex gap-2">
          <Link href="/ent/dashboard">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              ダッシュボード
            </Button>
          </Link>
          <Link href="/ent/templates">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              診断テンプレート
            </Button>
          </Link>
          {selectedPatientId && (
            <Button onClick={openNewTest}>
              <Plus className="mr-2 h-4 w-4" />
              新規{TAB_LABELS[activeTab]}
            </Button>
          )}
        </div>
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
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

          <TabsContent value="audiometry" className="space-y-4">
            <AudiometryTab patientId={selectedPatientId} onEditTest={handleAudiometryEdit} />
          </TabsContent>

          <TabsContent value="tympanometry" className="space-y-4">
            <TympanometryTab patientId={selectedPatientId} onEditTest={handleTympanometryEdit} />
          </TabsContent>

          <TabsContent value="vestibular" className="space-y-4">
            <VestibularTab patientId={selectedPatientId} onEditTest={handleVestibularEdit} />
          </TabsContent>

          <TabsContent value="endoscopy" className="space-y-4">
            <EndoscopyTab patientId={selectedPatientId} onEditTest={handleEndoscopyEdit} />
          </TabsContent>

          <TabsContent value="allergy" className="space-y-4">
            <AllergyTab patientId={selectedPatientId} onEditTest={handleAllergyEdit} />
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
            onSuccess={handleAudiometrySuccess}
          />
          <TympanometryDialog
            open={tympanometryDialogOpen}
            onOpenChange={setTympanometryDialogOpen}
            patientId={selectedPatientId}
            testId={selectedTestId}
            onSuccess={handleTympanometrySuccess}
          />
          <VestibularDialog
            open={vestibularDialogOpen}
            onOpenChange={setVestibularDialogOpen}
            patientId={selectedPatientId}
            testId={selectedTestId}
            onSuccess={handleVestibularSuccess}
          />
          <EndoscopyDialog
            open={endoscopyDialogOpen}
            onOpenChange={setEndoscopyDialogOpen}
            patientId={selectedPatientId}
            examId={selectedTestId}
            onSuccess={handleEndoscopySuccess}
          />
          <AllergyDialog
            open={allergyDialogOpen}
            onOpenChange={setAllergyDialogOpen}
            patientId={selectedPatientId}
            testId={selectedTestId}
            onSuccess={handleAllergySuccess}
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
