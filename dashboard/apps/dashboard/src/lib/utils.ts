import { cn } from "@vision_dashboard/ui/cn";

// Re-export cn for convenience
export { cn };

/* --------------------------------------------------------------------------
 *  DATE/TIME FORMAT HELPERS
 * --------------------------------------------------------------------------*/

// Format: "2025-11-25"
export function formatDateOnly(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Format: "12:45 PM"
export function formatTimeOnly(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format timestamp with custom pattern (supports HH:mm, h a, etc)
export function formatTimestamp(
  isoString: string,
  pattern: "HH:mm" | "h a" | string = "HH:mm",
): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "-";

  // Basic formatter implementation:
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");

  if (pattern === "HH:mm") {
    return `${hours}:${minutes}`;
  }

  if (pattern === "h a") {
    const hour12 = ((d.getHours() + 11) % 12) + 1;
    const ampm = d.getHours() >= 12 ? "PM" : "AM";
    return `${hour12} ${ampm}`;
  }

  return d.toLocaleString();
}

// Convert JS Date to ISO string in UTC (no timezone offset)
export function toUTCISOString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.000Z`;
}
