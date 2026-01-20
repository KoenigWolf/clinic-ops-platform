import { router } from "../trpc";
import { patientRouter } from "./patient";
import { recordRouter } from "./record";
import { appointmentRouter } from "./appointment";
import { videoRouter } from "./video";
import { prescriptionRouter } from "./prescription";
import { billingRouter } from "./billing";
import { entRouter } from "./ent";
import { questionnaireRouter } from "./questionnaire";
import { documentRouter } from "./document";
import { analyticsRouter } from "./analytics";
import { portalRouter } from "./portal";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  patient: patientRouter,
  record: recordRouter,
  appointment: appointmentRouter,
  video: videoRouter,
  prescription: prescriptionRouter,
  billing: billingRouter,
  ent: entRouter,
  questionnaire: questionnaireRouter,
  document: documentRouter,
  analytics: analyticsRouter,
  portal: portalRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
