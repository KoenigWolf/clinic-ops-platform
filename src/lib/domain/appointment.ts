/**
 * 予約のドメイン型定義
 *
 * スケジュール表示コンポーネントで共通利用される予約データの型
 * Single Source of Truth として一箇所で定義
 */

import type { AppointmentStatusType } from "./appointment-status";

/**
 * 患者情報（予約表示用）
 */
export type AppointmentPatient = {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
};

/**
 * 担当医情報（予約表示用）
 */
export type AppointmentDoctor = {
  id: string;
  name: string;
};

/**
 * 予約データ（スケジュール表示用）
 *
 * APIレスポンスとUIコンポーネント間で共通利用される型
 */
export type AppointmentView = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: AppointmentStatusType | string;
  isOnline: boolean;
  reason?: string | null;
  patient: AppointmentPatient;
  doctor: AppointmentDoctor;
};
