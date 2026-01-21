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
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { PageHeader, StatCard, StatGrid, EmptyState } from "@/components/layout";
import { labels } from "@/lib/labels";

const { portal: { medications: pageLabels }, common } = labels;

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
      toast.success(labels.messages.success.medicationAdded);
      setDialogOpen(false);
      setEditingMed(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.portal.updateMyMedication.useMutation({
    onSuccess: () => {
      toast.success(labels.messages.success.medicationUpdated);
      setDialogOpen(false);
      setEditingMed(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.portal.deleteMyMedication.useMutation({
    onSuccess: () => {
      toast.success(labels.messages.success.medicationDeleted);
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
      toast.error(labels.messages.error.requiredFields);
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
    <div className="space-y-4">
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={
          <Button onClick={openNewMed}>
            <Plus className="h-4 w-4 mr-2" />
            {pageLabels.addMedication}
          </Button>
        }
      />

      <StatGrid columns={3}>
        <StatCard label={pageLabels.stats.active} value={currentMedications?.length || 0} />
        <StatCard label={pageLabels.stats.total} value={allMedications?.length || 0} />
        <StatCard
          label={pageLabels.stats.prescription}
          value={currentMedications?.filter((m) => m.type === "PRESCRIPTION").length || 0}
        />
      </StatGrid>

      {/* Medications List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">{pageLabels.tabs.active}</TabsTrigger>
          <TabsTrigger value="all">{pageLabels.tabs.all}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {!medications?.length ? (
            <EmptyState
              icon={Pill}
              message={activeTab === "current" ? pageLabels.empty.active : pageLabels.empty.all}
              action={
                <Button variant="outline" onClick={openNewMed}>
                  <Plus className="h-4 w-4 mr-2" />
                  {pageLabels.addMedication}
                </Button>
              }
            />
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
                        {pageLabels.types[med.type as keyof typeof pageLabels.types]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{pageLabels.properties.instructions}</span>
                        <span className="font-medium">{med.frequency}</span>
                      </div>
                      {med.startDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{pageLabels.properties.startDate}</span>
                          <span>
                            {format(new Date(med.startDate), "yyyy年M月d日", { locale: ja })}
                          </span>
                        </div>
                      )}
                      {med.endDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{pageLabels.properties.endDate}</span>
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
              {editingMed?.id ? pageLabels.dialog.editTitle : pageLabels.dialog.addTitle}
            </DialogTitle>
            <DialogDescription>
              {pageLabels.dialog.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{pageLabels.form.name} *</Label>
                <Input
                  value={editingMed?.name || ""}
                  onChange={(e) => setEditingMed((prev) => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="例: ロキソニン"
                />
              </div>
              <div className="space-y-2">
                <Label>{pageLabels.form.type} *</Label>
                <Select
                  value={editingMed?.type || "PRESCRIPTION"}
                  onValueChange={(value) => setEditingMed((prev) => prev ? { ...prev, type: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(pageLabels.types) as Array<keyof typeof pageLabels.types>).map((key) => (
                      <SelectItem key={key} value={key}>
                        {pageLabels.types[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{pageLabels.form.dosage} *</Label>
                <Input
                  value={editingMed?.dosage || ""}
                  onChange={(e) => setEditingMed((prev) => prev ? { ...prev, dosage: e.target.value } : null)}
                  placeholder="例: 60mg"
                />
              </div>
              <div className="space-y-2">
                <Label>{pageLabels.form.instructions} *</Label>
                <Input
                  value={editingMed?.frequency || ""}
                  onChange={(e) => setEditingMed((prev) => prev ? { ...prev, frequency: e.target.value } : null)}
                  placeholder="例: 1日3回 毎食後"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{pageLabels.form.startDate} *</Label>
                <Input
                  type="date"
                  value={editingMed?.startDate || ""}
                  onChange={(e) => setEditingMed((prev) => prev ? { ...prev, startDate: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>{pageLabels.form.endDate}</Label>
                <Input
                  type="date"
                  value={editingMed?.endDate || ""}
                  onChange={(e) => setEditingMed((prev) => prev ? { ...prev, endDate: e.target.value } : null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{pageLabels.form.notes}</Label>
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
              {common.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending ? common.saving : common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
