"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, StatCard, StatGrid, EmptyState } from "@/components/layout";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import { labels } from "@/lib/labels";

const { portal: { appointments: pageLabels } } = labels;

const STATUS_CONFIG = {
  SCHEDULED: { label: pageLabels.status.scheduled, color: "bg-blue-100 text-blue-800" },
  CONFIRMED: { label: pageLabels.status.confirmed, color: "bg-green-100 text-green-800" },
  CANCELLED: { label: pageLabels.status.cancelled, color: "bg-gray-100 text-gray-800" },
  COMPLETED: { label: pageLabels.status.completed, color: "bg-purple-100 text-purple-800" },
  NO_SHOW: { label: pageLabels.status.noShow, color: "bg-red-100 text-red-800" },
};

const TYPE_CONFIG = {
  INITIAL: { label: "初診", icon: Calendar },
  FOLLOWUP: { label: "再診", icon: Calendar },
  CONSULTATION: { label: "相談", icon: Calendar },
  CHECKUP: { label: "健診", icon: Calendar },
  EMERGENCY: { label: "緊急", icon: Calendar },
};

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const { data: appointments, isLoading } = trpc.portal.myAppointments.useQuery();

  const today = startOfDay(new Date());
  const upcomingAppointments = appointments?.filter(
    (apt) => isAfter(new Date(apt.appointmentDate), today) ||
             format(new Date(apt.appointmentDate), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
  );
  const pastAppointments = appointments?.filter(
    (apt) => isBefore(new Date(apt.appointmentDate), today) &&
             format(new Date(apt.appointmentDate), "yyyy-MM-dd") !== format(today, "yyyy-MM-dd")
  );

  const displayAppointments = activeTab === "upcoming" ? upcomingAppointments : pastAppointments;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5">
              <Skeleton className="h-3 w-14 mb-3" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={pageLabels.title} description={pageLabels.description} />

      <StatGrid columns={4}>
        <StatCard label={pageLabels.stats.upcoming} value={upcomingAppointments?.length || 0} />
        <StatCard
          label={pageLabels.stats.confirmed}
          value={upcomingAppointments?.filter((a) => a.status === "CONFIRMED").length || 0}
        />
        <StatCard
          label={pageLabels.stats.online}
          value={upcomingAppointments?.filter((a) => a.isOnline).length || 0}
        />
        <StatCard label={pageLabels.stats.past} value={pastAppointments?.length || 0} />
      </StatGrid>

      {/* Appointments List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            {pageLabels.tabs.upcoming}
            {(upcomingAppointments?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingAppointments?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">{pageLabels.tabs.past}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {!displayAppointments?.length ? (
            <EmptyState
              icon={Calendar}
              message={activeTab === "upcoming" ? pageLabels.empty.upcoming : pageLabels.empty.past}
            />
          ) : (
            <div className="space-y-4">
              {displayAppointments.map((apt) => {
                const TypeIcon = TYPE_CONFIG[apt.type as keyof typeof TYPE_CONFIG]?.icon || Calendar;
                const isVideo = apt.isOnline;

                return (
                  <Card key={apt.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${isVideo ? "bg-purple-100" : "bg-blue-100"}`}>
                            <TypeIcon className={`h-6 w-6 ${isVideo ? "text-purple-600" : "text-blue-600"}`} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {format(new Date(apt.appointmentDate), "M月d日(E)", { locale: ja })}
                              </h3>
                              <Badge className={STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG]?.color}>
                                {STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG]?.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {format(new Date(apt.startTime), "HH:mm")} -{" "}
                                  {format(new Date(apt.endTime), "HH:mm")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {isVideo ? (
                                  <>
                                    <Video className="h-4 w-4" />
                                    <span>{pageLabels.location.online}</span>
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="h-4 w-4" />
                                    <span>{pageLabels.location.inPerson}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">
                              {pageLabels.doctorLabel(apt.doctor?.name || "")}
                            </p>
                            {apt.notes && (
                              <p className="text-sm text-gray-500 mt-2">{apt.notes}</p>
                            )}
                          </div>
                        </div>
                        {isVideo && apt.status === "CONFIRMED" && activeTab === "upcoming" && (
                          <Button className="shrink-0">
                            {pageLabels.startConsultation}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
