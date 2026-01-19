"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Plus,
  Send,
  User,
  Building,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";

export default function MessagesPage() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState({ subject: "", content: "" });

  const { data: messages, refetch } = trpc.portal.myMessages.useQuery();
  const sendMutation = trpc.portal.sendMyMessage.useMutation({
    onSuccess: () => {
      toast.success("メッセージを送信しました");
      setComposeOpen(false);
      setNewMessage({ subject: "", content: "" });
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const markAsReadMutation = trpc.portal.markMyMessageAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const handleSelectMessage = (messageId: string, isRead: boolean) => {
    setSelectedMessage(messageId);
    if (!isRead) {
      markAsReadMutation.mutate({ id: messageId });
    }
  };

  const handleSend = () => {
    if (!newMessage.subject || !newMessage.content) {
      toast.error("件名と本文を入力してください");
      return;
    }
    sendMutation.mutate(newMessage);
  };

  const selectedMessageData = messages?.find((m) => m.id === selectedMessage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">メッセージ</h1>
          <p className="text-gray-500">クリニックとのやり取り</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規メッセージ
        </Button>
      </div>

      {/* Message List & Detail */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Message List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">受信トレイ</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!messages?.length ? (
              <div className="text-center py-8 text-gray-500 px-4">
                <MessageSquare className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p>メッセージはありません</p>
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg.id, msg.isRead)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedMessage === msg.id ? "bg-blue-50" : ""
                    } ${!msg.isRead ? "bg-blue-50/50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {msg.senderType === "STAFF" ? (
                            <Building className="h-4 w-4 text-gray-400 shrink-0" />
                          ) : (
                            <User className="h-4 w-4 text-gray-400 shrink-0" />
                          )}
                          <p className="font-medium text-sm truncate">{msg.subject || "（件名なし）"}</p>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {msg.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(msg.createdAt), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </p>
                      </div>
                      {!msg.isRead && (
                        <Badge variant="destructive" className="shrink-0 text-xs">
                          新着
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            {selectedMessageData ? (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h2 className="text-lg font-semibold">{selectedMessageData.subject || "（件名なし）"}</h2>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    {selectedMessageData.senderType === "STAFF" ? (
                      <>
                        <Building className="h-4 w-4" />
                        <span>クリニック</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                        <span>あなた</span>
                      </>
                    )}
                    <span className="mx-2">•</span>
                    <span>
                      {format(new Date(selectedMessageData.createdAt), "yyyy年M月d日 HH:mm", {
                        locale: ja,
                      })}
                    </span>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedMessageData.content}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                <p>メッセージを選択してください</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規メッセージ</DialogTitle>
            <DialogDescription>
              クリニックへのお問い合わせを送信できます
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>件名</Label>
              <Input
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                placeholder="件名を入力"
              />
            </div>
            <div className="space-y-2">
              <Label>本文</Label>
              <Textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                placeholder="メッセージを入力..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSend} disabled={sendMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {sendMutation.isPending ? "送信中..." : "送信"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
