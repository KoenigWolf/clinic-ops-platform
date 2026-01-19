import { router } from "../trpc";
import { patientRouter } from "./patient";
import { recordRouter } from "./record";
import { appointmentRouter } from "./appointment";
import { videoRouter } from "./video";
import { prescriptionRouter } from "./prescription";
import { billingRouter } from "./billing";
import { entRouter } from "./ent";

export const appRouter = router({
  patient: patientRouter,
  record: recordRouter,
  appointment: appointmentRouter,
  video: videoRouter,
  prescription: prescriptionRouter,
  billing: billingRouter,
  ent: entRouter,
});

export type AppRouter = typeof appRouter;
