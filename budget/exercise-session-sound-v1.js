/*
 * Training session sounds, one place for every countdown (5 s start timer, cardio countdown,
 * automatic mode). window.SessionSound:
 *   tick()   a soft, round "tock" for the last seconds (4, 3, 2, 1)
 *   go()     a short two-note chime at 0, when the set actually starts or ends
 *   unlock() resume the audio context from a user gesture
 * Soft sine tones through a low-pass filter (no square waves, no clicks). Music keeps
 * priority: the audio session is "ambient", so a playing playlist is never interrupted.
 */
(function () {
  'use strict';
  if (window.SessionSound) return;

  var ctx = null, bus = null;
  function audio() {
    try {
      if (navigator.audioSession) {
        navigator.audioSession.type = 'ambient';
        if (navigator.audioSession.type !== 'ambient') return null;
      }
    } catch (_) { return null; }
    if (ctx) return ctx;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      ctx = new Ctx({ latencyHint: 'interactive' });
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2600;
      filter.Q.value = 0.4;
      var compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 14;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;
      filter.connect(compressor);
      compressor.connect(ctx.destination);
      bus = filter;
    } catch (_) { ctx = null; bus = null; }
    return ctx;
  }
  function unlock() {
    var c = audio();
    if (!c) return;
    try { if (c.state === 'suspended') { var p = c.resume(); if (p && p.catch) p.catch(function () {}); } } catch (_) {}
  }
  function ready() {
    var c = audio();
    if (!c) return null;
    unlock();
    return c.state === 'running' ? c : null;
  }
  // One voice: sine with a fast attack, a gentle pitch settle and an exponential decay.
  function voice(c, freq, start, peak, decay, partial) {
    var osc = c.createOscillator(), gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.012, start);
    osc.frequency.exponentialRampToValueAtTime(freq, start + 0.04);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    osc.connect(gain);
    gain.connect(bus || c.destination);
    osc.start(start);
    osc.stop(start + decay + 0.03);
    if (partial) voice(c, freq * 2.01, start, peak * 0.18, decay * 0.55, false);
  }
  function tick() {
    var c = ready();
    if (!c) return;
    try { voice(c, 740, c.currentTime + 0.005, 0.20, 0.20, true); } catch (_) {}
  }
  function go() {
    var c = ready();
    if (!c) return;
    try {
      var t = c.currentTime + 0.005;
      voice(c, 880, t, 0.22, 0.32, true);
      voice(c, 1318.5, t + 0.09, 0.20, 0.55, true);
    } catch (_) {}
  }
  ['pointerdown', 'touchend', 'keydown'].forEach(function (type) {
    window.addEventListener(type, unlock, { passive: true, capture: true });
  });
  window.SessionSound = { tick: tick, go: go, unlock: unlock };
})();
