"use client";

import { useCallback, useId, useState, useSyncExternalStore } from "react";

import {
  DATETIME_LOCAL_STEP_SECONDS,
  datetimeInputClassName,
} from "@/lib/datetime-local";

type Props = {
  name: string;
  id?: string;
  required?: boolean;
  /** `YYYY-MM-DDTHH:mm`（註解：編輯表單帶入）。 */
  defaultValue?: string;
};

/** 是否為觸控裝置（註解：iPhone 橫向仍用拆欄；SSR 預設 true 避免先渲染 datetime-local 撐版）。 */
function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => true,
  );
}

/** 拆開 datetime-local 字串（註解：供窄螢幕 date + time 分欄）。 */
function splitDatetime(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

/** 合併 date + time；缺一則回傳空字串（註解：配合 HTML5 required 驗證）。 */
function joinDatetime(date: string, time: string): string {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

/**
 * 日期時間輸入（註解：窄螢幕拆成 date + time，避免 iOS `datetime-local` 撐出畫面）。
 */
export function DatetimeLocalInput({ name, id, required, defaultValue = "" }: Props) {
  const coarsePointer = useCoarsePointer();
  const autoId = useId();
  const inputId = id ?? autoId;
  const initial = splitDatetime(defaultValue);
  const [value, setValue] = useState(defaultValue);
  const [datePart, setDatePart] = useState(initial.date);
  const [timePart, setTimePart] = useState(initial.time);

  const fieldClass = datetimeInputClassName.replace(/^mt-1 /, "");

  const updateFromParts = useCallback((date: string, time: string) => {
    setDatePart(date);
    setTimePart(time);
    setValue(joinDatetime(date, time));
  }, []);

  const updateFromLocal = useCallback((next: string) => {
    setValue(next);
    const parts = splitDatetime(next);
    setDatePart(parts.date);
    setTimePart(parts.time);
  }, []);

  return (
    <>
      {/* 註解：單一 name 由 hidden 提交，避免窄／寬兩套欄位重複 name */}
      <input type="hidden" name={name} value={value} />

      {coarsePointer ?
        <div className="grid min-w-0 gap-2">
          <input
            type="date"
            aria-label="日期"
            value={datePart}
            required={required}
            className={fieldClass}
            onChange={(e) => updateFromParts(e.target.value, timePart)}
          />
          <input
            type="time"
            aria-label="時間"
            step={DATETIME_LOCAL_STEP_SECONDS}
            value={timePart}
            required={required}
            className={fieldClass}
            onChange={(e) => updateFromParts(datePart, e.target.value)}
          />
        </div>
      : <input
          id={inputId}
          type="datetime-local"
          step={DATETIME_LOCAL_STEP_SECONDS}
          required={required}
          value={value}
          className={datetimeInputClassName}
          onChange={(e) => updateFromLocal(e.target.value)}
        />
      }
    </>
  );
}
