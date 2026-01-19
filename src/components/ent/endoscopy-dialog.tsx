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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface EndoscopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  examId: string | null;
  onSuccess: () => void;
}

const EXAM_TYPES = [
  { value: "NASAL", label: "鼻腔内視鏡" },
  { value: "PHARYNGEAL", label: "咽頭内視鏡" },
  { value: "LARYNGEAL", label: "喉頭内視鏡" },
  { value: "OTOSCOPY", label: "耳鏡検査" },
];

export function EndoscopyDialog({
  open,
  onOpenChange,
  patientId,
  examId,
  onSuccess,
}: EndoscopyDialogProps) {
  const [examType, setExamType] = useState("NASAL");

  // Nasal findings
  const [nasalFindings, setNasalFindings] = useState("");
  const [nasalSeptum, setNasalSeptum] = useState("");
  const [inferiorTurbinate, setInferiorTurbinate] = useState("");
  const [middleMeatus, setMiddleMeatus] = useState("");

  // Pharyngeal findings
  const [pharyngealFindings, setPharyngealFindings] = useState("");
  const [tonsils, setTonsils] = useState("");

  // Laryngeal findings
  const [laryngealFindings, setLaryngealFindings] = useState("");
  const [vocalCords, setVocalCords] = useState("");
  const [epiglottis, setEpiglottis] = useState("");

  // Otoscopy
  const [otoscopyRight, setOtoscopyRight] = useState("");
  const [otoscopyLeft, setOtoscopyLeft] = useState("");

  const [interpretation, setInterpretation] = useState("");

  const createMutation = trpc.ent.endoscopy.create.useMutation({
    onSuccess: () => {
      toast.success("内視鏡検査を保存しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.ent.endoscopy.update.useMutation({
    onSuccess: () => {
      toast.success("内視鏡検査を更新しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!open) {
      // Reset form
      setExamType("NASAL");
      setNasalFindings("");
      setNasalSeptum("");
      setInferiorTurbinate("");
      setMiddleMeatus("");
      setPharyngealFindings("");
      setTonsils("");
      setLaryngealFindings("");
      setVocalCords("");
      setEpiglottis("");
      setOtoscopyRight("");
      setOtoscopyLeft("");
      setInterpretation("");
    }
  }, [open]);

  const handleSubmit = () => {
    const data = {
      patientId,
      examType: examType as "NASAL" | "PHARYNGEAL" | "LARYNGEAL" | "OTOSCOPY",
      nasalFindings: nasalFindings || undefined,
      nasalSeptum: nasalSeptum || undefined,
      inferiorTurbinate: inferiorTurbinate || undefined,
      middleMeatus: middleMeatus || undefined,
      pharyngealFindings: pharyngealFindings || undefined,
      tonsils: tonsils || undefined,
      laryngealFindings: laryngealFindings || undefined,
      vocalCords: vocalCords || undefined,
      epiglottis: epiglottis || undefined,
      otoscopyRight: otoscopyRight || undefined,
      otoscopyLeft: otoscopyLeft || undefined,
      interpretation: interpretation || undefined,
    };

    if (examId) {
      updateMutation.mutate({ id: examId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{examId ? "内視鏡検査の編集" : "新規内視鏡検査"}</DialogTitle>
          <DialogDescription>
            鼻腔・咽頭・喉頭内視鏡検査の所見を入力してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Exam Type */}
          <div className="space-y-2">
            <Label>検査種類</Label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="nasal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="nasal">鼻腔</TabsTrigger>
              <TabsTrigger value="pharyngeal">咽頭</TabsTrigger>
              <TabsTrigger value="laryngeal">喉頭</TabsTrigger>
              <TabsTrigger value="otoscopy">耳鏡</TabsTrigger>
            </TabsList>

            {/* Nasal Tab */}
            <TabsContent value="nasal" className="space-y-4">
              <div className="space-y-2">
                <Label>鼻腔所見（総合）</Label>
                <Textarea
                  value={nasalFindings}
                  onChange={(e) => setNasalFindings(e.target.value)}
                  placeholder="粘膜の状態、分泌物、ポリープの有無など"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>鼻中隔</Label>
                <Select value={nasalSeptum} onValueChange={setNasalSeptum}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="正中">正中</SelectItem>
                    <SelectItem value="右への彎曲">右への彎曲</SelectItem>
                    <SelectItem value="左への彎曲">左への彎曲</SelectItem>
                    <SelectItem value="S字状彎曲">S字状彎曲</SelectItem>
                    <SelectItem value="棘・稜形成">棘・稜形成</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>下鼻甲介</Label>
                <Select value={inferiorTurbinate} onValueChange={setInferiorTurbinate}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="正常">正常</SelectItem>
                    <SelectItem value="軽度腫脹">軽度腫脹</SelectItem>
                    <SelectItem value="中等度腫脹">中等度腫脹</SelectItem>
                    <SelectItem value="高度腫脹">高度腫脹</SelectItem>
                    <SelectItem value="蒼白浮腫状">蒼白浮腫状</SelectItem>
                    <SelectItem value="充血">充血</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>中鼻道</Label>
                <Textarea
                  value={middleMeatus}
                  onChange={(e) => setMiddleMeatus(e.target.value)}
                  placeholder="膿性分泌物、ポリープの有無など"
                  rows={2}
                />
              </div>
            </TabsContent>

            {/* Pharyngeal Tab */}
            <TabsContent value="pharyngeal" className="space-y-4">
              <div className="space-y-2">
                <Label>咽頭所見</Label>
                <Textarea
                  value={pharyngealFindings}
                  onChange={(e) => setPharyngealFindings(e.target.value)}
                  placeholder="咽頭後壁、側索の状態、リンパ濾胞など"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>扁桃</Label>
                <Select value={tonsils} onValueChange={setTonsils}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="正常（I度）">正常（I度）</SelectItem>
                    <SelectItem value="軽度肥大（II度）">軽度肥大（II度）</SelectItem>
                    <SelectItem value="中等度肥大（III度）">中等度肥大（III度）</SelectItem>
                    <SelectItem value="高度肥大（IV度）">高度肥大（IV度）</SelectItem>
                    <SelectItem value="扁桃摘出後">扁桃摘出後</SelectItem>
                    <SelectItem value="白苔付着">白苔付着</SelectItem>
                    <SelectItem value="膿栓">膿栓</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Laryngeal Tab */}
            <TabsContent value="laryngeal" className="space-y-4">
              <div className="space-y-2">
                <Label>喉頭所見（総合）</Label>
                <Textarea
                  value={laryngealFindings}
                  onChange={(e) => setLaryngealFindings(e.target.value)}
                  placeholder="喉頭蓋、披裂部、梨状陥凹など"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>声帯</Label>
                <Select value={vocalCords} onValueChange={setVocalCords}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="正常">正常</SelectItem>
                    <SelectItem value="発赤">発赤</SelectItem>
                    <SelectItem value="浮腫">浮腫</SelectItem>
                    <SelectItem value="声帯結節">声帯結節</SelectItem>
                    <SelectItem value="声帯ポリープ">声帯ポリープ</SelectItem>
                    <SelectItem value="声帯麻痺（右）">声帯麻痺（右）</SelectItem>
                    <SelectItem value="声帯麻痺（左）">声帯麻痺（左）</SelectItem>
                    <SelectItem value="声帯萎縮">声帯萎縮</SelectItem>
                    <SelectItem value="白斑">白斑</SelectItem>
                    <SelectItem value="腫瘍性病変">腫瘍性病変</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>喉頭蓋</Label>
                <Select value={epiglottis} onValueChange={setEpiglottis}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="正常">正常</SelectItem>
                    <SelectItem value="発赤">発赤</SelectItem>
                    <SelectItem value="腫脹">腫脹</SelectItem>
                    <SelectItem value="嚢胞">嚢胞</SelectItem>
                    <SelectItem value="omega型">omega型</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Otoscopy Tab */}
            <TabsContent value="otoscopy" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg space-y-2">
                  <Label className="text-red-700 font-semibold">右耳</Label>
                  <Textarea
                    value={otoscopyRight}
                    onChange={(e) => setOtoscopyRight(e.target.value)}
                    placeholder="鼓膜の状態、光錐、穿孔、耳垢など"
                    rows={4}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <Label className="text-blue-700 font-semibold">左耳</Label>
                  <Textarea
                    value={otoscopyLeft}
                    onChange={(e) => setOtoscopyLeft(e.target.value)}
                    placeholder="鼓膜の状態、光錐、穿孔、耳垢など"
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Interpretation */}
          <div className="space-y-2">
            <Label>総合所見・診断</Label>
            <Textarea
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="検査結果の総合評価"
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
