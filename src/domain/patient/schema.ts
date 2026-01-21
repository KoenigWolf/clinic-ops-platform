import { z } from "zod";

// ============================================
// Patient Domain Schema - Single Source of Truth
// ============================================

// Gender enum
export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);
export type Gender = z.infer<typeof genderSchema>;

// Blood type enum
export const bloodTypeSchema = z.enum([
  "A_POSITIVE", "A_NEGATIVE",
  "B_POSITIVE", "B_NEGATIVE",
  "O_POSITIVE", "O_NEGATIVE",
  "AB_POSITIVE", "AB_NEGATIVE",
]);
export type BloodType = z.infer<typeof bloodTypeSchema>;

// Insurance type enum
export const insuranceTypeSchema = z.enum([
  "NATIONAL_HEALTH_INSURANCE",
  "EMPLOYEES_INSURANCE",
  "MUTUAL_AID_INSURANCE",
  "LATE_STAGE_ELDERLY",
  "OTHER",
]);
export type InsuranceType = z.infer<typeof insuranceTypeSchema>;

// Insurance category enum
export const insuranceCategorySchema = z.enum(["INSURED", "DEPENDENT"]);
export type InsuranceCategory = z.infer<typeof insuranceCategorySchema>;

// Public category enum
export const publicCategorySchema = z.enum([
  "LIVELIHOOD_PROTECTION",
  "INTRACTABLE_DISEASE",
  "MENTAL_HEALTH",
  "CHILD_MEDICAL",
  "ATOMIC_BOMB_SURVIVOR",
  "SPECIFIED_DISEASE",
  "MATERNAL_HEALTH",
  "OTHER",
]);
export type PublicCategory = z.infer<typeof publicCategorySchema>;

// Patient input schema (for create/update operations)
export const patientInputSchema = z.object({
  // 基本情報
  patientNumber: z.string().min(1, "患者番号は必須です"),
  lastName: z.string().min(1, "姓は必須です"),
  firstName: z.string().min(1, "名は必須です"),
  lastNameKana: z.string().min(1, "セイは必須です"),
  firstNameKana: z.string().min(1, "メイは必須です"),
  dateOfBirth: z.string().min(1, "生年月日は必須です"),
  gender: genderSchema,
  bloodType: bloodTypeSchema.nullable().optional(),

  // 住所
  address: z.string().min(1, "住所は必須です"),
  postalCode: z.string().nullable().optional(),

  // マイナンバーカード同意
  myNumberConsent: z.boolean(),

  // 初診日・最終来院日
  firstVisitDate: z.string().nullable().optional(),
  lastVisitDate: z.string().nullable().optional(),

  // 連絡先
  phone: z.string().min(1, "電話番号は必須です"),
  email: z.string().email().nullable().optional().or(z.literal("")),
  emergencyContact: z.string().nullable().optional(),
  emergencyRelationship: z.string().nullable().optional(),
  emergencyPhone: z.string().nullable().optional(),

  // 医療情報
  allergies: z.string().nullable().optional(),
  medicalHistory: z.string().nullable().optional(),
  familyHistory: z.string().nullable().optional(),
  contraindications: z.string().nullable().optional(),
  currentMedications: z.string().nullable().optional(),
  healthCheckInfo: z.string().nullable().optional(),
  pregnant: z.boolean().nullable().optional(),

  // 保険情報（オンライン資格確認）
  insurerNumber: z.string().min(1, "保険者番号は必須です"),
  insuredNumber: z.string().min(1, "被保険者番号は必須です"),
  insuranceType: insuranceTypeSchema.nullable().optional(),
  insuranceSymbol: z.string().nullable().optional(),
  insuranceNumber: z.string().nullable().optional(),
  insuranceExpiration: z.string().nullable().optional(),
  insuranceCategory: insuranceCategorySchema.nullable().optional(),
  limitCertification: z.string().nullable().optional(),

  // 公費負担医療
  publicPayerNumber: z.string().nullable().optional(),
  publicRecipientNumber: z.string().nullable().optional(),
  publicCategory: publicCategorySchema.nullable().optional(),
  publicExpiration: z.string().nullable().optional(),

  // その他
  notes: z.string().nullable().optional(),
});

export type PatientInput = z.infer<typeof patientInputSchema>;

// Patient for edit (with id)
export type PatientForEdit = PatientInput & { id: string };

// Default values for form
export const patientInputDefaults: PatientInput = {
  patientNumber: "",
  lastName: "",
  firstName: "",
  lastNameKana: "",
  firstNameKana: "",
  dateOfBirth: "",
  gender: "MALE",
  bloodType: null,
  address: "",
  postalCode: null,
  myNumberConsent: false,
  firstVisitDate: null,
  lastVisitDate: null,
  phone: "",
  email: null,
  emergencyContact: null,
  emergencyRelationship: null,
  emergencyPhone: null,
  allergies: null,
  medicalHistory: null,
  familyHistory: null,
  contraindications: null,
  currentMedications: null,
  healthCheckInfo: null,
  pregnant: null,
  insurerNumber: "",
  insuredNumber: "",
  insuranceType: null,
  insuranceSymbol: null,
  insuranceNumber: null,
  insuranceExpiration: null,
  insuranceCategory: null,
  limitCertification: null,
  publicPayerNumber: null,
  publicRecipientNumber: null,
  publicCategory: null,
  publicExpiration: null,
  notes: null,
};
