/* Home reads the planner's records directly; no duplicate travel data. */
(function () {
  'use strict';
  const S = window.TravelStore, M = window.TravelModel;
  const root = document.getElementById('home-travel-cards');
  if (!root || !S || !M) return;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = (trip, tab='overview') => 'travel.html?trip=' + encodeURIComponent(trip.id) + '&tab=' + tab;
  function render() {
    const rows = S.list().filter(x => !x.deleted);
    const order = {Pågående:0,Kommande:1,Tidigare:2};
    const trips = rows.filter(x => x.type === 'trip' && !x.archived).sort((a,b) => {
      const state = (order[M.tripState(a)] ?? 3) - (order[M.tripState(b)] ?? 3);
      if (state) return state;
      return M.tripState(a) === 'Tidigare' ? (b.departure || '').localeCompare(a.departure || '') : (a.departure || '9999').localeCompare(b.departure || '9999');
    });
    if (!trips.length) {
      root.innerHTML = '<p class="home-travel-empty">Inga aktiva resor ännu. Öppna reseplaneraren för att skapa en resa eller visa arkivet.</p>';
      return;
    }
    root.innerHTML = trips.map(t => {
      const children = rows.filter(x => x.tripId === t.id);
      const packing = children.filter(x => x.type === 'packing' && !x.isHeading);
      const tasks = children.filter(x => x.type === 'task' && x.taskKind !== 'unsorted' && !x.done);
      const today = M.today(t.timezone), time = M.timeIn(t.timezone);
      const next = children.filter(x => x.type === 'activity' && x.date && (x.date > today || (x.date === today && (!x.time || x.time >= time)))).sort(M.activitySort)[0];
      const countdown = S.countdown(t.departureISO || t.departure,t.endDate,Date.now(),t.timezone);
      const remaining = countdown.parts.length ? countdown.parts[0] + ' dagar · ' + countdown.parts[1] + ' tim' : countdown.label;
      return '<article class="home-trip-card"><div class="home-trip-kicker">' + esc(t.destination || 'ER RESA') + ' · ' + esc(M.tripState(t)) + '</div>'
        + '<h3><a href="' + esc(url(t)) + '">' + esc(t.title) + '</a></h3>'
        + '<p class="home-trip-dates">' + esc((t.departure || '').slice(0,10) || 'Avresa ej vald') + (t.endDate ? ' — ' + esc(t.endDate) : '') + '</p>'
        + '<div class="home-trip-countdown">' + esc(remaining) + (countdown.parts.length ? '<small>Till avresa</small>' : '') + '</div>'
        + '<div class="home-trip-stats"><a href="' + esc(url(t,'packing')) + '"><strong>' + packing.filter(x => x.done).length + ' / ' + packing.length + '</strong>Packat</a>'
        + '<a href="' + esc(url(t,'task')) + '"><strong>' + tasks.length + '</strong>Uppgifter kvar</a></div>'
        + (next ? '<div class="home-trip-next"><span>Nästa aktivitet · ' + esc(next.date) + (next.time ? ' · ' + esc(next.time) : '') + '</span><strong>' + esc(next.title) + '</strong></div>' : '')
        + '<div class="home-trip-links"><a href="' + esc(url(t,'activity')) + '">Schema</a><a href="' + esc(url(t,'expense')) + '">Resebudget</a><a href="' + esc(url(t)) + '">Öppna resa ↗</a></div></article>';
    }).join('');
  }
  window.renderHomeTravel = render;
  S.subscribe(render);
  setInterval(() => { if (!document.hidden && document.body.dataset.homeSection === 'travel') render(); },60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
})();
