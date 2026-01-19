"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { TemplateDialog } from "@/components/ent/template-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Link from "next/link";

const CATEGORIES = [
  { value: "ALL", label: "すべて" },
  { value: "EAR", label: "耳疾患" },
  { value: "NOSE", label: "鼻疾患" },
  { value: "THROAT", label: "咽喉頭疾患" },
  { value: "ALLERGY", label: "アレルギー" },
  { value: "VERTIGO", label: "めまい" },
  { value: "OTHER", label: "その他" },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case "EAR": return "bg-red-100 text-red-800";
    case "NOSE": return "bg-blue-100 text-blue-800";
    case "THROAT": return "bg-purple-100 text-purple-800";
    case "ALLERGY": return "bg-yellow-100 text-yellow-800";
    case "VERTIGO": return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getCategoryLabel = (category: string) => {
  const cat = CATEGORIES.find(c => c.value === category);
  return cat?.label || category;
};

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const queryInput = selectedCategory === "ALL"
    ? undefined
    : { category: selectedCategory as "EAR" | "NOSE" | "THROAT" | "ALLERGY" | "VERTIGO" | "OTHER" };

  const { data: templates, refetch } = trpc.ent.template.list.useQuery(queryInput);

  const deleteMutation = trpc.ent.template.delete.useMutation({
    onSuccess: () => {
      toast.success("テンプレートを削除しました");
      refetch();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate({ id: templateToDelete });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/ent" className="hover:text-gray-700">耳鼻科検査</Link>
            <span>/</span>
            <span>診断テンプレート</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">診断テンプレート管理</h1>
          <p className="text-gray-500">よく使う診断・所見・処方をテンプレート化</p>
        </div>
        <Button onClick={() => {
          setSelectedTemplateId(null);
          setDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          新規テンプレート
        </Button>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">カテゴリで絞り込み:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
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
        </CardContent>
      </Card>

      {/* Templates List */}
      {templates?.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>テンプレートがありません</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSelectedTemplateId(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                最初のテンプレートを作成
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.icdCode && (
                      <CardDescription>ICD: {template.icdCode}</CardDescription>
                    )}
                  </div>
                  <Badge className={getCategoryColor(template.category)}>
                    {getCategoryLabel(template.category)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.subjectiveTemplate && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-600">S (主訴)</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.subjectiveTemplate}</p>
                  </div>
                )}

                {template.objectiveTemplate && (
                  <div>
                    <h4 className="text-sm font-medium text-green-600">O (所見)</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.objectiveTemplate}</p>
                  </div>
                )}

                {template.assessmentTemplate && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-600">A (評価)</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.assessmentTemplate}</p>
                  </div>
                )}

                {template.planTemplate && (
                  <div>
                    <h4 className="text-sm font-medium text-purple-600">P (計画)</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.planTemplate}</p>
                  </div>
                )}

                {template.commonPrescriptions && Array.isArray(template.commonPrescriptions) && template.commonPrescriptions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600">処方</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(template.commonPrescriptions as Array<{name: string}>).slice(0, 3).map((rx, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {rx.name}
                        </Badge>
                      ))}
                      {(template.commonPrescriptions as Array<unknown>).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(template.commonPrescriptions as Array<unknown>).length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    編集
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setTemplateToDelete(template.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Dialog */}
      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        templateId={selectedTemplateId}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>テンプレートを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。テンプレートは完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
