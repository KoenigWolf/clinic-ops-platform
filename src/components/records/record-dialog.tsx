"use client";

import { useEffect } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

type RecordFormData = z.infer<typeof recordSchema>;

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
  const { data: existingRecord } = trpc.record.get.useQuery(
    { id: recordId || "" },
    { enabled: !!recordId }
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="soap">SOAP記録</TabsTrigger>
                <TabsTrigger value="vitals">バイタル</TabsTrigger>
                <TabsTrigger value="info">基本情報</TabsTrigger>
              </TabsList>

              {/* SOAP Tab */}
              <TabsContent value="soap" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="subjective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-600 font-semibold">
                        S (Subjective) - 主観的情報
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="患者の訴え、症状の経過、現病歴など"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-600 font-semibold">
                        O (Objective) - 客観的情報
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="身体所見、検査結果、バイタルサインなど"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assessment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-orange-600 font-semibold">
                        A (Assessment) - 評価
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="診断、病態の評価、鑑別診断など"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-600 font-semibold">
                        P (Plan) - 計画
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="治療計画、処方、検査オーダー、次回予約など"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Vitals Tab */}
              <TabsContent value="vitals" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bloodPressureSystolic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>収縮期血圧 (mmHg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="120"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bloodPressureDiastolic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>拡張期血圧 (mmHg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="80"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="heartRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>心拍数 (bpm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="72"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>体温 (°C)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="36.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="respiratoryRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>呼吸数 (/min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="16"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="oxygenSaturation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SpO2 (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="98"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>体重 (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="60.0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>身長 (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="170.0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="recordDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>診療日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chiefComplaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>主訴</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="頭痛、発熱など" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>診断名</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="急性上気道炎" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
