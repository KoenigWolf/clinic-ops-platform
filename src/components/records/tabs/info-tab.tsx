"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RecordFormData } from "../record-dialog";

interface InfoTabProps {
  form: UseFormReturn<RecordFormData>;
}

export function InfoTab({ form }: InfoTabProps) {
  return (
    <div className="space-y-4 mt-4">
      <FormField
        control={form.control}
        name="recordDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>診療日</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="chiefComplaint"
        render={({ field }) => (
          <FormItem>
            <FormLabel>主訴</FormLabel>
            <FormControl>
              <Input {...field} placeholder="頭痛、発熱など" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="diagnosis"
        render={({ field }) => (
          <FormItem>
            <FormLabel>診断名</FormLabel>
            <FormControl>
              <Input {...field} placeholder="急性上気道炎" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
