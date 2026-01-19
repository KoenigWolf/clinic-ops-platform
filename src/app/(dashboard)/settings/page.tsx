"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Building, Shield, Bell } from "lucide-react";

const roleLabels = {
  ADMIN: "管理者",
  DOCTOR: "医師",
  NURSE: "看護師",
  STAFF: "スタッフ",
  PATIENT: "患者",
};

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-500">アカウント設定とシステム設定</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              プロフィール
            </CardTitle>
            <CardDescription>アカウント情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">氏名</label>
              <p className="font-medium">{session?.user?.name || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">メールアドレス</label>
              <p className="font-medium">{session?.user?.email || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">役割</label>
              <div className="mt-1">
                <Badge>
                  {roleLabels[session?.user?.role as keyof typeof roleLabels] || "-"}
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
              組織情報
            </CardTitle>
            <CardDescription>所属クリニック情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">テナントID</label>
              <p className="font-mono text-sm">{session?.user?.tenantId || "-"}</p>
            </div>
            <Separator />
            <p className="text-sm text-gray-500">
              組織情報の変更は管理者にお問い合わせください。
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              セキュリティ
            </CardTitle>
            <CardDescription>セキュリティ設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">パスワード</p>
                <p className="text-sm text-gray-500">最終更新: 未設定</p>
              </div>
              <Badge variant="outline">変更</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">二段階認証</p>
                <p className="text-sm text-gray-500">追加のセキュリティ層</p>
              </div>
              <Badge variant="secondary">無効</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              通知設定
            </CardTitle>
            <CardDescription>通知の受信設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">予約リマインダー</p>
                <p className="text-sm text-gray-500">予約前に通知</p>
              </div>
              <Badge>有効</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">メール通知</p>
                <p className="text-sm text-gray-500">重要な更新をメールで受信</p>
              </div>
              <Badge>有効</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>システム情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">バージョン</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-gray-500">環境</p>
              <p className="font-medium">Production</p>
            </div>
            <div>
              <p className="text-gray-500">ビデオAPI</p>
              <p className="font-medium">Daily.co</p>
            </div>
            <div>
              <p className="text-gray-500">データベース</p>
              <p className="font-medium">PostgreSQL</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
