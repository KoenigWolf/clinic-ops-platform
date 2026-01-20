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
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";

const STATUS_CONFIG = {
  SCHEDULED: { label: "予約済", color: "bg-blue-100 text-blue-800" },
  CONFIRMED: { label: "確定", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "キャンセル", color: "bg-gray-100 text-gray-800" },
  COMPLETED: { label: "完了", color: "bg-purple-100 text-purple-800" },
  NO_SHOW: { label: "未来院", color: "bg-red-100 text-red-800" },
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">予約</h1>
        <p className="text-gray-500">診療予約の確認</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingAppointments?.length || 0}</p>
                <p className="text-xs text-gray-500">今後の予約</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {upcomingAppointments?.filter((a) => a.status === "CONFIRMED").length || 0}
                </p>
                <p className="text-xs text-gray-500">確定済み</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Video className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {upcomingAppointments?.filter((a) => a.isOnline).length || 0}
                </p>
                <p className="text-xs text-gray-500">オンライン</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pastAppointments?.length || 0}</p>
                <p className="text-xs text-gray-500">過去の予約</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            今後の予約
            {(upcomingAppointments?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingAppointments?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">過去の予約</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {!displayAppointments?.length ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>
                    {activeTab === "upcoming"
                      ? "今後の予約はありません"
                      : "過去の予約はありません"}
                  </p>
                </div>
              </CardContent>
            </Card>
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
                                    <span>オンライン診療</span>
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="h-4 w-4" />
                                    <span>来院</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">
                              担当: {apt.doctor?.name || "未定"}
                            </p>
                            {apt.notes && (
                              <p className="text-sm text-gray-500 mt-2">{apt.notes}</p>
                            )}
                          </div>
                        </div>
                        {isVideo && apt.status === "CONFIRMED" && activeTab === "upcoming" && (
                          <Button className="shrink-0">
                            診療を開始
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
