"use client";

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      patientId,
      testType: formData.get("testType") as "CALORIC" | "POSTUROGRAPHY" | "ENG" | "VNG" | "VHIT" | "VEMP" | "ROTATION",
      chiefComplaint: (formData.get("chiefComplaint") as string) || undefined,
      vertigoType: (formData.get("vertigoType") as string) || undefined,
      nystagmusFindings: (formData.get("nystagmusFindings") as string) || undefined,
      rombergTest: (formData.get("rombergTest") as string) || undefined,
      mannTest: (formData.get("mannTest") as string) || undefined,
      caloricResponse: (formData.get("caloricResponse") as string) || undefined,
      headImpulseTest: (formData.get("headImpulseTest") as string) || undefined,
      dixHallpikeResult: (formData.get("dixHallpikeResult") as string) || undefined,
      interpretation: (formData.get("interpretation") as string) || undefined,
    };

    if (testId) {
      updateMutation.mutate({ id: testId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Use key to reset form when dialog closes/opens
  const formKey = `${testId || "new"}-${open}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{testId ? "平衡機能検査の編集" : "新規平衡機能検査"}</DialogTitle>
          <DialogDescription>
            めまい・平衡機能検査の結果を入力してください
          </DialogDescription>
        </DialogHeader>

        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          {/* Test Type */}
          <div className="space-y-2">
            <Label>検査種類</Label>
            <Select name="testType" defaultValue="CALORIC">
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
              name="chiefComplaint"
              placeholder="例: 回転性めまい、ふらつき"
            />
          </div>

          {/* Vertigo Type */}
          <div className="space-y-2">
            <Label>めまいの種類</Label>
            <Select name="vertigoType">
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
              name="nystagmusFindings"
              placeholder="自発眼振、注視眼振、頭位眼振など"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Romberg Test */}
            <div className="space-y-2">
              <Label>Romberg検査</Label>
              <Select name="rombergTest">
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
              <Select name="mannTest">
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
              name="caloricResponse"
              placeholder="CP、DP、眼振の方向・持続時間など"
              rows={2}
            />
          </div>

          {/* Head Impulse Test */}
          <div className="space-y-2">
            <Label>Head Impulse Test</Label>
            <Input
              name="headImpulseTest"
              placeholder="正常/catch-up saccade あり"
            />
          </div>

          {/* Dix-Hallpike Test */}
          <div className="space-y-2">
            <Label>Dix-Hallpike検査</Label>
            <Select name="dixHallpikeResult">
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
              name="interpretation"
              placeholder="検査結果の総合評価、疑い病名など"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
