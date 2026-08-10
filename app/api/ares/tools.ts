import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getCalendarEvents, getBusyTimes, isCalendarConnected } from "@/lib/google-calendar";
import { TRAINING_PLAN, OUTREACH_CHANNELS } from "@/lib/constants";
import { WHOOP_MOCK } from "@/lib/whoop-mock";

/** Today's date (YYYY-MM-DD) in the app's timezone, independent of server locale. */
function todayKeyBerlin(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

/** 0 = Monday ... 6 = Sunday, in the app's timezone. */
function todayWeekdayBerlin(): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
  }).format(new Date());
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return order.indexOf(weekday);
}

export const TOOLS: Anthropic.Messages.ToolUnion[] = [
  {
    type: "web_search_20260209",
    name: "web_search",
    max_uses: 5,
  },
  {
    name: "getTodayTasks",
    description: "Listet alle Aufgaben für den heutigen Tag mit Uhrzeit, Titel und Status.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "createTask",
    description: "Legt eine neue Aufgabe für heute an.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel der Aufgabe" },
        time: { type: "string", description: "Uhrzeit im Format HH:MM, optional" },
      },
      required: ["title"],
    },
  },
  {
    name: "completeTask",
    description:
      "Markiert eine Aufgabe als erledigt. Rufe zuerst getTodayTasks auf, um die id der Aufgabe zu finden.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Die id der Aufgabe" },
      },
      required: ["id"],
    },
  },
  {
    name: "getGoals",
    description: "Listet alle Ziele (Goals) mit Status, Priorität, Zieldatum und Fortschritt.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "createGoal",
    description: "Legt ein neues Ziel (Goal) an.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel des Ziels" },
        targetDate: { type: "string", description: "Zieldatum im Format YYYY-MM-DD, optional" },
        priority: {
          type: "string",
          enum: ["low", "normal", "high", "critical"],
          description: "Priorität, optional, Standard 'normal'",
        },
        category: { type: "string", description: "Kategorie, optional" },
      },
      required: ["title"],
    },
  },
  {
    name: "getProjects",
    description: "Listet alle Projekte mit Status und verknüpftem Ziel.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "saveMemory",
    description:
      "Speichert eine dauerhafte, wichtige Erinnerung über den Nutzer für zukünftige Gespräche " +
      "(z. B. Prioritäten, Vorlieben, wiederkehrende Fakten). Nur für Informationen mit " +
      "bleibendem Wert verwenden, nicht für beiläufige oder einmalige Aussagen.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Freie Kategorie, z. B. Business, Gesundheit, Persönlich, Finanzen",
        },
        content: {
          type: "string",
          description:
            "Die Erinnerung als eigenständiger, klarer Satz in der dritten Person, z. B. " +
            "'Voltra ist aktuell Louis' wichtigstes Businessprojekt.'",
        },
        importance: {
          type: "string",
          enum: ["low", "normal", "high", "critical"],
          description: "Wie wichtig diese Erinnerung ist",
        },
      },
      required: ["category", "content", "importance"],
    },
  },
  {
    name: "searchMemory",
    description:
      "Durchsucht gespeicherte Erinnerungen nach Stichworten. Rufe dies proaktiv auf, bevor du " +
      "eine Frage beantwortest, die sich auf zuvor gespeicherte, persönliche Informationen " +
      "beziehen könnte (Prioritäten, Vorlieben, Fakten über den Nutzer oder sein Business). " +
      "Die Suche ist aktuell stichwortbasiert, nicht semantisch — probiere bei Bedarf mehrere " +
      "naheliegende Begriffe.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Suchbegriff(e), z. B. 'Business' oder 'wichtigstes Projekt'" },
      },
      required: ["query"],
    },
  },
  {
    name: "getMetrics",
    description: "Liest gespeicherte Kennzahlen (z. B. Gewicht, Körperfett, WHOOP-Werte).",
    input_schema: {
      type: "object",
      properties: {
        metricKey: { type: "string", description: "Filter auf einen bestimmten Metrik-Key, optional" },
        limit: { type: "number", description: "Maximale Anzahl Ergebnisse, Standard 20" },
      },
      required: [],
    },
  },
  {
    name: "saveJournalEntry",
    description: "Speichert einen neuen Journal-Eintrag.",
    input_schema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Inhalt des Journal-Eintrags" },
      },
      required: ["content"],
    },
  },
  {
    name: "getTodayOutreach",
    description:
      "Liest den heutigen Cold-Outreach-Fortschritt (Cold Email, Cold Loom, Cold LinkedIn) inkl. " +
      "Tagesziel und noch offener Einheiten pro Kanal — die zentrale Business-KPI für Priorisierung.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getTodayTraining",
    description:
      "Gibt das für den heutigen Wochentag geplante Training zurück (Push/Pull/Legs/Arme/Rest), " +
      "basierend auf dem festen wöchentlichen Trainingsplan.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getWhoopScores",
    description:
      "Liest die aktuellen WHOOP-Werte (Sleep, Recovery, Strain). Hinweis: Solange WHOOP nicht " +
      "echt angebunden ist, handelt es sich um einen konstanten Platzhalterwert, keine echte " +
      "Tagesmessung — sag das transparent, wenn es für die Antwort relevant ist.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getCalendarEvents",
    description:
      "Liest Termine und Meetings aus Google Calendar für einen Zeitraum. Nur lesend — kann keine " +
      "Termine erstellen, verschieben oder löschen. Wenn der Kalender noch nicht verbunden ist, " +
      "sag dem Nutzer, dass er ihn zuerst auf der Business-Seite verbinden muss.",
    input_schema: {
      type: "object",
      properties: {
        timeMin: { type: "string", description: "Start des Zeitraums als ISO-8601-Zeitstempel" },
        timeMax: { type: "string", description: "Ende des Zeitraums als ISO-8601-Zeitstempel" },
      },
      required: ["timeMin", "timeMax"],
    },
  },
  {
    name: "getFreeBusyTimes",
    description:
      "Liest belegte Zeiträume aus Google Calendar für einen Zeitraum, um freie Zeiten zu " +
      "ermitteln. Nur lesend.",
    input_schema: {
      type: "object",
      properties: {
        timeMin: { type: "string", description: "Start des Zeitraums als ISO-8601-Zeitstempel" },
        timeMax: { type: "string", description: "Ende des Zeitraums als ISO-8601-Zeitstempel" },
      },
      required: ["timeMin", "timeMax"],
    },
  },
  {
    name: "getInvestmentOpportunities",
    description:
      "Listet bereits gespeicherte Investment-Opportunities (Aktien, Branchen, Technologien, " +
      "Rohstoffe, Makrotrends). Rufe dies IMMER zuerst auf, bevor du eine neue Opportunity " +
      "speicherst, um Duplikate und thematisch redundante Ideen zu vermeiden.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "saveInvestmentOpportunity",
    description:
      "Speichert eine neu recherchierte Investment-Opportunity, die auf der Investments-Seite " +
      "erscheint. NUR für wirklich neue, hochwertige Ideen mit klarer These verwenden — nicht für " +
      "jede beiläufige Erwähnung. Es gibt ein tägliches Limit; wird es erreicht, schlägt der " +
      "Aufruf fehl und du solltest dem Nutzer sagen, dass das Tageslimit erreicht ist, statt es zu " +
      "umgehen.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Kurzer, prägnanter Titel, z. B. 'Halbleiter-Ausrüstung'" },
        category: {
          type: "string",
          enum: ["stock", "industry", "technology", "commodity", "macro"],
          description: "Art der Opportunity",
        },
        ticker: { type: "string", description: "Börsenkürzel, falls vorhanden, sonst weglassen" },
        thesis: { type: "string", description: "Die These: warum das langfristig interessant sein könnte" },
      },
      required: ["title", "category", "thesis"],
    },
  },
];

const MAX_NEW_OPPORTUNITIES_PER_DAY = 2;

export async function callTool(name: string, input: unknown): Promise<unknown> {
  const supabase = await createClient();
  const args = (input ?? {}) as Record<string, unknown>;

  switch (name) {
    case "getTodayTasks": {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, scheduled_time, status")
        .eq("due_date", todayKeyBerlin())
        .order("scheduled_time", { ascending: true });
      if (error) throw error;
      return data;
    }

    case "createTask": {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: String(args.title),
          scheduled_time: args.time ? String(args.time) : null,
          due_date: todayKeyBerlin(),
          status: "todo",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "completeTask": {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", String(args.id))
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "getGoals": {
      const { data, error } = await supabase
        .from("goals")
        .select("id, title, status, priority, target_date, progress")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }

    case "createGoal": {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          title: String(args.title),
          target_date: args.targetDate ? String(args.targetDate) : null,
          priority: args.priority ? String(args.priority) : "normal",
          category: args.category ? String(args.category) : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "getProjects": {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, goal_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }

    case "saveMemory": {
      const content = String(args.content);
      const title = content.length > 60 ? `${content.slice(0, 57)}...` : content;
      const { data, error } = await supabase
        .from("memories")
        .insert({
          category: args.category ? String(args.category) : null,
          content,
          importance: args.importance ? String(args.importance) : "normal",
          title,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "searchMemory": {
      // Word-level OR matching until pgvector/embeddings land — more forgiving
      // than a single exact-phrase substring match, still not semantic search.
      const rawWords = String(args.query)
        .split(/\s+/)
        .map((w) => w.replace(/[,()%]/g, ""))
        .filter((w) => w.length >= 3);
      const words = rawWords.length > 0 ? rawWords : [String(args.query).replace(/[,()%]/g, "")];

      const orFilter = words.flatMap((w) => [`title.ilike.%${w}%`, `content.ilike.%${w}%`]).join(",");

      const { data, error } = await supabase
        .from("memories")
        .select("id, category, content, importance, created_at")
        .or(orFilter)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }

    case "getMetrics": {
      let query = supabase
        .from("metrics")
        .select("id, metric_key, value, recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(typeof args.limit === "number" ? args.limit : 20);
      if (args.metricKey) query = query.eq("metric_key", String(args.metricKey));
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    case "saveJournalEntry": {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({ content: String(args.content) })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "getTodayOutreach": {
      const categories = OUTREACH_CHANNELS.map((c) => `outreach_${c.key}`);
      const { data, error } = await supabase
        .from("daily_logs")
        .select("category, value")
        .eq("log_date", todayKeyBerlin())
        .in("category", categories);
      if (error) throw error;

      return OUTREACH_CHANNELS.map((channel) => {
        const row = data?.find((r) => r.category === `outreach_${channel.key}`);
        const done = row ? Number(row.value) || 0 : 0;
        return { label: channel.label, done, target: channel.target, remaining: Math.max(0, channel.target - done) };
      });
    }

    case "getTodayTraining": {
      const plan = TRAINING_PLAN[todayWeekdayBerlin()];
      return { label: plan.label, kind: plan.kind };
    }

    case "getWhoopScores": {
      return {
        sleep: WHOOP_MOCK.sleep,
        recovery: WHOOP_MOCK.recovery,
        strain: WHOOP_MOCK.strain,
        note: "Platzhalterwert — WHOOP ist noch nicht real angebunden.",
      };
    }

    case "getCalendarEvents": {
      if (!(await isCalendarConnected())) {
        throw new Error(
          "Google Calendar ist noch nicht verbunden. Der Nutzer muss ihn zuerst auf der Business-Seite verbinden."
        );
      }
      return getCalendarEvents(String(args.timeMin), String(args.timeMax));
    }

    case "getFreeBusyTimes": {
      if (!(await isCalendarConnected())) {
        throw new Error(
          "Google Calendar ist noch nicht verbunden. Der Nutzer muss ihn zuerst auf der Business-Seite verbinden."
        );
      }
      return getBusyTimes(String(args.timeMin), String(args.timeMax));
    }

    case "getInvestmentOpportunities": {
      const { data, error } = await supabase
        .from("investment_opportunities")
        .select("id, title, category, ticker, thesis, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }

    case "saveInvestmentOpportunity": {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from("investment_opportunities")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since);
      if (countError) throw countError;

      if ((count ?? 0) >= MAX_NEW_OPPORTUNITIES_PER_DAY) {
        throw new Error(
          `Tageslimit erreicht (${MAX_NEW_OPPORTUNITIES_PER_DAY} neue Opportunities pro 24h). ` +
            "Keine weiteren Ideen speichern, auch wenn der Nutzer insistiert — Qualität vor Menge."
        );
      }

      const { data, error } = await supabase
        .from("investment_opportunities")
        .insert({
          title: String(args.title),
          category: String(args.category),
          ticker: args.ticker ? String(args.ticker) : null,
          thesis: String(args.thesis),
        })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") {
          throw new Error("Eine Opportunity mit diesem Titel existiert bereits — keine Duplikate speichern.");
        }
        throw error;
      }
      return data;
    }

    default:
      throw new Error(`Unbekanntes Tool: ${name}`);
  }
}
