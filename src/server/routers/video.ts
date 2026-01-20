import { z } from "zod";
import { router, protectedProcedure, doctorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN;

async function createDailyRoom(roomName: string) {
  const response = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // 2 hours
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create Daily.co room");
  }

  return response.json();
}

async function createMeetingToken(roomName: string, isOwner: boolean) {
  const response = await fetch("https://api.daily.co/v1/meeting-tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // 2 hours
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create meeting token");
  }

  return response.json();
}

export const videoRouter = router({
  // Create video session for appointment
  createSession: doctorProcedure
    .input(z.object({ appointmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.appointmentId,
          tenantId: ctx.tenantId,
          isOnline: true,
        },
        include: { videoSession: true },
      });

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Return existing session if already created
      if (appointment.videoSession) {
        return appointment.videoSession;
      }

      // Create Daily.co room
      const roomName = `karute-${appointment.id}-${Date.now()}`;

      let roomUrl = `https://${DAILY_DOMAIN}/${roomName}`;

      // Only call Daily.co API if API key is configured
      if (DAILY_API_KEY && DAILY_API_KEY !== "your-daily-api-key") {
        const room = await createDailyRoom(roomName);
        roomUrl = room.url;
      }

      // Create video session
      const videoSession = await ctx.prisma.videoSession.create({
        data: {
          roomName,
          roomUrl,
          appointmentId: appointment.id,
        },
      });

      // Update appointment with video room info
      await ctx.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          videoRoomUrl: roomUrl,
          videoRoomName: roomName,
        },
      });

      return videoSession;
    }),

  // Get meeting token
  getToken: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.videoSession.findUnique({
        where: { id: input.sessionId },
        include: {
          appointment: {
            include: { patient: true, doctor: true },
          },
        },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Verify tenant access
      if (session.appointment.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Verify user access
      const isDoctor = session.appointment.doctorId === ctx.session?.user.id;
      const isAppointmentPatient =
        ctx.session?.user.role === "PATIENT" &&
        session.appointment.patient.email === ctx.session?.user.email;

      if (!isDoctor && !isAppointmentPatient) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Only call Daily.co API if API key is configured
      if (DAILY_API_KEY && DAILY_API_KEY !== "your-daily-api-key") {
        const { token } = await createMeetingToken(session.roomName, isDoctor);
        return { token, roomUrl: session.roomUrl };
      }

      return { token: null, roomUrl: session.roomUrl };
    }),

  // Start session
  startSession: doctorProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.videoSession.findFirst({
        where: {
          id: input.sessionId,
          appointment: { tenantId: ctx.tenantId },
        },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.prisma.appointment.update({
        where: { id: session.appointmentId },
        data: { status: "IN_PROGRESS" },
      });

      return ctx.prisma.videoSession.update({
        where: { id: input.sessionId },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });
    }),

  // End session
  endSession: doctorProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.videoSession.findFirst({
        where: {
          id: input.sessionId,
          appointment: { tenantId: ctx.tenantId },
        },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const endedAt = new Date();
      const duration = session.startedAt
        ? Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000)
        : 0;

      await ctx.prisma.appointment.update({
        where: { id: session.appointmentId },
        data: { status: "COMPLETED" },
      });

      return ctx.prisma.videoSession.update({
        where: { id: input.sessionId },
        data: {
          status: "COMPLETED",
          endedAt,
          duration,
        },
      });
    }),
});
