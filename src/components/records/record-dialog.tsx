"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ear } from "lucide-react";
import { SOAPTab, ENTTab, VitalsTab, InfoTab } from "./tabs";

const recordSchema = z.object({
  recordDate: z.string().optional(),
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  heartRate: z.number().optional(),
  temperature: z.number().optional(),
  respiratoryRate: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
});

export type RecordFormData = z.infer<typeof recordSchema>;

interface RecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  recordId: string | null;
  onSuccess: () => void;
}

export function RecordDialog({
  open,
  onOpenChange,
  patientId,
  recordId,
  onSuccess,
}: RecordDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const { data: existingRecord } = trpc.record.get.useQuery(
    { id: recordId || "" },
    { enabled: !!recordId }
  );

  const { data: templates } = trpc.ent.template.list.useQuery(undefined);

  const { data: linkedAudiometry } = trpc.ent.audiometry.list.useQuery(
    { patientId },
    { enabled: !!patientId && !!recordId }
  );

  const { data: linkedEndoscopy } = trpc.ent.endoscopy.list.useQuery(
    { patientId },
    { enabled: !!patientId && !!recordId }
  );

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      recordDate: new Date().toISOString().split("T")[0],
      chiefComplaint: "",
      diagnosis: "",
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
    },
  });

  useEffect(() => {
    if (existingRecord) {
      const vitalSigns = existingRecord.vitalSigns as Record<string, number> | null;
      form.reset({
        recordDate: new Date(existingRecord.recordDate).toISOString().split("T")[0],
        chiefComplaint: existingRecord.chiefComplaint || "",
        diagnosis: existingRecord.diagnosis || "",
        subjective: existingRecord.subjective || "",
        objective: existingRecord.objective || "",
        assessment: existingRecord.assessment || "",
        plan: existingRecord.plan || "",
        bloodPressureSystolic: vitalSigns?.bloodPressureSystolic,
        bloodPressureDiastolic: vitalSigns?.bloodPressureDiastolic,
        heartRate: vitalSigns?.heartRate,
        temperature: vitalSigns?.temperature,
        respiratoryRate: vitalSigns?.respiratoryRate,
        oxygenSaturation: vitalSigns?.oxygenSaturation,
        weight: vitalSigns?.weight,
        height: vitalSigns?.height,
      });
    } else {
      form.reset({
        recordDate: new Date().toISOString().split("T")[0],
        chiefComplaint: "",
        diagnosis: "",
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
      });
    }
  }, [existingRecord, form]);

  const createMutation = trpc.record.create.useMutation({
    onSuccess: () => {
      toast.success("診療記録を保存しました");
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "保存に失敗しました");
    },
  });

  const updateMutation = trpc.record.update.useMutation({
    onSuccess: () => {
      toast.success("診療記録を更新しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "更新に失敗しました");
    },
  });

  const onSubmit = (data: RecordFormData) => {
    const vitalSigns = {
      bloodPressureSystolic: data.bloodPressureSystolic,
      bloodPressureDiastolic: data.bloodPressureDiastolic,
      heartRate: data.heartRate,
      temperature: data.temperature,
      respiratoryRate: data.respiratoryRate,
      oxygenSaturation: data.oxygenSaturation,
      weight: data.weight,
      height: data.height,
    };

    const payload = {
      recordDate: data.recordDate ? new Date(data.recordDate) : undefined,
      chiefComplaint: data.chiefComplaint,
      diagnosis: data.diagnosis,
      subjective: data.subjective,
      objective: data.objective,
      assessment: data.assessment,
      plan: data.plan,
      vitalSigns,
    };

    if (recordId) {
      updateMutation.mutate({ id: recordId, data: payload });
    } else {
      createMutation.mutate({ ...payload, patientId });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {recordId ? "診療記録編集" : "新規診療記録"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="soap">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="soap">SOAP記録</TabsTrigger>
                <TabsTrigger value="ent">
                  <Ear className="h-4 w-4 mr-1" />
                  耳鼻科
                </TabsTrigger>
                <TabsTrigger value="vitals">バイタル</TabsTrigger>
                <TabsTrigger value="info">基本情報</TabsTrigger>
              </TabsList>

              <TabsContent value="soap">
                <SOAPTab
                  form={form}
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  onTemplateChange={setSelectedTemplate}
                />
              </TabsContent>

              <TabsContent value="ent">
                <ENTTab
                  patientId={patientId}
                  recordId={recordId}
                  linkedAudiometry={linkedAudiometry}
                  linkedEndoscopy={linkedEndoscopy}
                />
              </TabsContent>

              <TabsContent value="vitals">
                <VitalsTab form={form} />
              </TabsContent>

              <TabsContent value="info">
                <InfoTab form={form} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
