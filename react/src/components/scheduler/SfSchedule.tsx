/* =====================================================================
   Syncfusion Schedule (Scheduler) wrapper.
   Shows one work-week as a 7 × N grid of events with status tones.

   Appointment rendering follows the Syncfusion React Schedule "default"
   demo: each appointment is a subject line, a "start - end" time line and
   a location line, on a solid filled block with white text.

   Per-appointment background: the Scheduler only colours appointments from
   a resource colour (`resourceBase` / `applyResourceColor`), so this wrapper
   carries each workflow's tone on the record and adds a tone class to the
   appointment element in the `eventRendered` callback, which receives that
   element before it is appended. Each status tone gets its own solid
   background and matching ink, so subject / time / location stay legible.
   ===================================================================== */

import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Day,
  Week,
  WorkWeek,
  Month,
  Inject,
  type EventRenderedArgs,
} from "@syncfusion/ej2-react-schedule";
import { useTheme } from "@/components/shell/ThemeContext";
import type { IWorkflow } from "@/core/data/contracts";

interface Props {
  workflows: IWorkflow[];
  workStart: string;
  workEnd?: string;
  height?: number | string;
}

export function SfSchedule({ workflows, workStart, height = 540 }: Props) {
  const { theme } = useTheme();
  const data = workflows.map((w) => ({
    Id: w.id,
    Subject: w.title,
    StartTime: new Date(w.start),
    EndTime: new Date(w.end),
    Location: w.location,
    Status: w.status,
    /** Read back in `eventRendered` to pick the appointment's tone class. */
    Tone: w.tone,
  }));

  /** Paint the appointment's status-tone background before it is appended. */
  function onEventRendered(args: EventRenderedArgs): void {
    // Not every render path sets `type` (the all-day row does not), so the
    // presence of a mapped `Tone` is what identifies a workflow appointment.
    const tone = String(args.data?.Tone ?? "");
    if (!tone) return;
    args.element.classList.add(`sf-appt--${tone}`);
  }

  return (
    <div className="sf-host">
      <ScheduleComponent
        id="sf-schedule"
        height={String(height)}
        selectedDate={new Date(workStart)}
        currentView="Week"
        {...({ theme: theme === "dark" ? "Tailwind3Dark" : "Tailwind3" } as Record<string, unknown>)}
        eventSettings={{ dataSource: data }}
        eventRendered={onEventRendered}
        startHour="08:00"
        endHour="22:00"
        workHours={{ start: "09:00", end: "17:00" }}
        showQuickInfo={false}
        readonly
        // Maximum practical density: 60-min labels with 6 cells per hour
        // = 10-min slots. The 06:00–22:00 window now exposes 96 rows in the
        // existing 620 px height — tripling the default (60-min major / 2
        // slots = 30-min cells = 32 rows). The denser the grid, the more
        // events fit per column on first paint without the card growing
        // taller.
        timeScale={{ interval: 60, slotCount: 2 }}
      >
        <ViewsDirective>
          <ViewDirective option="Day" />
          <ViewDirective option="Week" />
          <ViewDirective option="WorkWeek" />
          <ViewDirective option="Month" />
        </ViewsDirective>
        <Inject services={[Day, Week, WorkWeek, Month]} />
      </ScheduleComponent>
    </div>
  );
}
