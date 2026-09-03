import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

export interface ErrorCardProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Backwards compatibility alias for onAction */
  onRetry?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'card' | 'centered' | 'banner';
  className?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title,
  message = 'Could not load this content. Please try again.',
  icon,
  actionLabel,
  onAction,
  onRetry,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'card',
  className = '',
}) => {
  const primaryHandler = onAction || onRetry;
  const primaryLabel = actionLabel || (primaryHandler ? 'Try again' : undefined);

  // ── 1. Banner Variant (compact inline banner for chat, search, forms) ──
  if (variant === 'banner') {
    return (
      <div
        role="alert"
        className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon ?? <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" strokeWidth={2} />}
          <div className="min-w-0">
            {title && (
              <p className="text-xs font-bold text-rose-950 truncate leading-tight mb-0.5">
                {title}
              </p>
            )}
            <p className="text-xs sm:text-[13px] font-medium text-rose-700 leading-tight truncate">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {primaryHandler && (
            <button
              type="button"
              onClick={primaryHandler}
              className="inline-flex items-center gap-1 text-[11.5px] sm:text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-md transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{primaryLabel}</span>
            </button>
          )}

          {onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              aria-label={secondaryActionLabel || 'Dismiss error'}
              className="text-rose-400 hover:text-rose-700 p-1 transition-colors"
            >
              {secondaryActionLabel ? (
                <span className="text-[11.5px] font-medium">{secondaryActionLabel}</span>
              ) : (
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 2. Centered Variant (full-page or centered card for Profile, not-found, etc.) ──
  if (variant === 'centered') {
    const displayTitle = title || 'Failed to load';
    return (
      <div
        role="alert"
        className={`bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 text-center ${className}`}
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500">
          {icon ?? <AlertCircle className="w-6 h-6" strokeWidth={1.8} />}
        </div>

        <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">
          {displayTitle}
        </h3>

        {message && (
          <p className="text-[13px] text-gray-500 mb-6 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center items-center">
          {onSecondaryAction && secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-5 py-2.5 rounded-full text-[13px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}

          {primaryHandler && primaryLabel && (
            <button
              type="button"
              onClick={primaryHandler}
              className="px-5 py-2.5 rounded-full text-[13px] font-bold bg-[#D9F26B] text-slate-950 hover:bg-[#c9e35b] transition-colors shadow-sm"
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 3. Default Card Variant (for content sections like Stories feed, StoryRead, etc.) ──
  const displayTitle = title || 'Failed to load';
  return (
    <div
      role="alert"
      className={`w-full rounded-2xl bg-[#EEF7FF] p-5 sm:p-6 border border-blue-100 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {icon && <div className="mt-0.5 shrink-0 text-slate-700">{icon}</div>}
          <div>
            <h3 className="text-base font-bold text-slate-950">
              {displayTitle}
            </h3>
            {message && (
              <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
          {onSecondaryAction && secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="rounded-full bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}

          {primaryHandler && primaryLabel && (
            <button
              type="button"
              onClick={primaryHandler}
              className="rounded-full bg-[#D9F26B] px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-[#c9e35b] transition-colors shadow-sm"
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};