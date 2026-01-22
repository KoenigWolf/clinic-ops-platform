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
import { EmptyState, PageHeader } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { labels } from "@/lib/labels";

const { pages: { entDashboard: pageLabels }, common } = labels;

function DashboardContent() {
  const {
    data: stats,
    isError: statsError,
    refetch: refetchStats,
  } = trpc.ent.stats.useQuery();
  const {
    data: recentTests,
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecent,
  } = trpc.ent.recentTests.useQuery({ limit: 8 });
  const {
    data: hearingDistribution,
    isLoading: distLoading,
    isError: distError,
    refetch: refetchDistribution,
  } = trpc.ent.hearingLevelDistribution.useQuery();

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
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={
          <Link href="/ent">
            <Button>
              {pageLabels.viewTests}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        }
      />

      {/* Stats Overview */}
      {statsError ? (
        <EmptyState message={common.loadFailed} onRetry={refetchStats} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{pageLabels.stats.totalTests}</p>
                  <p className="text-2xl font-bold">{stats?.totals.total ?? "-"}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {pageLabels.stats.last30Days}: <span className="text-green-600 font-medium">+{stats?.recent.total ?? 0}</span>
              </p>
            </CardContent>
          </Card>

          {Object.entries(testTypeConfig).map(([key, config]) => {
            const Icon = config.icon;
            const total = stats?.totals[key as keyof typeof stats.totals] ?? 0;
            const recent = stats?.recent[key as keyof typeof stats.recent] ?? 0;

            return (
              <Card key={key}>
                <CardContent className="pt-4">
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
                    {pageLabels.stats.last30Days}: <span className="text-green-600 font-medium">+{recent}</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hearing Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ear className="h-5 w-5" />
              {pageLabels.sections.hearingDistribution}
            </CardTitle>
            <CardDescription>{pageLabels.sections.hearingDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {distError ? (
              <EmptyState message={common.loadFailed} onRetry={refetchDistribution} />
            ) : distLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : totalHearingTests === 0 ? (
              <EmptyState message={pageLabels.empty.hearing} icon={Ear} />
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
              {pageLabels.sections.recentTests}
            </CardTitle>
            <CardDescription>{pageLabels.sections.recentDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentError ? (
              <EmptyState message={common.loadFailed} onRetry={refetchRecent} />
            ) : recentLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : !recentTests?.length ? (
              <EmptyState message={pageLabels.empty.tests} icon={Calendar} />
            ) : (
              <div className="space-y-3">
                {recentTests.map((test) => {
                  const config = testTypeConfig[test.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={test.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/patients/${test.patient.id}`}
                          className="font-medium text-sm truncate hover:underline"
                        >
                          {test.patient.lastName} {test.patient.firstName}
                        </Link>
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
                        <Link
                          href={`/ent?patientId=${test.patient.id}`}
                          className="text-xs text-gray-500 hover:underline block mt-1"
                        >
                          検査一覧
                        </Link>
                      </div>
                    </div>
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
          <CardTitle>{pageLabels.sections.quickActions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/ent">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Ear className="h-6 w-6" />
                <span>{pageLabels.actions.recordTest}</span>
              </Button>
            </Link>
            <Link href="/ent/templates">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Activity className="h-6 w-6" />
                <span>{pageLabels.actions.templates}</span>
              </Button>
            </Link>
            <Link href="/patients">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>{pageLabels.actions.patients}</span>
              </Button>
            </Link>
            <Link href="/records">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>{pageLabels.actions.records}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function EntDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
