"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import { Plus, Trash2 } from "lucide-react";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "項目名は必須です"),
  quantity: z.number().min(1, "数量は1以上"),
  unitPrice: z.number().min(0, "単価は0以上"),
});

const invoiceSchema = z.object({
  patientId: z.string().min(1, "患者を選択してください"),
  dueDate: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "1つ以上の項目が必要です"),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
}: InvoiceDialogProps) {
  const { data: patients } = trpc.patient.list.useQuery({ limit: 100 });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patientId: "",
      dueDate: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const subtotal = watchItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  const createMutation = trpc.billing.create.useMutation({
    onSuccess: () => {
      toast.success("請求書を作成しました");
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "作成に失敗しました");
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    createMutation.mutate({
      patientId: data.patientId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      items: data.items,
      notes: data.notes,
    });
  };

  const isLoading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新規請求書作成</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支払期限</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Invoice Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">請求項目</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  項目追加
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} placeholder="項目名" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="数量"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="単価"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <p className="w-28 text-right pt-2 font-medium">
                    ¥{((watchItems[index]?.quantity || 0) * (watchItems[index]?.unitPrice || 0)).toLocaleString()}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-end gap-4">
                  <span className="text-gray-500">小計:</span>
                  <span className="w-28 text-right">¥{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span className="text-gray-500">消費税 (10%):</span>
                  <span className="w-28 text-right">¥{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-end gap-4 text-lg font-bold">
                  <span>合計:</span>
                  <span className="w-28 text-right">¥{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備考</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="請求に関する備考" rows={3} />
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
                {isLoading ? "作成中..." : "請求書作成"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
