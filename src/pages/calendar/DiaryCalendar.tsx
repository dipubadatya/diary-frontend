import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Feather,
  Plus,
  BookOpen,
  Clock,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { ErrorCard } from "../../components/ErrorCard";

/* ============================================================================
 * Types
 * ========================================================================== */

interface DiaryCalendarEntry {
  id: string;
  _id?: string;
  title: string;
  createdAt: string;
}

interface CalendarDayGroup {
  date: string; // YYYY-MM-DD
  entries: DiaryCalendarEntry[];
}

interface CalendarApiResponse {
  success: boolean;
  year: number;
  month: number;
  totalUserStories: number;
  data: CalendarDayGroup[];
}

interface CalendarCellData {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  entries: DiaryCalendarEntry[];
}

/* ============================================================================
 * Weekday Names (Monday - Sunday)
 * ========================================================================== */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/* ============================================================================
 * Component
 * ========================================================================== */

export const DiaryCalendar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active month cursor (always anchored to 1st of month)
  const [currentMonth, setCurrentMonth] = useState<moment.Moment>(() =>
    moment().startOf("month")
  );

  // Selected date (YYYY-MM-DD)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() =>
    moment().format("YYYY-MM-DD")
  );

  // Modal for multiple entries on a date
  const [modalDateStr, setModalDateStr] = useState<string | null>(null);

  // API data state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [entriesByDate, setEntriesByDate] = useState<
    Map<string, DiaryCalendarEntry[]>
  >(new Map());
  const [totalUserStories, setTotalUserStories] = useState<number>(0);

  // Animation direction for month transitions
  const [direction, setDirection] = useState<number>(0);

  /* --------------------------------------------------------------------------
   * Fetch Calendar Data
   * ------------------------------------------------------------------------ */
  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const year = currentMonth.year();
    const month = currentMonth.month() + 1;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      const res = await api.get<CalendarApiResponse>("/stories/calendar", {
        params: {
          year: year.toString(),
          month: month.toString(),
          timezone,
        },
      });

      if (res.data.success) {
        const map = new Map<string, DiaryCalendarEntry[]>();

        // Populate map with server entries
        for (const group of res.data.data || []) {
          // Normalize entries and ensure clean id
          const cleanEntries = group.entries.map((entry) => ({
            id: entry.id || entry._id || "",
            title: entry.title || "Untitled Entry",
            createdAt: entry.createdAt,
          }));
          map.set(group.date, cleanEntries);
        }

        setEntriesByDate(map);
        setTotalUserStories(res.data.totalUserStories ?? 0);
      } else {
        throw new Error("Could not load calendar data");
      }
    } catch (err: any) {
      setError(
        err?.message || "Unable to load your diary calendar. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  /* --------------------------------------------------------------------------
   * Month Navigation Handlers
   * ------------------------------------------------------------------------ */
  const handlePrevMonth = () => {
    setDirection(-1);
    setCurrentMonth((prev) => prev.clone().subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setDirection(1);
    setCurrentMonth((prev) => prev.clone().add(1, "month"));
  };

  const handleToday = () => {
    const today = moment();
    const isCurrent = currentMonth.isSame(today, "month");
    if (!isCurrent) {
      setDirection(today.isAfter(currentMonth) ? 1 : -1);
      setCurrentMonth(today.clone().startOf("month"));
    }
    setSelectedDateStr(today.format("YYYY-MM-DD"));
  };

  /* --------------------------------------------------------------------------
   * Keyboard Navigation
   * ------------------------------------------------------------------------ */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input/textarea or modal is open
      if (modalDateStr) {
        if (e.key === "Escape") setModalDateStr(null);
        return;
      }
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handlePrevMonth();
      } else if (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleNextMonth();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalDateStr]);

  /* --------------------------------------------------------------------------
   * Calendar Grid Calculation (Monday - Sunday ISO 8601)
   * ------------------------------------------------------------------------ */
  const calendarCells = useMemo<CalendarCellData[]>(() => {
    const cells: CalendarCellData[] = [];
    const todayStr = moment().format("YYYY-MM-DD");

    const year = currentMonth.year();
    const month = currentMonth.month(); // 0-indexed

    const daysInCurrentMonth = currentMonth.daysInMonth();
    const firstDayIsoWeekday = currentMonth.clone().startOf("month").isoWeekday(); // 1=Mon, 7=Sun

    // 1. Trailing days from previous month
    const trailingDaysCount = firstDayIsoWeekday - 1;
    if (trailingDaysCount > 0) {
      const prevMonth = currentMonth.clone().subtract(1, "month");
      const prevMonthDays = prevMonth.daysInMonth();
      for (let i = trailingDaysCount - 1; i >= 0; i--) {
        const dayNum = prevMonthDays - i;
        const d = prevMonth.clone().date(dayNum);
        const dateStr = d.format("YYYY-MM-DD");
        cells.push({
          dateStr,
          dayNumber: dayNum,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDateStr,
          entries: entriesByDate.get(dateStr) || [],
        });
      }
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const d = moment([year, month, day]);
      const dateStr = d.format("YYYY-MM-DD");
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        entries: entriesByDate.get(dateStr) || [],
      });
    }

    // 3. Leading days from next month to complete the row (multiples of 7)
    const totalFilled = cells.length;
    const remainingDays = (7 - (totalFilled % 7)) % 7;
    if (remainingDays > 0) {
      const nextMonth = currentMonth.clone().add(1, "month");
      for (let day = 1; day <= remainingDays; day++) {
        const d = nextMonth.clone().date(day);
        const dateStr = d.format("YYYY-MM-DD");
        cells.push({
          dateStr,
          dayNumber: day,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDateStr,
          entries: entriesByDate.get(dateStr) || [],
        });
      }
    }

    return cells;
  }, [currentMonth, selectedDateStr, entriesByDate]);

  // Selected date entries
  const selectedDateEntries = useMemo(() => {
    return entriesByDate.get(selectedDateStr) || [];
  }, [selectedDateStr, entriesByDate]);

  // Modal date entries
  const modalDateEntries = useMemo(() => {
    if (!modalDateStr) return [];
    return entriesByDate.get(modalDateStr) || [];
  }, [modalDateStr, entriesByDate]);

  // Count of entries written in this displayed month
  const currentMonthEntriesCount = useMemo(() => {
    let count = 0;
    const ymPrefix = currentMonth.format("YYYY-MM");
    for (const [dateStr, entries] of entriesByDate.entries()) {
      if (dateStr.startsWith(ymPrefix)) {
        count += entries.length;
      }
    }
    return count;
  }, [currentMonth, entriesByDate]);

  // Check if viewing current real-time month
  const isViewingCurrentMonth = currentMonth.isSame(moment(), "month");

  /* --------------------------------------------------------------------------
   * Modal Open Helpers
   * ------------------------------------------------------------------------ */
  const handleOpenDayModal = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setModalDateStr(dateStr);
  };

  const handleDayClick = (dateStr: string, entries: DiaryCalendarEntry[]) => {
    setSelectedDateStr(dateStr);
    // On desktop, if more than 2 entries, open popover/modal
    if (entries.length > 2) {
      setModalDateStr(dateStr);
    }
  };

  /* --------------------------------------------------------------------------
   * Story Click Helper
   * ------------------------------------------------------------------------ */
  const handleStoryClick = (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/stories/${storyId}`);
  };

  /* --------------------------------------------------------------------------
   * Empty Diary State (User has NEVER written any stories)
   * ------------------------------------------------------------------------ */
  if (!loading && !error && totalUserStories === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to={user ? `/profile/${user.username}` : "/stories"}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to profile
          </Link>
        </div>

        {/* Empty State Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-14 border border-gray-100 dark:border-slate-800 shadow-sm text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center mx-auto mb-5 text-[#FE5621]">
            <BookOpen className="w-8 h-8" strokeWidth={1.8} />
          </div>

          <h2 className="text-[20px] sm:text-[22px] font-bold text-gray-900 dark:text-white mb-2">
            Your diary is waiting.
          </h2>

          <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-xs mx-auto">
            Start writing your first story and it will appear here on its date.
          </p>

          <Link
            to="/write"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-[13.5px] font-semibold transition-all active:scale-[0.98] shadow-sm"
          >
            <Feather className="w-4 h-4" strokeWidth={2} />
            Write your first story
          </Link>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
   * Main Render
   * ------------------------------------------------------------------------ */
  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
      {/* ── Top Bar: Back Link & Privacy Indicator ── */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Link
          to={user ? `/profile/${user.username}` : "/stories"}
          className="inline-flex items-center gap-2 text-[12.5px] sm:text-[13px] font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Profile</span>
        </Link>

        <div className="flex items-center gap-2 text-[11.5px] sm:text-[12px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-full">
          <CalendarIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-400" />
          <span>Personal & Private</span>
        </div>
      </div>

      {/* ── Page Header ── */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-[22px] sm:text-[28px] font-bold text-gray-900 dark:text-white tracking-tight">
          My Diary Calendar
        </h1>
        <p className="text-[13px] sm:text-[14px] text-gray-500 dark:text-gray-400 mt-1">
          Your stories, organized by the days you wrote them.
        </p>
      </div>

      {/* ── Calendar Container Card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* ── Month Navigation Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-800/80">
          {/* Previous / Next Month Controls & Title */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors active:scale-95 border border-gray-200/60 dark:border-slate-700"
              aria-label="Previous month"
              title="Previous month (Ctrl + ←)"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.2} />
            </button>

            <div className="flex items-baseline gap-2">
              <h2 className="text-[16px] sm:text-[18px] font-bold text-gray-900 dark:text-white">
                {currentMonth.format("MMMM YYYY")}
              </h2>
              {currentMonthEntriesCount > 0 && (
                <span className="hidden sm:inline-flex text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                  ({currentMonthEntriesCount}{" "}
                  {currentMonthEntriesCount === 1 ? "story" : "stories"})
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors active:scale-95 border border-gray-200/60 dark:border-slate-700"
              aria-label="Next month"
              title="Next month (Ctrl + →)"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>

          {/* Quick Actions (Today Button & Month badge) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToday}
              className={`px-3 py-1.5 rounded-xl text-[12px] sm:text-[12.5px] font-semibold transition-all active:scale-95 border ${
                isViewingCurrentMonth
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow-xs"
                  : "bg-gray-50 text-gray-600 dark:bg-slate-800 dark:text-gray-300 border-gray-200/80 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
              aria-label="Go to today"
            >
              Today
            </button>
          </div>
        </div>

        {/* ── Error Banner State ── */}
        {error && (
          <div className="p-4 sm:p-6">
            <ErrorCard
              title="Unable to load diary calendar"
              message={error}
              actionLabel="Try again"
              onAction={fetchCalendar}
              variant="card"
            />
          </div>
        )}

        {/* ── Loading Skeleton Grid ── */}
        {loading && (
          <div className="p-3 sm:p-6 animate-pulse">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="h-6 bg-gray-100 dark:bg-slate-800 rounded-md"
                />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 sm:h-28 bg-gray-50 dark:bg-slate-800/40 rounded-xl sm:rounded-2xl border border-gray-100/60 dark:border-slate-800"
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Active Calendar Grid ── */}
        {!loading && !error && (
          <div className="p-2 sm:p-5">
            {/* Weekday Header */}
            <div
              className="grid grid-cols-7 gap-1 sm:gap-2 mb-2"
              role="row"
              aria-label="Calendar weekdays"
            >
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-1.5 sm:py-2 text-center text-[10.5px] sm:text-[12px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                  role="columnheader"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Monthly Dates Grid with subtle slide transition */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentMonth.format("YYYY-MM")}
                initial={{ opacity: 0, x: direction * 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -15 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="grid grid-cols-7 gap-1 sm:gap-2"
              >
                {calendarCells.map((cell) => {
                  const hasEntries = cell.entries.length > 0;
                  const isSelected = cell.dateStr === selectedDateStr;

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => handleDayClick(cell.dateStr, cell.entries)}
                      className={`
                        relative flex flex-col justify-between
                        p-1 sm:p-2.5 rounded-xl sm:rounded-2xl
                        transition-all duration-150 select-none
                        min-h-[58px] sm:min-h-[105px] lg:min-h-[115px]
                        border cursor-pointer
                        ${
                          cell.isCurrentMonth
                            ? isSelected
                              ? "bg-amber-50/40 dark:bg-amber-950/20 border-gray-900/20 dark:border-gray-100/30 shadow-xs"
                              : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800/80 hover:border-gray-200 dark:hover:border-slate-700"
                            : "bg-gray-50/50 dark:bg-slate-950/40 border-transparent opacity-45 hover:opacity-75"
                        }
                      `}
                      role="button"
                      tabIndex={0}
                      aria-label={`${moment(cell.dateStr).format(
                        "MMMM D, YYYY"
                      )} — ${cell.entries.length} ${
                        cell.entries.length === 1 ? "entry" : "entries"
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleDayClick(cell.dateStr, cell.entries);
                        }
                      }}
                    >
                      {/* Top: Day number + Today / Entry Count badge */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`
                            text-[11px] sm:text-[13px] font-semibold leading-none
                            flex items-center justify-center
                            w-5 h-5 sm:w-6 sm:h-6 rounded-lg
                            ${
                              cell.isToday
                                ? "bg-[#FE5621] text-white font-bold shadow-xs"
                                : isSelected
                                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold"
                                : cell.isCurrentMonth
                                ? "text-gray-800 dark:text-gray-200"
                                : "text-gray-400 dark:text-gray-600"
                            }
                          `}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* Mobile dot indicator */}
                        {hasEntries && (
                          <div className="sm:hidden flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FE5621]" />
                            {cell.entries.length > 1 && (
                              <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">
                                {cell.entries.length}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Desktop subtle entry count badge */}
                        {hasEntries && (
                          <span className="hidden sm:inline-flex text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100/70 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            {cell.entries.length}
                          </span>
                        )}
                      </div>

                      {/* Desktop / Tablet: Stories in cell */}
                      <div className="hidden sm:flex flex-col gap-1 my-1 flex-1 justify-start overflow-hidden">
                        {cell.entries.slice(0, 2).map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={(e) => handleStoryClick(entry.id, e)}
                            className="group/item flex items-center gap-1.5 w-full text-left px-2 py-1 rounded-lg bg-gray-50 dark:bg-slate-800/90 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 text-gray-700 dark:text-gray-200 transition-colors duration-150"
                            title={entry.title}
                          >
                            <span className="w-1 h-1 rounded-full bg-[#FE5621] shrink-0" />
                            <span className="text-[11px] font-medium truncate leading-tight flex-1">
                              {entry.title}
                            </span>
                          </button>
                        ))}

                        {/* If > 2 entries, show "+ X more" interactive button */}
                        {cell.entries.length > 2 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDayModal(cell.dateStr);
                            }}
                            className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-1.5 py-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition-colors w-fit"
                          >
                            + {cell.entries.length - 2} more
                          </button>
                        )}
                      </div>

                      {/* Subtle "+ Write" prompt on hover (Desktop) for empty days */}
                      {!hasEntries && cell.isCurrentMonth && (
                        <div className="hidden sm:flex items-center justify-end opacity-0 hover:opacity-100 transition-opacity">
                          <Link
                            to="/write"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-medium text-gray-400 hover:text-[#FE5621] flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-slate-800"
                            title="Write a new entry"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Write</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Selected Day Entries Section (Responsive: visible below calendar on all screen sizes) ── */}
      <div className="mt-5 sm:mt-6 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-[0_2px_16px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-200">
              <CalendarIcon className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[14px] sm:text-[15px] font-bold text-gray-900 dark:text-white">
                {moment(selectedDateStr).format("dddd, MMMM D, YYYY")}
              </h3>
              <p className="text-[11px] sm:text-[12px] text-gray-400 dark:text-gray-500">
                {selectedDateEntries.length === 0
                  ? "No stories written on this day"
                  : `${selectedDateEntries.length} ${
                      selectedDateEntries.length === 1 ? "story" : "stories"
                    }`}
              </p>
            </div>
          </div>

          {/* Quick Write Button for selected date */}
          <Link
            to="/write"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-[12px] font-semibold transition-all active:scale-95 shadow-xs"
          >
            <Feather className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Write</span>
          </Link>
        </div>

        {/* Selected date entries list */}
        {selectedDateEntries.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-[13px] text-gray-400 dark:text-gray-500 mb-2">
              No diary entries written on this date.
            </p>
            <Link
              to="/write"
              className="text-[12px] font-semibold text-[#FE5621] hover:underline"
            >
              Write a story now →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedDateEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={(e) => handleStoryClick(entry.id, e)}
                className="group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gray-50/70 hover:bg-gray-100/90 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800 transition-all cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/stories/${entry.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-2 h-2 rounded-full bg-[#FE5621] shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-[13px] sm:text-[13.5px] font-semibold text-gray-900 dark:text-white truncate group-hover:text-[#FE5621] transition-colors">
                      {entry.title}
                    </h4>
                    {entry.createdAt && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{moment(entry.createdAt).format("h:mm A")}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[12px] font-medium text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white shrink-0 transition-colors">
                  <span className="hidden sm:inline">Open</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Day Entries Modal / Popover (for dates with multiple entries) ── */}
      <AnimatePresence>
        {modalDateStr && (
          <div
            className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setModalDateStr(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-200">
                    <CalendarIcon className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2
                      id="modal-title"
                      className="text-[15px] font-bold text-gray-900 dark:text-white"
                    >
                      {moment(modalDateStr).format("MMMM D, YYYY")}
                    </h2>
                    <p className="text-[11.5px] text-gray-400 dark:text-gray-500">
                      {modalDateEntries.length}{" "}
                      {modalDateEntries.length === 1 ? "entry" : "entries"}{" "}
                      written
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalDateStr(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              {/* Modal Entries List */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-2 flex-1">
                {modalDateEntries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={(e) => handleStoryClick(entry.id, e)}
                    className="w-full text-left p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 transition-all group"
                  >
                    <div className="min-w-0 pr-2">
                      <h3 className="text-[13.5px] font-semibold text-gray-900 dark:text-white truncate group-hover:text-[#FE5621] transition-colors">
                        {entry.title}
                      </h3>
                      {entry.createdAt && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {moment(entry.createdAt).format("h:mm A")}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[12px] font-medium text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white shrink-0 transition-colors">
                      <span>Read</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 bg-gray-50/70 dark:bg-slate-800/40 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <Link
                  to="/write"
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#FE5621] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Write another entry for this day
                </Link>

                <button
                  type="button"
                  onClick={() => setModalDateStr(null)}
                  className="px-3.5 py-1.5 rounded-xl text-[12px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-slate-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiaryCalendar;
