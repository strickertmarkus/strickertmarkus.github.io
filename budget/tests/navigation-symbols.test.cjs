const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const pages = ["home.html","budget.html","budget_maja.html","analytics.html","analytics_maja.html","familjebudget.html","data.html","calendar.html","shopping.html","mila.html","melker.html"];
const symbols = {"home.html":"⌂","budget.html":"¤","analytics.html":"⌁","budget_maja.html":"¤","analytics_maja.html":"⌁","familjebudget.html":"◇","data.html":"⚙","calendar.html":"□","exercise.html":"◆","shopping.html":"＋","mila.html":"○","melker.html":"○","shopping-minimal.html":"▤"};
const training = fs.readFileSync(path.join(root,'exercise-motion-v1.js'),'utf8');

test('all family-app nav symbols stay aligned with canonical Training menu', () => {
  for (const [href, symbol] of Object.entries(symbols)) {
    if (href === 'shopping-minimal.html') continue;
    assert.ok(training.includes("navLink('" + href + "'" + (href === 'exercise.html' ? ' + profile' : '') + ",'" + symbol + "'"), href);
  }
  for (const name of pages) {
    const html = fs.readFileSync(path.join(root,name),'utf8');
    assert.match(html, /id="nav-menu"/, name);
    const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>\s*<span class="nav-icon"([^>]*)>([^<]*)<\/span>/g)];
    assert.equal(links.length, name === 'shopping.html' ? 14 : 12, name + ' link count');
    for (const [,href,attrs,icon] of links) {
      assert.equal(icon, symbols[href], name + ': ' + href);
      assert.match(attrs, /aria-hidden="true"/, name + ': ' + href);
    }
  }
});
