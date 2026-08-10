"use client";

import { useEffect, useState } from "react";
import { getDailyValue, setDailyValue } from "@/lib/daily-state";
import { TRAINING_PLAN, WEEKDAYS_SHORT_DE } from "@/lib/constants";
import { trainingDisciplinePercentage } from "@/lib/calculations";
import { isoWeekday, todayKey } from "@/lib/utils";

const NAMESPACE = "training";

function currentWeekDates(): string[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - isoWeekday(now));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return todayKey(d);
  });
}

export function useWeekTraining() {
  const [weekKeys] = useState(currentWeekDates);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loaded: Record<string, boolean> = {};
    weekKeys.forEach((key) => {
      loaded[key] = getDailyValue(NAMESPACE, key, false);
    });
    // Deferred to after mount for the same SSR/hydration reason as useDailyState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompleted(loaded);
  }, [weekKeys]);

  function toggle(dateKey: string) {
    setCompleted((prev) => {
      const next = !prev[dateKey];
      setDailyValue(NAMESPACE, dateKey, next);
      return { ...prev, [dateKey]: next };
    });
  }

  const days = TRAINING_PLAN.map((plan, i) => ({
    ...plan,
    dateKey: weekKeys[i],
    completed: Boolean(completed[weekKeys[i]]),
  }));

  const scheduledDays = days.filter((d) => d.kind !== "rest");
  const disciplinePercentage = trainingDisciplinePercentage(
    scheduledDays.length,
    scheduledDays.filter((d) => d.completed).length
  );

  const dailyPercentages = days.map((d, i) => ({
    label: WEEKDAYS_SHORT_DE[i],
    value: d.kind === "rest" ? 100 : d.completed ? 100 : 0,
  }));

  const todayEntry = days[isoWeekday()];

  return { days, toggle, disciplinePercentage, dailyPercentages, weekKeys, todayEntry };
}
