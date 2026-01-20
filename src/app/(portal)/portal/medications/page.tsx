"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pill,
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";

const MEDICATION_TYPES = [
  { value: "PRESCRIPTION", label: "処方薬" },
  { value: "OTC", label: "市販薬" },
  { value: "SUPPLEMENT", label: "サプリメント" },
];

export default function MedicationsPage() {
  const [activeTab, setActiveTab] = useState("current");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<{
    id?: string;
    name: string;
    dosage: string;
    frequency: string;
    type: string;
    startDate: string;
    endDate?: string;
    notes?: string;
  } | null>(null);

  const { data: allMedications, refetch } = trpc.portal.myMedications.useQuery();
  const { data: currentMedications } = trpc.portal.myCurrentMedications.useQuery();

  const addMutation = trpc.portal.addMyMedication.useMutation({
    onSuccess: () => {
      toast.success("お薬を追加しました");
      setDialogOpen(false);
      setEditingMed(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.portal.updateMyMedication.useMutation({
    onSuccess: () => {
      toast.success("お薬を更新しました");
      setDialogOpen(false);
      setEditingMed(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.portal.deleteMyMedication.useMutation({
    onSuccess: () => {
      toast.success("お薬を削除しました");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const openNewMed = () => {
    setEditingMed({
      name: "",
      dosage: "",
      frequency: "",
      type: "PRESCRIPTION",
      startDate: new Date().toISOString().split("T")[0],
    });
    setDialogOpen(true);
  };

  const openEditMed = (med: NonNullable<typeof allMedications>[0]) => {
    setEditingMed({
      id: med.id,
      name: med.medicationName,
      dosage: med.dosage || "",
      frequency: med.frequency || "",
      type: med.type,
      startDate: med.startDate ? new Date(med.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      endDate: med.endDate ? new Date(med.endDate).toISOString().split("T")[0] : undefined,
      notes: med.notes || undefined,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingMed?.name || !editingMed?.dosage || !editingMed?.frequency) {
      toast.error("必須項目を入力してください");
      return;
    }

    const data = {
      name: editingMed.name,
      dosage: editingMed.dosage,
      frequency: editingMed.frequency,
      type: editingMed.type as "PRESCRIPTION" | "OTC" | "SUPPLEMENT",
      startDate: new Date(editingMed.startDate),
      endDate: editingMed.endDate ? new Date(editingMed.endDate) : undefined,
      notes: editingMed.notes,
    };

    if (editingMed.id) {
      updateMutation.mutate({ id: editingMed.id, data });
    } else {
      addMutation.mutate(data);
    }
  };

  const medications = activeTab === "current" ? currentMedications : allMedications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">お薬手帳</h1>
          <p className="text-gray-500">服用中のお薬を管理できます</p>
        </div>
        <Button onClick={openNewMed}>
          <Plus className="h-4 w-4 mr-2" />
          お薬を追加
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Pill className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentMedications?.length || 0}</p>
                <p className="text-xs text-gray-500">服用中</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allMedications?.length || 0}</p>
                <p className="text-xs text-gray-500">合計</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {currentMedications?.filter((m) => m.type === "PRESCRIPTION").length || 0}
                </p>
                <p className="text-xs text-gray-500">処方薬</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medications List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">服用中</TabsTrigger>
          <TabsTrigger value="all">すべて</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {!medications?.length ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Pill className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>{activeTab === "current" ? "服用中の薬はありません" : "お薬の記録はありません"}</p>
                  <Button variant="outline" className="mt-4" onClick={openNewMed}>
                    <Plus className="h-4 w-4 mr-2" />
                    お薬を追加
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {medications.map((med) => (
                <Card key={med.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{med.medicationName}</CardTitle>
                        <CardDescription>{med.dosage}</CardDescription>
                      </div>
                      <Badge
                        variant={med.type === "PRESCRIPTION" ? "default" : "secondary"}
                      >
                        {MEDICATION_TYPES.find((t) => t.value === med.type)?.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">服用方法</span>
                        <span className="font-medium">{med.frequency}</span>
                      </div>
                      {med.startDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">開始日</span>
                          <span>
                            {format(new Date(med.startDate), "yyyy年M月d日", { locale: ja })}
                          </span>
                        </div>
                      )}
                      {med.endDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">終了日</span>
                          <span>
                            {format(new Date(med.endDate), "yyyy年M月d日", { locale: ja })}
                          </span>
                        </div>
                      )}
                      {med.notes && (
                        <div className="pt-2 border-t mt-2">
                          <p className="text-gray-500 text-xs">{med.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-1 mt-4 pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => openEditMed(med)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteMutation.mutate({ id: med.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMed?.id ? "お薬を編集" : "お薬を追加"}
            </DialogTitle>
            <DialogDescription>
              服用中のお薬を記録します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>お薬の名前 *</Label>
                <Input
                  value={editingMed?.name || ""}
                  onChange={(e) => setEditingMed((prev) => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="例: ロキソニン"
                />
              </div>
              <div className="space-y-2">
                <Label>種類 *</Label>
                <Select
                  value={editingMed?.type || "PRESCRIPTION"}
                  onValueChange={(value) => setEditingMed((prev) => prev ? { ...prev, type: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用量 *</Label>
                <Input
                  value={editingMed?.dosage || ""}
                  onChange={(e) => setEditingMed((prev) => prev ? { ...prev, dosage: e.target.value } : null)}
                  placeholder="例: 60mg"
                />
              </div>
              <div className="space-y-2">
                <Label>服用方法 *</Label>
                <Input
                  value={editingMed?.frequency || ""}
                  onChange={(e) => setEditingMed((prev) => prev ? { ...prev, frequency: e.target.value } : null)}
                  placeholder="例: 1日3回 毎食後"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>開始日 *</Label>
                <Input
                  type="date"
                  value={editingMed?.startDate || ""}
                  onChange={(e) => setEditingMed((prev) => prev ? { ...prev, startDate: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>終了日</Label>
                <Input
                  type="date"
                  value={editingMed?.endDate || ""}
                  onChange={(e) => setEditingMed((prev) => prev ? { ...prev, endDate: e.target.value } : null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Textarea
                value={editingMed?.notes || ""}
                onChange={(e) => setEditingMed((prev) => prev ? { ...prev, notes: e.target.value } : null)}
                placeholder="お薬に関するメモ（副作用、注意事項など）"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
