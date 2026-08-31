from pathlib import Path

home = Path('budget/home.html')
s = home.read_text()

# Messaging SDK alongside the already used compat Firebase SDKs.
db_sdk = '<script src="https://www.gstatic.com/firebasejs/11.0.2/firebase-database-compat.js"></script>'
msg_sdk = '<script src="https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js"></script>'
if msg_sdk not in s:
    if s.count(db_sdk) != 1:
        raise SystemExit(f'home database SDK guard failed: {s.count(db_sdk)}')
    s = s.replace(db_sdk, db_sdk + '\n  ' + msg_sdk, 1)

# PWA metadata required for iPhone Home Screen web push.
favicon = '<link rel="icon" href="/favicon.ico" sizes="any">'
pwa = '''<link rel="manifest" href="manifest.webmanifest?v=20260831-push-v1">
  <meta name="theme-color" content="#181F2E">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Familjen">'''
if 'manifest.webmanifest?v=20260831-push-v1' not in s:
    if s.count(favicon) != 1:
        raise SystemExit(f'home favicon guard failed: {s.count(favicon)}')
    s = s.replace(favicon, favicon + '\n  ' + pwa, 1)

# Persist reminder choice as part of the existing cal_events event object.
repeat_line = "    repeatUntil: document.getElementById('ev-repeat-until').value||'',\n"
reminder_line = "    reminderMinutes: (document.getElementById('ev-reminder') && document.getElementById('ev-reminder').value !== '') ? Number(document.getElementById('ev-reminder').value) : null,\n"
if reminder_line not in s:
    if s.count(repeat_line) != 1:
        raise SystemExit(f'home repeatUntil guard failed: {s.count(repeat_line)}')
    s = s.replace(repeat_line, repeat_line + reminder_line, 1)

push_script = '<script src="push-notifications.js?v=20260831-push-v1"></script>'
if push_script not in s:
    if s.count('</body>') != 1:
        raise SystemExit(f'home body guard failed: {s.count("</body>")}')
    s = s.replace('</body>', push_script + '\n</body>', 1)

home.write_text(s)

# calendar.html does not expose reminder controls yet, but editing an event there
# must preserve a reminder that was configured on Home.
calendar = Path('budget/calendar.html')
c = calendar.read_text()
calendar_marker = "    repeatUntil: document.getElementById('ev-repeat-until').value||'',\n"
calendar_preserve = "    reminderMinutes: editId ? ((events.find(function(e){ return e.id===editId; }) || {}).reminderMinutes ?? null) : null,\n"
if calendar_preserve not in c:
    if c.count(calendar_marker) != 1:
        raise SystemExit(f'calendar repeatUntil guard failed: {c.count(calendar_marker)}')
    c = c.replace(calendar_marker, calendar_marker + calendar_preserve, 1)
calendar.write_text(c)
