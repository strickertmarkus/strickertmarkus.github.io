from pathlib import Path

old_ver = '20260915-first-paint-v1'
new_ver = '20260915-loader-v2'

for name in ['budget/auth-config.js', 'budget/auth-gate.js', 'budget/exercise.html']:
    p = Path(name)
    s = p.read_text()
    if old_ver not in s:
        raise SystemExit(f'missing cache key in {name}')
    p.write_text(s.replace(old_ver, new_ver))

# One authoritative ordered manifest. Categories are metadata only: execution
# order stays identical to the existing auth-gate sequence.
p = Path('budget/auth-config.js')
s = p.read_text()
anchor = "  var exerciseFastVersion = '20260915-loader-v2';\n"
if anchor not in s:
    raise SystemExit('exerciseFastVersion anchor missing')
manifest = r'''  var exerciseFastVersion = '20260915-loader-v2';

  /* Loader manifest v2. Network fetches may run concurrently, but auth-gate
     still executes these entries in this exact order. `group` documents the
     ownership so later cleanup can move only proven-independent layers. */
  var exerciseAssetManifestV2 = [
    {src:'exercise-points-8-9.js',attr:'data-exercise-points-8-9',group:'dashboard'},
    {src:'exercise-heart-rate-range.js',attr:'data-exercise-heart-rate-range',group:'dashboard'},
    {src:'exercise-session-enhancements.js',attr:'data-exercise-session-enhancements',group:'session-presentation'},
    {src:'exercise-session-runtime-core-v21.js',attr:'data-exercise-session-runtime-core-v21',group:'session-core'},
    {src:'exercise-session-theme-stability.js',attr:'data-exercise-session-theme-stability',group:'session-presentation'},
    {src:'exercise-session-stable-details.js',attr:'data-exercise-session-stable-details',group:'session-presentation'},
    {src:'exercise-reload-recovery.js',attr:'data-exercise-reload-recovery',group:'boot-recovery'},
    {src:'exercise-points-3-6-7.js',attr:'data-exercise-points-3-6-7',group:'dashboard'},
    {src:'exercise-between-routing-v7.js',attr:'data-exercise-between-routing-v7',group:'session-transition'},
    {src:'exercise-between-custom-exercise-v3.js',attr:'data-exercise-between-custom-exercise-v3',group:'session-transition'},
    {src:'exercise-between-sets.js',attr:'data-exercise-between-sets-v2',group:'session-transition'},
    {src:'exercise-hype-polish.js',attr:'data-exercise-hype-polish-passive',group:'session-presentation'},
    {src:'exercise-flow-polish-v2.js',attr:'data-exercise-flow-polish-v2',group:'session-transition'},
    {src:'exercise-builder-row-tools-v3.js',attr:'data-exercise-builder-row-tools-v3',group:'builder'},
    {src:'exercise-builder-style-v5.js',attr:'data-exercise-builder-style-v5',group:'builder'},
    {src:'exercise-log-mobile-fix-v5.js',attr:'data-exercise-log-mobile-fix-v5',group:'training-log'},
    {src:'exercise-session-set-cards-v6.js',attr:'data-exercise-session-set-cards-v6',group:'session-presentation'},
    {src:'exercise-builder-between-preview-v7.js',attr:'data-exercise-builder-between-preview-v7',group:'builder'},
    {src:'exercise-session-shell-v19.js',attr:'data-exercise-session-shell-v19',group:'session-presentation'},
    {src:'exercise-session-ux-v20.js',attr:'data-exercise-session-ux-v20',group:'session-ux'},
    {src:'exercise-motion-v1.js',attr:'data-exercise-motion-v1',group:'motion'},
    {src:'exercise-hype-timer-layout-v1.js',attr:'data-exercise-hype-timer-layout-v1',group:'session-presentation'},
    {src:'exercise-session-stability-v55.js',attr:'data-exercise-session-stability-v55',group:'session-stability'},
    {src:'exercise-custom-transition-atomic-v56.js',attr:'data-exercise-custom-transition-atomic-v56',group:'session-transition'},
    {src:'exercise-pulse-flow-v58.js',attr:'data-exercise-pulse-flow-v58',group:'pulse-presentation'},
    {src:'exercise-pulse-flow-motion-v67.js',attr:'data-exercise-pulse-flow-motion-v67',group:'motion'},
    {src:'exercise-session-typography.js',attr:'data-exercise-session-typography',group:'pulse-presentation'}
  ];
  window.__exerciseAssetManifestV2 = exerciseAssetManifestV2;
  window.__exerciseLoaderMetricsV2 = {
    manifestCount:exerciseAssetManifestV2.length,
    preloadStartedAt:(window.performance && performance.now) ? performance.now() : Date.now(),
    groups:exerciseAssetManifestV2.reduce(function (out,item) {
      out[item.group] = (out[item.group] || 0) + 1;
      return out;
    },{})
  };

  /* Start all network transfers together. Script execution remains ordered in
     auth-gate, so this removes waterfall latency without changing dependencies. */
  exerciseAssetManifestV2.forEach(function (item) {
    var href = item.src + '?v=' + exerciseFastVersion;
    if (document.querySelector('link[rel="preload"][href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = href;
    link.setAttribute('data-exercise-manifest-preload-v2','true');
    document.head.appendChild(link);
  });
'''
s = s.replace(anchor, manifest, 1)
# The legacy heart-rate preload used a different URL than auth-gate and was a
# wasted request. Make the residual compatibility block resolve to the same URL
# so the manifest preload deduplicates it.
s = s.replace("['exercise-heart-rate-range.js','20260913-training-cleanup-timers']", "['exercise-heart-rate-range.js',exerciseFastVersion]", 1)
p.write_text(s)

# Consume the manifest in auth-gate while retaining the literal array as a
# fallback. This leaves execution order/behavior unchanged.
p = Path('budget/auth-gate.js')
s = p.read_text()
needle = "    var exerciseScripts = [\n"
replacement = """    var exerciseManifestV2 = Array.isArray(window.__exerciseAssetManifestV2) && window.__exerciseAssetManifestV2.length
      ? window.__exerciseAssetManifestV2
      : null;
    var exerciseScripts = exerciseManifestV2
      ? exerciseManifestV2.map(function (item) { return [item.src,item.attr]; })
      : [
"""
if needle not in s:
    raise SystemExit('auth-gate exerciseScripts anchor missing')
s = s.replace(needle, replacement, 1)

old_done = """      if (index >= exerciseScripts.length) {
        window.__exerciseBundleReadyV1 = true;
"""
new_done = """      if (index >= exerciseScripts.length) {
        if (window.__exerciseLoaderMetricsV2) {
          window.__exerciseLoaderMetricsV2.bundleReadyAt = (window.performance && performance.now) ? performance.now() : Date.now();
          window.__exerciseLoaderMetricsV2.bundleMs = Math.round(window.__exerciseLoaderMetricsV2.bundleReadyAt - window.__exerciseLoaderMetricsV2.preloadStartedAt);
          window.__exerciseLoaderMetricsV2.executionCount = exerciseScripts.length;
        }
        window.__exerciseBundleReadyV1 = true;
"""
if old_done not in s:
    raise SystemExit('auth-gate bundle completion anchor missing')
s = s.replace(old_done, new_done, 1)
p.write_text(s)
