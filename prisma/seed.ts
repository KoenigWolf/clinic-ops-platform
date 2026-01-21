import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-clinic" },
    update: {},
    create: {
      name: "デモクリニック",
      slug: "demo-clinic",
      settings: {
        businessHours: {
          start: "09:00",
          end: "18:00",
        },
        appointmentDuration: 30,
      },
    },
  });

  console.log("Created tenant:", tenant.name);

  // Create demo users
  const passwordHash = await bcrypt.hash("password", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "管理者 太郎",
      passwordHash,
      role: "ADMIN",
      tenantId: tenant.id,
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@example.com" },
    update: {},
    create: {
      email: "doctor@example.com",
      name: "山田 医師",
      passwordHash,
      role: "DOCTOR",
      specialization: "内科",
      licenseNumber: "12345",
      tenantId: tenant.id,
    },
  });

  const nurseUser = await prisma.user.upsert({
    where: { email: "nurse@example.com" },
    update: {},
    create: {
      email: "nurse@example.com",
      name: "佐藤 看護師",
      passwordHash,
      role: "NURSE",
      tenantId: tenant.id,
    },
  });

  console.log("Created users:", [
    adminUser.email,
    doctorUser.email,
    nurseUser.email,
  ]);

  // ============================
  // Patients (Prisma model 完全準拠)
  // ============================

  const patients = [
    {
      patientNumber: "P0001",
      firstName: "太郎",
      lastName: "田中",
      firstNameKana: "タロウ",
      lastNameKana: "タナカ",
      dateOfBirth: new Date("1980-05-15"),
      gender: "MALE" as const,
      bloodType: "A_POSITIVE" as const,
      phone: "090-1234-5678",
      email: "tanaka@example.com",
      address: "東京都渋谷区1-2-3",
      postalCode: "150-0001",

      insurerNumber: "1234567",
      insuredNumber: "89012345",
      insuranceType: "EMPLOYEES_INSURANCE" as const,

      insuranceSymbol: null,
      insuranceExpiration: null,
      insuranceCategory: null,
      limitCertification: null,

      publicPayerNumber: null,
      publicRecipientNumber: null,
      publicCategory: null,
      publicExpiration: null,

      allergies: null,
      medicalHistory: null,
      familyHistory: null,
      contraindications: null,
      currentMedications: null,
      healthCheckInfo: null,
      pregnant: null,

      myNumberConsent: false,
      firstVisitDate: null,
      lastVisitDate: null,
    },
    {
      patientNumber: "P0002",
      firstName: "花子",
      lastName: "鈴木",
      firstNameKana: "ハナコ",
      lastNameKana: "スズキ",
      dateOfBirth: new Date("1990-08-20"),
      gender: "FEMALE" as const,
      bloodType: "B_POSITIVE" as const,
      phone: "090-2345-6789",
      email: "suzuki@example.com",
      address: "東京都新宿区4-5-6",
      postalCode: "160-0001",

      insurerNumber: "7654321",
      insuredNumber: "11223344",
      insuranceType: "NATIONAL_HEALTH_INSURANCE" as const,

      insuranceSymbol: null,
      insuranceExpiration: null,
      insuranceCategory: null,
      limitCertification: null,

      publicPayerNumber: null,
      publicRecipientNumber: null,
      publicCategory: null,
      publicExpiration: null,

      allergies: "ペニシリン",
      medicalHistory: null,
      familyHistory: null,
      contraindications: null,
      currentMedications: null,
      healthCheckInfo: null,
      pregnant: null,

      myNumberConsent: false,
      firstVisitDate: null,
      lastVisitDate: null,
    },
    {
      patientNumber: "P0003",
      firstName: "一郎",
      lastName: "高橋",
      firstNameKana: "イチロウ",
      lastNameKana: "タカハシ",
      dateOfBirth: new Date("1975-03-10"),
      gender: "MALE" as const,
      bloodType: "O_POSITIVE" as const,
      phone: "090-3456-7890",
      email: null,
      address: "東京都品川区7-8-9",
      postalCode: "140-0001",

      insurerNumber: "9999999",
      insuredNumber: "55667788",
      insuranceType: "EMPLOYEES_INSURANCE" as const,

      insuranceSymbol: null,
      insuranceExpiration: null,
      insuranceCategory: null,
      limitCertification: null,

      publicPayerNumber: null,
      publicRecipientNumber: null,
      publicCategory: null,
      publicExpiration: null,

      allergies: null,
      medicalHistory: "高血圧",
      familyHistory: null,
      contraindications: null,
      currentMedications: null,
      healthCheckInfo: null,
      pregnant: null,

      myNumberConsent: false,
      firstVisitDate: null,
      lastVisitDate: null,
    },
  ];

  // Insert patients
  for (const patientData of patients) {
    const patient = await prisma.patient.upsert({
      where: {
        tenantId_patientNumber: {
          tenantId: tenant.id,
          patientNumber: patientData.patientNumber,
        },
      },
      update: {},
      create: {
        ...patientData,
        tenantId: tenant.id,
      },
    });

    console.log("Created patient:", patient.lastName, patient.firstName);

    // Create sample medical record
    const record = await prisma.medicalRecord.create({
      data: {
        patientId: patient.id,
        doctorId: doctorUser.id,
        recordDate: new Date(),
        chiefComplaint: "定期検診",
        subjective: "特に自覚症状なし。体調良好。",
        objective: "バイタルサイン正常。視診・聴診にて異常所見なし。",
        assessment: "健康状態良好",
        plan: "次回3ヶ月後に定期検診予定。",
        diagnosis: "健康診断",
        vitalSigns: {
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          heartRate: 72,
          temperature: 36.5,
          oxygenSaturation: 98,
        },
      },
    });

    // Create sample prescription
    await prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: doctorUser.id,
        medicalRecordId: record.id,
        medicationName: "ロキソプロフェン",
        dosage: "60mg",
        frequency: "1日3回毎食後",
        duration: 7,
        quantity: 21,
        unit: "錠",
        instructions: "胃腸障害に注意",
      },
    });

    // Create sample appointment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setMinutes(30);

    await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        patientId: patient.id,
        doctorId: doctorUser.id,
        appointmentDate: tomorrow,
        startTime: tomorrow,
        endTime,
        type: "FOLLOWUP",
        status: "SCHEDULED",
        reason: "経過観察",
        isOnline: patient.patientNumber === "P0002",
      },
    });
  }

  // Create sample invoice
  const firstPatient = await prisma.patient.findFirst({
    where: { tenantId: tenant.id },
  });

  if (firstPatient) {
    await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        patientId: firstPatient.id,
        invoiceNumber: "INV-202401-0001",
        subtotal: 3000,
        tax: 300,
        total: 3300,
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: "現金",
        items: {
          create: [
            {
              description: "初診料",
              quantity: 1,
              unitPrice: 2820,
              amount: 2820,
            },
            {
              description: "処方箋料",
              quantity: 1,
              unitPrice: 180,
              amount: 180,
            },
          ],
        },
      },
    });
  }

  console.log("Database seeded successfully!");
  console.log("\n--- Demo Credentials ---");
  console.log("Admin: admin@example.com / password");
  console.log("Doctor: doctor@example.com / password");
  console.log("Nurse: nurse@example.com / password");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
