/**
 * 予約ステータス遷移のドメインロジック
 *
 * 業務ルール:
 * - 予約は SCHEDULED → WAITING → IN_PROGRESS → COMPLETED の順で進む
 * - 各ステータスから前のステータスに戻すことが可能（誤操作対応）
 * - CANCELLED は SCHEDULED に戻せる（キャンセル取り消し）
 * - NO_SHOW は戻せない（確定状態）
 */

export const AppointmentStatus = {
  SCHEDULED: "SCHEDULED",
  WAITING: "WAITING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus];

/**
 * 予約ステータスの進行順序（タイムライン表示用）
 * キャンセル・来院なしは通常フローから外れるため含まない
 */
export const STATUS_FLOW: AppointmentStatusType[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.WAITING,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
];

/**
 * ステータスの進行順序でのインデックスを取得
 * @returns フロー内のインデックス、フロー外の場合は -1
 */
export function getStatusFlowIndex(status: string): number {
  if (status === AppointmentStatus.CANCELLED || status === AppointmentStatus.NO_SHOW) {
    return -1;
  }
  return STATUS_FLOW.indexOf(status as AppointmentStatusType);
}

/**
 * ステータス遷移の定義
 * - forward: 進める先のステータス一覧
 * - revert: 戻せる先のステータス（null = 戻せない）
 */
type StatusTransition = {
  forward: AppointmentStatusType[];
  revert: AppointmentStatusType | null;
};

const STATUS_TRANSITIONS: Record<AppointmentStatusType, StatusTransition> = {
  [AppointmentStatus.SCHEDULED]: {
    forward: [AppointmentStatus.WAITING, AppointmentStatus.CANCELLED],
    revert: null,
  },
  [AppointmentStatus.WAITING]: {
    forward: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
    revert: AppointmentStatus.SCHEDULED,
  },
  [AppointmentStatus.IN_PROGRESS]: {
    forward: [AppointmentStatus.COMPLETED],
    revert: AppointmentStatus.WAITING,
  },
  [AppointmentStatus.COMPLETED]: {
    forward: [],
    revert: AppointmentStatus.IN_PROGRESS,
  },
  [AppointmentStatus.CANCELLED]: {
    forward: [],
    revert: AppointmentStatus.SCHEDULED,
  },
  [AppointmentStatus.NO_SHOW]: {
    forward: [],
    revert: null,
  },
};

/**
 * 指定ステータスから進められる先のステータス一覧を取得
 */
export function getForwardStatuses(status: string): AppointmentStatusType[] {
  const transition = STATUS_TRANSITIONS[status as AppointmentStatusType];
  return transition?.forward ?? [];
}

/**
 * 指定ステータスから戻せる先のステータスを取得
 * @returns 戻せるステータス、戻せない場合は null
 */
export function getRevertStatus(status: string): AppointmentStatusType | null {
  const transition = STATUS_TRANSITIONS[status as AppointmentStatusType];
  return transition?.revert ?? null;
}

/**
 * 指定ステータスへの遷移が可能かどうかを判定
 */
export function canTransitionTo(currentStatus: string, targetStatus: string): boolean {
  const transition = STATUS_TRANSITIONS[currentStatus as AppointmentStatusType];
  if (!transition) return false;

  const target = targetStatus as AppointmentStatusType;
  return transition.forward.includes(target) || transition.revert === target;
}

/**
 * ステータスがキャンセル可能かどうかを判定
 */
export function canCancel(status: string): boolean {
  const forward = getForwardStatuses(status);
  return forward.includes(AppointmentStatus.CANCELLED);
}

/**
 * ステータスが終了状態かどうかを判定
 */
export function isTerminalStatus(status: string): boolean {
  return status === AppointmentStatus.COMPLETED ||
         status === AppointmentStatus.CANCELLED ||
         status === AppointmentStatus.NO_SHOW;
}

/**
 * ステータスにアクションボタンを表示すべきかどうかを判定
 */
export function shouldShowActions(status: string): boolean {
  // NO_SHOW のみアクションなし
  return status !== AppointmentStatus.NO_SHOW;
}
