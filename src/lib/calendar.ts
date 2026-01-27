export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  attendees?: { email: string; displayName?: string }[];
}

export interface ParsedCalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  attendees: string[];
}

export async function fetchUpcomingEvents(
  accessToken: string,
  maxResults = 50
): Promise<ParsedCalendarEvent[]> {
  // Get events from now to 30 days in the future
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const timeMin = now.toISOString();
  const timeMax = thirtyDaysLater.toISOString();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `maxResults=${maxResults}&` +
      `timeMin=${encodeURIComponent(timeMin)}&` +
      `timeMax=${encodeURIComponent(timeMax)}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Calendar API error: ${response.status}`);
  }

  const data = await response.json();
  const events: CalendarEvent[] = data.items || [];

  // Parse events into clean format
  return events.map((event) => ({
    id: event.id,
    title: event.summary || "(No title)",
    startTime: event.start.dateTime || event.start.date || "",
    endTime: event.end.dateTime || event.end.date || "",
    location: event.location || "",
    description: event.description || "",
    attendees: (event.attendees || []).map(
      (a) => a.displayName || a.email
    ),
  }));
}
