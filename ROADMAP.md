# プロジェクト改善ロードマップ

> プロジェクト全体の改善タスクを管理するドキュメント

## 追記ルール

1. PR単位で追記: 各PRで発見・提案された改善点を記録
2. フォーマット: `### YYYY-MM-DD PR#xxx (@author) - タイトル`
3. 優先度: `[P0]` 緊急 / `[P1]` 重要 / `[P2]` 改善
4. ステータス: `[ ]` 未着手 / `[x]` 完了 / `[-]` 取り消し
5. 完了時: チェックを入れ、対応PRを末尾に追記 `→ PR#xxx`

---

## 変更履歴（PR単位）

### 2026-01-22 PR#-- (@claude) - デザインレビュー・共通化改善

コンテキスト: feature/patient-model-redesign ブランチでのデザインレビュー

#### 1. ハードコード文字列のラベル化

##### 1.1 Dashboard - appointments/page.tsx
- [x] Line 153: "リスト" → labels
- [x] Line 157: "週間" → labels
- [x] Line 190: "今週" → labels
- [x] Line 319: "担当:" → labels

##### 1.2 その他のダッシュボードページ（223箇所/17ファイル）
- [ ] video/page.tsx
- [ ] page.tsx (dashboard home)
- [ ] error.tsx
- [ ] patients/page.tsx
- [ ] documents/page.tsx
- [ ] analytics/page.tsx
- [ ] billing/page.tsx
- [ ] prescriptions/page.tsx
- [ ] ent/page.tsx
- [ ] ent/dashboard/page.tsx
- [ ] ent/templates/page.tsx
- [ ] staff/[id]/page.tsx
- [ ] questionnaire/page.tsx
- [ ] ent/report/page.tsx
- [ ] patients/[id]/page.tsx

#### 2. 共通コンポーネント作成

##### 2.1 ConfirmDialog
- [x] 削除確認用の再利用可能なダイアログコンポーネント
- [x] Props: title, description, onConfirm, onCancel, isDestructive, isLoading
- [x] 使用箇所: medications削除、templates削除、documents削除など
- [x] 作成ファイル: src/components/layout/confirm-dialog.tsx

##### 2.2 Pagination
- [x] ページネーション用コンポーネント
- [x] Props: currentPage, totalPages, onPageChange, showFirstLast
- [x] 使用箇所: patients一覧、appointments一覧、records一覧
- [x] 作成ファイル: src/components/layout/pagination.tsx

##### 2.3 FilterCard
- [x] フィルタリング用コンポーネント群
- [x] SearchFilter: 検索入力（アイコン付き）
- [x] SelectFilter: ラベル付きセレクト
- [x] FilterBar: フィルタラッパー
- [x] 作成ファイル: src/components/layout/filter.tsx
- [x] 適用: patients, prescriptions, billing

#### 3. ユーティリティ関数

##### 3.1 日付フォーマットヘルパー (src/lib/date-utils.ts)
- [x] formatDate(date) → "yyyy年M月d日"
- [x] formatDateShort(date) → "M月d日"
- [x] formatDateWithDay(date) → "M月d日(月)"
- [x] formatDateTime(date) → "yyyy年M月d日 HH:mm"
- [x] formatTime(date) → "HH:mm"
- [x] formatRelative(date) → "3日前" など

#### 4. UX改善

##### 4.1 ローディング状態
- [x] ボタンのローディング状態を統一（isPending時にdisabled + スピナー）
- [ ] Skeleton コンポーネントのレスポンシブ対応

##### 4.2 フォーカス管理
- [ ] ダイアログオープン時の初期フォーカス設定
- [ ] フォーム送信後のフォーカス移動

##### 4.3 オプティミスティック更新
- [ ] ステータス更新時の即時UI反映
- [ ] エラー時のロールバック

#### 5. 既存バグ修正（feature/patient-model-redesign）

##### 5.1 TypeScript エラー
- [x] prisma generate 実行で解決

#### 6. コード品質

##### 6.1 型安全性
- [ ] any型の排除
- [ ] 厳密な型定義の追加

##### 6.2 テスト
- [ ] 新規コンポーネントのユニットテスト追加
- [ ] ユーティリティ関数のテスト追加

#### 完了サマリー

##### High 優先度（完了）
- [x] TypeScript エラー修正（prisma generate で解決）
- [x] ConfirmDialog 作成
- [x] 日付フォーマットヘルパー作成
- [x] Pagination 作成
- [x] appointments ページラベル化

##### Medium 優先度（未完了）
- [ ] その他ダッシュボードページのラベル化
- [x] FilterCard 作成
- [x] ローディング状態統一

##### Low 優先度（未完了）
- [ ] UX改善（フォーカス管理、オプティミスティック更新）
- [ ] テスト追加

---

### 2026-01-22 PR#-- (@user) - グローバル改善レビュー

コンテキスト: プロジェクト全体の品質・運用改善の洗い出し

#### 1. 運用・信頼性
- [ ] [P0] 本番監視の導入（エラートラッキング + メトリクス + アラート）
- [ ] [P0] DBバックアップ/リストア手順の整備と定期検証
- [ ] [P1] ジョブ実行基盤（キュー + リトライ + 冪等性）を設計
- [ ] [P1] ヘルスチェック/リードネスの標準化

#### 2. セキュリティ・コンプライアンス
- [ ] [P0] テナント分離の保証策（RLS or 強制スコープ + 侵入テスト）
- [ ] [P0] 秘密情報の管理方針（回転、漏洩時の手順、監査）
- [ ] [P1] 監査ログの網羅性レビュー（重要操作の漏れ確認）
- [ ] [P1] 重要データの暗号化方針（保存・転送・S3）

#### 3. 品質・テスト
- [ ] [P0] 主要業務フローのE2Eテスト（予約/診療/請求/ポータル）
- [ ] [P1] tRPC ルーターの統合テストと回帰テストの拡充
- [ ] [P2] テストデータ/シードの再現性と速度改善

#### 4. パフォーマンス・スケール
- [ ] [P1] 重い一覧の最適化（クエリ最適化 + 画面仮想化）
- [ ] [P1] キャッシュ戦略（再検証・無効化・TTL）の設計
- [ ] [P2] 画像/ファイル配信の最適化（署名URL、CDN）

#### 5. 開発・運用フロー
- [ ] [P1] CI/CD強化（check-all自動化 + Prismaマイグレーション検証）
- [ ] [P1] 環境変数バリデーション（起動時フェイルファスト）
- [ ] [P2] 障害対応ランブックと運用ドキュメント整備

#### 6. アクションプラン
- [ ] [P0] 本番監視: ベンダー選定とPoC / Owner: Platform(仮) / Due: 2026-02-15
- [ ] [P0] バックアップ手順: 復旧リハーサル実施 / Owner: Backend(仮) / Due: 2026-02-15
- [ ] [P0] テナント分離: 侵入テスト計画とチェックリスト化 / Owner: Security(仮) / Due: 2026-03-01
- [ ] [P0] E2Eテスト: 主要4フローのシナリオ作成 / Owner: QA(仮) / Due: 2026-03-01
- [ ] [P1] ジョブ基盤: 要件整理と候補比較 / Owner: Backend(仮) / Due: 2026-03-15
- [ ] [P1] 監査ログ: 重要操作の網羅性レビュー / Owner: Security(仮) / Due: 2026-03-15
- [ ] [P1] キャッシュ設計: 対象機能と無効化ルール整理 / Owner: Backend(仮) / Due: 2026-03-15
- [ ] [P1] CI/CD: check-all自動化とDB検証の設計 / Owner: Platform(仮) / Due: 2026-03-15
- [ ] [P2] 配信最適化: ファイル種別とCDN方針整理 / Owner: Frontend(仮) / Due: 2026-04-01
- [ ] [P2] ランブック: 障害対応フローのたたき台作成 / Owner: Platform(仮) / Due: 2026-04-01

#### 7. 追加分析による改善候補
- [ ] [P0] 設定値の型保証: envスキーマと起動時バリデーションを必須化
- [ ] [P0] 監査ログの検証基準: 保存期間、改ざん検知、閲覧権限の明文化
- [ ] [P1] 権限設計の可視化: ロール/権限マトリクスとUI制約の同期
- [ ] [P1] 依存関係監査: 重要ライブラリの脆弱性監視と定期更新
- [ ] [P1] リリース手順: ロールバック/DB切替の標準化
- [ ] [P2] パフォーマンス計測: 主要画面のCore Web Vitalsの定点計測
- [ ] [P2] アクセシビリティ: 主要ページのA11yチェックリスト化

#### 8. 具体化タスク（短期）
- [ ] [P0] モニタリング: 対象指標の一覧化（APIエラー率、p95、DB遅延）
- [ ] [P0] バックアップ: RPO/RTOを定義し運用メモに反映
- [ ] [P0] E2E: 予約/診療/請求/ポータルのテストケース雛形作成
- [ ] [P1] テナント分離: APIスコープの自動チェック導入方針決定
- [ ] [P1] CI/CD: 本番用チェックゲートの合意形成
- [ ] [P2] A11y: 主要フォームのアクセシビリティ改善リスト作成

---

## テンプレート（コピー用）

```markdown
### YYYY-MM-DD PR#xxx (@author) - タイトル

コンテキスト: [この変更の背景・目的]

#### 完了項目
- [x] 完了したタスク → PR#xxx

#### 残タスク
- [ ] [P0] 緊急タスク
- [ ] [P1] 重要タスク
- [ ] [P2] 改善タスク
```
