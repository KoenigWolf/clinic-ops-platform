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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ear, FileText, Plus } from "lucide-react";
import Link from "next/link";

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
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const { data: existingRecord } = trpc.record.get.useQuery(
    { id: recordId || "" },
    { enabled: !!recordId }
  );

  // Fetch ENT templates
  const { data: templates } = trpc.ent.template.list.useQuery(undefined);

  // Fetch ENT tests linked to this record
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

  // Apply template to form
  const applyTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      form.setValue("diagnosis", template.name);
      if (template.subjectiveTemplate) {
        form.setValue("subjective", template.subjectiveTemplate);
      }
      if (template.objectiveTemplate) {
        form.setValue("objective", template.objectiveTemplate);
      }
      if (template.assessmentTemplate) {
        form.setValue("assessment", template.assessmentTemplate);
      }
      if (template.planTemplate) {
        form.setValue("plan", template.planTemplate);
      }
      toast.success(`テンプレート「${template.name}」を適用しました`);
    }
    setSelectedTemplate("");
  };

  // Filter tests linked to this specific record
  const recordAudiometryTests = linkedAudiometry?.filter(
    test => test.medicalRecordId === recordId
  ) || [];
  const recordEndoscopyTests = linkedEndoscopy?.filter(
    exam => exam.medicalRecordId === recordId
  ) || [];

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

              {/* SOAP Tab */}
              <TabsContent value="soap" className="space-y-4 mt-4">
                {/* Template Selector */}
                {templates && templates.length > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          テンプレートから入力:
                        </span>
                        <Select
                          value={selectedTemplate}
                          onValueChange={(value) => {
                            setSelectedTemplate(value);
                            applyTemplate(value);
                          }}
                        >
                          <SelectTrigger className="w-[250px] bg-white">
                            <SelectValue placeholder="テンプレートを選択..." />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Link href="/ent/templates" className="text-blue-600 text-sm hover:underline">
                          テンプレート管理
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

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

              {/* ENT Tab */}
              <TabsContent value="ent" className="space-y-4 mt-4">
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">
                    耳鼻科検査を記録に紐付けることができます
                  </p>
                  <Link href={`/ent?patientId=${patientId}`}>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      耳鼻科検査ページで検査を追加
                    </Button>
                  </Link>
                </div>

                {/* Linked Audiometry Tests */}
                {recordAudiometryTests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">紐付けられた聴力検査</h4>
                    {recordAudiometryTests.map((test) => (
                      <Card key={test.id} className="bg-gray-50">
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              {new Date(test.testDate).toLocaleDateString("ja-JP")}
                              {" - "}
                              {test.testType === "PURE_TONE" ? "純音聴力検査" : test.testType}
                            </span>
                            <Badge variant="secondary">聴力検査</Badge>
                          </div>
                          {test.interpretation && (
                            <p className="text-sm text-gray-600 mt-1">{test.interpretation}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Linked Endoscopy Exams */}
                {recordEndoscopyTests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">紐付けられた内視鏡検査</h4>
                    {recordEndoscopyTests.map((exam) => (
                      <Card key={exam.id} className="bg-gray-50">
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              {new Date(exam.examDate).toLocaleDateString("ja-JP")}
                              {" - "}
                              {exam.examType === "NASAL" ? "鼻腔内視鏡" :
                               exam.examType === "PHARYNGEAL" ? "咽頭内視鏡" :
                               exam.examType === "LARYNGEAL" ? "喉頭内視鏡" : "耳鏡検査"}
                            </span>
                            <Badge variant="secondary">内視鏡</Badge>
                          </div>
                          {exam.interpretation && (
                            <p className="text-sm text-gray-600 mt-1">{exam.interpretation}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {recordAudiometryTests.length === 0 && recordEndoscopyTests.length === 0 && (
                  <p className="text-gray-400 text-sm text-center">
                    この診療記録に紐付けられた検査はありません
                  </p>
                )}
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
