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
  Flame,
  Target,
  Trophy,
  CheckCircle2,
  Settings2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

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

export interface IStreakStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  isStreakActiveToday: boolean;
}

export interface IGoalStats {
  dailyTarget: number;
  dailyCompleted: number;
  dailyRemaining: number;
  dailyProgressPercent: number;
  isDailyGoalMet: boolean;
  weeklyTarget: number;
  weeklyCompleted: number;
  weeklyRemaining: number;
  weeklyProgressPercent: number;
  isWeeklyGoalMet: boolean;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
}

interface CalendarApiResponse {
  success: boolean;
  year: number;
  month: number;
  totalUserStories: number;
  data: CalendarDayGroup[];
  streak?: IStreakStats;
  goals?: IGoalStats;
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
 * Weekday Names (Monday - Sunday ISO 8601)
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

  // Streak & Goals state
  const [streak, setStreak] = useState<IStreakStats | null>(null);
  const [goals, setGoals] = useState<IGoalStats | null>(null);

  // Goal Settings Modal state
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState<boolean>(false);
  const [dailyGoalInput, setDailyGoalInput] = useState<number>(1);
  const [weeklyGoalInput, setWeeklyGoalInput] = useState<number>(5);
  const [savingGoals, setSavingGoals] = useState<boolean>(false);

  // Animation direction for month transitions
  const [direction, setDirection] = useState<number>(0);

  /* --------------------------------------------------------------------------
   * Fetch Calendar, Streak & Goals Data
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
          const cleanEntries = group.entries.map((entry) => ({
            id: entry.id || entry._id || "",
            title: entry.title || "Untitled Entry",
            createdAt: entry.createdAt,
          }));
          map.set(group.date, cleanEntries);
        }

        setEntriesByDate(map);
        setTotalUserStories(res.data.totalUserStories ?? 0);

        if (res.data.streak) {
          setStreak(res.data.streak);
        }
        if (res.data.goals) {
          setGoals(res.data.goals);
          setDailyGoalInput(res.data.goals.dailyTarget);
          setWeeklyGoalInput(res.data.goals.weeklyTarget);
        }
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
   * Goal Customization Handlers
   * ------------------------------------------------------------------------ */
  const handleOpenGoalsModal = () => {
    if (goals) {
      setDailyGoalInput(goals.dailyTarget);
      setWeeklyGoalInput(goals.weeklyTarget);
    }
    setIsGoalsModalOpen(true);
  };

  const handleSaveGoals = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (dailyGoalInput < 1 || dailyGoalInput > 50) {
      toast.error("Daily goal must be between 1 and 50 stories.");
      return;
    }
    if (weeklyGoalInput < 1 || weeklyGoalInput > 200) {
      toast.error("Weekly goal must be between 1 and 200 stories.");
      return;
    }

    setSavingGoals(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await api.put<{
        success: boolean;
        goals: IGoalStats;
        streak: IStreakStats;
        message?: string;
      }>("/users/writing-goals", {
        dailyTarget: dailyGoalInput,
        weeklyTarget: weeklyGoalInput,
        timezone,
      });

      if (res.data.success) {
        if (res.data.goals) setGoals(res.data.goals);
        if (res.data.streak) setStreak(res.data.streak);
        setIsGoalsModalOpen(false);
        toast.success("Writing goals updated successfully!");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to update writing goals."
      );
    } finally {
      setSavingGoals(false);
    }
  };

  /* --------------------------------------------------------------------------
   * Keyboard Navigation
   * ------------------------------------------------------------------------ */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modal is open or typing in input
      if (modalDateStr || isGoalsModalOpen) {
        if (e.key === "Escape") {
          setModalDateStr(null);
          setIsGoalsModalOpen(false);
        }
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
  }, [modalDateStr, isGoalsModalOpen]);

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
      <div className="mb-5 sm:mb-6">
        <h1 className="text-[22px] sm:text-[28px] font-bold text-gray-900 dark:text-white tracking-tight">
          My Diary Calendar
        </h1>
        <p className="text-[13px] sm:text-[14px] text-gray-500 dark:text-gray-400 mt-1">
          Your stories, writing streak and daily goals in one unified space.
        </p>
      </div>

      {/* ── First-time / New User Welcome Banner (Non-blocking, motivational) ── */}
      {!loading && !error && totalUserStories === 0 && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-[#FE5621] flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[14px] sm:text-[15px] font-bold text-gray-900 dark:text-white">
                Your writing journey starts here.
              </h3>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-300 mt-0.5">
                Publish your first story today to activate your streak and hit your daily goal!
              </p>
            </div>
          </div>
          <Link
            to="/write"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-[12.5px] font-semibold transition-all shrink-0 active:scale-95 shadow-xs"
          >
            <Feather className="w-3.5 h-3.5" />
            <span>Write your first story</span>
          </Link>
        </div>
      )}

      {/* ── Section A & B: Writing Streak & Goals Dashboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 mb-6">
        {/* ── Section A: Writing Streak Card (col-span-5) ── */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Header / Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/40 flex items-center justify-center text-[#FE5621]">
                  <Flame className="w-4 h-4 fill-[#FE5621]" />
                </div>
                <div>
                  <h2 className="text-[13.5px] font-bold text-gray-900 dark:text-white">
                    Writing Streak
                  </h2>
                </div>
              </div>

              {/* Dynamic Status Pill */}
              {streak?.isStreakActiveToday ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Active today</span>
                </span>
              ) : (streak?.currentStreak ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 animate-pulse">
                  <Flame className="w-3 h-3 text-[#FE5621]" />
                  <span>Keep flame alive</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400">
                  <span>Start today</span>
                </span>
              )}
            </div>

            {/* Streak Counter Display */}
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {streak?.currentStreak ?? 0}
              </span>
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {(streak?.currentStreak ?? 0) === 1 ? "day streak" : "days streak"}
              </span>
            </div>

            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
              {streak?.isStreakActiveToday
                ? "You've successfully written today! Come back tomorrow to keep it going."
                : (streak?.currentStreak ?? 0) > 0
                ? "Publish a story before midnight in your timezone to maintain your streak."
                : "Publish a story today to ignite your consecutive writing streak."}
            </p>
          </div>

          {/* Sub-stats Row */}
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-[11.5px] sm:text-[12px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5 font-medium">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Longest:{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {streak?.longestStreak ?? 0}{" "}
                  {(streak?.longestStreak ?? 0) === 1 ? "day" : "days"}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
              <span>
                Total active:{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {streak?.totalActiveDays ?? 0}{" "}
                  {(streak?.totalActiveDays ?? 0) === 1 ? "day" : "days"}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* ── Section B: Writing Goals Card (col-span-7) ── */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Header & Adjust Goals CTA */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[13.5px] font-bold text-gray-900 dark:text-white">
                    Writing Goals
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenGoalsModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11.5px] font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-gray-200/60 dark:border-slate-700 active:scale-95"
                title="Configure daily and weekly targets"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Adjust targets</span>
              </button>
            </div>

            {/* Progress Bars Grid (Daily + Weekly) */}
            <div className="space-y-3.5 mt-2">
              {/* 1. Daily Goal Indicator */}
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    Daily Goal
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {goals?.dailyCompleted ?? 0} / {goals?.dailyTarget ?? 1}{" "}
                      <span className="font-normal text-gray-400 dark:text-gray-500">
                        stories
                      </span>
                    </span>
                    {goals?.isDailyGoalMet ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Met
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                        {goals?.dailyRemaining ?? 1} to go
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      goals?.isDailyGoalMet
                        ? "bg-emerald-500"
                        : "bg-[#FE5621]"
                    }`}
                    style={{
                      width: `${goals?.dailyProgressPercent ?? 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* 2. Weekly Goal Indicator */}
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      Weekly Goal
                    </span>
                    <span className="text-[10.5px] text-gray-400 dark:text-gray-500">
                      (Mon – Sun)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {goals?.weeklyCompleted ?? 0} / {goals?.weeklyTarget ?? 5}{" "}
                      <span className="font-normal text-gray-400 dark:text-gray-500">
                        stories
                      </span>
                    </span>
                    {goals?.isWeeklyGoalMet ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Met
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                        {goals?.weeklyRemaining ?? 5} to go
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      goals?.isWeeklyGoalMet
                        ? "bg-emerald-500"
                        : "bg-[#FE5621]"
                    }`}
                    style={{
                      width: `${goals?.weeklyProgressPercent ?? 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
            <span>Only successfully published stories count toward targets.</span>
            {goals?.isDailyGoalMet && goals?.isWeeklyGoalMet && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3 h-3" /> All goals met!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Section C: Calendar Container Card ── */}
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
                              ? "bg-amber-50/50 dark:bg-amber-950/30 border-gray-900/30 dark:border-gray-100/40 shadow-xs ring-1 ring-gray-900/10 dark:ring-white/10"
                              : hasEntries
                              ? "bg-amber-50/25 dark:bg-amber-950/15 border-amber-200/70 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-800"
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
                                ? "bg-[#FE5621] text-white font-bold shadow-xs ring-2 ring-orange-200 dark:ring-orange-900/60"
                                : isSelected
                                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold"
                                : hasEntries
                                ? "text-amber-800 dark:text-amber-300 font-bold"
                                : cell.isCurrentMonth
                                ? "text-gray-800 dark:text-gray-200"
                                : "text-gray-400 dark:text-gray-600"
                            }
                          `}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* Mobile dot & count indicator */}
                        {hasEntries && (
                          <div className="sm:hidden flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FE5621]" />
                            {cell.entries.length > 1 && (
                              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                {cell.entries.length}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Desktop subtle entry count badge */}
                        {hasEntries && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-900/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FE5621]" />
                            <span>{cell.entries.length}</span>
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
                            className="group/item flex items-center gap-1.5 w-full text-left px-2 py-1 rounded-lg bg-gray-50/90 dark:bg-slate-800/90 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 text-gray-700 dark:text-gray-200 transition-colors duration-150 border border-gray-100/60 dark:border-slate-800"
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
                            className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:text-gray-900 dark:hover:text-white px-1.5 py-0.5 rounded-md hover:bg-amber-100/60 dark:hover:bg-slate-800 text-left transition-colors w-fit"
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

      {/* ── Section D: Selected Day Entries Section (Responsive) ── */}
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
                    } published`}
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

      {/* ── Section E: Goal Settings Modal ── */}
      <AnimatePresence>
        {isGoalsModalOpen && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsGoalsModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/40 flex items-center justify-center text-[#FE5621]">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h2
                      id="goal-modal-title"
                      className="text-[15px] font-bold text-gray-900 dark:text-white"
                    >
                      Customize Writing Goals
                    </h2>
                    <p className="text-[11.5px] text-gray-400 dark:text-gray-500">
                      Set daily and weekly publication targets
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGoalsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              {/* Modal Form Content */}
              <form onSubmit={handleSaveGoals} className="p-5 space-y-4">
                {/* Presets Row */}
                <div>
                  <label className="text-[11.5px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">
                    Routine Presets
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDailyGoalInput(1);
                        setWeeklyGoalInput(3);
                      }}
                      className={`px-2.5 py-2 rounded-xl text-[11.5px] font-medium border text-center transition-all ${
                        dailyGoalInput === 1 && weeklyGoalInput === 3
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow-xs"
                          : "bg-gray-50 text-gray-700 dark:bg-slate-800 dark:text-gray-300 border-gray-200/70 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div className="font-bold">Steady</div>
                      <div className="text-[10px] opacity-75">1/day · 3/wk</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDailyGoalInput(1);
                        setWeeklyGoalInput(5);
                      }}
                      className={`px-2.5 py-2 rounded-xl text-[11.5px] font-medium border text-center transition-all ${
                        dailyGoalInput === 1 && weeklyGoalInput === 5
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow-xs"
                          : "bg-gray-50 text-gray-700 dark:bg-slate-800 dark:text-gray-300 border-gray-200/70 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div className="font-bold">Standard</div>
                      <div className="text-[10px] opacity-75">1/day · 5/wk</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDailyGoalInput(2);
                        setWeeklyGoalInput(10);
                      }}
                      className={`px-2.5 py-2 rounded-xl text-[11.5px] font-medium border text-center transition-all ${
                        dailyGoalInput === 2 && weeklyGoalInput === 10
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow-xs"
                          : "bg-gray-50 text-gray-700 dark:bg-slate-800 dark:text-gray-300 border-gray-200/70 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div className="font-bold">Prolific</div>
                      <div className="text-[10px] opacity-75">2/day · 10/wk</div>
                    </button>
                  </div>
                </div>

                {/* Daily Goal Target Field */}
                <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">
                        Daily Target
                      </h4>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Stories to publish each calendar day
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl p-1 border border-gray-200/80 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() =>
                          setDailyGoalInput((prev) => Math.max(1, prev - 1))
                        }
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-bold active:scale-95"
                        aria-label="Decrease daily goal"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={dailyGoalInput}
                        onChange={(e) =>
                          setDailyGoalInput(
                            Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1))
                          )
                        }
                        className="w-10 text-center font-bold text-[13px] text-gray-900 dark:text-white bg-transparent focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDailyGoalInput((prev) => Math.min(50, prev + 1))
                        }
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-bold active:scale-95"
                        aria-label="Increase daily goal"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Weekly Goal Target Field */}
                <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">
                        Weekly Target
                      </h4>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Stories to publish Monday through Sunday
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl p-1 border border-gray-200/80 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() =>
                          setWeeklyGoalInput((prev) => Math.max(1, prev - 1))
                        }
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-bold active:scale-95"
                        aria-label="Decrease weekly goal"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={weeklyGoalInput}
                        onChange={(e) =>
                          setWeeklyGoalInput(
                            Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 1))
                          )
                        }
                        className="w-10 text-center font-bold text-[13px] text-gray-900 dark:text-white bg-transparent focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setWeeklyGoalInput((prev) => Math.min(200, prev + 1))
                        }
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-bold active:scale-95"
                        aria-label="Increase weekly goal"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGoalsModalOpen(false)}
                    disabled={savingGoals}
                    className="px-4 py-2 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingGoals}
                    className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-[12.5px] font-semibold transition-all active:scale-95 shadow-xs disabled:opacity-50"
                  >
                    {savingGoals ? "Saving..." : "Save Targets"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
