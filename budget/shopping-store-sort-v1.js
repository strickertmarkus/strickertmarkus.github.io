/* Sort the shopping list in the order you walk through the shop.
   Every item is matched to a department with a Swedish keyword list; each shop
   has its own order of departments. One button sorts every shop section that
   has an order (Maxi for now). The core undo (window.saveState/undo) takes it back.
   Owner of: departments, keywords, shop orders and the sort button. */
(function () {
  'use strict';
  var path = location.pathname.toLowerCase();
  if (!/\/shopping\.html$/.test(path)) return;

  /* Departments and the words that point to them. Compounds are matched anywhere
     in the item, and a word at the end of a compound weighs more (in Swedish the
     last part says what it is: "jordgubbssylt" is jam, "vispgrädde" is cream). */
  var DEPARTMENTS = {
    bars: ['proteinbar', 'energibar', 'müslibar', 'mustibar', 'nötbar', 'bars', 'barebells', 'njie', 'nakd'],
    hygien: ['tandkräm', 'tandborste', 'tandtråd', 'munskölj', 'schampo', 'shampoo', 'balsam', 'tvål', 'duschcreme', 'duschkräm', 'deodorant', 'deo', 'rakhyvel', 'rakblad', 'raklödder', 'bomull', 'tops', 'plåster', 'tampong', 'binda', 'bindor', 'trosskydd', 'hudkräm', 'handkräm', 'ansiktskräm', 'solkräm', 'läppbalsam', 'hårspray', 'hårgelé', 'hårvax', 'smink', 'mascara', 'nagellack', 'intimtvål', 'värktablett', 'alvedon', 'ipren'],
    blommor: ['blommor', 'blomma', 'bukett', 'tulpan', 'rosor', 'krukväxt', 'planteringsjord', 'snittblommor'],
    barn: ['blöjor', 'blöja', 'välling', 'barnmat', 'ersättning', 'klämpåse', 'klämpåsar', 'våtservett', 'våtservetter', 'nappflaska', 'napp', 'barngröt', 'semper', 'hipp', 'barnkräm', 'barnschampo'],
    frukt: ['äpple', 'äpplen', 'päron', 'banan', 'bananer', 'apelsin', 'citron', 'lime', 'clementin', 'mandarin', 'vindruvor', 'druvor', 'melon', 'kiwi', 'mango', 'ananas', 'avokado', 'tomat', 'tomater', 'körsbärstomat', 'gurka', 'paprika', 'sallad', 'isberg', 'rucola', 'spenat', 'grönkål', 'vitkål', 'rödkål', 'savojkål', 'kål', 'broccoli', 'blomkål', 'morot', 'morötter', 'lök', 'gul lök', 'rödlök', 'purjolök', 'salladslök', 'schalottenlök', 'vitlök', 'ingefära', 'potatis', 'sötpotatis', 'svamp', 'champinjon', 'champinjoner', 'zucchini', 'squash', 'aubergine', 'selleri', 'rädisor', 'rödbetor', 'rödbeta', 'palsternacka', 'pumpa', 'persilja', 'dill', 'koriander', 'gräslök', 'basilika', 'mynta', 'jordgubbar', 'jordgubb', 'blåbär', 'hallon', 'chili', 'sockerärtor', 'groddar', 'majskolv', 'fänkål', 'sparris', 'kålrot', 'granatäpple', 'nektarin', 'persika', 'plommon', 'grapefrukt', 'frukt', 'grönsaker'],
    kott: ['köttfärs', 'nötfärs', 'blandfärs', 'fläskfärs', 'kycklingfärs', 'färs', 'kyckling', 'kycklingfilé', 'kycklinglår', 'lårfilé', 'fläskfilé', 'fläskkarré', 'karré', 'kotlett', 'bacon', 'korv', 'falukorv', 'prinskorv', 'chorizo', 'grillkorv', 'wienerkorv', 'köttbullar', 'biff', 'entrecote', 'oxfilé', 'högrev', 'lammfilé', 'lamm', 'revbensspjäll', 'pulled pork', 'schnitzel', 'hamburgare', 'burgare', 'kött', 'potatisgratäng', 'gratäng', 'bearnaise', 'bearnaisesås', 'kall sås', 'kylda såser', 'vegofärs', 'quorn', 'oumph', 'lax', 'laxfilé', 'torsk', 'torskfilé', 'räkor', 'fisk', 'sej', 'pytt', 'kassler', 'skinkstek', 'kalkonfilé', 'tzatziki'],
    kryddor: ['salt', 'peppar', 'svartpeppar', 'krydda', 'kryddor', 'paprikapulver', 'kanel', 'kardemumma', 'oregano', 'curry', 'chiliflakes', 'spiskummin', 'timjan', 'rosmarin', 'olja', 'olivolja', 'rapsolja', 'matolja', 'vinäger', 'balsamvinäger', 'balsamico', 'soja', 'sojasås', 'fisksås', 'sesamolja', 'buljong', 'buljongtärning', 'fond', 'tacokrydda', 'lagerblad', 'muskot', 'gurkmeja', 'vitpeppar'],
    deli: ['oliver', 'soltorkade', 'hummus', 'delikatess', 'antipasti', 'prosciutto', 'serranoskinka', 'parmaskinka', 'kronärtskocka', 'färsk pasta', 'delidisk', 'sallad deli'],
    mejeri: ['mjölk', 'mellanmjölk', 'lättmjölk', 'standardmjölk', 'filmjölk', 'yoghurt', 'kvarg', 'grädde', 'vispgrädde', 'matlagningsgrädde', 'crème fraiche', 'creme fraiche', 'gräddfil', 'smör', 'bregott', 'margarin', 'ost', 'riven ost', 'mozzarella', 'fetaost', 'halloumi', 'parmesan', 'cheddar', 'keso', 'cottage cheese', 'ägg', 'juice', 'apelsinjuice', 'havremjölk', 'havredryck', 'oatly', 'sojadryck', 'pålägg', 'skinka', 'kalkon', 'leverpastej', 'kaviar', 'messmör', 'smörgåsost', 'färskost', 'philadelphia', 'kesella', 'laktosfri', 'pudding', 'proteinpudding', 'smoothie', 'mjölkdryck', 'salami', 'rökt skinka', 'mesost', 'brie', 'getost', 'chèvre'],
    brod: ['bröd', 'limpa', 'baguette', 'fralla', 'frallor', 'tunnbröd', 'knäckebröd', 'knäcke', 'hamburgerbröd', 'korvbröd', 'pitabröd', 'toast', 'rostbröd', 'kanelbulle', 'kanelbullar', 'bullar', 'wienerbröd', 'croissant', 'lantbröd', 'surdegsbröd', 'polarbröd', 'skorpor', 'kakor', 'kaka', 'muffins', 'pågen'],
    skafferi: ['pasta', 'spaghetti', 'makaroner', 'penne', 'fusilli', 'lasagneplattor', 'lasagne', 'nudlar', 'ris', 'jasminris', 'basmatiris', 'couscous', 'bulgur', 'quinoa', 'linser', 'bönor', 'kidneybönor', 'kikärtor', 'krossade tomater', 'tomatpuré', 'passata', 'konserv', 'tonfisk', 'majs', 'kokosmjölk', 'müsli', 'flingor', 'havregryn', 'gryn', 'cornflakes', 'granola', 'sylt', 'honung', 'jordnötssmör', 'nutella', 'ketchup', 'senap', 'majonnäs', 'dressing', 'tacosås', 'salsa', 'tacoskal', 'tortilla', 'tortillas', 'soppa', 'pastasås', 'tomatsås', 'grötris', 'risgrynsgröt', 'marmelad', 'äppelmos', 'inlagd gurka', 'saltgurka', 'pickles', 'sweet chili', 'currypasta'],
    bak: ['vetemjöl', 'mjöl', 'socker', 'strösocker', 'florsocker', 'farinsocker', 'bakpulver', 'jäst', 'vaniljsocker', 'vanilj', 'kakao', 'bakchoklad', 'blockchoklad', 'sirap', 'mandelmassa', 'maizena', 'majsstärkelse', 'kokosflingor', 'strössel', 'pärlsocker', 'bikarbonat', 'gelatin'],
    glutenfritt: ['glutenfri', 'glutenfritt', 'glutenfria', 'schär', 'fria'],
    kaffe: ['kaffe', 'bryggkaffe', 'espresso', 'kaffekapslar', 'kapslar', 'te', 'tepåsar', 'oboy', 'chai', 'snabbkaffe', 'pulverkaffe'],
    dricka: ['läsk', 'cola', 'pepsi', 'fanta', 'sprite', 'vatten', 'kolsyrat vatten', 'mineralvatten', 'ramlösa', 'loka', 'bonaqua', 'energidryck', 'nocco', 'monster', 'red bull', 'celsius', 'saft', 'cider', 'lättöl', 'öl', 'alkoholfritt', 'sportdryck', 'powerade', 'iste', 'zingo', 'trocadero', 'festis'],
    godis: ['godis', 'choklad', 'chokladkaka', 'marabou', 'lösgodis', 'tuggummi', 'pastiller', 'kola', 'lakrits', 'snickers', 'kexchoklad', 'dumle', 'ahlgrens'],
    fryst: ['fryst', 'frysta', 'fryst pizza', 'pizza', 'fiskpinnar', 'wokgrönsaker', 'pommes', 'pommes frites', 'färdigrätt', 'dumplings', 'gyoza', 'ärtor', 'gröna ärtor', 'frysta grönsaker', 'nuggets', 'kycklingnuggets', 'pannkakor', 'piroger', 'lasagne fryst', 'vårrullar', 'frysta räkor', 'potatisbullar', 'rösti'],
    frystGluten: ['glutenfri pizza', 'glutenfritt fryst', 'fryst glutenfri'],
    glass: ['glass', 'glasspinne', 'glasstrut', 'sorbet', 'frysta bär', 'frusna bär', 'fryst mango', 'smoothiemix', 'isglass', 'magnum', 'piggelin', 'daim glass'],
    naturgodis: ['naturgodis', 'nötter', 'cashewnötter', 'cashew', 'mandlar', 'mandel', 'jordnötter', 'russin', 'torkad frukt', 'dadlar', 'torkade aprikoser', 'studentmix', 'pistagenötter', 'pistage', 'valnötter', 'hasselnötter', 'solrosfrön', 'pumpafrön', 'nötmix'],
    chips: ['chips', 'ostbågar', 'popcorn', 'dipmix', 'dippmix', 'dip', 'nachos', 'nachochips', 'salta pinnar', 'cheez doodles', 'olw', 'estrella', 'tortillachips', 'linschips'],
    toapapper: ['toalettpapper', 'toapapper', 'hushållspapper', 'servetter', 'näsdukar', 'pappersservetter', 'kökspapper'],
    stad: ['diskmedel', 'maskindiskmedel', 'disktabletter', 'tvättmedel', 'sköljmedel', 'rengöring', 'allrengöring', 'disksvamp', 'wettex', 'disktrasa', 'trasa', 'soppåsar', 'sopsäckar', 'sopsäck', 'fönsterputs', 'wc-rent', 'toarent', 'klorin', 'ajax', 'städ', 'mikrofiberduk', 'avkalkning', 'fläckborttagning', 'glansmedel'],
    folie: ['fryspåsar', 'fryspåse', 'plastfolie', 'aluminiumfolie', 'folie', 'bakplåtspapper', 'plastpåsar', 'gladpack', 'zip-påsar', 'ziplock', 'matlådor', 'muffinsformar', 'påsar']
  };
  // Very short words only count as whole words ("te" must not hit "tomater").
  var WHOLE_WORD = { te: 1, ris: 1, ost: 1, öl: 1, dip: 1, kål: 1, lök: 1, ägg: 1, deo: 1, tops: 1, fria: 1, lax: 1, soja: 1, majs: 1, kola: 1, saft: 1, fisk: 1, olja: 1, salt: 1, kaka: 1, napp: 1, hipp: 1 };

  // Shops and the order of their departments, as you walk through them.
  var SHOPS = {
    maxi: { name: 'Maxi', order: ['bars', 'hygien', 'blommor', 'barn', 'frukt', 'kott', 'kryddor', 'deli', 'mejeri', 'brod', 'skafferi', 'bak', 'glutenfritt', 'kaffe', 'dricka', 'godis', 'fryst', 'frystGluten', 'glass', 'naturgodis', 'chips', 'toapapper', 'stad', 'folie'] }
  };
  var NAMES = { bars: 'Bars', hygien: 'Hygien', blommor: 'Blommor', barn: 'Barn', frukt: 'Frukt och grönt', kott: 'Kött och korv', kryddor: 'Kryddor och olja', deli: 'Delidisken', mejeri: 'Mejeri och pålägg', brod: 'Bröd', skafferi: 'Skafferiet', bak: 'Bak', glutenfritt: 'Glutenfritt', kaffe: 'Kaffe och te', dricka: 'Dricka', godis: 'Godis', fryst: 'Fryst mat', frystGluten: 'Fryst glutenfritt', glass: 'Glass och bär', naturgodis: 'Naturgodis', chips: 'Chips', toapapper: 'Toalettpapper', stad: 'Städ', folie: 'Fryspåsar och folie' };
  /* Learned places, per shop: when you drag an item, it takes the department of the item
     it now sits under (or above, at the top), and the next sort puts it there. Synced as
     sh_store_places so both phones learn together. */
  var PLACES_KEY = 'sh_store_places';
  function places() { try { var v = JSON.parse(localStorage.getItem(PLACES_KEY) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch (_) { return {}; } }
  function savePlaces(v) { try { localStorage.setItem(PLACES_KEY, JSON.stringify(v)); } catch (_) {} }
  function shopFor(heading) {
    var name = String(heading || '').toLocaleLowerCase('sv-SE').trim();
    return Object.keys(SHOPS).find(function (key) { return name === key || name.indexOf(key) === 0; }) || null;
  }

  function clean(text) {
    return String(text || '').toLocaleLowerCase('sv-SE')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\b\d+([.,]\d+)?\s*(st|kg|g|hg|l|dl|cl|ml|förp|paket|pkt|burk|burkar|flaskor|flaska|påse|påsar|x)?\b/g, ' ')
      .replace(/[^\p{L}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
  }
  // A learned place in this shop first, otherwise the word list.
  function departmentOf(text, shop) {
    var t = clean(text);
    if (!t) return null;
    var learned = shop && places()[shop];
    if (learned && learned[t] && SHOPS[shop].order.indexOf(learned[t]) >= 0) return learned[t];
    return guess(t);
  }
  // Best department from the words: the longest match, with a bonus when it ends a word.
  function guess(t) {
    var words = t.split(' '), best = null, bestScore = 0;
    Object.keys(DEPARTMENTS).forEach(function (dept) {
      DEPARTMENTS[dept].forEach(function (kw) {
        var score = 0;
        if (WHOLE_WORD[kw]) { if (words.indexOf(kw) >= 0) score = kw.length + 10; }
        else if (kw.indexOf(' ') >= 0) { if (t.indexOf(kw) >= 0) score = kw.length + 12; }
        else words.forEach(function (w) {
          var at = w.indexOf(kw);
          if (at < 0) return;
          var s = kw.length + (at + kw.length === w.length ? 10 : 0) + (w === kw ? 2 : 0);
          if (s > score) score = s;
        });
        if (score > bestScore) { bestScore = score; best = dept; }
      });
    });
    // Frozen and gluten-free together go to the frozen gluten-free freezer; frozen berries to the ice-cream freezer.
    var frozen = /\bfryst|\bfrysta|\bfrusna/.test(t);
    if (/glutenfri/.test(t) && (frozen || best === 'fryst')) return 'frystGluten';
    if (frozen && (best === 'frukt' || best === 'glass')) return 'glass';
    if (frozen && best && best !== 'frystGluten' && best !== 'glass') return 'fryst';
    return best;
  }

  // Sort each shop section by its department order. Unknown items keep their place
  // order at the end of the section; checked items stay last.
  function sortItems(items) {
    var out = [], shop = null, section = [], changed = false;
    function flush() {
      if (!section.length) return;
      if (shop) {
        var order = SHOPS[shop].order;
        var ranked = section.map(function (item, i) {
          var dept = departmentOf(item.text, shop), at = dept ? order.indexOf(dept) : -1;
          return { item: item, i: i, rank: (item.checked ? 1000 : 0) + (at < 0 ? order.length : at) };
        }).sort(function (a, b) { return a.rank - b.rank || a.i - b.i; });
        ranked.forEach(function (r, i) { if (r.i !== i) changed = true; out.push(r.item); });
      } else out.push.apply(out, section);
      section = [];
    }
    items.forEach(function (item) {
      if (item && item.type === 'category') { flush(); shop = shopFor(item.text); out.push(item); }
      else section.push(item);
    });
    flush();
    return { items: out, changed: changed };
  }

  function activeList(lists) {
    var id = window.getShoppingActiveListId && window.getShoppingActiveListId();
    return lists.find(function (l) { return Number(l.id) === Number(id); }) || null;
  }
  function sortList() {
    if (window.__shoppingListEngineV7 && window.__shoppingListEngineV7.commitActive) window.__shoppingListEngineV7.commitActive();
    var lists = [];
    try { lists = JSON.parse(localStorage.getItem('sh_lists') || '[]'); } catch (_) {}
    var list = activeList(lists);
    if (!list || !Array.isArray(list.items)) return;
    var hasShop = list.items.some(function (i) { return i && i.type === 'category' && shopFor(i.text); });
    if (!hasShop) { toast('Det finns ingen butik med sorteringsordning i listan än.'); return; }
    var result = sortItems(list.items);
    if (!result.changed) { toast('Listan är redan sorterad efter butiken.'); return; }
    if (typeof window.saveState === 'function') window.saveState();
    list.items = result.items;
    localStorage.setItem('sh_lists', JSON.stringify(lists));
    if (typeof window.renderItems === 'function') window.renderItems();
    toast('Sorterad i butikens ordning.', true);
  }

  function learnMove(event) {
    var d = event.detail || {}, items = d.items || [], at = items.findIndex(function (i) { return i && String(i.id) === String(d.id); });
    if (at < 0 || items[at].type === 'category') return;
    var shop = null, start = 0, end = items.length;
    for (var i = at - 1; i >= 0; i--) if (items[i] && items[i].type === 'category') { shop = shopFor(items[i].text); start = i + 1; break; }
    for (var j = at + 1; j < items.length; j++) if (items[j] && items[j].type === 'category') { end = j; break; }
    if (!shop) return;
    // The neighbour it was dropped under decides; at the top of the shop, the one below.
    var dept = null;
    for (var k = at - 1; k >= start && !dept; k--) if (!items[k].checked) dept = departmentOf(items[k].text, shop);
    for (var m = at + 1; m < end && !dept; m++) if (!items[m].checked) dept = departmentOf(items[m].text, shop);
    if (!dept) return;
    var key = clean(items[at].text); if (!key) return;
    var all = places(), mine = all[shop] || {}, before = mine[key] || guess(key);
    if (before === dept) return;
    if (guess(key) === dept) delete mine[key]; else mine[key] = dept;
    all[shop] = mine; savePlaces(all);
    toast(items[at].text + ' hamnar vid ' + NAMES[dept] + ' i ' + SHOPS[shop].name + ' från nu.');
  }
  window.addEventListener('shopping:item-moved', learnMove);

  var toastNode = null, toastTimer = 0;
  function toast(text, undoable) {
    if (!toastNode) {
      toastNode = document.createElement('div');
      toastNode.className = 'store-sort-toast'; toastNode.setAttribute('role', 'status');
      document.body.appendChild(toastNode);
      toastNode.addEventListener('click', function (event) {
        if (!event.target.closest('[data-store-sort-undo]')) return;
        if (typeof window.undo === 'function') window.undo();
        hide();
      });
    }
    toastNode.innerHTML = '<span>' + String(text).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span>' + (undoable ? '<button type="button" data-store-sort-undo>Ångra</button>' : '');
    toastNode.classList.add('is-visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(hide, undoable ? 6000 : 2800);
  }
  function hide() { if (toastNode) toastNode.classList.remove('is-visible'); }

  function init() {
    var button = document.getElementById('store-sort-btn');
    if (button) button.addEventListener('click', sortList);
  }
  window.ShoppingStoreSort = { departmentOf: departmentOf, sortItems: sortItems, shops: SHOPS, places: places };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
