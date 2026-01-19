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
  Plus,
  ClipboardList,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

const CATEGORIES = [
  { value: "ALL", label: "すべて" },
  { value: "GENERAL", label: "一般" },
  { value: "FIRST_VISIT", label: "初診" },
  { value: "FOLLOW_UP", label: "再診" },
  { value: "PEDIATRIC", label: "小児科" },
  { value: "INTERNAL", label: "内科" },
  { value: "ENT", label: "耳鼻科" },
  { value: "DERMATOLOGY", label: "皮膚科" },
  { value: "ORTHOPEDIC", label: "整形外科" },
  { value: "MENTAL", label: "心療内科" },
  { value: "OTHER", label: "その他" },
];

const STATUS_CONFIG = {
  DRAFT: { label: "下書き", color: "bg-gray-100 text-gray-800" },
  SUBMITTED: { label: "提出済み", color: "bg-blue-100 text-blue-800" },
  REVIEWED: { label: "確認済み", color: "bg-green-100 text-green-800" },
  APPLIED: { label: "カルテ適用済み", color: "bg-purple-100 text-purple-800" },
};

export default function QuestionnairePage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeTab, setActiveTab] = useState("responses");

  const categoryFilter = selectedCategory === "ALL" ? undefined : selectedCategory as never;

  const { data: templates } = trpc.questionnaire.template.list.useQuery({
    category: categoryFilter,
  });

  const { data: pendingResponses } = trpc.questionnaire.response.pending.useQuery();

  const { data: allResponses } = trpc.questionnaire.response.list.useQuery({
    limit: 50,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Web問診</h1>
          <p className="text-gray-500">問診テンプレートの管理と回答の確認</p>
        </div>
        <div className="flex gap-2">
          <Link href="/questionnaire/templates">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              テンプレート管理
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">未確認の問診</p>
                <p className="text-2xl font-bold text-blue-600">
                  {pendingResponses?.length || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日の回答</p>
                <p className="text-2xl font-bold">
                  {allResponses?.filter((r) => {
                    const today = new Date();
                    const submitted = new Date(r.submittedAt);
                    return submitted.toDateString() === today.toDateString();
                  }).length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">テンプレート数</p>
                <p className="text-2xl font-bold">{templates?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">総回答数</p>
                <p className="text-2xl font-bold">{allResponses?.length || 0}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-gray-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="responses" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            問診回答
            {(pendingResponses?.length || 0) > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingResponses?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            テンプレート
          </TabsTrigger>
        </TabsList>

        {/* Responses Tab */}
        <TabsContent value="responses" className="space-y-4">
          {/* Pending Responses */}
          {(pendingResponses?.length || 0) > 0 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  未確認の問診回答
                </CardTitle>
                <CardDescription>
                  確認してカルテに反映してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingResponses?.map((response) => (
                    <div
                      key={response.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">
                            {response.patient.lastName} {response.patient.firstName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {response.patient.patientNumber}
                          </p>
                        </div>
                        <Badge variant="outline">{response.template.name}</Badge>
                        {response.appointment && (
                          <span className="text-sm text-gray-500">
                            予約: {new Date(response.appointment.appointmentDate).toLocaleDateString("ja-JP")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {formatDistanceToNow(new Date(response.submittedAt), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </span>
                        <Link href={`/questionnaire/response/${response.id}`}>
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            確認
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">問診回答一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {!allResponses?.length ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>問診回答がありません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allResponses.map((response) => (
                    <div
                      key={response.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">
                            {response.patient.lastName} {response.patient.firstName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {response.patient.patientNumber}
                          </p>
                        </div>
                        <Badge variant="outline">{response.template.name}</Badge>
                        <Badge className={STATUS_CONFIG[response.status].color}>
                          {STATUS_CONFIG[response.status].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {new Date(response.submittedAt).toLocaleDateString("ja-JP")}
                        </span>
                        <Link href={`/questionnaire/response/${response.id}`}>
                          <Button variant="ghost" size="sm">
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
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
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
            <Link href="/questionnaire/templates/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新規テンプレート
              </Button>
            </Link>
          </div>

          {!templates?.length ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>テンプレートがありません</p>
                  <Link href="/questionnaire/templates/new">
                    <Button variant="outline" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      最初のテンプレートを作成
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
                      {template.isDefault && (
                        <Badge variant="secondary">デフォルト</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {CATEGORIES.find((c) => c.value === template.category)?.label}
                      </Badge>
                      <div className="flex gap-1">
                        <Link href={`/questionnaire/templates/${template.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/questionnaire/preview/${template.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {(template.questions as unknown[])?.length || 0}問
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
