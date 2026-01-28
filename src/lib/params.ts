import { NextResponse } from "next/server";

/**
 * Parse a route parameter as an integer.
 * Returns the number, or a 400 response if invalid.
 */
export function parseIdParam(value: string): number | NextResponse {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1) {
    return NextResponse.json({ error: "Invalid ID parameter" }, { status: 400 });
  }
  return num;
}
