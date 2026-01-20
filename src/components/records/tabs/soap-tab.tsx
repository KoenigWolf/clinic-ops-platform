"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RecordFormData } from "../record-dialog";

interface Template {
  id: string;
  name: string;
  subjectiveTemplate: string | null;
  objectiveTemplate: string | null;
  assessmentTemplate: string | null;
  planTemplate: string | null;
}

interface SOAPTabProps {
  form: UseFormReturn<RecordFormData>;
  templates?: Template[];
  selectedTemplate: string;
  onTemplateChange: (value: string) => void;
}

export function SOAPTab({
  form,
  templates,
  selectedTemplate,
  onTemplateChange,
}: SOAPTabProps) {
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
    onTemplateChange("");
  };

  return (
    <div className="space-y-4 mt-4">
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
                  onTemplateChange(value);
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
    </div>
  );
}
