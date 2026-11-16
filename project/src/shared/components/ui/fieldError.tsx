import React from 'react';

/**
 * Shared inline form-validation primitives.
 *
 * Usage: pass `error={fieldErrors.name}` to a field component (or append
 * FIELD_ERROR_CLASSES to any input/select/textarea className) and render
 * <FieldErrorMessage message={fieldErrors.name} /> beneath it.
 */

/**
 * Classes appended to a control's className while it has a validation error.
 * Uses Tailwind important modifiers so the error state wins over the
 * tone/brand border and focus colours regardless of stylesheet order.
 */
export const FIELD_ERROR_CLASSES =
  '!border-red-400 focus:!border-red-500 focus:!ring-red-100 dark:!border-red-500';

export function FieldErrorMessage({
  message,
  id,
}: {
  message?: string | null;
  id?: string;
}) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}
