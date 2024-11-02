import type { GmailMessage, ParsedEmail } from './types';

export function extractEmailContent(message: GmailMessage): ParsedEmail {
  const headers = message.payload?.headers || [];
  const subject = headers.find(h => h?.name?.toLowerCase() === 'subject')?.value || '';
  const from = headers.find(h => h?.name?.toLowerCase() === 'from')?.value || '';
  const to = headers.find(h => h?.name?.toLowerCase() === 'to')?.value || '';
  const date = headers.find(h => h?.name?.toLowerCase() === 'date')?.value || '';

  let body = '';
  
  function getBody(part: any): string {
    if (part?.mimeType === 'text/plain' && part.body?.data) {
      return Buffer.from(part.body.data, 'base64').toString();
    }
    if (part?.parts) {
      return part.parts.map(getBody).join('\n');
    }
    return '';
  }

  if (message.payload?.mimeType === 'text/plain') {
    body = message.payload.body?.data 
      ? Buffer.from(message.payload.body.data, 'base64').toString()
      : '';
  } else if (message.payload?.parts) {
    body = getBody(message.payload);
  }

  return {
    subject,
    from,
    to,
    body,
    date
  };
}

export function parseEmailAddress(email: string): {
  name?: string;
  email: string;
} {
  const match = email.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
  if (!match) {
    return { email };
  }
  return {
    name: match[1],
    email: match[2]
  };
}