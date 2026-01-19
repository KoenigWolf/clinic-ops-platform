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

interface AllergyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  testId: string | null;
  onSuccess: () => void;
}

const TEST_TYPES = [
  { value: "RAST", label: "RAST (特異的IgE検査)" },
  { value: "SKIN_PRICK", label: "皮膚プリックテスト" },
  { value: "MAST", label: "MAST (多項目同時測定)" },
  { value: "CAP", label: "CAP (UniCAP)" },
];

const COMMON_ALLERGENS = [
  "スギ",
  "ヒノキ",
  "ブタクサ",
  "カモガヤ",
  "ヨモギ",
  "ハウスダスト",
  "ダニ",
  "カビ",
  "ネコ",
  "イヌ",
  "卵白",
  "牛乳",
  "小麦",
  "そば",
  "ピーナッツ",
  "エビ",
  "カニ",
];

const CLASS_LEVELS = [
  { value: "0", label: "クラス0 (陰性)" },
  { value: "1", label: "クラス1 (疑陽性)" },
  { value: "2", label: "クラス2 (陽性)" },
  { value: "3", label: "クラス3 (陽性)" },
  { value: "4", label: "クラス4 (強陽性)" },
  { value: "5", label: "クラス5 (強陽性)" },
  { value: "6", label: "クラス6 (最強陽性)" },
];

interface AllergenResult {
  allergen: string;
  class: string;
  value?: string;
}

export function AllergyDialog({
  open,
  onOpenChange,
  patientId,
  testId,
  onSuccess,
}: AllergyDialogProps) {
  const [testType, setTestType] = useState("RAST");
  const [totalIgE, setTotalIgE] = useState("");
  const [results, setResults] = useState<AllergenResult[]>([]);
  const [newAllergen, setNewAllergen] = useState("");
  const [newClass, setNewClass] = useState("");
  const [interpretation, setInterpretation] = useState("");

  const createMutation = trpc.ent.allergy.create.useMutation({
    onSuccess: () => {
      toast.success("アレルギー検査を保存しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.ent.allergy.update.useMutation({
    onSuccess: () => {
      toast.success("アレルギー検査を更新しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!open) {
      // Reset form
      setTestType("RAST");
      setTotalIgE("");
      setResults([]);
      setNewAllergen("");
      setNewClass("");
      setInterpretation("");
    }
  }, [open]);

  const addAllergenResult = () => {
    if (newAllergen && newClass) {
      setResults([...results, { allergen: newAllergen, class: newClass }]);
      setNewAllergen("");
      setNewClass("");
    }
  };

  const removeAllergenResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const getClassColor = (classLevel: string) => {
    const level = parseInt(classLevel);
    if (level === 0) return "bg-gray-100 text-gray-800";
    if (level === 1) return "bg-yellow-100 text-yellow-800";
    if (level <= 3) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const handleSubmit = () => {
    const resultsObj: Record<string, string> = {};
    results.forEach((r) => {
      resultsObj[r.allergen] = r.class;
    });

    const data = {
      patientId,
      testType: testType as "RAST" | "SKIN_PRICK" | "MAST" | "CAP",
      totalIgE: totalIgE ? parseFloat(totalIgE) : null,
      results: resultsObj,
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
          <DialogTitle>{testId ? "アレルギー検査の編集" : "新規アレルギー検査"}</DialogTitle>
          <DialogDescription>
            アレルギー検査の結果を入力してください
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

          {/* Total IgE */}
          <div className="space-y-2">
            <Label>総IgE (IU/mL)</Label>
            <Input
              type="number"
              value={totalIgE}
              onChange={(e) => setTotalIgE(e.target.value)}
              placeholder="例: 150"
            />
            <p className="text-xs text-gray-500">基準値: 170 IU/mL 以下</p>
          </div>

          {/* Allergen Results */}
          <div className="space-y-2">
            <Label>アレルゲン別結果</Label>

            {/* Results list */}
            {results.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {results.map((result, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`${getClassColor(result.class)} flex items-center gap-1`}
                  >
                    {result.allergen}: クラス{result.class}
                    <button
                      type="button"
                      onClick={() => removeAllergenResult(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add new allergen */}
            <div className="flex gap-2">
              <Select value={newAllergen} onValueChange={setNewAllergen}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="アレルゲンを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_ALLERGENS.map((allergen) => (
                    <SelectItem key={allergen} value={allergen}>
                      {allergen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={newClass} onValueChange={setNewClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="クラス..." />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addAllergenResult}
                disabled={!newAllergen || !newClass}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Custom allergen input */}
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="その他のアレルゲンを入力..."
                value={newAllergen}
                onChange={(e) => setNewAllergen(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Quick add common panel allergens */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-500">よく使うパネル</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const panel = ["スギ", "ヒノキ", "ハウスダスト", "ダニ"];
                  panel.forEach((a) => {
                    if (!results.find((r) => r.allergen === a)) {
                      setResults((prev) => [...prev, { allergen: a, class: "0" }]);
                    }
                  });
                }}
              >
                吸入系4項目
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const panel = ["卵白", "牛乳", "小麦", "そば", "ピーナッツ"];
                  panel.forEach((a) => {
                    if (!results.find((r) => r.allergen === a)) {
                      setResults((prev) => [...prev, { allergen: a, class: "0" }]);
                    }
                  });
                }}
              >
                食物系5項目
              </Button>
            </div>
          </div>

          {/* Interpretation */}
          <div className="space-y-2">
            <Label>所見・解釈</Label>
            <Textarea
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="アレルギー検査結果の総合評価、臨床との相関など"
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
