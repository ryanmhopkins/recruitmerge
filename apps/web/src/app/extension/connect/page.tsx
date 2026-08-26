'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../lib/supabase-browser';

const supabase = createSupabaseBrowserClient();

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
    if (!extensionId || !window.chrome?.runtime?.sendMessage) {
      setMessage('Open this page from the RecruitMerge Chrome extension and try again.');
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setMessage('Your session expired. Sign in again and retry.');
      return;
    }

    window.chrome.runtime.sendMessage(extensionId, {
      type: 'RECRUITMERGE_CONNECT',
      session: { accessToken: data.session.access_token, refreshToken: data.session.refresh_token },
    }, (response) => {
      if (window.chrome?.runtime?.lastError || !response?.ok) {
        setMessage('The extension could not be reached. Make sure it is installed and retry.');
        return;
      }
      setMessage('Connected. You can close this tab and start saving candidates.');
      setReady(false);
    });
  }

  return <main className="auth-page"><div className="auth-card card"><Link className="brand" href="/">RecruitMerge</Link><p className="eyebrow">Chrome extension</p><h1>Connect your candidate capture</h1><p className="muted">This securely links the extension to your RecruitMerge account so candidates appear in your dashboard.</p><button className="button primary full" disabled={!ready || !extensionId} onClick={connect}>Connect extension</button><p className="form-message" role="status">{message}</p></div></main>;
}

export default function ExtensionConnectPage() {
  return <Suspense fallback={<main className="auth-page"><p className="muted">Loading connection…</p></main>}><ExtensionConnectForm /></Suspense>;
}
