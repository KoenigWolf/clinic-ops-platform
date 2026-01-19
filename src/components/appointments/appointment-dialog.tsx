"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "患者を選択してください"),
  doctorId: z.string().min(1, "担当医を選択してください"),
  date: z.string().min(1, "日付を選択してください"),
  startTime: z.string().min(1, "開始時間を入力してください"),
  endTime: z.string().min(1, "終了時間を入力してください"),
  type: z.enum(["INITIAL", "FOLLOWUP", "CONSULTATION", "CHECKUP", "EMERGENCY"]),
  reason: z.string().optional(),
  isOnline: z.boolean(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const typeLabels = {
  INITIAL: "初診",
  FOLLOWUP: "再診",
  CONSULTATION: "相談",
  CHECKUP: "健診",
  EMERGENCY: "緊急",
};

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSuccess: () => void;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  onSuccess,
}: AppointmentDialogProps) {
  const { data: patients } = trpc.patient.list.useQuery({ limit: 100 });

  // Get doctors (users with DOCTOR role)
  const { data: doctors } = trpc.appointment.doctors.useQuery();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      date: selectedDate.toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "09:30",
      type: "FOLLOWUP",
      reason: "",
      isOnline: false,
    },
  });

  const createMutation = trpc.appointment.create.useMutation({
    onSuccess: () => {
      toast.success("予約を登録しました");
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "登録に失敗しました");
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    const appointmentDate = new Date(data.date);
    const [startHour, startMin] = data.startTime.split(":").map(Number);
    const [endHour, endMin] = data.endTime.split(":").map(Number);

    const startTime = new Date(appointmentDate);
    startTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(appointmentDate);
    endTime.setHours(endHour, endMin, 0, 0);

    createMutation.mutate({
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentDate,
      startTime,
      endTime,
      type: data.type,
      reason: data.reason,
      isOnline: data.isOnline,
    });
  };

  const isLoading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新規予約</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>患者 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="患者を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients?.patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.patientNumber} - {patient.lastName} {patient.firstName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>担当医 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="担当医を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors?.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>日付 *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始時間 *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>終了時間 *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>診療種別 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isOnline"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>オンライン診療</FormLabel>
                    <p className="text-sm text-gray-500">
                      ビデオ通話で診療を行います
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>予約理由</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="来院理由や症状など"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "登録中..." : "予約登録"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
