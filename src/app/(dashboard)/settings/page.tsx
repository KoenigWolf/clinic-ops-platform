"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Building, Shield, Bell } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { labels } from "@/lib/labels";

const { pages: { settings: pageLabels } } = labels;

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <PageHeader title={pageLabels.title} description={pageLabels.description} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {pageLabels.sections.profile.title}
            </CardTitle>
            <CardDescription>{pageLabels.sections.profile.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">{pageLabels.labels.name}</label>
              <p className="font-medium">{session?.user?.name || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">{pageLabels.labels.email}</label>
              <p className="font-medium">{session?.user?.email || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">{pageLabels.labels.role}</label>
              <div className="mt-1">
                <Badge>
                  {pageLabels.roles[session?.user?.role as keyof typeof pageLabels.roles] || "-"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {pageLabels.sections.organization.title}
            </CardTitle>
            <CardDescription>{pageLabels.sections.organization.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">{pageLabels.labels.tenantId}</label>
              <p className="font-mono text-sm">{session?.user?.tenantId || "-"}</p>
            </div>
            <Separator />
            <p className="text-sm text-gray-500">
              {pageLabels.hints.orgChangeHint}
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {pageLabels.sections.security.title}
            </CardTitle>
            <CardDescription>{pageLabels.sections.security.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{pageLabels.labels.password}</p>
                <p className="text-sm text-gray-500">{pageLabels.hints.lastUpdated}</p>
              </div>
              <Badge variant="outline">{pageLabels.actions.change}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{pageLabels.labels.twoFactor}</p>
                <p className="text-sm text-gray-500">{pageLabels.hints.twoFactorHint}</p>
              </div>
              <Badge variant="secondary">{pageLabels.status.disabled}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {pageLabels.sections.notifications.title}
            </CardTitle>
            <CardDescription>{pageLabels.sections.notifications.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{pageLabels.labels.appointmentReminder}</p>
                <p className="text-sm text-gray-500">{pageLabels.hints.reminderHint}</p>
              </div>
              <Badge>{pageLabels.status.enabled}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{pageLabels.labels.emailNotification}</p>
                <p className="text-sm text-gray-500">{pageLabels.hints.emailHint}</p>
              </div>
              <Badge>{pageLabels.status.enabled}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>{pageLabels.sections.system.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">{pageLabels.system.version}</p>
              <p className="font-medium">{pageLabels.system.values.version}</p>
            </div>
            <div>
              <p className="text-gray-500">{pageLabels.system.environment}</p>
              <p className="font-medium">{pageLabels.system.values.environment}</p>
            </div>
            <div>
              <p className="text-gray-500">{pageLabels.system.videoApi}</p>
              <p className="font-medium">{pageLabels.system.values.videoApi}</p>
            </div>
            <div>
              <p className="text-gray-500">{pageLabels.system.database}</p>
              <p className="font-medium">{pageLabels.system.values.database}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
