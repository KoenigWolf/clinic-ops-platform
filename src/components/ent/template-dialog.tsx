"use client";

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
  onSuccess: () => void;
}

interface Prescription {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

const CATEGORIES = [
  { value: "EAR", label: "耳疾患" },
  { value: "NOSE", label: "鼻疾患" },
  { value: "THROAT", label: "咽喉頭疾患" },
  { value: "ALLERGY", label: "アレルギー" },
  { value: "VERTIGO", label: "めまい" },
  { value: "OTHER", label: "その他" },
];

interface FormData {
  name: string;
  category: string;
  icdCode: string;
  subjectiveTemplate: string;
  objectiveTemplate: string;
  assessmentTemplate: string;
  planTemplate: string;
  prescriptions: Prescription[];
}

const initialFormData: FormData = {
  name: "",
  category: "EAR",
  icdCode: "",
  subjectiveTemplate: "",
  objectiveTemplate: "",
  assessmentTemplate: "",
  planTemplate: "",
  prescriptions: [],
};

export function TemplateDialog({
  open,
  onOpenChange,
  templateId,
  onSuccess,
}: TemplateDialogProps) {
  const { data: existingTemplate } = trpc.ent.template.get.useQuery(
    { id: templateId! },
    { enabled: !!templateId }
  );

  // Derive form data from existing template (memoized)
  const formData = useMemo<FormData>(() => {
    if (!existingTemplate) {
      return initialFormData;
    }

    return {
      name: existingTemplate.name,
      category: existingTemplate.category,
      icdCode: existingTemplate.icdCode || "",
      subjectiveTemplate: existingTemplate.subjectiveTemplate || "",
      objectiveTemplate: existingTemplate.objectiveTemplate || "",
      assessmentTemplate: existingTemplate.assessmentTemplate || "",
      planTemplate: existingTemplate.planTemplate || "",
      prescriptions: (existingTemplate.commonPrescriptions as unknown as Prescription[]) || [],
    };
  }, [existingTemplate]);

  // State for dynamically added prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [newRxName, setNewRxName] = useState("");
  const [newRxDosage, setNewRxDosage] = useState("");
  const [newRxFrequency, setNewRxFrequency] = useState("");
  const [newRxDuration, setNewRxDuration] = useState("");

  // Sync prescriptions when formData changes
  const effectivePrescriptions = prescriptions.length > 0 ? prescriptions : formData.prescriptions;

  const createMutation = trpc.ent.template.create.useMutation({
    onSuccess: () => {
      toast.success("テンプレートを作成しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.ent.template.update.useMutation({
    onSuccess: () => {
      toast.success("テンプレートを更新しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addPrescription = () => {
    if (newRxName) {
      const currentPrescriptions = prescriptions.length > 0 ? prescriptions : formData.prescriptions;
      setPrescriptions([
        ...currentPrescriptions,
        {
          name: newRxName,
          dosage: newRxDosage,
          frequency: newRxFrequency,
          duration: newRxDuration,
        },
      ]);
      setNewRxName("");
      setNewRxDosage("");
      setNewRxFrequency("");
      setNewRxDuration("");
    }
  };

  const removePrescription = (index: number) => {
    const currentPrescriptions = prescriptions.length > 0 ? prescriptions : formData.prescriptions;
    setPrescriptions(currentPrescriptions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = fd.get("name") as string;
    if (!name) {
      toast.error("テンプレート名は必須です");
      return;
    }

    const data = {
      name,
      category: fd.get("category") as "EAR" | "NOSE" | "THROAT" | "ALLERGY" | "VERTIGO" | "OTHER",
      icdCode: (fd.get("icdCode") as string) || undefined,
      subjectiveTemplate: (fd.get("subjectiveTemplate") as string) || undefined,
      objectiveTemplate: (fd.get("objectiveTemplate") as string) || undefined,
      assessmentTemplate: (fd.get("assessmentTemplate") as string) || undefined,
      planTemplate: (fd.get("planTemplate") as string) || undefined,
      commonPrescriptions: effectivePrescriptions.length > 0 ? effectivePrescriptions : undefined,
    };

    if (templateId) {
      updateMutation.mutate({ id: templateId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPrescriptions([]);
      setNewRxName("");
      setNewRxDosage("");
      setNewRxFrequency("");
      setNewRxDuration("");
    }
    onOpenChange(newOpen);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const formKey = `${templateId || "new"}-${open}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {templateId ? "テンプレートの編集" : "新規テンプレート"}
          </DialogTitle>
          <DialogDescription>
            診療テンプレートを作成・編集します
          </DialogDescription>
        </DialogHeader>

        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>テンプレート名 *</Label>
              <Input
                name="name"
                defaultValue={formData.name}
                placeholder="例: 急性中耳炎"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>カテゴリ</Label>
              <Select name="category" defaultValue={formData.category}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ICD-10コード</Label>
            <Input
              name="icdCode"
              defaultValue={formData.icdCode}
              placeholder="例: H65.0"
            />
          </div>

          {/* SOAP Templates */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold">SOAPテンプレート</h4>

            <div className="space-y-2">
              <Label>S (主観的所見)</Label>
              <Textarea
                name="subjectiveTemplate"
                defaultValue={formData.subjectiveTemplate}
                placeholder="主訴、症状の経過など"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>O (客観的所見)</Label>
              <Textarea
                name="objectiveTemplate"
                defaultValue={formData.objectiveTemplate}
                placeholder="検査結果、診察所見など"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>A (評価・診断)</Label>
              <Textarea
                name="assessmentTemplate"
                defaultValue={formData.assessmentTemplate}
                placeholder="診断名、病状評価など"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>P (計画)</Label>
              <Textarea
                name="planTemplate"
                defaultValue={formData.planTemplate}
                placeholder="治療計画、指導内容など"
                rows={2}
              />
            </div>
          </div>

          {/* Prescriptions */}
          <div className="space-y-2">
            <Label>よく使う処方</Label>

            {effectivePrescriptions.length > 0 && (
              <div className="space-y-2 mb-3">
                {effectivePrescriptions.map((rx, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-blue-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{rx.name}</Badge>
                      <span className="text-sm text-gray-600">
                        {rx.dosage} {rx.frequency} {rx.duration}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrescription(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-5 gap-2">
              <Input
                placeholder="薬剤名"
                value={newRxName}
                onChange={(e) => setNewRxName(e.target.value)}
                className="col-span-2"
              />
              <Input
                placeholder="用量"
                value={newRxDosage}
                onChange={(e) => setNewRxDosage(e.target.value)}
              />
              <Input
                placeholder="用法"
                value={newRxFrequency}
                onChange={(e) => setNewRxFrequency(e.target.value)}
              />
              <div className="flex gap-1">
                <Input
                  placeholder="日数"
                  value={newRxDuration}
                  onChange={(e) => setNewRxDuration(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addPrescription}
                  disabled={!newRxName}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
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
