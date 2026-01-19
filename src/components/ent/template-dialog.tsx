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

export function TemplateDialog({
  open,
  onOpenChange,
  templateId,
  onSuccess,
}: TemplateDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("EAR");
  const [icdCode, setIcdCode] = useState("");
  const [subjectiveTemplate, setSubjectiveTemplate] = useState("");
  const [objectiveTemplate, setObjectiveTemplate] = useState("");
  const [assessmentTemplate, setAssessmentTemplate] = useState("");
  const [planTemplate, setPlanTemplate] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // New prescription form
  const [newRxName, setNewRxName] = useState("");
  const [newRxDosage, setNewRxDosage] = useState("");
  const [newRxFrequency, setNewRxFrequency] = useState("");
  const [newRxDuration, setNewRxDuration] = useState("");

  const { data: existingTemplate } = trpc.ent.template.get.useQuery(
    { id: templateId! },
    { enabled: !!templateId }
  );

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

  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setCategory(existingTemplate.category);
      setIcdCode(existingTemplate.icdCode || "");
      setSubjectiveTemplate(existingTemplate.subjectiveTemplate || "");
      setObjectiveTemplate(existingTemplate.objectiveTemplate || "");
      setAssessmentTemplate(existingTemplate.assessmentTemplate || "");
      setPlanTemplate(existingTemplate.planTemplate || "");
      if (existingTemplate.commonPrescriptions && Array.isArray(existingTemplate.commonPrescriptions)) {
        setPrescriptions(existingTemplate.commonPrescriptions as unknown as Prescription[]);
      }
    } else if (!templateId) {
      // Reset form for new template
      setName("");
      setCategory("EAR");
      setIcdCode("");
      setSubjectiveTemplate("");
      setObjectiveTemplate("");
      setAssessmentTemplate("");
      setPlanTemplate("");
      setPrescriptions([]);
    }
  }, [existingTemplate, templateId, open]);

  const addPrescription = () => {
    if (newRxName) {
      setPrescriptions([
        ...prescriptions,
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
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name) {
      toast.error("テンプレート名は必須です");
      return;
    }

    const data = {
      name,
      category: category as "EAR" | "NOSE" | "THROAT" | "ALLERGY" | "VERTIGO" | "OTHER",
      icdCode: icdCode || undefined,
      subjectiveTemplate: subjectiveTemplate || undefined,
      objectiveTemplate: objectiveTemplate || undefined,
      assessmentTemplate: assessmentTemplate || undefined,
      planTemplate: planTemplate || undefined,
      commonPrescriptions: prescriptions.length > 0 ? prescriptions : undefined,
    };

    if (templateId) {
      updateMutation.mutate({ id: templateId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {templateId ? "テンプレートの編集" : "新規テンプレート"}
          </DialogTitle>
          <DialogDescription>
            よく使う診断・所見・処方をテンプレートとして保存できます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>テンプレート名 *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 急性中耳炎"
              />
            </div>
            <div className="space-y-2">
              <Label>カテゴリ *</Label>
              <Select value={category} onValueChange={setCategory}>
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
              value={icdCode}
              onChange={(e) => setIcdCode(e.target.value)}
              placeholder="例: H65.0"
            />
          </div>

          {/* SOAP Templates */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">SOAP テンプレート</h3>

            <div className="space-y-2">
              <Label className="text-blue-600">S (主訴・現病歴)</Label>
              <Textarea
                value={subjectiveTemplate}
                onChange={(e) => setSubjectiveTemplate(e.target.value)}
                placeholder="例: 〇日前から耳痛あり。発熱(+)。"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-green-600">O (所見)</Label>
              <Textarea
                value={objectiveTemplate}
                onChange={(e) => setObjectiveTemplate(e.target.value)}
                placeholder="例: 右鼓膜発赤・膨隆(+)。光錐消失。"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-orange-600">A (評価)</Label>
              <Textarea
                value={assessmentTemplate}
                onChange={(e) => setAssessmentTemplate(e.target.value)}
                placeholder="例: 急性中耳炎（右）"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-purple-600">P (計画)</Label>
              <Textarea
                value={planTemplate}
                onChange={(e) => setPlanTemplate(e.target.value)}
                placeholder="例: 抗生剤処方。3日後再診。"
                rows={2}
              />
            </div>
          </div>

          {/* Common Prescriptions */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">よく使う処方</h3>

            {/* Existing prescriptions */}
            {prescriptions.length > 0 && (
              <div className="space-y-2">
                {prescriptions.map((rx, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{rx.name}</span>
                      {rx.dosage && (
                        <span className="text-gray-600 ml-2">{rx.dosage}</span>
                      )}
                      {rx.frequency && (
                        <span className="text-gray-600 ml-2">{rx.frequency}</span>
                      )}
                      {rx.duration && (
                        <Badge variant="outline" className="ml-2">
                          {rx.duration}
                        </Badge>
                      )}
                    </div>
                    <Button
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

            {/* Add prescription form */}
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <Input
                  value={newRxName}
                  onChange={(e) => setNewRxName(e.target.value)}
                  placeholder="薬剤名"
                />
              </div>
              <Input
                value={newRxDosage}
                onChange={(e) => setNewRxDosage(e.target.value)}
                placeholder="用量"
              />
              <Input
                value={newRxFrequency}
                onChange={(e) => setNewRxFrequency(e.target.value)}
                placeholder="用法"
              />
              <div className="flex gap-2">
                <Input
                  value={newRxDuration}
                  onChange={(e) => setNewRxDuration(e.target.value)}
                  placeholder="日数"
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

            {/* Quick add common ENT medications */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">よく使う薬:</span>
              {[
                { name: "サワシリン", dosage: "250mg", frequency: "1日3回毎食後" },
                { name: "クラリス", dosage: "200mg", frequency: "1日2回朝夕食後" },
                { name: "アレグラ", dosage: "60mg", frequency: "1日2回朝夕食後" },
                { name: "ナゾネックス", dosage: "", frequency: "1日1回各鼻腔1噴霧" },
                { name: "タリビッド点耳", dosage: "", frequency: "1日2回" },
              ].map((rx) => (
                <Button
                  key={rx.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPrescriptions([...prescriptions, { ...rx, duration: "" }]);
                  }}
                >
                  + {rx.name}
                </Button>
              ))}
            </div>
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
