(function () {
  'use strict';

  // Swedish public holidays (SFS 1989:253) and selected traditions.
  // Calculated locally: never stored among family events or synced to Firebase.
  var STORAGE_KEY = 'home-show-swedish-holidays-v1';
  var enabled = true;
  try { enabled = localStorage.getItem(STORAGE_KEY) !== 'false'; } catch (_) {}
  var years = Object.create(null);

  function dateISO(year, month, day) {
    return String(year).padStart(4, '0') + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  function fromUTC(date) {
    return dateISO(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  function offset(iso, days) {
    var parts = iso.split('-').map(Number);
    return fromUTC(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days)));
  }

  // Gregorian Easter Sunday (Meeus/Jones/Butcher algorithm).
  function easter(year) {
    var a = year % 19;
    var b = Math.floor(year / 100);
    var c = year % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k + 7) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var n = h + l - 7 * m + 114;
    return dateISO(year, Math.floor(n / 31), (n % 31) + 1);
  }

  function weekdayBetween(year, month, startDay, endDay, weekday) {
    for (var d = startDay; d <= endDay; d++) {
      if (new Date(Date.UTC(year, month - 1, d)).getUTCDay() === weekday) return dateISO(year, month, d);
    }
    return '';
  }

  function makeYear(year) {
    var days = Object.create(null);
    function add(date, name, type, detail) {
      if (!days[date]) days[date] = [];
      days[date].push({ name:name, type:type, detail:detail || (type === 'official' ? 'Allmän helgdag' : 'Svensk tradition / temadag') });
    }
    function red(month, day, name) { add(dateISO(year, month, day), name, 'official'); }
    function tradition(month, day, name, detail) { add(dateISO(year, month, day), name, 'tradition', detail); }

    red(1, 1, 'Nyårsdagen');
    red(1, 6, 'Trettondedag jul');
    red(5, 1, 'Första maj');
    red(6, 6, 'Sveriges nationaldag');
    red(12, 25, 'Juldagen');
    red(12, 26, 'Annandag jul');

    var pascha = easter(year);
    add(offset(pascha, -3), 'Skärtorsdagen', 'tradition');
    add(offset(pascha, -2), 'Långfredagen', 'official');
    add(offset(pascha, -1), 'Påskafton', 'tradition');
    add(pascha, 'Påskdagen', 'official');
    add(offset(pascha, 1), 'Annandag påsk', 'official');
    add(offset(pascha, 39), 'Kristi himmelsfärdsdag', 'official');
    add(offset(pascha, 48), 'Pingstafton', 'tradition');
    add(offset(pascha, 49), 'Pingstdagen', 'official');
    add(offset(pascha, -47), 'Fettisdagen', 'tradition');

    var midsummer = weekdayBetween(year, 6, 20, 26, 6);
    add(offset(midsummer, -1), 'Midsommarafton', 'tradition', 'Högtidsafton, inte allmän helgdag');
    add(midsummer, 'Midsommardagen', 'official');
    var allSaints = weekdayBetween(year, 10, 31, 37, 6);
    // Oct 31-Nov 6 is a seven-day range crossing the month boundary.
    if (!allSaints) {
      for (var novemberDay = 1; novemberDay <= 6; novemberDay++) {
        if (new Date(Date.UTC(year, 10, novemberDay)).getUTCDay() === 6) {
          allSaints = dateISO(year, 11, novemberDay);
          break;
        }
      }
    }
    add(allSaints, 'Alla helgons dag', 'official');

    tradition(2, 14, 'Alla hjärtans dag');
    tradition(3, 8, 'Internationella kvinnodagen', 'Temadag');
    tradition(3, 25, 'Våffeldagen');
    tradition(4, 30, 'Valborgsmässoafton');
    tradition(10, 4, 'Kanelbullens dag');
    tradition(10, 31, 'Halloween');
    tradition(12, 13, 'Lucia');
    tradition(12, 24, 'Julafton', 'Högtidsafton, inte allmän helgdag');
    tradition(12, 31, 'Nyårsafton', 'Högtidsafton, inte allmän helgdag');

    // Last Sunday in May; second Sunday in November.
    for (var mothers = 31; mothers >= 25; mothers--) {
      if (new Date(Date.UTC(year, 4, mothers)).getUTCDay() === 0) {
        add(dateISO(year, 5, mothers), 'Mors dag', 'tradition');
        break;
      }
    }
    var sundays = 0;
    for (var fathers = 1; fathers <= 14; fathers++) {
      if (new Date(Date.UTC(year, 10, fathers)).getUTCDay() === 0 && ++sundays === 2) {
        add(dateISO(year, 11, fathers), 'Fars dag', 'tradition');
        break;
      }
    }
    // Advent Sundays: fourth is the last Sunday before Dec 25.
    var adventFourth = new Date(Date.UTC(year, 11, 24));
    while (adventFourth.getUTCDay() !== 0) adventFourth.setUTCDate(adventFourth.getUTCDate() - 1);
    for (var advent = 1; advent <= 4; advent++) {
      add(fromUTC(new Date(adventFourth.getTime() - (4 - advent) * 7 * 86400000)),
        ['Första advent', 'Andra advent', 'Tredje advent', 'Fjärde advent'][advent - 1], 'tradition');
    }
    return days;
  }

  function get(iso) {
    if (!enabled || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return [];
    var year = Number(iso.slice(0, 4));
    if (!years[year]) years[year] = makeYear(year);
    return years[year][iso] || [];
  }

  function setEnabled(value) {
    enabled = !!value;
    try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch (_) {}
    window.dispatchEvent(new Event('swedish-holidays-change'));
  }

  window.SwedishHolidays = {
    get: get,
    isEnabled: function () { return enabled; },
    setEnabled: setEnabled
  };
})();
