import { z } from "zod";

// ==================== 聴力検査スキーマ ====================

export const audiometrySchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  testDate: z.date().optional(),
  testType: z.enum(["PURE_TONE", "SPEECH", "IMPEDANCE", "OAE", "ABR"]).default("PURE_TONE"),
  // 右耳気導
  rightAir125: z.number().nullable().optional(),
  rightAir250: z.number().nullable().optional(),
  rightAir500: z.number().nullable().optional(),
  rightAir1000: z.number().nullable().optional(),
  rightAir2000: z.number().nullable().optional(),
  rightAir4000: z.number().nullable().optional(),
  rightAir8000: z.number().nullable().optional(),
  // 左耳気導
  leftAir125: z.number().nullable().optional(),
  leftAir250: z.number().nullable().optional(),
  leftAir500: z.number().nullable().optional(),
  leftAir1000: z.number().nullable().optional(),
  leftAir2000: z.number().nullable().optional(),
  leftAir4000: z.number().nullable().optional(),
  leftAir8000: z.number().nullable().optional(),
  // 右耳骨導
  rightBone250: z.number().nullable().optional(),
  rightBone500: z.number().nullable().optional(),
  rightBone1000: z.number().nullable().optional(),
  rightBone2000: z.number().nullable().optional(),
  rightBone4000: z.number().nullable().optional(),
  // 左耳骨導
  leftBone250: z.number().nullable().optional(),
  leftBone500: z.number().nullable().optional(),
  leftBone1000: z.number().nullable().optional(),
  leftBone2000: z.number().nullable().optional(),
  leftBone4000: z.number().nullable().optional(),
  // 語音弁別能
  rightSpeechDiscrimination: z.number().nullable().optional(),
  leftSpeechDiscrimination: z.number().nullable().optional(),
  interpretation: z.string().optional(),
});

export type AudiometryInput = z.infer<typeof audiometrySchema>;

// ==================== ティンパノメトリースキーマ ====================

export const tympanometrySchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  testDate: z.date().optional(),
  rightType: z.enum(["A", "As", "Ad", "B", "C"]).nullable().optional(),
  rightPeakPressure: z.number().nullable().optional(),
  rightCompliance: z.number().nullable().optional(),
  rightEarCanalVolume: z.number().nullable().optional(),
  leftType: z.enum(["A", "As", "Ad", "B", "C"]).nullable().optional(),
  leftPeakPressure: z.number().nullable().optional(),
  leftCompliance: z.number().nullable().optional(),
  leftEarCanalVolume: z.number().nullable().optional(),
  interpretation: z.string().optional(),
});

export type TympanometryInput = z.infer<typeof tympanometrySchema>;

// ==================== 平衡機能検査スキーマ ====================

export const vestibularSchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  testDate: z.date().optional(),
  testType: z.enum(["CALORIC", "POSTUROGRAPHY", "ENG", "VNG", "VHIT", "VEMP", "ROTATION"]).default("CALORIC"),
  chiefComplaint: z.string().optional(),
  vertigoType: z.string().optional(),
  nystagmusFindings: z.string().optional(),
  rombergTest: z.string().optional(),
  mannTest: z.string().optional(),
  caloricResponse: z.string().optional(),
  headImpulseTest: z.string().optional(),
  dixHallpikeResult: z.string().optional(),
  interpretation: z.string().optional(),
});

export type VestibularInput = z.infer<typeof vestibularSchema>;

// ==================== 内視鏡検査スキーマ ====================

export const endoscopySchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  examDate: z.date().optional(),
  examType: z.enum(["NASAL", "PHARYNGEAL", "LARYNGEAL", "OTOSCOPY"]).default("NASAL"),
  nasalFindings: z.string().optional(),
  nasalSeptum: z.string().optional(),
  inferiorTurbinate: z.string().optional(),
  middleMeatus: z.string().optional(),
  pharyngealFindings: z.string().optional(),
  tonsils: z.string().optional(),
  laryngealFindings: z.string().optional(),
  vocalCords: z.string().optional(),
  epiglottis: z.string().optional(),
  otoscopyRight: z.string().optional(),
  otoscopyLeft: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  interpretation: z.string().optional(),
});

export type EndoscopyInput = z.infer<typeof endoscopySchema>;

// ==================== アレルギー検査スキーマ ====================

export const allergyResultSchema = z.record(
  z.string(),
  z.string().regex(/^[0-6]$/, "クラスは0-6の値")
);

export type AllergyResult = z.infer<typeof allergyResultSchema>;

export const allergyTestSchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  testDate: z.date().optional(),
  testType: z.enum(["RAST", "SKIN_PRICK", "MAST", "CAP"]).default("RAST"),
  results: allergyResultSchema.optional(),
  totalIgE: z.number().nullable().optional(),
  interpretation: z.string().optional(),
});

export type AllergyTestInput = z.infer<typeof allergyTestSchema>;

// ==================== 処方スキーマ ====================

export const prescriptionItemSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
});

export type PrescriptionItem = z.infer<typeof prescriptionItemSchema>;

// ==================== 診断テンプレートスキーマ ====================

export const diagnosisTemplateSchema = z.object({
  name: z.string(),
  category: z.enum(["EAR", "NOSE", "THROAT", "ALLERGY", "VERTIGO", "OTHER"]),
  icdCode: z.string().optional(),
  subjectiveTemplate: z.string().optional(),
  objectiveTemplate: z.string().optional(),
  assessmentTemplate: z.string().optional(),
  planTemplate: z.string().optional(),
  commonPrescriptions: z.array(prescriptionItemSchema).optional(),
  isActive: z.boolean().default(true),
});

export type DiagnosisTemplateInput = z.infer<typeof diagnosisTemplateSchema>;

// ==================== カテゴリ定義 ====================

export const TEMPLATE_CATEGORIES = [
  "EAR",
  "NOSE",
  "THROAT",
  "ALLERGY",
  "VERTIGO",
  "OTHER",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const AUDIOMETRY_TEST_TYPES = [
  "PURE_TONE",
  "SPEECH",
  "IMPEDANCE",
  "OAE",
  "ABR",
] as const;

export type AudiometryTestType = (typeof AUDIOMETRY_TEST_TYPES)[number];

export const TYMPANOMETRY_TYPES = ["A", "As", "Ad", "B", "C"] as const;

export type TympanometryType = (typeof TYMPANOMETRY_TYPES)[number];

export const VESTIBULAR_TEST_TYPES = [
  "CALORIC",
  "POSTUROGRAPHY",
  "ENG",
  "VNG",
  "VHIT",
  "VEMP",
  "ROTATION",
] as const;

export type VestibularTestType = (typeof VESTIBULAR_TEST_TYPES)[number];

export const ENDOSCOPY_EXAM_TYPES = [
  "NASAL",
  "PHARYNGEAL",
  "LARYNGEAL",
  "OTOSCOPY",
] as const;

export type EndoscopyExamType = (typeof ENDOSCOPY_EXAM_TYPES)[number];

export const ALLERGY_TEST_TYPES = ["RAST", "SKIN_PRICK", "MAST", "CAP"] as const;

export type AllergyTestType = (typeof ALLERGY_TEST_TYPES)[number];
