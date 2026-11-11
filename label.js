function parseLabelText_(raw) {
  var t = String(raw || '').replace(/\r/g, '').replace(/(\d),(\d)/g, '$1.$2');
  var low = t.toLowerCase();

  var measure = /per\s*100\s*ml|\/\s*100\s*ml/.test(low) ? 'ml' : 'g';
  var serving = null;
  var m = low.match(/serv(?:ing|e)\s*(?:size)?\s*[:\-=]?\s*\(?\s*(\d+(?:\.\d+)?)\s*(g|ml)\b/) ||
          low.match(/per\s*serv(?:ing|e)\s*(?:of\s*)?\(?\s*(\d+(?:\.\d+)?)\s*(g|ml)\b/) ||
          low.match(/(\d+(?:\.\d+)?)\s*(g|ml)\s*serv(?:ing|e)/);
  if (m) serving = Number(m[1]);

  var at100 = low.search(/per\s*100\s*(g|ml)|\/\s*100\s*(g|ml)|100\s*(g|ml)\b/);
  var atServ = low.search(/per\s*serv|amount\s*per\s*serv|per\s*pack|per\s*bar|per\s*piece/);
  // which of the numbers after each nutrient name is the per-100 one (-1: there is no per-100 column)
  var col100 = at100 < 0 ? -1 : (atServ >= 0 && atServ < at100 ? 1 : 0);

  var KEYS = [
    ['kcal',      /\benergy\b|\bcalories\b/],
    ['protein',   /\bprotein/],
    ['carbs',     /\btotal\s*carbohydrates?|\bcarbohydrates?/],
    ['sugar',     /\btotal\s*sugars?\b|\bsugars?\b/],
    ['fat',       /\btotal\s*fat\b|\bfat\b/],
    ['fiber',     /\bdietary\s*fib(?:re|er)|\bfib(?:re|er)\b/],
    ['sodium_mg', /\bsodium\b/]
  ];
  // every row name we know, so a nutrient's numbers stop where the next row begins
  var ROWS = /\benergy\b|\bcalories\b|\bprotein|\bcarbohydrate|\bsugars?\b|\bfat\b|\bsaturated|\btrans\b|\bcholesterol|\bfib(?:re|er)|\bsodium|\bingredients?/g;
  var rowStarts = [], rm;
  while ((rm = ROWS.exec(low))) rowStarts.push(rm.index);

  var per100 = {};
  KEYS.forEach(function(k){
    var hit = firstRow_(low, k[1], k[0]);
    if (!hit) { per100[k[0]] = null; return; }
    var i = hit.at, end = low.length;
    // the next row starts after this row's own label — "total fat" must not end at its own "fat"
    rowStarts.forEach(function(s){ if (s >= i + hit.len && s < end) end = s; });
    var win = low.slice(i, Math.min(end, i + 140)).replace(/^[a-z ]+/, '');
    var vals = k[0] === 'kcal' ? energyValues_(win) : numbersIn_(win);
    var v = pick_(vals, col100, serving);
    if (k[0] === 'sodium_mg' && v != null && !/mg/.test(win) && /\bg\b/.test(win)) v = v * 1000;
    per100[k[0]] = v == null ? null : Math.round(v * 10) / 10;
  });
  if (per100.kcal == null) {
    // the word "Energy" was misread: take any number that carries its own kcal or kJ unit (not the 2000 kcal reference intake)
    var loose = [], er = /(\d+(?:\.\d+)?)\s*k\s*cal/g, em;
    while ((em = er.exec(low))) if (Number(em[1]) < 1000) loose.push(Number(em[1]));
    if (!loose.length) { er = /(\d+(?:\.\d+)?)\s*k\s*j/g; while ((em = er.exec(low))) if (Number(em[1]) < 4000) loose.push(Number(em[1]) / 4.184); }
    var lv = pick_(loose, col100, serving);
    per100.kcal = lv == null ? null : Math.round(lv * 10) / 10;
  }

  var ing = '';
  var ii = low.search(/ingredients?\s*[:\-]/);
  if (ii >= 0) {
    var rest = t.slice(ii).replace(/^ingredients?\s*[:\-]\s*/i, '');
    var stop = rest.search(/allergen|contains\s*:|nutrition|best before|mfd|manufactured|net\s*(wt|weight|quantity)|storage/i);
    ing = rest.slice(0, stop > 0 ? stop : 600).replace(/\s+/g, ' ').trim().slice(0, 600);
  }
  return {
    readable: per100.kcal != null,
    name: '',
    per100: per100,
    serving_g: serving,
    measure: measure,
    ingredients: ing,
    contains_milk: /\b(milk|whey|casein|lactose|butter|ghee|cream|cheese|curd|paneer)\b/i.test(ing + ' ' + low),
    added_sugar: /\b(sugar|glucose|fructose|dextrose|maltodextrin|jaggery|honey|syrup|invert)\b/i.test(ing),
    note: 'Read by free OCR — check every number against the packet'
  };
}

/** Position of a nutrient's row. "Fat" must not match "Saturated fat"; "Sugars" must not match "Added sugars" lines inside ingredients. */
function firstRow_(low, re, key) {
  var g = new RegExp(re.source, 'g'), m;
  while ((m = g.exec(low))) {
    var before = low.slice(Math.max(0, m.index - 12), m.index);
    if (key === 'fat' && /(saturated|trans|mono|poly)[\s-]*(unsaturated)?\s*$/.test(before)) continue;
    if (key === 'kcal' && /from\s*$/.test(before)) continue;      // "calories from fat"
    var ingAt = low.search(/ingredients?\s*[:\-]/);
    if (ingAt >= 0 && m.index > ingAt && m.index < ingAt + 600 && key !== 'kcal') {
      // inside the ingredients list — only accept it if a number follows soon, like a table row
      if (!/^[a-z ()]{0,25}\d/.test(low.slice(m.index + m[0].length, m.index + m[0].length + 30))) continue;
    }
    return { at: m.index, len: m[0].length };
  }
  return null;
}

function numbersIn_(s) {
  var out = [], re = /(\d+(?:\.\d+)?)/g, m;
  while ((m = re.exec(s))) {
    if (/^\s*%/.test(s.slice(re.lastIndex, re.lastIndex + 2))) continue;   // %RDA columns are not amounts
    out.push(Number(m[1]));
  }
  return out;
}

/** Energy rows mix kJ and kcal. Prefer numbers marked kcal; fall back to kJ ÷ 4.184. */
function energyValues_(win) {
  var kcal = [], kj = [], re = /(\d+(?:\.\d+)?)\s*(k\s*cal|cal|k\s*j)?/g, m;
  var hasKcal = /k\s*cal|\bcal/.test(win), hasKj = /k\s*j/.test(win);
  while ((m = re.exec(win))) {
    if (/^\s*%/.test(win.slice(re.lastIndex, re.lastIndex + 2))) continue;
    var u = (m[2] || '').replace(/\s/g, '');
    if (u === 'kj') kj.push(Number(m[1]));
    else if (u) kcal.push(Number(m[1]));
    else if (hasKcal && !hasKj) kcal.push(Number(m[1]));
    else if (hasKj && !hasKcal) kj.push(Number(m[1]));
    else if (!hasKcal && !hasKj) kcal.push(Number(m[1]));     // "Calories 120" with no unit
  }
  if (kcal.length) return kcal;
  return kj.map(function(v){ return v / 4.184; });
}

/** Chooses the per-100 value, or converts from per serving when that's all there is. */
function pick_(vals, col100, serving) {
  if (!vals.length) return null;
  if (col100 >= 0 && vals.length > col100) return vals[col100];
  if (col100 < 0 && serving) return vals[0] * 100 / serving;   // the table is per serving only
  return vals[0];
}
