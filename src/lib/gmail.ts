export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
    body?: { data?: string };
    parts?: { mimeType: string; body?: { data?: string } }[];
  };
}

export interface EmailData {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
}

export async function fetchRecentEmails(accessToken: string, maxResults = 50): Promise<EmailData[]> {
  // Search for job-related emails from the last 7 days
  const query = encodeURIComponent(
    "newer_than:7d (application OR interview OR position OR candidate OR hiring OR recruiter OR offer OR unfortunately OR regret)"
  );

  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${query}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!listResponse.ok) {
    throw new Error(`Gmail API error: ${listResponse.status}`);
  }

  const listData = await listResponse.json();
  const messages: { id: string }[] = listData.messages || [];

  // Fetch full message details
  const emails: EmailData[] = [];

  for (const msg of messages.slice(0, 20)) {
    const msgResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!msgResponse.ok) continue;

    const msgData: GmailMessage = await msgResponse.json();

    const headers = msgData.payload.headers;
    const from = headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
    const subject = headers.find((h) => h.name.toLowerCase() === "subject")?.value || "";
    const date = headers.find((h) => h.name.toLowerCase() === "date")?.value || "";

    // Extract body
    let body = "";
    if (msgData.payload.body?.data) {
      body = Buffer.from(msgData.payload.body.data, "base64").toString("utf-8");
    } else if (msgData.payload.parts) {
      const textPart = msgData.payload.parts.find((p) => p.mimeType === "text/plain");
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    }

    emails.push({
      id: msgData.id,
      from,
      subject,
      snippet: msgData.snippet,
      body: body.slice(0, 2000), // Limit body size
      date,
    });
  }

  return emails;
}
