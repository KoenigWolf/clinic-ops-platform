"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface VestibularDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  testId: string | null;
  onSuccess: () => void;
}

const TEST_TYPES = [
  { value: "CALORIC", label: "温度刺激検査" },
  { value: "POSTUROGRAPHY", label: "重心動揺検査" },
  { value: "ENG", label: "眼振電図検査 (ENG)" },
  { value: "VNG", label: "ビデオ眼振検査 (VNG)" },
  { value: "VHIT", label: "Video Head Impulse Test" },
  { value: "VEMP", label: "前庭誘発筋電位 (VEMP)" },
  { value: "ROTATION", label: "回転検査" },
];

export function VestibularDialog({
  open,
  onOpenChange,
  patientId,
  testId,
  onSuccess,
}: VestibularDialogProps) {
  const [testType, setTestType] = useState("CALORIC");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [vertigoType, setVertigoType] = useState("");
  const [nystagmusFindings, setNystagmusFindings] = useState("");
  const [rombergTest, setRombergTest] = useState("");
  const [mannTest, setMannTest] = useState("");
  const [caloricResponse, setCaloricResponse] = useState("");
  const [headImpulseTest, setHeadImpulseTest] = useState("");
  const [dixHallpikeResult, setDixHallpikeResult] = useState("");
  const [interpretation, setInterpretation] = useState("");

  const createMutation = trpc.ent.vestibular.create.useMutation({
    onSuccess: () => {
      toast.success("平衡機能検査を保存しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.ent.vestibular.update.useMutation({
    onSuccess: () => {
      toast.success("平衡機能検査を更新しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!open) {
      // Reset form
      setTestType("CALORIC");
      setChiefComplaint("");
      setVertigoType("");
      setNystagmusFindings("");
      setRombergTest("");
      setMannTest("");
      setCaloricResponse("");
      setHeadImpulseTest("");
      setDixHallpikeResult("");
      setInterpretation("");
    }
  }, [open]);

  const handleSubmit = () => {
    const data = {
      patientId,
      testType: testType as "CALORIC" | "POSTUROGRAPHY" | "ENG" | "VNG" | "VHIT" | "VEMP" | "ROTATION",
      chiefComplaint: chiefComplaint || undefined,
      vertigoType: vertigoType || undefined,
      nystagmusFindings: nystagmusFindings || undefined,
      rombergTest: rombergTest || undefined,
      mannTest: mannTest || undefined,
      caloricResponse: caloricResponse || undefined,
      headImpulseTest: headImpulseTest || undefined,
      dixHallpikeResult: dixHallpikeResult || undefined,
      interpretation: interpretation || undefined,
    };

    if (testId) {
      updateMutation.mutate({ id: testId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{testId ? "平衡機能検査の編集" : "新規平衡機能検査"}</DialogTitle>
          <DialogDescription>
            めまい・平衡機能検査の結果を入力してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Test Type */}
          <div className="space-y-2">
            <Label>検査種類</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEST_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chief Complaint */}
          <div className="space-y-2">
            <Label>主訴</Label>
            <Input
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="例: 回転性めまい、ふらつき"
            />
          </div>

          {/* Vertigo Type */}
          <div className="space-y-2">
            <Label>めまいの種類</Label>
            <Select value={vertigoType} onValueChange={setVertigoType}>
              <SelectTrigger>
                <SelectValue placeholder="選択..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="回転性">回転性めまい</SelectItem>
                <SelectItem value="浮動性">浮動性めまい</SelectItem>
                <SelectItem value="動揺性">動揺性めまい</SelectItem>
                <SelectItem value="立ちくらみ">立ちくらみ</SelectItem>
                <SelectItem value="その他">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nystagmus Findings */}
          <div className="space-y-2">
            <Label>眼振所見</Label>
            <Textarea
              value={nystagmusFindings}
              onChange={(e) => setNystagmusFindings(e.target.value)}
              placeholder="自発眼振、注視眼振、頭位眼振など"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Romberg Test */}
            <div className="space-y-2">
              <Label>Romberg検査</Label>
              <Select value={rombergTest} onValueChange={setRombergTest}>
                <SelectTrigger>
                  <SelectValue placeholder="選択..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="陰性">陰性</SelectItem>
                  <SelectItem value="陽性">陽性</SelectItem>
                  <SelectItem value="偏倚あり">偏倚あり</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mann Test */}
            <div className="space-y-2">
              <Label>Mann検査</Label>
              <Select value={mannTest} onValueChange={setMannTest}>
                <SelectTrigger>
                  <SelectValue placeholder="選択..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="陰性">陰性</SelectItem>
                  <SelectItem value="陽性">陽性</SelectItem>
                  <SelectItem value="偏倚あり">偏倚あり</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Caloric Response */}
          <div className="space-y-2">
            <Label>温度刺激検査所見</Label>
            <Textarea
              value={caloricResponse}
              onChange={(e) => setCaloricResponse(e.target.value)}
              placeholder="CP、DP、眼振の方向・持続時間など"
              rows={2}
            />
          </div>

          {/* Head Impulse Test */}
          <div className="space-y-2">
            <Label>Head Impulse Test</Label>
            <Input
              value={headImpulseTest}
              onChange={(e) => setHeadImpulseTest(e.target.value)}
              placeholder="正常/catch-up saccade あり"
            />
          </div>

          {/* Dix-Hallpike Test */}
          <div className="space-y-2">
            <Label>Dix-Hallpike検査</Label>
            <Select value={dixHallpikeResult} onValueChange={setDixHallpikeResult}>
              <SelectTrigger>
                <SelectValue placeholder="選択..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="陰性">陰性</SelectItem>
                <SelectItem value="右陽性">右陽性</SelectItem>
                <SelectItem value="左陽性">左陽性</SelectItem>
                <SelectItem value="両側陽性">両側陽性</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interpretation */}
          <div className="space-y-2">
            <Label>総合所見・診断</Label>
            <Textarea
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="検査結果の総合評価、疑い病名など"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
