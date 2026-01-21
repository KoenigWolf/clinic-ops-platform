"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  patientInputSchema,
  patientInputDefaults,
  type PatientInput,
  type PatientForEdit,
} from "@/domain/patient/schema";

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: PatientForEdit | null;
}

export function PatientDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: PatientDialogProps) {
  const form = useForm<PatientInput>({
    resolver: zodResolver(patientInputSchema),
    defaultValues: initialData ?? patientInputDefaults,
  });

  // initialDataが変更されたらフォームをリセット
  useEffect(() => {
    form.reset(initialData ?? patientInputDefaults);
  }, [initialData, form]);

  const createMutation = trpc.patient.create.useMutation({
    onSuccess: () => {
      toast.success("患者を登録しました");
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "登録に失敗しました");
    },
  });

  const updateMutation = trpc.patient.update.useMutation({
    onSuccess: () => {
      toast.success("患者情報を更新しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "更新に失敗しました");
    },
  });

  const onSubmit = (data: PatientInput) => {
    if (initialData?.id) {
      updateMutation.mutate({ id: initialData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "患者情報編集" : "新規患者登録"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    {/* 基本情報 */}
    <div className="space-y-4">
      <h3 className="font-semibold">基本情報</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="patientNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>患者番号 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="P0001"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>性別 *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MALE">男性</SelectItem>
                  <SelectItem value="FEMALE">女性</SelectItem>
                  <SelectItem value="OTHER">その他</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="山田"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="太郎"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="lastNameKana"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓(カナ) *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="ヤマダ"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="firstNameKana"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名(カナ) *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="タロウ"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>生年月日 *</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bloodType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>血液型</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}  // null/undefined の場合は空文字列
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="A_POSITIVE">A+</SelectItem>
                  <SelectItem value="A_NEGATIVE">A-</SelectItem>
                  <SelectItem value="B_POSITIVE">B+</SelectItem>
                  <SelectItem value="B_NEGATIVE">B-</SelectItem>
                  <SelectItem value="O_POSITIVE">O+</SelectItem>
                  <SelectItem value="O_NEGATIVE">O-</SelectItem>
                  <SelectItem value="AB_POSITIVE">AB+</SelectItem>
                  <SelectItem value="AB_NEGATIVE">AB-</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>郵便番号</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="123-4567"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="col-span-2">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>住所 *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="東京都渋谷区..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>

    {/* マイナンバーカード同意 */}
    <div className="space-y-4">
      <h3 className="font-semibold">マイナンバーカード情報</h3>
      <FormField
        control={form.control}
        name="myNumberConsent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <input
                type="checkbox"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-4 w-4 mt-1"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                マイナンバーカードによる資格確認に同意する
              </FormLabel>
            </div>
          </FormItem>
        )}
      />
    </div>

    {/* 初診日・最終来院日 */}
    <div className="space-y-4">
      <h3 className="font-semibold">来院情報</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstVisitDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>初診日</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastVisitDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>最終来院日</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>

    {/* 連絡先 */}
    <div className="space-y-4">
      <h3 className="font-semibold">連絡先</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電話番号 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="090-1234-5678"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="email"
                  placeholder="example@email.com"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="emergencyContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>緊急連絡先(氏名)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="山田花子"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emergencyRelationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>続柄</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="妻"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emergencyPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>緊急連絡先(電話)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="090-9876-5432"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>

    {/* 保険情報 */}
    <div className="space-y-4">
      <h3 className="font-semibold">保険情報(オンライン資格確認)</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="insurerNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>保険者番号 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="12345678"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="insuredNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>被保険者番号 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="1234567890"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="insuranceSymbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>記号</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="insuranceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>番号</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="insuranceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>保険種別</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NATIONAL_HEALTH_INSURANCE">
                    国民健康保険
                  </SelectItem>
                  <SelectItem value="EMPLOYEES_INSURANCE">
                    社会保険
                  </SelectItem>
                  <SelectItem value="MUTUAL_AID_INSURANCE">
                    共済組合
                  </SelectItem>
                  <SelectItem value="LATE_STAGE_ELDERLY">
                    後期高齢者医療
                  </SelectItem>
                  <SelectItem value="OTHER">その他</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="insuranceCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>本人/家族区分</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="INSURED">本人</SelectItem>
                  <SelectItem value="DEPENDENT">家族</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="insuranceExpiration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>有効期限</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="limitCertification"
        render={({ field }) => (
          <FormItem>
            <FormLabel>限度額認定</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="限度額適用認定証の情報"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    {/* 公費負担医療 */}
    <div className="space-y-4">
      <h3 className="font-semibold">公費負担医療</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="publicPayerNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>公費負担者番号</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="publicRecipientNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>公費受給者番号</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="publicCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>公費区分</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="LIVELIHOOD_PROTECTION">
                    生活保護
                  </SelectItem>
                  <SelectItem value="INTRACTABLE_DISEASE">
                    難病医療
                  </SelectItem>
                  <SelectItem value="MENTAL_HEALTH">
                    精神通院医療
                  </SelectItem>
                  <SelectItem value="CHILD_MEDICAL">
                    小児慢性特定疾病
                  </SelectItem>
                  <SelectItem value="ATOMIC_BOMB_SURVIVOR">
                    原爆被爆者援護
                  </SelectItem>
                  <SelectItem value="SPECIFIED_DISEASE">
                    特定疾患
                  </SelectItem>
                  <SelectItem value="MATERNAL_HEALTH">
                    母子保健
                  </SelectItem>
                  <SelectItem value="OTHER">その他</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="publicExpiration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>公費有効期限</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>

    {/* 医療情報 */}
    <div className="space-y-4">
      <h3 className="font-semibold">医療情報</h3>
      <FormField
        control={form.control}
        name="allergies"
        render={({ field }) => (
          <FormItem>
            <FormLabel>アレルギー</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="薬剤アレルギー、食物アレルギーなど"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="medicalHistory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>既往歴</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="過去の病歴、手術歴など"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="familyHistory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>家族歴</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="家族の病歴など"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="contraindications"
        render={({ field }) => (
          <FormItem>
            <FormLabel>禁忌情報</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="投薬や処置の禁忌事項"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="currentMedications"
        render={({ field }) => (
          <FormItem>
            <FormLabel>服薬中の薬</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="現在服用中の薬剤"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="healthCheckInfo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>特定健診情報</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="特定健診の結果など"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="pregnant"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <input
                type="checkbox"
                checked={field.value === true}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-4 w-4 mt-1"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>妊娠中</FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>備考</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="その他の注意事項"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    {/* 送信ボタン */}
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
      >
        キャンセル
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "保存中..." : initialData ? "更新" : "登録"}
      </Button>
    </div>
  </form>
</Form>

      </DialogContent>
    </Dialog>
  );
}
