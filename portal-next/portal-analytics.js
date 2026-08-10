(() => {
  const events = window.__RC_PORTAL_EVENTS = window.__RC_PORTAL_EVENTS || [];
  const buildEnvironment = document.body.dataset.buildEnvironment || 'work';
  window.rcPortalTrack = (eventName, parameters = {}) => {
    const safe = {
      event_name: eventName,
      portal_id: 'rc:portal:main',
      build_environment: buildEnvironment,
      occurred_at: new Date().toISOString(),
      ...parameters
    };
    delete safe.query;
    delete safe.search_text;
    delete safe.question_text;
    events.push(safe);
    window.dispatchEvent(new CustomEvent('rc:portal-analytics', { detail: safe }));
  };
})();
