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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  FileText,
  FileSignature,
  Edit,
  Trash2,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, StatCard, StatGrid } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { labels } from "@/lib/labels";
import Link from "next/link";

const { pages: { documents: pageLabels }, common, messages } = labels;

const getCategoryColor = (category: string) => {
  switch (category) {
    case "REFERRAL": return "bg-blue-100 text-blue-800";
    case "CERTIFICATE": return "bg-green-100 text-green-800";
    case "MEDICAL_CERT": return "bg-purple-100 text-purple-800";
    case "SICK_LEAVE": return "bg-orange-100 text-orange-800";
    case "CONSENT": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function DocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeTab, setActiveTab] = useState("templates");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<{
    id?: string;
    name: string;
    category: string;
    content: string;
    description: string;
  } | null>(null);

  const categories = [
    { value: "ALL", label: pageLabels.categories.all },
    { value: "REFERRAL", label: pageLabels.categories.referral },
    { value: "CERTIFICATE", label: pageLabels.categories.certificate },
    { value: "MEDICAL_CERT", label: pageLabels.categories.medicalCertificate },
    { value: "PRESCRIPTION", label: pageLabels.categories.prescription },
    { value: "CONSENT", label: pageLabels.categories.consent },
    { value: "SICK_LEAVE", label: pageLabels.categories.leaveOfAbsence },
    { value: "INSURANCE", label: pageLabels.categories.insurance },
    { value: "OTHER", label: pageLabels.categories.other },
  ];

  const categoryFilter = selectedCategory === "ALL" ? undefined : selectedCategory as never;

  const {
    data: templates,
    isLoading: templatesLoading,
    isError: templatesError,
    refetch: refetchTemplates,
  } = trpc.document.template.list.useQuery({
    category: categoryFilter,
  });

  const {
    data: documents,
    isLoading: documentsLoading,
    isError: documentsError,
    refetch: refetchDocuments,
  } = trpc.document.list.useQuery({
    category: categoryFilter,
    limit: 50,
  });

  const createMutation = trpc.document.template.create.useMutation({
    onSuccess: () => {
      toast.success(messages.success.templateCreated);
      refetchTemplates();
      setDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => toast.error(error.message || messages.error.recordSaveFailed),
  });

  const updateMutation = trpc.document.template.update.useMutation({
    onSuccess: () => {
      toast.success(messages.success.templateUpdated);
      refetchTemplates();
      setDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => toast.error(error.message || messages.error.recordUpdateFailed),
  });

  const deleteMutation = trpc.document.template.delete.useMutation({
    onSuccess: () => {
      toast.success(messages.success.templateDeleted);
      refetchTemplates();
    },
    onError: (error) => toast.error(error.message || messages.error.templateDeleteFailed),
    onSettled: () => {
      setPendingDeleteId(null);
    },
  });

  const handleSaveTemplate = () => {
    if (!editingTemplate?.name || !editingTemplate?.content) {
      toast.error(messages.error.requiredFields);
      return;
    }

    if (editingTemplate.id) {
      updateMutation.mutate({
        id: editingTemplate.id,
        data: {
          name: editingTemplate.name,
          category: editingTemplate.category as never,
          content: editingTemplate.content,
          description: editingTemplate.description || undefined,
        },
      });
    } else {
      createMutation.mutate({
        name: editingTemplate.name,
        category: editingTemplate.category as never,
        content: editingTemplate.content,
        description: editingTemplate.description || undefined,
      });
    }
  };

  const openNewTemplate = () => {
    setEditingTemplate({
      name: "",
      category: "REFERRAL",
      content: "",
      description: "",
    });
    setDialogOpen(true);
  };

  const openEditTemplate = (template: NonNullable<typeof templates>[0]) => {
    setEditingTemplate({
      id: template.id,
      name: template.name,
      category: template.category,
      content: template.content,
      description: template.description || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={
          <Button onClick={openNewTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            {pageLabels.newTemplate}
          </Button>
        }
      />

      {/* Summary Cards */}
      <StatGrid columns={4}>
        <StatCard
          label={pageLabels.stats.templateCount}
          value={templates?.length || 0}
        />
        <StatCard
          label={pageLabels.stats.issuedDocuments}
          value={documents?.length || 0}
        />
        <StatCard
          label={pageLabels.stats.referralLetters}
          value={documents?.filter((d) => d.category === "REFERRAL").length || 0}
        />
        <StatCard
          label={pageLabels.stats.certificates}
          value={documents?.filter((d) => d.category === "CERTIFICATE").length || 0}
        />
      </StatGrid>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {pageLabels.tabs.templates}
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            {pageLabels.tabs.issued}
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={common.select} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openNewTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              {pageLabels.newTemplate}
            </Button>
          </div>

          {templatesError ? (
            <EmptyState message={common.loadFailed} onRetry={refetchTemplates} />
          ) : templatesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !templates?.length ? (
            <EmptyState
              icon={FileText}
              message={pageLabels.empty.templates}
              action={
                <Button variant="outline" onClick={openNewTemplate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {pageLabels.createFirst}
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription>{template.description}</CardDescription>
                        )}
                      </div>
                      <Badge className={getCategoryColor(template.category)}>
                        {pageLabels.categories[template.category as keyof typeof pageLabels.categories] ?? template.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {template.content.substring(0, 150)}...
                    </p>
                    <div className="flex justify-end gap-1 mt-4 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={pendingDeleteId === template.id}
                        onClick={() => {
                          setPendingDeleteId(template.id);
                          deleteMutation.mutate({ id: template.id });
                        }}
                      >
                        {pendingDeleteId === template.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={common.select} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {documentsError ? (
            <EmptyState message={common.loadFailed} onRetry={refetchDocuments} />
          ) : documentsLoading ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <Skeleton className="h-5 w-40 mb-1" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-20" />
                        <div className="flex gap-1">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : !documents?.length ? (
            <EmptyState icon={FileSignature} message={pageLabels.empty.issued} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <Link
                            href={`/patients/${doc.patient.id}`}
                            className="text-sm text-gray-500 hover:underline"
                          >
                            {doc.patient.lastName} {doc.patient.firstName} ({doc.patient.patientNumber})
                          </Link>
                        </div>
                        <Badge className={getCategoryColor(doc.category)}>
                          {pageLabels.categories[doc.category as keyof typeof pageLabels.categories] ?? doc.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                          {new Date(doc.issuedAt).toLocaleDateString("ja-JP")}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.id ? pageLabels.dialog.editTitle : pageLabels.dialog.newTitle}
            </DialogTitle>
            <DialogDescription>
              {pageLabels.dialog.placeholderHint}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{pageLabels.dialog.form.name} *</Label>
                <Input
                  value={editingTemplate?.name || ""}
                  onChange={(e) =>
                    setEditingTemplate((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  placeholder={pageLabels.categories.referral}
                />
              </div>
              <div className="space-y-2">
                <Label>{pageLabels.dialog.form.category} *</Label>
                <Select
                  value={editingTemplate?.category || "REFERRAL"}
                  onValueChange={(value) =>
                    setEditingTemplate((prev) =>
                      prev ? { ...prev, category: value } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c.value !== "ALL").map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{pageLabels.dialog.form.description}</Label>
              <Input
                value={editingTemplate?.description || ""}
                onChange={(e) =>
                  setEditingTemplate((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
                placeholder={pageLabels.dialog.form.description}
              />
            </div>

            <div className="space-y-2">
              <Label>{pageLabels.dialog.form.content} *</Label>
              <Textarea
                value={editingTemplate?.content || ""}
                onChange={(e) =>
                  setEditingTemplate((prev) =>
                    prev ? { ...prev, content: e.target.value } : null
                  )
                }
                placeholder={`紹介状

拝啓

時下ますますご清栄のこととお慶び申し上げます。

下記の患者様をご紹介申し上げます。

患者名: {{患者名}}
生年月日: {{生年月日}}
年齢: {{年齢}}歳

【紹介目的】


【現病歴】


【検査所見】


【診断名】


お忙しいところ恐れ入りますが、ご高診の程よろしくお願い申し上げます。

敬具

発行日: {{発行日}}`}
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "保存中..."
                : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
