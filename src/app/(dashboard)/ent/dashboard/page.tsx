"use client";

import { Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ear,
  Eye,
  Activity,
  FlaskConical,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const { data: stats } = trpc.ent.stats.useQuery();
  const { data: recentTests, isLoading: recentLoading } = trpc.ent.recentTests.useQuery({ limit: 8 });
  const { data: hearingDistribution, isLoading: distLoading } = trpc.ent.hearingLevelDistribution.useQuery();

  const testTypeConfig = {
    audiometry: { label: "聴力検査", icon: Ear, color: "text-purple-600", bg: "bg-purple-50" },
    tympanometry: { label: "ティンパノ", icon: Activity, color: "text-orange-600", bg: "bg-orange-50" },
    vestibular: { label: "平衡機能", icon: Activity, color: "text-cyan-600", bg: "bg-cyan-50" },
    endoscopy: { label: "内視鏡", icon: Eye, color: "text-green-600", bg: "bg-green-50" },
    allergy: { label: "アレルギー", icon: FlaskConical, color: "text-pink-600", bg: "bg-pink-50" },
  };

  const hearingLevelConfig = {
    normal: { label: "正常", color: "#22c55e" },
    mild: { label: "軽度", color: "#eab308" },
    moderate: { label: "中等度", color: "#f97316" },
    moderatelySevere: { label: "準重度", color: "#ef4444" },
    severe: { label: "重度", color: "#dc2626" },
    profound: { label: "最重度", color: "#7f1d1d" },
  };

  const totalHearingTests = hearingDistribution
    ? Object.values(hearingDistribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">耳鼻科ダッシュボード</h1>
          <p className="text-gray-500">検査統計と最近の活動</p>
        </div>
        <Link href="/ent">
          <Button>
            検査一覧へ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">総検査数</p>
                <p className="text-2xl font-bold">{stats?.totals.total ?? "-"}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              直近30日: <span className="text-green-600 font-medium">+{stats?.recent.total ?? 0}</span>
            </p>
          </CardContent>
        </Card>

        {Object.entries(testTypeConfig).map(([key, config]) => {
          const Icon = config.icon;
          const total = stats?.totals[key as keyof typeof stats.totals] ?? 0;
          const recent = stats?.recent[key as keyof typeof stats.recent] ?? 0;

          return (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{config.label}</p>
                    <p className="text-2xl font-bold">{total}</p>
                  </div>
                  <div className={`p-2 rounded-full ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  直近30日: <span className="text-green-600 font-medium">+{recent}</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hearing Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ear className="h-5 w-5" />
              聴力レベル分布
            </CardTitle>
            <CardDescription>全聴力検査結果の分布（左右耳別）</CardDescription>
          </CardHeader>
          <CardContent>
            {distLoading ? (
              <div className="h-48 flex items-center justify-center text-gray-400">
                読み込み中...
              </div>
            ) : totalHearingTests === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400">
                聴力検査データがありません
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(hearingLevelConfig).map(([key, config]) => {
                  const count = hearingDistribution?.[key as keyof typeof hearingDistribution] ?? 0;
                  const percentage = totalHearingTests > 0 ? (count / totalHearingTests) * 100 : 0;

                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{config.label}</span>
                        <span className="text-gray-500">{count}件 ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: config.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              最近の検査
            </CardTitle>
            <CardDescription>直近の検査記録</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="h-48 flex items-center justify-center text-gray-400">
                読み込み中...
              </div>
            ) : !recentTests?.length ? (
              <div className="h-48 flex items-center justify-center text-gray-400">
                検査データがありません
              </div>
            ) : (
              <div className="space-y-3">
                {recentTests.map((test) => {
                  const config = testTypeConfig[test.type];
                  const Icon = config.icon;

                  return (
                    <Link
                      key={test.id}
                      href={`/ent?patientId=${test.patient.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {test.patient.lastName} {test.patient.firstName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {test.patient.patientNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(test.date).toLocaleDateString("ja-JP", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/ent">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Ear className="h-6 w-6" />
                <span>検査を記録</span>
              </Button>
            </Link>
            <Link href="/ent/templates">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Activity className="h-6 w-6" />
                <span>テンプレート管理</span>
              </Button>
            </Link>
            <Link href="/patients">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>患者一覧</span>
              </Button>
            </Link>
            <Link href="/records">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>診療記録</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EntDashboardPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">読み込み中...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
