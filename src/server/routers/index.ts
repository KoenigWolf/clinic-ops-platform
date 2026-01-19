import { router } from "../trpc";
import { patientRouter } from "./patient";
import { recordRouter } from "./record";
import { appointmentRouter } from "./appointment";
import { videoRouter } from "./video";
import { prescriptionRouter } from "./prescription";
import { billingRouter } from "./billing";

export const appRouter = router({
  patient: patientRouter,
  record: recordRouter,
  appointment: appointmentRouter,
  video: videoRouter,
  prescription: prescriptionRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
