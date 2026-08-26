'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../lib/supabase-browser';
import { Brand } from '../../components/brand';

const supabase = createSupabaseBrowserClient();

type ExtensionResponse = { ok?: boolean };
type WebChrome = {
  runtime?: {
    lastError?: { message?: string };
    sendMessage: (extensionId: string, message: unknown, callback: (response?: ExtensionResponse) => void) => void;
  };
};

function getChrome() {
  return (window as unknown as { chrome?: WebChrome }).chrome;
}

function ExtensionConnectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const extensionId = searchParams.get('extensionId');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('Checking your session…');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        const next = `/extension/connect?extensionId=${encodeURIComponent(extensionId ?? '')}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      setReady(true);
      setMessage('Your RecruitMerge account is ready to connect.');
    });
  }, [extensionId, router]);

  async function connect() {
    const browserChrome = getChrome();
    if (!extensionId || !browserChrome?.runtime?.sendMessage) {
      setMessage('Open this page from the RecruitMerge Chrome extension and try again.');
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setMessage('Your session expired. Sign in again and retry.');
      return;
    }

    browserChrome.runtime.sendMessage(extensionId, {
      type: 'RECRUITMERGE_CONNECT',
      session: { accessToken: data.session.access_token, refreshToken: data.session.refresh_token },
    }, (response) => {
      if (getChrome()?.runtime?.lastError || !response?.ok) {
        setMessage('The extension could not be reached. Make sure it is installed and retry.');
        return;
      }
      setMessage('Connected. You can close this tab and start saving candidates.');
      setReady(false);
    });
  }

  return <main className="auth-page"><div className="auth-ambient auth-ambient-one" /><div className="auth-ambient auth-ambient-two" /><div className="auth-card"><Brand /><div className="auth-icon extension-icon" aria-hidden="true">⌁</div><p className="eyebrow">Chrome extension</p><h1>Connect capture to your workspace.</h1><p className="muted">Profiles you save in Chrome will flow securely into your private RecruitMerge candidate list.</p><button className="button primary full" disabled={!ready || !extensionId} onClick={connect}>Connect extension <span aria-hidden="true">→</span></button><p className="form-message" role="status">{message}</p><p className="auth-footnote">You can disconnect or reconnect at any time.</p></div></main>;
}

export default function ExtensionConnectPage() {
  return <Suspense fallback={<main className="auth-page"><p className="muted">Loading connection…</p></main>}><ExtensionConnectForm /></Suspense>;
}
