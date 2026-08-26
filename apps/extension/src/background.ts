type RecruitMergeSession = {
  accessToken: string;
  refreshToken: string;
};

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'RECRUITMERGE_CONNECT' || !message.session?.accessToken || !message.session?.refreshToken) {
    sendResponse({ ok: false });
    return;
  }

  const session: RecruitMergeSession = {
    accessToken: message.session.accessToken,
    refreshToken: message.session.refreshToken,
  };

  chrome.storage.local.set({ recruitmergeSession: session }).then(() => sendResponse({ ok: true }));
  return true;
});
