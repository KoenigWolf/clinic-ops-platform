"use client";

import { useMemo, useState } from "react";
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
  Plus,
  ClipboardList,
  FileText,
  Clock,
  Eye,
  Edit,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import {
  StatCard,
  StatGrid,
  EmptyState,
  PageHeader,
} from "@/components/layout";
import { colors, componentStyles } from "@/lib/design-tokens";
import { labels } from "@/lib/labels";

const { pages: { questionnaire: pageLabels }, common } = labels;

const CATEGORIES = [
  { value: "ALL", label: pageLabels.categories.all },
  { value: "GENERAL", label: pageLabels.categories.general },
  { value: "FIRST_VISIT", label: pageLabels.categories.initial },
  { value: "FOLLOW_UP", label: pageLabels.categories.followup },
  { value: "PEDIATRIC", label: pageLabels.categories.pediatrics },
  { value: "INTERNAL", label: pageLabels.categories.internal },
  { value: "ENT", label: pageLabels.categories.ent },
  { value: "DERMATOLOGY", label: pageLabels.categories.dermatology },
  { value: "ORTHOPEDIC", label: pageLabels.categories.orthopedics },
  { value: "MENTAL", label: pageLabels.categories.psychiatry },
  { value: "OTHER", label: pageLabels.categories.other },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: pageLabels.status.draft, className: `${colors.bg.muted} ${colors.text.muted}` },
  SUBMITTED: { label: pageLabels.status.submitted, className: `${colors.info.bgLight} ${colors.info.text}` },
  REVIEWED: { label: pageLabels.status.confirmed, className: `${colors.success.bgLight} ${colors.success.text}` },
  APPLIED: { label: pageLabels.status.applied, className: "bg-purple-50 text-purple-600" },
};

export default function QuestionnairePage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeTab, setActiveTab] = useState("responses");

  const { data, isLoading, isError, refetch } = trpc.questionnaire.dashboard.useQuery();

  const templates = useMemo(() => (
    selectedCategory === "ALL"
      ? data?.templates
      : data?.templates?.filter((t) => t.category === selectedCategory)
  ), [data?.templates, selectedCategory]);
  const pendingResponses = data?.pendingResponses;
  const allResponses = data?.allResponses;

  const todayResponses = allResponses?.filter((r) => {
    const today = new Date();
    const submitted = new Date(r.submittedAt);
    return submitted.toDateString() === today.toDateString();
  }).length || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={
          <Link href="/questionnaire/templates">
            <Button variant="outline" className="w-full sm:w-auto">
              <Settings className="mr-2 h-4 w-4" />
              {pageLabels.templateManagement}
            </Button>
          </Link>
        }
      />

      {isError ? (
        <EmptyState
          message={common.loadFailed}
          action={
            <Button type="button" variant="outline" onClick={() => refetch()}>
              {common.retry}
            </Button>
          }
        />
      ) : isLoading ? (
        <div className={`text-center py-8 ${colors.text.muted}`}>{common.loading}</div>
      ) : (
        <>
          {/* Stats */}
          <StatGrid columns={4}>
            <StatCard
              label={pageLabels.stats.unconfirmed}
              value={pendingResponses?.length || 0}
              href="#responses"
            />
            <StatCard
              label={pageLabels.stats.todayResponses}
              value={todayResponses}
            />
            <StatCard
              label={pageLabels.stats.templateCount}
              value={data?.templates?.length || 0}
              href="#templates"
            />
            <StatCard
              label={pageLabels.stats.totalResponses}
              value={allResponses?.length || 0}
            />
          </StatGrid>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="responses" className="flex-1 sm:flex-initial flex items-center gap-2">
                <ClipboardList className="h-4 w-4 hidden sm:block" />
                {pageLabels.tabs.responses}
                {(pendingResponses?.length || 0) > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {pendingResponses?.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex-1 sm:flex-initial flex items-center gap-2">
                <FileText className="h-4 w-4 hidden sm:block" />
                {pageLabels.tabs.templates}
              </TabsTrigger>
            </TabsList>

            {/* Responses Tab */}
            <TabsContent value="responses" className="space-y-4 mt-4">
              {/* Pending Responses */}
              {(pendingResponses?.length || 0) > 0 && (
                <Card className={`border-2 ${colors.info.border} ${colors.info.bgLight}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Clock className={`h-5 w-5 ${colors.info.text}`} />
                      {pageLabels.sections.unconfirmed}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {pageLabels.confirmHint}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pendingResponses?.map((response) => (
                        <div
                          key={response.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 ${colors.bg.card} rounded-lg border gap-3`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div>
                              <Link
                                href={`/patients/${response.patient.id}`}
                                className="font-medium hover:underline"
                              >
                                {response.patient.lastName} {response.patient.firstName}
                              </Link>
                              <p className={`text-sm ${colors.text.muted}`}>
                                {response.patient.patientNumber}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">{response.template.name}</Badge>
                              {response.appointment && (
                                <span className={`text-xs ${colors.text.subtle}`}>
                                  予約: {new Date(response.appointment.appointmentDate).toLocaleDateString("ja-JP")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <span className={`text-xs ${colors.text.subtle}`}>
                              {formatDistanceToNow(new Date(response.submittedAt), {
                                addSuffix: true,
                                locale: ja,
                              })}
                            </span>
                            <Link href={`/questionnaire/response/${response.id}`}>
                              <Button size="sm">
                                <Eye className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">確認</span>
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Responses */}
              <Card className={componentStyles.card.base}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">{pageLabels.sections.responseList}</CardTitle>
                </CardHeader>
                <CardContent>
                  {!allResponses?.length ? (
                    <EmptyState message={pageLabels.empty} />
                  ) : (
                    <div className="space-y-1">
                      {allResponses.map((response) => (
                        <div
                          key={response.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:${colors.bg.hover} rounded-lg transition-colors gap-2`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div className="min-w-0">
                              <Link
                                href={`/patients/${response.patient.id}`}
                                className="font-medium truncate hover:underline"
                              >
                                {response.patient.lastName} {response.patient.firstName}
                              </Link>
                              <p className={`text-xs ${colors.text.muted}`}>
                                {response.patient.patientNumber}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">{response.template.name}</Badge>
                              <Badge className={STATUS_CONFIG[response.status]?.className ?? `${colors.bg.muted} ${colors.text.muted}`}>
                                {STATUS_CONFIG[response.status]?.label ?? response.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <span className={`text-xs ${colors.text.subtle}`}>
                              {new Date(response.submittedAt).toLocaleDateString("ja-JP")}
                            </span>
                            <Link href={`/questionnaire/response/${response.id}`}>
                              <Button variant="ghost" size="sm" aria-label="問診回答を表示">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]" aria-label="カテゴリ">
                    <SelectValue placeholder="カテゴリ" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Link href="/questionnaire/templates/new" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    {pageLabels.newTemplate}
                  </Button>
                </Link>
              </div>

              {!templates?.length ? (
                <Card className={componentStyles.card.base}>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <FileText className={`mx-auto h-12 w-12 ${colors.text.subtle} mb-4`} />
                      <p className={colors.text.muted}>{pageLabels.templatesEmpty}</p>
                      <Link href="/questionnaire/templates/new">
                        <Button variant="outline" className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          {pageLabels.templatesCreateFirst}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <Card key={template.id} className={`${componentStyles.card.interactive}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base truncate">{template.name}</CardTitle>
                            {template.description && (
                              <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
                            )}
                          </div>
                          {template.isDefault && (
                            <Badge variant="secondary" className="shrink-0 text-xs">{common.default}</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {CATEGORIES.find((c) => c.value === template.category)?.label}
                            </Badge>
                            <span className={`text-xs ${colors.text.muted}`}>
                              {(template.questions as unknown[])?.length || 0}問
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Link href={`/questionnaire/templates/${template.id}`}>
                              <Button variant="ghost" size="sm" aria-label="テンプレートを編集">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/questionnaire/preview/${template.id}`}>
                              <Button variant="ghost" size="sm" aria-label="テンプレートをプレビュー">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
