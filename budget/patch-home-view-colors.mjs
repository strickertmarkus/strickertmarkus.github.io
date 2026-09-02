import fs from 'node:fs';

const themePath = 'budget/home-calendar-theme-v12.js';
let theme = fs.readFileSync(themePath, 'utf8');

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`${label} not found`);
  return source.replace(from, to);
}

theme = replaceOnce(theme,
`        --home-view-accent:#FB923C;
        --home-view-accent-soft:#FDBA74;
        --home-view-rgb:251,146,60;`,
`        --home-view-accent:#60A5FA;
        --home-view-accent-soft:#93C5FD;
        --home-view-rgb:96,165,250;`,
'default theme');

theme = replaceOnce(theme,
`      html.home-finance-orange-v3[data-home-calendar-view="day"],
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="day"] {
        --home-view-accent:#60A5FA;
        --home-view-accent-soft:#93C5FD;
        --home-view-rgb:96,165,250;
      }`,
`      html.home-finance-orange-v3[data-home-calendar-view="day"],
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="day"] {
        --home-view-accent:#FB923C;
        --home-view-accent-soft:#FDBA74;
        --home-view-rgb:251,146,60;
      }`,
'day theme');

theme = replaceOnce(theme,
`      html.home-finance-orange-v3[data-home-calendar-view="month"],
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="month"] {
        --home-view-accent:#FB923C;
        --home-view-accent-soft:#FDBA74;
        --home-view-rgb:251,146,60;
      }`,
`      html.home-finance-orange-v3[data-home-calendar-view="month"],
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="month"] {
        --home-view-accent:#60A5FA;
        --home-view-accent-soft:#93C5FD;
        --home-view-rgb:96,165,250;
      }`,
'month theme');

const genericTime = `      html.home-finance-orange-v3 body.home-calendar-polish-v5 .header-time {
        color:var(--home-view-accent) !important;
        text-shadow:0 2px 10px rgba(var(--home-view-rgb),.20) !important;
      }`;
const monthTime = `${genericTime}
      html.home-finance-orange-v3[data-home-calendar-view="month"] body.home-calendar-polish-v5 .header-time,
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="month"] .header-time {
        color:#FB923C !important;
        text-shadow:0 2px 10px rgba(251,146,60,.22) !important;
      }`;
theme = replaceOnce(theme, genericTime, monthTime, 'header time');

theme = theme.split('\n').map(line => {
  if (line.includes('data-home-calendar-view="day"') && line.includes('input[data-picker=')) {
    return line.replaceAll('%2360A5FA', '%23FB923C');
  }
  if (line.includes('data-home-calendar-view="month"') && line.includes('input[data-picker=')) {
    return line.replaceAll('%23FB923C', '%2360A5FA');
  }
  return line;
}).join('\n');
fs.writeFileSync(themePath, theme);

const navPath = 'budget/nav-menu-motion.js';
let nav = fs.readFileSync(navPath, 'utf8');
nav = replaceOnce(
  nav,
  'home-calendar-theme-v12.js?v=20260902-home-calendar-theme-v12',
  'home-calendar-theme-v12.js?v=20260902-home-calendar-theme-v13-view-colors',
  'theme cache bust'
);
fs.writeFileSync(navPath, nav);

console.log('Home view colors patched.');
