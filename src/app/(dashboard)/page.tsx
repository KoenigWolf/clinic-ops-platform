"use client";

import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import {
  PageHeader,
  StatCard,
  StatGrid,
  ContentCard,
  ContentCardItem,
  SectionHeader,
  EmptyState,
  StatusBadge,
  OnlineBadge,
  Avatar,
  TimeDisplay,
  DateDisplay,
  VerticalSeparator,
} from "@/components/layout";
import { typography } from "@/lib/design-tokens";
import { labels } from "@/lib/labels";

const formatCurrency = (amount: number) => `¥${amount.toLocaleString("ja-JP")}`;

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { data, isLoading, isError, refetch } = trpc.dashboard.get.useQuery();

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5">
              <Skeleton className="h-3 w-14 mb-3" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader title={labels.pages.dashboard.title} />
        <EmptyState
          message={labels.common.loadFailed}
          action={
            <Button type="button" variant="outline" onClick={() => refetch()}>
              {labels.common.retry}
            </Button>
          }
        />
      </div>
    );
  }

  const userName = session?.user?.name ?? "ユーザー";
  const totalPatients = data?.totalPatients ?? 0;
  const todayAppointmentsCount = data?.todayAppointments?.length ?? 0;
  const pendingPrescriptions = data?.pendingPrescriptions ?? 0;
  const monthlyRevenue = data?.monthlyRevenue ?? 0;
  const appointments = data?.todayAppointments ?? [];
  const patients = data?.recentPatients ?? [];

  const { stats: statLabels, sections, empty } = labels.pages.dashboard;
  const stats = [
    { label: statLabels.patients, value: totalPatients, href: "/patients" },
    { label: statLabels.todayAppointments, value: todayAppointmentsCount, href: "/appointments" },
    { label: statLabels.pendingPrescriptions, value: pendingPrescriptions, href: "/prescriptions" },
    { label: statLabels.monthlyRevenue, value: formatCurrency(monthlyRevenue), href: "/billing" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title={labels.pages.dashboard.greeting(userName)} />

      <StatGrid columns={4}>
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            href={stat.href}
          />
        ))}
      </StatGrid>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-3">
          <SectionHeader title={sections.todayAppointments} viewAllHref="/appointments" />

          {appointments.length > 0 ? (
            <ContentCard divided>
              {appointments.map((apt) => (
                <ContentCardItem key={apt.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <TimeDisplay
                        startTime={apt.startTime}
                        endTime={apt.endTime}
                      />
                      <VerticalSeparator />
                      <div>
                        <Link
                          href={`/patients/${apt.patient.id}`}
                          className={`${typography.cardTitle} hover:underline`}
                        >
                          {apt.patient.lastName} {apt.patient.firstName}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={apt.status} />
                          {apt.isOnline && <OnlineBadge />}
                        </div>
                      </div>
                    </div>
                  </div>
                </ContentCardItem>
              ))}
            </ContentCard>
          ) : (
            <EmptyState message={empty.appointments} />
          )}
        </div>

        {/* Recent Patients */}
        <div className="lg:col-span-2">
          <SectionHeader title={sections.recentPatients} viewAllHref="/patients" />

          {patients.length > 0 ? (
            <ContentCard divided>
              {patients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/patients/${patient.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50/50 transition-colors"
                >
                  <Avatar name={patient.lastName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className={`${typography.cardTitle} truncate`}>
                      {patient.lastName} {patient.firstName}
                    </p>
                  </div>
                  <DateDisplay date={patient.updatedAt} format="short" />
                </Link>
              ))}
            </ContentCard>
          ) : (
            <EmptyState message={empty.patients} />
          )}
        </div>
      </div>
    </div>
  );
}
