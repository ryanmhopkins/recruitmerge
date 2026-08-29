import { NextResponse } from 'next/server';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim().slice(0, 100);
    const email = String(body.email || '').trim().slice(0, 200);
    const subject = String(body.subject || '').trim().slice(0, 160);
    const message = String(body.message || '').trim().slice(0, 4000);
    const company = String(body.company || '').trim();

    if (company) return NextResponse.json({ sent: true });
    if (!name || !emailPattern.test(email) || !subject || !message) {
      return NextResponse.json({ error: 'Please complete every field with a valid email address.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Contact email is not configured yet.' }, { status: 503 });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RecruitMerge Support <support@recruitmerge.com>',
        to: [process.env.SUPPORT_EMAIL || 'rmhxai@gmail.com'],
        reply_to: email,
        subject: `[RecruitMerge] ${subject}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:620px;color:#1d2a2a"><h2 style="margin-bottom:20px">New RecruitMerge message</h2><p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><div style="margin-top:24px;padding:20px;border-radius:12px;background:#f1f4f1;white-space:pre-wrap">${escapeHtml(message)}</div></div>`,
      }),
    });

    if (!response.ok) return NextResponse.json({ error: 'Unable to send your message right now.' }, { status: 502 });
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: 'Unable to send your message right now.' }, { status: 500 });
  }
}
