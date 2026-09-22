export type ClassValue = string | false | null | undefined;

/** Joins truthy class names. Deliberately not tailwind-merge — this
 * app's components don't need conflict resolution, just concatenation. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
