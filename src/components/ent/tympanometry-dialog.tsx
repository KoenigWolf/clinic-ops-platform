"use client";

import { useState } from "react";
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

interface TympanometryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  testId: string | null;
  onSuccess: () => void;
}

const TYMPANOGRAM_TYPES = [
  { value: "A", label: "Type A (正常)" },
  { value: "As", label: "Type As (コンプライアンス低下)" },
  { value: "Ad", label: "Type Ad (コンプライアンス亢進)" },
  { value: "B", label: "Type B (フラット)" },
  { value: "C", label: "Type C (陰圧)" },
];

export function TympanometryDialog({
  open,
  onOpenChange,
  patientId,
  testId,
  onSuccess,
}: TympanometryDialogProps) {
  // Right ear
  const [rightType, setRightType] = useState<string>("");
  const [rightPeakPressure, setRightPeakPressure] = useState("");
  const [rightCompliance, setRightCompliance] = useState("");
  const [rightEarCanalVolume, setRightEarCanalVolume] = useState("");

  // Left ear
  const [leftType, setLeftType] = useState<string>("");
  const [leftPeakPressure, setLeftPeakPressure] = useState("");
  const [leftCompliance, setLeftCompliance] = useState("");
  const [leftEarCanalVolume, setLeftEarCanalVolume] = useState("");

  const [interpretation, setInterpretation] = useState("");

  const createMutation = trpc.ent.tympanometry.create.useMutation({
    onSuccess: () => {
      toast.success("ティンパノメトリーを保存しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.ent.tympanometry.update.useMutation({
    onSuccess: () => {
      toast.success("ティンパノメトリーを更新しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setRightType("");
    setRightPeakPressure("");
    setRightCompliance("");
    setRightEarCanalVolume("");
    setLeftType("");
    setLeftPeakPressure("");
    setLeftCompliance("");
    setLeftEarCanalVolume("");
    setInterpretation("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const parseNum = (val: string): number | null => {
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const handleSubmit = () => {
    const data = {
      patientId,
      rightType: rightType as "A" | "As" | "Ad" | "B" | "C" | undefined || undefined,
      rightPeakPressure: parseNum(rightPeakPressure),
      rightCompliance: parseNum(rightCompliance),
      rightEarCanalVolume: parseNum(rightEarCanalVolume),
      leftType: leftType as "A" | "As" | "Ad" | "B" | "C" | undefined || undefined,
      leftPeakPressure: parseNum(leftPeakPressure),
      leftCompliance: parseNum(leftCompliance),
      leftEarCanalVolume: parseNum(leftEarCanalVolume),
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{testId ? "ティンパノメトリーの編集" : "新規ティンパノメトリー"}</DialogTitle>
          <DialogDescription>
            鼓膜・中耳機能検査の結果を入力してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Right Ear */}
            <div className="p-4 bg-red-50 rounded-lg space-y-4">
              <h4 className="font-semibold text-red-700">右耳</h4>

              <div className="space-y-2">
                <Label>ティンパノグラム型</Label>
                <Select value={rightType} onValueChange={setRightType}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TYMPANOGRAM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>中耳圧 (daPa)</Label>
                <Input
                  type="number"
                  value={rightPeakPressure}
                  onChange={(e) => setRightPeakPressure(e.target.value)}
                  placeholder="-400 〜 +200"
                />
              </div>

              <div className="space-y-2">
                <Label>コンプライアンス (ml)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={rightCompliance}
                  onChange={(e) => setRightCompliance(e.target.value)}
                  placeholder="0.3 〜 1.5"
                />
              </div>

              <div className="space-y-2">
                <Label>外耳道容積 (ml)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={rightEarCanalVolume}
                  onChange={(e) => setRightEarCanalVolume(e.target.value)}
                  placeholder="0.6 〜 2.0"
                />
              </div>
            </div>

            {/* Left Ear */}
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <h4 className="font-semibold text-blue-700">左耳</h4>

              <div className="space-y-2">
                <Label>ティンパノグラム型</Label>
                <Select value={leftType} onValueChange={setLeftType}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TYMPANOGRAM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>中耳圧 (daPa)</Label>
                <Input
                  type="number"
                  value={leftPeakPressure}
                  onChange={(e) => setLeftPeakPressure(e.target.value)}
                  placeholder="-400 〜 +200"
                />
              </div>

              <div className="space-y-2">
                <Label>コンプライアンス (ml)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={leftCompliance}
                  onChange={(e) => setLeftCompliance(e.target.value)}
                  placeholder="0.3 〜 1.5"
                />
              </div>

              <div className="space-y-2">
                <Label>外耳道容積 (ml)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={leftEarCanalVolume}
                  onChange={(e) => setLeftEarCanalVolume(e.target.value)}
                  placeholder="0.6 〜 2.0"
                />
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className="space-y-2">
            <Label>所見・解釈</Label>
            <Textarea
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="検査結果の所見を入力..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
