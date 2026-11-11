(function(){
"use strict";

/* ============================ PLAN ============================
   Nothing here is tied to a calendar. The plan is three numbers you can change at any time:
   where you started, where you are going, and how fast. Everything else is worked out from them. */
var DAY = 86400000;
var KCAL_PER_KG = 7700;
var DEFAULTS = { kcal:2250, protein:120, maint:2950, pace:0.7 };

/* Habit checklist. Keys must match the Log sheet headers exactly. */
var ITEMS = [
  ["Food", [
    ["Morning protein","Morning protein — 25 g+ before leaving","AUTO","From what you log under Morning."],
    ["Midday meal","A real meal at midday","AUTO","Before the fried snack, not instead of it."],
    ["Evening feed","4–5 pm feed before the ride home","AUTO","This slot is what saves your evening."],
    ["Calories on target","Calories within 200 of target","AUTO",""],
    ["Protein 120g+","Protein target hit","AUTO",""],
    ["No mindless eating","Off a plate, no screen, no sweets in the room","",""]
  ]],
  ["Body", [
    ["Trained","Trained — or a planned rest day","","Your sessions live in Lyfta."],
    ["12k steps","12,000 steps","",""],
    ["Posture circuit","8-minute posture circuit","",""],
    ["Gait drill","5-minute gait drill","",""]
  ]],
  ["Skin & sleep", [
    ["Riding gear","Full riding gear — visor, sleeves, gloves, shoes","",""],
    ["Sunscreen","Sunscreen before leaving, reapplied at college","",""],
    ["Slept 7-8h","7–8 hours, fixed wake time, phone across the room","",""]
  ]]
];

var MEALS = [["morning","Morning"],["midday","Midday"],["evening","4–5 pm"],["dinner","Dinner"]];

var CUES = [
  [1,2,"Train tracks, not a tightrope — feet on two parallel lines, hip-width apart."],
  [3,4,"Toes pointing straight ahead."],
  [5,6,"Heel → outside edge → push off the big toe."],
  [7,8,"A glass of water on each hip bone. Don't spill either."],
  [9,10,"Arms swing front-to-back from the shoulder, never across the chest."],
  [11,99,"Eyes on the horizon, ribs stacked over hips."]
];

/* Stages follow how far you have come, not what the date is. */
var STAGES = [
  {name:"Foundation", when:"Your first two weeks",
   body:"Learn to log. Accuracy matters more than the number. Morning protein every day. Halve the sugar in tea. Train at 60%, three or four reps short of failure."},
  {name:"Build", when:"The first third of the way",
   body:"Full intensity in the gym. The weekly check-in starts to set your calories from your own data, not from a formula."},
  {name:"Push", when:"The middle third",
   body:"The longest grind. Take a week at maintenance every 10 to 12 weeks. Repeat the bloodwork, the photos and the walking video here."},
  {name:"Finish", when:"The last third",
   body:"Loss slows as you get lighter. That is normal. Lower the pace if training suffers. The date moves; the direction does not."},
  {name:"Hold", when:"At your goal",
   body:"Add 100 kcal a week until the trend stays flat for two weeks. That number is your new maintenance. Maintenance is a skill, not an afterthought."}
];

/* ---- built-in food library. Values are estimates; edit any of them under My foods. ---- */
var BUILTIN_FOODS = [
  {n:"Rice, cooked",u:"100g",k:130,p:2.7,c:28,f:0.3},
  {n:"Chapati",u:"pc",k:104,p:3,c:18,f:2.5},
  {n:"Idli",u:"pc",k:58,p:1.9,c:12,f:0.2},
  {n:"Dosa, plain",u:"pc",k:133,p:2.7,c:20,f:4.5},
  {n:"Masala dosa",u:"pc",k:250,p:5,c:35,f:10},
  {n:"Puttu",u:"100g",k:145,p:3,c:30,f:1},
  {n:"Appam",u:"pc",k:120,p:2,c:24,f:1.5},
  {n:"Idiyappam",u:"pc",k:90,p:1.8,c:19,f:0.5},
  {n:"Kerala porotta",u:"pc",k:260,p:5,c:35,f:11},
  {n:"Kappa / tapioca, boiled",u:"100g",k:160,p:1.4,c:38,f:0.3},
  {n:"Sweet potato, boiled",u:"100g",k:86,p:1.6,c:20,f:0.1},
  {n:"Oats, dry",u:"100g",k:389,p:17,c:66,f:7},
  {n:"Ragi flour",u:"100g",k:336,p:7.3,c:72,f:1.3},
  {n:"Wheat flour / atta",u:"100g",k:340,p:12,c:71,f:1.7},
  {n:"Bread slice",u:"pc",k:70,p:2.4,c:13,f:0.9},
  {n:"Upma",u:"100g",k:130,p:3,c:20,f:4},
  {n:"Poha, cooked",u:"100g",k:130,p:2.5,c:24,f:3},

  {n:"Egg, whole boiled",u:"pc",k:78,p:6.3,c:0.6,f:5.3},
  {n:"Egg white",u:"pc",k:17,p:3.6,c:0.2,f:0.1},
  {n:"Egg, fried",u:"pc",k:110,p:6.3,c:0.6,f:9},
  {n:"Chicken breast, cooked",u:"100g",k:165,p:31,c:0,f:3.6},
  {n:"Chicken thigh, cooked",u:"100g",k:209,p:26,c:0,f:11},
  {n:"Chicken curry, home",u:"100g",k:150,p:14,c:4,f:9},
  {n:"Chicken fry",u:"100g",k:250,p:22,c:6,f:15},
  {n:"Beef, cooked",u:"100g",k:250,p:26,c:0,f:15},
  {n:"Beef fry, Kerala",u:"100g",k:290,p:24,c:5,f:19},
  {n:"Fish curry",u:"100g",k:120,p:14,c:3,f:6},
  {n:"Fish fry",u:"100g",k:200,p:21,c:5,f:11},
  {n:"Prawns, cooked",u:"100g",k:99,p:24,c:0,f:0.3},
  {n:"Soya chunks, dry",u:"100g",k:345,p:52,c:33,f:0.5},
  {n:"Soya chunks, cooked",u:"100g",k:105,p:16,c:10,f:0.2},
  {n:"Paneer",u:"100g",k:296,p:18,c:3.4,f:23,fl:"milk"},
  {n:"Curd / plain yogurt",u:"100g",k:61,p:3.5,c:4.7,f:3.3,fl:"milk"},
  {n:"Milk, full fat",u:"100g",k:62,p:3.2,c:4.8,f:3.3,fl:"milk"},
  {n:"Milk, toned",u:"100g",k:47,p:3.2,c:4.7,f:1.7,fl:"milk"},
  {n:"Whey protein",u:"pc",k:120,p:24,c:3,f:1.5,fl:"milk"},
  {n:"Dal, cooked",u:"100g",k:116,p:9,c:20,f:0.4},
  {n:"Chana, roasted",u:"100g",k:364,p:20,c:61,f:5},
  {n:"Rajma, cooked",u:"100g",k:127,p:8.7,c:23,f:0.5},
  {n:"Peanuts",u:"100g",k:567,p:26,c:16,f:49},
  {n:"Almonds",u:"100g",k:579,p:21,c:22,f:50},

  {n:"Sambar",u:"100g",k:60,p:3,c:8,f:2},
  {n:"Rasam",u:"100g",k:35,p:1.5,c:5,f:1},
  {n:"Thoran",u:"100g",k:90,p:2.5,c:8,f:5.5},
  {n:"Avial",u:"100g",k:120,p:2,c:8,f:9,fl:"milk"},
  {n:"Olan",u:"100g",k:110,p:1.5,c:8,f:8},
  {n:"Erissery",u:"100g",k:130,p:3,c:14,f:7},
  {n:"Coconut, grated",u:"100g",k:354,p:3.3,c:15,f:33},
  {n:"Mixed vegetables, cooked",u:"100g",k:60,p:2,c:9,f:2},

  {n:"Banana chips",u:"100g",k:519,p:2.3,c:58,f:30},
  {n:"Uzhunnu vada",u:"pc",k:145,p:4,c:15,f:8},
  {n:"Parippu vada",u:"pc",k:130,p:5,c:14,f:6},
  {n:"Bonda",u:"pc",k:150,p:3,c:18,f:8},
  {n:"Samosa",u:"pc",k:260,p:5,c:30,f:13},
  {n:"Pazham pori",u:"pc",k:180,p:2,c:25,f:8,fl:"sugar"},
  {n:"Sukhiyan",u:"pc",k:160,p:3,c:22,f:7,fl:"sugar"},
  {n:"Veg puffs",u:"pc",k:230,p:4,c:25,f:13},
  {n:"Chicken puffs",u:"pc",k:270,p:8,c:25,f:15},
  {n:"Marie biscuit",u:"pc",k:25,p:0.4,c:4.5,f:0.7,fl:"sugar"},
  {n:"Potato chips, packet",u:"100g",k:536,p:7,c:53,f:34},

  {n:"Sugar, 1 tsp",u:"pc",k:20,p:0,c:5,f:0,fl:"sugar"},
  {n:"Tea with milk & sugar",u:"pc",k:90,p:2,c:12,f:3,fl:"milk,sugar"},
  {n:"Black coffee",u:"pc",k:2,p:0.3,c:0,f:0},
  {n:"Coffee with milk & sugar",u:"pc",k:100,p:2.5,c:13,f:3.5,fl:"milk,sugar"},
  {n:"Payasam",u:"100g",k:180,p:3,c:28,f:6,fl:"milk,sugar"},
  {n:"Gulab jamun",u:"pc",k:150,p:2,c:22,f:6,fl:"milk,sugar"},
  {n:"Kozhikodan halwa",u:"100g",k:380,p:2,c:60,f:15,fl:"sugar"},
  {n:"Ice cream",u:"100g",k:207,p:3.5,c:24,f:11,fl:"milk,sugar"},
  {n:"Milk chocolate",u:"100g",k:535,p:7.6,c:59,f:30,fl:"milk,sugar"},
  {n:"Soft drink, can",u:"pc",k:139,p:0,c:35,f:0,fl:"sugar"},
  {n:"Sweet lime soda",u:"pc",k:90,p:0,c:23,f:0,fl:"sugar"},
  {n:"Banana",u:"pc",k:105,p:1.3,c:27,f:0.4},
  {n:"Apple",u:"pc",k:95,p:0.5,c:25,f:0.3},
  {n:"Orange",u:"pc",k:62,p:1.2,c:15,f:0.2},

  {n:"Coconut oil, 1 tsp",u:"pc",k:45,p:0,c:0,f:5},
  {n:"Ghee, 1 tsp",u:"pc",k:45,p:0,c:0,f:5,fl:"milk"},
  {n:"Cooking oil, 1 tsp",u:"pc",k:45,p:0,c:0,f:5},
  {n:"Honey, 1 tsp",u:"pc",k:21,p:0,c:6,f:0,fl:"sugar"}
];
BUILTIN_FOODS.forEach(function(f){ f.b = 1; });

/* ============================ STATE ============================ */
var days = {}, foodLog = [], myFoods = [], settings = {}, scanner = { label:true };
var TODAY = iso(new Date()), CUR = TODAY;
var saveTimer = null, notesTimer = null;

/* ============================ UTIL ============================ */
function $(id){ return document.getElementById(id); }
function $$(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function parseIso(s){ var p = s.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
function addDays(s, n){ var d = parseIso(s); d.setDate(d.getDate()+n); return iso(d); }
function midnight(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function n1(x){ return Math.round(x*10)/10; }
function fmt(n){ return Math.round(n).toLocaleString("en-IN"); }
function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function num(v){ var x = parseFloat(v); return isNaN(x) ? null : x; }
function round50(x){ return Math.round(x/50)*50; }
function prettyDate(s, opts){ return parseIso(s).toLocaleDateString("en-IN", opts || {weekday:"short", day:"numeric", month:"short"}); }

var ICON = {
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  left:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
  right:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
  chev:'<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  camera:'<svg class="big" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 16V11a3 3 0 0 1 3-3h5M32 8h5a3 3 0 0 1 3 3v5M40 32v5a3 3 0 0 1-3 3h-5M16 40h-5a3 3 0 0 1-3-3v-5M15 18v12M20 18v12M25 18v12M30 18v8M34 18v12"/></svg>'
};

/* ============================ STORE ============================
   Everything is saved on this phone first (localStorage), so the app works
   offline and needs no account. If a Google Sheet is connected in Settings,
   each change also waits in the outbox until the sheet has taken it. */
var LS = "rebuild.data", LS_SYNC = "rebuild.sync";
var DEMO = /[?&]demo/.test(location.search);       // ?demo — five weeks of made-up data, never saved
function lsGet(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } }
var outbox = [], conn = DEMO ? null : lsGet(LS_SYNC), syncState = { busy:false, err:"", at:0 };

function newId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function dayHasData(d){
  return d.weight != null || d.waist != null || d.steps != null || !!d.notes || !!d.mode ||
         Object.keys(d.checks || {}).some(function(k){ return d.checks[k]; });
}
function snapshot(){
  return { log: Object.keys(days).sort().map(function(k){ return days[k]; }).filter(dayHasData),
           foodLog: foodLog.map(stripEntry), foods: myFoods, settings: settings };
}
function persist(){
  if (DEMO) return;
  var o = snapshot(); o.outbox = outbox;
  try { localStorage.setItem(LS, JSON.stringify(o)); }
  catch(e){ toast("This phone's storage is full. Export a backup in Settings.", true); }
}
function applyData(data){
  days = {};
  (data.log||[]).forEach(function(r){ if (!r.checks) r.checks = {}; days[r.date] = r; });
  foodLog  = data.foodLog || [];
  myFoods  = (data.foods || []).map(function(f){ if (f.k == null) f.k = 0; if (f.p == null) f.p = 0; return f; });
  settings = data.settings || {};
  day(TODAY);
}

/* every write has already changed the in-memory state; this saves it and queues it for the sheet */
var api = {};
["saveDay","addFoodEntry","updateFoodEntry","deleteFoodEntry","saveFood","deleteFood","saveSetting"].forEach(function(fn){
  api[fn] = function(){
    var a = [].slice.call(arguments); a.pop(); var ok = a.pop();
    if (conn) outbox.push([fn, JSON.parse(JSON.stringify(a))]);
    persist(); ok(true);
    setTimeout(function(){ persist(); flush(); }, 0);
  };
});

/* ---------- Google Sheet sync ---------- */
function post(body){
  body.token = conn.token;
  // no Content-Type header on purpose: that keeps it a "simple" request, the only kind an Apps Script web app accepts cross-site
  return fetch(conn.url, { method:"POST", body: JSON.stringify(body) })
    .then(function(r){ return r.json(); })
    .then(function(j){ if (!j || !j.ok) throw new Error((j && j.error) || "The sheet refused the request"); return j; });
}
function typing(){
  var a = document.activeElement;
  return (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) || $("sheet").classList.contains("open");
}
/** Sends the outbox. With pull, also takes the sheet's copy — but only if nothing new was queued meanwhile. */
function flush(pull){
  if (!conn || syncState.busy || navigator.onLine === false) return;
  if (!outbox.length && !pull) return;
  var batch = outbox.slice(0, 40);
  syncState.busy = true; paintSync();
  post({ ops:batch, pull: !!pull && outbox.length <= 40 }).then(function(j){
    outbox.splice(0, batch.length);
    syncState.err = ""; syncState.at = Date.now();
    if (j.data && !outbox.length && !typing()) { applyData(j.data); renderAll(); }
    persist();
    syncState.busy = false; paintSync();
    if (outbox.length) flush(pull);
  }).catch(function(e){
    syncState.busy = false; syncState.err = String(e.message || e); paintSync();
  });
}
/** First connection: takes the sheet's data, then adds only what this phone has and the sheet lacks. Never overwrites the sheet. */
function connect(url, token, done){
  var mine = snapshot();
  conn = { url:url.trim(), token:token.trim() };
  post({ ops:[], pull:true }).then(function(j){
    var d = j.data, has = {};
    d.log.forEach(function(r){ has["d"+r.date] = 1; });
    d.foodLog.forEach(function(e){ has["e"+e.id] = 1; });
    d.foods.forEach(function(f){ has["f"+String(f.n).toLowerCase()] = 1; });
    mine.log.forEach(function(r){ if (!has["d"+r.date]) { d.log.push(r); outbox.push(["saveDay",[r]]); } });
    mine.foodLog.forEach(function(e){ if (!has["e"+e.id]) { d.foodLog.push(e); outbox.push(["addFoodEntry",[e]]); } });
    mine.foods.forEach(function(f){ if (!has["f"+f.n.toLowerCase()]) { d.foods.push(f); outbox.push(["saveFood",[f]]); } });
    Object.keys(mine.settings).forEach(function(k){ if (!(k in d.settings)) { d.settings[k] = mine.settings[k]; outbox.push(["saveSetting",[k, mine.settings[k]]]); } });
    try { localStorage.setItem(LS_SYNC, JSON.stringify(conn)); } catch(e){}
    applyData(d); persist(); renderAll(); flush();
    syncState.err = ""; syncState.at = Date.now(); paintSync();
    done("");
  }).catch(function(e){ conn = null; done(String(e.message || e)); });
}
function disconnect(){
  conn = null; outbox = []; syncState.err = "";
  try { localStorage.removeItem(LS_SYNC); } catch(e){}
  persist(); paintSync();
}
function syncText(){
  if (!conn) return "Saved on this phone only.";
  if (syncState.busy) return "Sending to your Google Sheet…";
  if (syncState.err) return "Not sent yet (" + outbox.length + " waiting): " + syncState.err;
  if (outbox.length) return outbox.length + " changes waiting to send.";
  return "Up to date with your Google Sheet.";
}
function paintSync(){
  $("open-settings").classList.toggle("flag", !!(conn && !syncState.busy && (syncState.err || outbox.length)));
  if ($("st-sync")) $("st-sync").textContent = syncText();
}

/* ---------- packet lookups: both free, both run from the phone ---------- */
api.lookupBarcode = function(code, ok, err){
  fetch("https://world.openfoodfacts.org/api/v2/product/" + code +
        ".json?fields=product_name,brands,nutriments,serving_quantity,serving_quantity_unit,quantity,ingredients_text,ingredients_text_en,allergens_tags")
    .then(function(r){ return r.json(); })
    .then(function(j){
      if (!j || j.status !== 1 || !j.product) { ok({ found:false }); return; }
      var p = j.product, nt = p.nutriments || {};
      var kcal = nt["energy-kcal_100g"];
      if (kcal == null && nt.energy_100g != null) kcal = nt.energy_100g / 4.184;   // kJ → kcal
      var ing = p.ingredients_text_en || p.ingredients_text || "", allergens = (p.allergens_tags || []).join(" ");
      ok({
        found:true, source:"Open Food Facts",
        name: [p.brands ? String(p.brands).split(",")[0].trim() : "", p.product_name || ""].join(" ").trim(),
        per100: { kcal:num(kcal), protein:num(nt.proteins_100g), carbs:num(nt.carbohydrates_100g), sugar:num(nt.sugars_100g),
                  fat:num(nt.fat_100g), fiber:num(nt.fiber_100g), sodium_mg: nt.sodium_100g != null ? Math.round(nt.sodium_100g*1000) : null },
        serving_g: num(p.serving_quantity),
        measure: /ml/i.test(String(p.serving_quantity_unit || "") + " " + String(p.quantity || "")) ? "ml" : "g",
        ingredients: ing,
        contains_milk: /milk/.test(allergens) || /\b(milk|whey|casein|lactose|curd|paneer|butter|ghee|cream|cheese)\b/i.test(ing),
        added_sugar: /\b(sugar|glucose|fructose|dextrose|maltodextrin|jaggery|honey|syrup|invert)\b/i.test(ing),
        complete: kcal != null && nt.proteins_100g != null
      });
    }).catch(err);
};

/* the label reader (Tesseract, about 15 MB) is only downloaded the first time a label is read; the browser keeps it after that */
var TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js", tessLoading = null;
function loadTesseract(){
  if (!tessLoading) tessLoading = new Promise(function(res, rej){
    var sc = document.createElement("script");
    sc.src = TESSERACT; sc.onload = res;
    sc.onerror = function(){ tessLoading = null; rej(new Error("offline")); };
    document.head.appendChild(sc);
  });
  return tessLoading;
}
/** Grey, enlarged, and dark-on-light: the three things the on-phone reader needs most. */
function prepLabel(src){
  var long = Math.max(src.width, src.height), s = long < 2200 ? Math.min(3, 2200/long) : 1;
  var c = document.createElement("canvas");
  c.width = Math.round(src.width*s); c.height = Math.round(src.height*s);
  var x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(src, 0, 0, c.width, c.height);
  var im = x.getImageData(0, 0, c.width, c.height), d = im.data, sum = 0, i;
  for (i = 0; i < d.length; i += 4) { d[i] = d[i+1] = d[i+2] = (d[i]*77 + d[i+1]*150 + d[i+2]*29) >> 8; sum += d[i]; }
  if (sum / (d.length/4) < 110) for (i = 0; i < d.length; i += 4) d[i] = d[i+1] = d[i+2] = 255 - d[i];    // light text on a dark wrapper
  x.putImageData(im, 0, 0);
  return c;
}
/* Two free readers. Google's (through your connected sheet) is far better on real packets;
   the on-phone one works with no setup and offline, but needs a flat, sharp, close photo. */
api.readLabel = function(canvas, ok, err){
  var onPhone = function(){
    return loadTesseract().then(function(){
      return window.Tesseract.recognize(prepLabel(canvas), "eng", { logger:function(m){
        var li = document.querySelector('#sc-steps li[data-i="2"]');
        if (li && m.progress != null) li.lastChild.textContent = (m.status === "recognizing text" ? "Reading the label " : "Getting the label reader ready ") + Math.round(m.progress*100) + "%";
      }});
    }).then(function(r){ return { text:r.data.text, by:"read on this phone" }; });
  };
  var read = conn && navigator.onLine !== false
    ? post({ ocr: canvas.toDataURL("image/jpeg", 0.85).split(",")[1] }).then(function(j){ return { text:j.text, by:"read by Google" }; }).catch(onPhone)
    : onPhone();
  read.then(function(r){
    var out = parseLabelText_(r.text);
    if (out.per100.kcal == null) {
      ok({ ok:false, error:"Couldn't find the energy figure. Fill the frame with the nutrition table, flatten the packet, avoid glare." +
           (conn ? "" : " Connecting a Google Sheet in Settings turns on a much better reader.") });
      return;
    }
    out.ok = true; out.source = "Label photo · " + r.by; out.note = "Check every number against the packet";
    ok(out);
  }).catch(err);
};

function toast(msg, isErr){
  var el = $("toast");
  el.textContent = msg;
  el.className = "show" + (isErr ? " err" : "");
  clearTimeout(toast.t);
  toast.t = setTimeout(function(){ el.className = ""; }, isErr ? 3200 : 1500);
}
function failed(what){ return function(){ toast("Couldn't " + what + " — check your connection", true); }; }

/* ============================ SETTINGS / TARGETS ============================ */
function plan(){
  var first = weighIns()[0];
  return { start: settings.planStart || (first ? first.date : TODAY),
           w0: num(settings.startWeight) || (first ? Number(first.weight) : null),
           goal: num(settings.goal), pace: num(settings.pace) || DEFAULTS.pace };
}
/** 0 at the start weight, 1 at the goal. null until there is a start, a goal and a weigh-in. */
function progress(){
  var p = plan(), t = trendOn(TODAY);
  if (p.w0 == null || p.goal == null || t == null || p.w0 <= p.goal) return null;
  return clamp((p.w0 - t)/(p.w0 - p.goal), 0, 1);
}
function stageNow(){
  var pr = progress();
  if (pr !== null && pr >= 1) return 4;
  if (weekNo(TODAY) <= 2) return 0;
  return pr === null || pr < 1/3 ? 1 : pr < 2/3 ? 2 : 3;
}
function cfg(){
  var p = plan(), w = trendOn(TODAY) || p.w0;
  // shortcut: 29.5 kcal per kg is a rough guess at maintenance; the weekly check-in replaces it with a measured number
  var maint = num(settings.maint) || (w ? round50(w*29.5) : DEFAULTS.maint);
  return {
    kcal:    num(settings.kcal)    || (w ? Math.max(1800, round50(maint - p.pace*KCAL_PER_KG/7)) : DEFAULTS.kcal),
    protein: num(settings.protein) || (w ? clamp(Math.round(w*1.2/5)*5, 90, 180) : DEFAULTS.protein),
    maint:   maint
  };
}
function setSetting(k, v){
  settings[k] = v;
  api.saveSetting(k, v, function(){}, failed("save the setting"));
}
/** Calorie target for a given day — maintenance on exam and diet-break days. */
function kcalTarget(d){
  var c = cfg();
  if (d && (d.mode === "exam" || d.mode === "break")) {
    var est = maintenanceEstimate();
    return round50(est ? est.tdee : c.maint);
  }
  return c.kcal;
}

/* ============================ WEEKS ============================ */
function weekNo(s){
  var n = Math.floor((parseIso(s || TODAY) - parseIso(plan().start))/DAY);
  return n < 0 ? 0 : Math.floor(n/7)+1;
}
function weekStart(w){ return addDays(plan().start, (w-1)*7); }
/* the milk test is no longer on the calendar, so no day is ever inside it */
function milkTest(){ return null; }

/* ============================ DAYS ============================ */
function blankDay(d){
  var o = { date:d, weight:null, waist:null, steps:null, notes:"", mode:"", checks:{} };
  ITEMS.forEach(function(g){ g[1].forEach(function(it){ o.checks[it[0]] = false; }); });
  return o;
}
function day(s){ s = s || CUR; if (!days[s]) days[s] = blankDay(s); return days[s]; }
var saveDue = null;
function queueSave(s){
  s = s || CUR;
  if (saveDue && saveDue !== s) saveNow();
  saveDue = s;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 600);
}
function saveNow(){
  if (!saveDue) return;
  var s = saveDue; saveDue = null; clearTimeout(saveTimer);
  api.saveDay(day(s), function(){ toast("Saved"); }, failed("save"));
}

/* ============================ WEIGHT TREND ============================
   A daily scale reading moves ±1 kg with water and salt. The trend is an
   exponentially smoothed average: each weigh-in pulls it 10% of the way. */
function weighIns(){
  return Object.keys(days).map(function(k){ return days[k]; })
    .filter(function(d){ return d.weight != null && d.weight !== "" && !isNaN(Number(d.weight)); })
    .sort(function(a,b){ return a.date < b.date ? -1 : 1; });
}
function trendSeries(){
  var pts = weighIns(), t = null;
  return pts.map(function(p){
    var w = Number(p.weight);
    t = t === null ? w : t + 0.1*(w - t);
    return { date:p.date, w:w, t:t, waist:p.waist };
  });
}
function trendOn(s){
  var tr = trendSeries(), v = null;
  tr.forEach(function(p){ if (p.date <= s) v = p.t; });
  return v;
}
/** kg lost per week over the last `span` days, by least squares on raw weigh-ins. Positive = losing. */
function lossRate(span){
  span = span || 21;
  var from = addDays(TODAY, -span);
  var pts = weighIns().filter(function(p){ return p.date >= from; });
  if (pts.length < 5) return null;
  var xs = pts.map(function(p){ return (parseIso(p.date) - parseIso(pts[0].date))/DAY; }), ys = pts.map(function(p){ return Number(p.weight); });
  var mx = xs.reduce(function(a,b){return a+b;},0)/xs.length, my = ys.reduce(function(a,b){return a+b;},0)/ys.length;
  var num_ = 0, den = 0;
  for (var i=0;i<xs.length;i++){ num_ += (xs[i]-mx)*(ys[i]-my); den += (xs[i]-mx)*(xs[i]-mx); }
  if (!den || xs[xs.length-1] - xs[0] < 10) return null;
  return -(num_/den)*7;
}
/** Your real maintenance, from what you ate and what the scale did. Needs ~2–3 weeks of honest logging. */
function maintenanceEstimate(){
  var rate = lossRate(21);
  if (rate === null) return null;
  var intake = [], s;
  for (var i=1;i<=21;i++){
    s = addDays(TODAY, -i);
    var k = foodTotals(s).kcal;
    if (k >= 1200) intake.push(k);         // a day under 1,200 is almost always a day you forgot to log
  }
  if (intake.length < 10) return null;
  var avg = intake.reduce(function(a,b){return a+b;},0)/intake.length;
  return { tdee: avg + rate*KCAL_PER_KG/7, avgIntake: avg, rate: rate, days: intake.length };
}

/* ============================ FOOD ============================ */
function allFoods(){
  var seen = {}, out = [];
  myFoods.concat(BUILTIN_FOODS).forEach(function(f){
    var k = String(f.n).toLowerCase();
    if (!seen[k]) { seen[k] = 1; out.push(f); }
  });
  return out;
}
function builtinNamed(n){
  n = String(n).toLowerCase();
  for (var i=0;i<BUILTIN_FOODS.length;i++) if (BUILTIN_FOODS[i].n.toLowerCase() === n) return BUILTIN_FOODS[i];
  return null;
}
function foodByName(n){
  var all = allFoods(); n = String(n).toLowerCase();
  for (var i=0;i<all.length;i++) if (all[i].n.toLowerCase() === n) return all[i];
  return null;
}
function foodByBarcode(code){
  for (var i=0;i<myFoods.length;i++) if (myFoods[i].bc && String(myFoods[i].bc) === String(code)) return myFoods[i];
  return null;
}
function flags(f){ return String((f && f.fl) || "").split(",").filter(Boolean); }
function flagTags(f){
  return flags(f).map(function(x){ return '<span class="tag '+x+'">'+(x==="milk"?"milk":"added sugar")+'</span>'; }).join("");
}
function entriesOn(s){ return foodLog.filter(function(e){ return e.date === s; }); }
function foodTotals(s, meal){
  var t = {kcal:0,p:0,c:0,f:0};
  foodLog.forEach(function(e){
    if (e.date === s && (meal === undefined || (e.meal||"") === meal)){
      t.kcal+=Number(e.kcal)||0; t.p+=Number(e.protein)||0; t.c+=Number(e.carbs)||0; t.f+=Number(e.fat)||0;
    }
  });
  return t;
}
function mult(f, qty){ return f.u === "100g" ? qty/100 : qty; }
/* "100g" in the data means "per 100 of the food's measure" — g for solids, ml for drinks */
function mu(f){ return f && f.mm === "ml" ? "ml" : "g"; }
function per(f){ return f.u === "100g" ? "100 " + mu(f) : "each"; }
/** The same food expressed per 100 g/ml — needs the size of one piece. */
function per100Of(f){
  if (f.u === "100g") return f;
  if (!f.sg) return null;
  var r = 100 / f.sg;
  return { n:f.n, u:"100g", mm:f.mm, sg:f.sg, fl:f.fl, k:f.k*r, p:f.p*r, c:(f.c||0)*r, f:(f.f||0)*r };
}
function makeEntry(f, qty, meal, s){
  var m = mult(f, qty);
  return { date:s || CUR, food:f.n, qty:qty, unit:f.u, meal:meal,
           kcal:Math.round(f.k*m), protein:n1(f.p*m), carbs:n1((f.c||0)*m), fat:n1((f.f||0)*m) };
}
/** The per-unit values an entry was logged with — so editing old entries never depends on today's library. */
function baseOf(e){
  var m = e.unit === "100g" ? (Number(e.qty)||0)/100 : (Number(e.qty)||0);
  if (!m) m = 1;
  var lib = foodByName(e.food);
  return { n:e.food, u:e.unit || "pc", k:(e.kcal||0)/m, p:(e.protein||0)/m, c:(e.carbs||0)/m, f:(e.fat||0)/m,
           sg: lib ? lib.sg : null, fl: lib ? lib.fl : "", mm: lib ? lib.mm : "g" };
}
function defaultMeal(){
  if (CUR !== TODAY) return "dinner";
  var h = new Date().getHours() + new Date().getMinutes()/60;
  return h < 11 ? "morning" : h < 15 ? "midday" : h < 18.5 ? "evening" : "dinner";
}

function logEntry(e){
  e.id = newId();
  foodLog.push(e);
  afterFoodChange(e.date);
  api.addFoodEntry(stripEntry(e), function(){ toast("Added"); }, failed("save that"));
}
function stripEntry(e){ var o = {}; ["id","date","food","qty","unit","kcal","protein","carbs","fat","meal"].forEach(function(k){ o[k] = e[k]; }); return o; }
function updateEntry(e){
  afterFoodChange(e.date);
  api.updateFoodEntry(stripEntry(e), function(){ toast("Updated"); }, failed("update it"));
}
function removeEntry(e){
  foodLog = foodLog.filter(function(x){ return x !== e; });
  afterFoodChange(e.date);
  api.deleteFoodEntry(e.id, function(){ toast("Removed"); }, failed("remove it"));
}

/* auto-tick what the food log can prove. Only ever ticks — never unticks something you ticked. */
function afterFoodChange(s){
  var d = day(s), t = foodTotals(s), target = kcalTarget(d), c = cfg(), changed = false;
  var want = {
    "Morning protein":    foodTotals(s, "morning").p >= 25,
    "Midday meal":        foodTotals(s, "midday").kcal >= 300,
    "Evening feed":       foodTotals(s, "evening").kcal >= 120,
    "Calories on target": t.kcal > 0 && Math.abs(t.kcal - target) <= 200,
    "Protein 120g+":      t.p >= c.protein - 5
  };
  Object.keys(want).forEach(function(k){
    if (want[k] && !d.checks[k]) { d.checks[k] = true; changed = true; }
  });
  if (changed) queueSave(s);
  renderAll();
}

/* ============================ RENDER: TOP + STEPPER ============================ */
function renderTop(){
  var p = plan(), t = trendOn(TODAY), w = weekNo(TODAY);
  var toGo = p.goal != null && t != null ? t - p.goal : null;
  $("eyebrow").innerHTML = p.goal == null ? "No goal set yet" :
    "Wk <b>"+String(w).padStart(2,"0")+"</b> · "+esc(STAGES[stageNow()].name)+" · "+
    (toGo === null ? "goal "+p.goal+" kg" : toGo <= 0 ? "at goal" : toGo.toFixed(1)+" kg to go");

  $$("[data-stepper]").forEach(function(el){
    var isToday = CUR === TODAY, label = isToday ? "Today" : CUR === addDays(TODAY,-1) ? "Yesterday" : prettyDate(CUR, {weekday:"long"});
    el.innerHTML =
      '<button data-step="-1" aria-label="Previous day">'+ICON.left+'</button>'+
      '<div class="d'+(isToday?"":" past")+'">'+esc(label)+'<small>'+(isToday ? prettyDate(CUR) : "Editing "+prettyDate(CUR)+' <button class="tdy" data-today aria-label="Go back to today">today</button>')+'</small></div>'+
      '<button data-step="1" aria-label="Next day"'+(isToday?" disabled":"")+'>'+ICON.right+'</button>';
  });
}

/* ============================ RENDER: TODAY ============================ */
function renderBanners(){
  var out = [], w = weekNo(CUR), d = day(CUR);
  if (plan().goal == null)
    out.push(['accent','Set your plan','Three numbers: where you are, where you want to be, and how fast. <button class="link" id="set-plan">Set them now</button>']);
  if (w > 0 && w % 12 === 0)
    out.push(['good','Diet break week','Eat at maintenance all week — switch the day to <b>Break</b> below. It isn\'t a cheat: it refills glycogen, settles hunger hormones, and makes the next stretch survivable.']);
  if (parseIso(CUR).getDay() === 0 && CUR === TODAY)
    out.push(['accent','Sunday check-in','Weigh in, measure your waist at the navel, then read the verdict on <b>Progress</b>. Every 4th Sunday: front, side and back photos in the same light.']);
  if (d.mode === "exam")
    out.push(['','Exam mode','Maintenance calories today. Morning protein, a walk, sleep — holding weight through a bad week counts as a win.']);
  if (d.mode === "break")
    out.push(['good','Diet break','Maintenance calories today. Protein target stays the same.']);
  $("banners").innerHTML = out.map(function(b){
    return '<div class="banner '+b[0]+'"><span class="k">'+b[1]+'</span>'+b[2]+'</div>';
  }).join("");
  if ($("set-plan")) $("set-plan").addEventListener("click", openSettings);
}

function renderHero(){
  var d = day(CUR), t = foodTotals(CUR), target = kcalTarget(d), c = cfg();
  var left = target - t.kcal, over = left < -200;
  var kpct = clamp(t.kcal/target*100, 0, 100), ppct = clamp(t.p/c.protein*100, 0, 100);
  var kcls = t.kcal > target + 200 ? " over" : (Math.abs(t.kcal - target) <= 200 && t.kcal > 0 ? " ok" : "");
  $("hero").innerHTML =
    '<div class="hero">'+
      '<div><div class="big num'+(over?" over":"")+'">'+fmt(Math.abs(left))+'</div>'+
        '<div class="biglbl">'+(left >= 0 ? "kcal left of "+fmt(target) : "kcal over "+fmt(target))+'</div></div>'+
      '<div class="heroside"><div class="num">'+Math.round(t.p)+'<span class="muted" style="font-size:13px"> / '+c.protein+' g</span></div><div class="lbl">protein</div></div>'+
    '</div>'+
    '<div class="meter"><div class="row"><span>Eaten</span><span class="num">'+fmt(t.kcal)+' kcal</span></div>'+
      '<div class="track kcal'+kcls+'"><span style="width:'+kpct+'%"></span></div></div>'+
    '<div class="meter"><div class="row"><span>Protein</span><span class="num">'+Math.round(ppct)+'%</span></div>'+
      '<div class="track prot'+(t.p >= c.protein-5 ? " ok":"")+'"><span style="width:'+ppct+'%"></span></div></div>'+
    '<div class="macros"><span>Carbs <span class="num">'+Math.round(t.c)+'g</span></span><span>Fat <span class="num">'+Math.round(t.f)+'g</span></span>'+
      (t.f > 0 && t.f < 55 && CUR !== TODAY ? '<span style="color:var(--warn)">fat under 55 g</span>' : '')+'</div>'+
    '<div class="seg" role="group" aria-label="Day type">'+
      [["","Normal"],["exam","Exam"],["break","Break"]].map(function(m){
        return '<button data-mode="'+m[0]+'" class="'+((d.mode||"")===m[0]?"on":"")+'">'+m[1]+'</button>';
      }).join("")+
    '</div>';
  $$("[data-mode]", $("hero")).forEach(function(b){
    b.addEventListener("click", function(){
      day(CUR).mode = b.dataset.mode; queueSave(); renderToday(); renderFood();
    });
  });
}

function renderBody(){
  var d = day(CUR), isSun = parseIso(CUR).getDay() === 0, showWaist = isSun || d.waist != null;
  $("body-inputs").innerHTML =
    '<div class="field"><label class="lbl" for="i-wt">Weight, kg</label><input class="num" type="number" step="0.1" inputmode="decimal" id="i-wt" placeholder="before food" value="'+(d.weight==null?"":d.weight)+'"></div>'+
    (showWaist
      ? '<div class="field"><label class="lbl" for="i-waist">Waist at navel, cm</label><input class="num" type="number" step="0.5" inputmode="decimal" id="i-waist" placeholder="relaxed, not sucked in" value="'+(d.waist==null?"":d.waist)+'"></div>'
      : '<div class="field" style="display:flex;align-items:flex-end"><button class="link" id="show-waist" style="padding:12px 0">+ Add waist (Sundays)</button></div>');
  var tr = trendSeries(), last = tr.length ? tr[tr.length-1] : null, rate = lossRate(14);
  $("trend-aside").textContent = last ? "TREND " + last.t.toFixed(1) + " KG" : "";
  $("weigh-hint").textContent = last
    ? (rate !== null ? (rate >= 0 ? "Losing " : "Gaining ") + Math.abs(rate).toFixed(2) + " kg a week over the last two weeks." : "Keep weighing daily — the rate appears after ten days.")
    : "Same time every morning. One reading means little; the trend is what counts.";
  bindNum("i-wt", "weight");
  if (showWaist) bindNum("i-waist", "waist");
  else $("show-waist").addEventListener("click", function(){ day(CUR).waist = null; renderBodyWithWaist(); });
}
function renderBodyWithWaist(){ var d = day(CUR); if (d.waist == null) d.waist = ""; renderBody(); }
function bindNum(id, key){
  $(id).addEventListener("change", function(){
    var v = num($(id).value);
    day(CUR)[key] = v;
    queueSave(); renderTop(); renderBody(); renderProgress();
  });
}

var STEP_GOAL = 12000;
function renderSteps(){
  var d = day(CUR), st = Number(d.steps) || 0, inp = $("i-steps");
  if (document.activeElement !== inp) inp.value = d.steps == null ? "" : d.steps;
  $("stepbar").style.width = clamp(st/STEP_GOAL*100, 0, 100) + "%";
  $("stepbar").parentNode.className = "track" + (st >= STEP_GOAL ? " prot ok" : "");
  $("stepcount").textContent = fmt(st) + " / " + fmt(STEP_GOAL);
  var avg = avgSteps(addDays(CUR, -6), CUR);
  $("steps-aside").textContent = avg ? "7-DAY AVG " + fmt(avg) : "";
}
/** Mean steps over the days that have a number in them. */
function avgSteps(fromIso, toIso){
  var sum = 0, n = 0;
  for (var s = fromIso; s <= toIso; s = addDays(s, 1)){
    var d = days[s];
    if (d && d.steps) { sum += Number(d.steps); n++; }
  }
  return n ? sum/n : 0;
}
function renderCue(){
  var w = weekNo(CUR), cue = "";
  CUES.forEach(function(cc){ if (w>=cc[0] && w<=cc[1]) cue = cc[2]; });
  var fc = $("floor-card");
  fc.hidden = !cue;
  if (cue) fc.innerHTML = '<h2>Gait cue · week '+w+'</h2><p class="sub" style="margin:0">'+esc(cue)+'</p>';
}

function renderToday(){
  renderBanners(); renderHero(); renderBody(); renderSteps(); renderCue();
  var n = $("notes");
  if (document.activeElement !== n) n.value = day(CUR).notes || "";
}

/* ============================ RENDER: FOOD ============================ */
function renderFoodBars(){
  var d = day(CUR), t = foodTotals(CUR), target = kcalTarget(d), c = cfg();
  $("f-kcal").textContent = fmt(t.kcal) + " / " + fmt(target);
  var kb = $("f-kcalbar");
  kb.className = "track kcal" + (t.kcal > target+200 ? " over" : (t.kcal > 0 && Math.abs(t.kcal-target) <= 200 ? " ok" : ""));
  kb.firstChild.style.width = clamp(t.kcal/target*100,0,100) + "%";
  $("f-prot").textContent = Math.round(t.p) + " / " + c.protein + " g";
  var pb = $("f-protbar");
  pb.className = "track prot" + (t.p >= c.protein-5 ? " ok" : "");
  pb.firstChild.style.width = clamp(t.p/c.protein*100,0,100) + "%";
}

function renderMeals(){
  var mine = entriesOn(CUR), box = $("meals"), yest = addDays(CUR, -1);
  $("eaten-aside").textContent = mine.length ? mine.length + " ITEMS" : "";
  var slots = MEALS.slice();
  if (mine.some(function(e){ return !e.meal; })) slots.push(["","Other"]);
  box.innerHTML = slots.map(function(m){
    var list = mine.filter(function(e){ return (e.meal||"") === m[0]; });
    var t = foodTotals(CUR, m[0]);
    var prev = m[0] ? foodLog.filter(function(e){ return e.date === yest && e.meal === m[0]; }) : [];
    return '<div class="meal"><div class="mealhead"><span class="nm">'+m[1]+'</span>'+
      '<span class="tot">'+(list.length ? fmt(t.kcal)+" KCAL · "+Math.round(t.p)+"G P" : "")+'</span></div>'+
      (list.length
        ? list.map(function(e){
            return '<button class="entry" data-i="'+mine.indexOf(e)+'"><div class="g"><div class="n">'+esc(e.food)+'</div>'+
              '<div class="s">'+n1(e.qty)+(e.unit==="100g"?" "+mu(foodByName(e.food)):" ×")+' · '+n1(e.protein)+' g protein</div></div>'+
              '<div class="k">'+fmt(e.kcal)+'</div>'+ICON.chev+'</button>';
          }).join("")
        : (prev.length
            ? '<button class="link repeat" data-repeat="'+m[0]+'">+ Repeat yesterday\'s '+m[1].toLowerCase()+' ('+prev.length+' item'+(prev.length>1?"s":"")+', '+fmt(prev.reduce(function(a,e){return a+(e.kcal||0);},0))+' kcal)</button>'
            : '<div class="tiny" style="padding:10px 2px">Nothing yet.</div>')) +
      '</div>';
  }).join("");
  $$("[data-i]", box).forEach(function(b){
    b.addEventListener("click", function(){ var e = mine[+b.dataset.i]; if (e) openPicker({ entry:e }); });
  });
  $$("[data-repeat]", box).forEach(function(b){
    b.addEventListener("click", function(){
      foodLog.filter(function(e){ return e.date === yest && e.meal === b.dataset.repeat; }).forEach(function(e){
        var n = stripEntry(e); delete n.id; n.date = CUR; logEntry(n);
      });
    });
  });
}

function renderFreq(){
  var count = {}, since = addDays(TODAY, -30);
  foodLog.forEach(function(e){ if (e.date >= since) count[e.food] = (count[e.food]||0)+1; });
  var top = Object.keys(count).filter(function(n){ return foodByName(n); })
    .sort(function(a,b){ return count[b]-count[a]; }).slice(0,10);
  if (top.length < 4) {
    ["Egg, whole boiled","Whey protein","Chapati","Chicken curry, home","Tea with milk & sugar","Rice, cooked"].forEach(function(n){
      if (top.indexOf(n) < 0 && top.length < 8) top.push(n);
    });
  }
  $("foodfreq").innerHTML = top.map(function(n){ return '<button class="chip" data-n="'+esc(n)+'">'+esc(n)+'</button>'; }).join("");
  $$(".chip", $("foodfreq")).forEach(function(b){ b.addEventListener("click", function(){ openPicker({ name:b.dataset.n }); }); });
}

function searchFoods(q){
  q = q.trim().toLowerCase();
  if (!q) return [];
  var words = q.split(/\s+/);
  return allFoods().filter(function(f){
    var hay = (f.n + " " + (f.bc||"")).toLowerCase();
    return words.every(function(w){ return hay.indexOf(w) >= 0; });
  }).sort(function(a,b){
    return a.n.toLowerCase().indexOf(q) - b.n.toLowerCase().indexOf(q);
  }).slice(0,10);
}
function renderFoodSearch(){
  var q = $("foodsearch").value, box = $("foodresults");
  if (!q.trim()){ box.innerHTML = ""; box.className = ""; return; }
  var hits = searchFoods(q);
  box.className = "results";
  box.innerHTML = hits.map(function(f){
    return '<button data-n="'+esc(f.n)+'"><span>'+esc(f.n)+flagTags(f)+'</span><span class="meta">'+Math.round(f.k)+' / '+per(f)+'</span></button>';
  }).join("") +
    '<button data-new="1"><span class="new">+ New food “'+esc(q.trim())+'”</span><span class="meta">type it in</span></button>';
  $$("button", box).forEach(function(b){
    b.addEventListener("click", function(){
      var term = q.trim();
      $("foodsearch").value = ""; box.innerHTML = ""; box.className = "";
      if (b.dataset.new) openFoodForm({ food:{ n:term, u:"100g" }, after:"log" });
      else openPicker({ name:b.dataset.n });
    });
  });
}

function renderFood(){ renderFoodBars(); renderMeals(); renderFreq(); }

/* ============================ SHEET ============================ */
var sheetOnClose = null;
function openSheet(title, html, mount, onClose){
  $("sheet-title").textContent = title;
  $("sheet-body").innerHTML = html;
  $("sheet").classList.add("open"); $("scrim").classList.add("open");
  $("sheet").scrollTop = 0;
  sheetOnClose = onClose || null;
  if (mount) mount($("sheet-body"));
}
function closeSheet(){
  $("sheet").classList.remove("open"); $("scrim").classList.remove("open");
  if (sheetOnClose) { var f = sheetOnClose; sheetOnClose = null; f(); }
}

/* ---------- quantity picker: adding a food, or editing a logged entry ---------- */
function openPicker(o){
  var entry = o.entry || null;
  var f = entry ? baseOf(entry) : foodByName(o.name);
  if (!f) return;
  var meal = entry ? (entry.meal || defaultMeal()) : defaultMeal();
  var mt = milkTest(entry ? entry.date : CUR);
  var milkWarn = mt && mt.stage === "elim" && flags(f).indexOf("milk") >= 0;

  /* the same food two ways: counted in pieces, or weighed. Either needs the piece size to reach the other. */
  var m = mu(f), sg = f.sg;
  var byWeight = per100Of(f);
  var byPiece = f.u === "pc" ? f : (sg ? { n:f.n, u:"pc", mm:f.mm, sg:sg, fl:f.fl, k:f.k*sg/100, p:f.p*sg/100, c:(f.c||0)*sg/100, f:(f.f||0)*sg/100 } : null);
  var mode = f.u === "pc" ? "pc" : "w";
  var qty = entry ? Number(entry.qty) : (mode === "w" ? (sg || 100) : 1);
  function active(){ return mode === "pc" ? byPiece : byWeight; }
  function qLabel(){ return mode === "pc" ? (f.u === "pc" ? "How many" : "Servings") : (m === "ml" ? "Millilitres" : "Grams"); }
  function presets(){
    return mode === "pc" ? [[0.5,"½"],[1,"1"],[1.5,"1½"],[2,"2"],[3,"3"],[4,"4"]]
      : (sg ? [[sg, "1 piece · "+n1(sg)+" "+m],[sg*2, "2 pieces"]] : []).concat([[50,"50 "+m],[100,"100 "+m],[150,"150 "+m],[200,"200 "+m]]);
  }

  openSheet(entry ? "Edit entry" : f.n,
    (entry ? '<div class="srcline">'+esc(f.n)+' · '+prettyDate(entry.date)+'</div>' : '') +
    (milkWarn ? '<div class="banner warn"><span class="k">Milk test</span>This contains milk. It breaks the elimination — skip it until 6 Oct.</div>' : '') +
    (byPiece && byWeight
      ? '<div class="seg" style="margin:0 0 12px" id="pmode"><button data-mode="pc" class="'+(mode==="pc"?"on":"")+'">'+(f.u==="pc"?"Pieces":"Servings")+'</button>'+
        '<button data-mode="w" class="'+(mode==="w"?"on":"")+'">'+(m==="ml"?"Millilitres":"Grams")+'</button></div>'
      : '') +
    '<div class="field"><label class="lbl" for="pq" id="pq-l">'+qLabel()+'</label><input class="num" id="pq" type="number" inputmode="decimal" value="'+n1(qty)+'"></div>' +
    '<div class="chips" style="margin-top:8px" id="pq-pre"></div>' +
    '<div class="lbl" style="margin-top:14px">Meal</div><div class="seg" style="margin-top:0" id="pm">'+
      MEALS.map(function(m){ return '<button data-m="'+m[0]+'" class="'+(m[0]===meal?"on":"")+'">'+m[1]+'</button>'; }).join("")+'</div>'+
    '<div class="preview" id="pv"></div>' +
    (entry
      ? '<div class="btnrow"><button class="btn danger" id="pdel">Delete</button><button class="btn" id="pok">Save</button></div>'
      : '<div class="btnrow"><button class="btn accent" id="pok">Add to '+(CUR===TODAY?"today":prettyDate(CUR))+'<span class="ic">'+ICON.plus+'</span></button></div>') +
    (!entry ? '<div style="text-align:center;margin-top:12px"><button class="link" id="pedit">Edit this food’s numbers</button></div>' : ''),
    function(root){
      function calc(){
        var a = active(), q = num($("pq").value) || 0, x = mult(a, q);
        $("pv").innerHTML =
          '<div><div class="num">'+Math.round(a.k*x)+'</div><div class="l">kcal</div></div>'+
          '<div><div class="num">'+n1(a.p*x)+'</div><div class="l">protein</div></div>'+
          '<div><div class="num">'+n1((a.c||0)*x)+'</div><div class="l">carbs</div></div>'+
          '<div><div class="num">'+n1((a.f||0)*x)+'</div><div class="l">fat</div></div>';
        return q;
      }
      function drawPresets(){
        $("pq-pre").innerHTML = presets().map(function(p){ return '<button class="chip" data-q="'+p[0]+'">'+esc(p[1])+'</button>'; }).join("");
        $$("[data-q]", root).forEach(function(b){ b.addEventListener("click", function(){ $("pq").value = n1(+b.dataset.q); calc(); }); });
      }
      drawPresets(); calc();
      $("pq").addEventListener("input", calc);
      $$("[data-mode]", root).forEach(function(b){ b.addEventListener("click", function(){
        if (b.dataset.mode === mode) return;
        var q = num($("pq").value) || 0;
        mode = b.dataset.mode;
        $("pq").value = q ? n1(mode === "w" ? q*sg : q/sg) : "";       // 2 pieces ⇄ 2 × piece weight
        $$("[data-mode]", root).forEach(function(x){ x.className = x===b ? "on" : ""; });
        $("pq-l").textContent = qLabel();
        drawPresets(); calc();
      }); });
      $$("[data-m]", root).forEach(function(b){ b.addEventListener("click", function(){
        meal = b.dataset.m; $$("[data-m]", root).forEach(function(x){ x.className = x===b ? "on" : ""; });
      }); });
      $("pok").addEventListener("click", function(){
        var q = calc();
        if (!q) { $("pq").focus(); return; }
        if (entry) {
          var ne = makeEntry(active(), q, meal, entry.date);
          ["qty","unit","kcal","protein","carbs","fat","meal"].forEach(function(k){ entry[k] = ne[k]; });
          closeSheet(); updateEntry(entry);
        } else {
          closeSheet(); logEntry(makeEntry(active(), q, meal));
        }
      });
      if (entry) $("pdel").addEventListener("click", function(){ closeSheet(); removeEntry(entry); });
      else $("pedit").addEventListener("click", function(){ openFoodForm({ food:foodByName(f.n), after:"log" }); });
    });
}

/* ---------- food form: new, scanned, or editing an existing food ---------- */
function openFoodForm(o){
  var f = o.food || { n:"", u:"100g" }, scan = o.scan || null;
  var editing = !!(o.food && o.food.n && foodByName(o.food.n) && !scan);
  var isMine = editing && myFoods.some(function(x){ return x.n.toLowerCase() === f.n.toLowerCase(); });
  var builtin = builtinNamed(f.n);
  var unit = f.u || "100g", measure = mu(f), fl = flags(f);
  var title = scan ? "Check the label" : editing ? "Edit food" : "New food";

  openSheet(title,
    (scan ? '<div class="srcline">From '+esc(scan.source)+(scan.note ? ' · '+esc(scan.note) : '')+'</div>' : '') +
    (scan && scan.thumb ? '<img class="thumb" src="'+scan.thumb+'" alt="Photo of the packet you scanned">' : '') +
    (scan && fl.length ? '<div class="banner '+(fl.indexOf("milk")>=0 && milkTest(CUR) ? "warn" : "")+'" style="margin-top:12px"><span class="k">From the ingredients</span>'+
        (fl.indexOf("milk")>=0 ? "<b>Contains milk.</b> " : "")+(fl.indexOf("sugar")>=0 ? "<b>Has added sugar.</b> " : "")+
        (scan.per100 && scan.per100.sugar != null ? scan.per100.sugar + " g sugar per 100 g." : "")+'</div>' : '') +
    '<div class="field" style="margin-top:'+(scan?"12px":"0")+'"><label class="lbl" for="ff-n">Name</label><input id="ff-n" value="'+esc(f.n)+'" placeholder="e.g. Yoga Bar protein bar"></div>' +
    '<div class="grid2" style="margin-top:12px">'+
      '<div><div class="lbl">Measured in</div><div class="seg" style="margin-top:0" id="ff-mm">'+
        '<button data-mm="g" class="'+(measure==="g"?"on":"")+'">Grams</button><button data-mm="ml" class="'+(measure==="ml"?"on":"")+'">ml</button></div></div>'+
      '<div class="field"><label class="lbl" for="ff-sg" id="ff-sgl"></label><input class="num" id="ff-sg" type="number" inputmode="decimal" placeholder="e.g. 40" value="'+(f.sg?n1(f.sg):"")+'"></div>'+
    '</div>' +
    '<div class="lbl" style="margin-top:12px">Numbers are</div><div class="seg" style="margin-top:0" id="ff-u">'+
      '<button data-u="pc" class="'+(unit==="pc"?"on":"")+'">Per piece / serving</button><button data-u="100g" class="'+(unit==="100g"?"on":"")+'" id="ff-u100"></button></div>' +
    '<div class="grid4" style="margin-top:12px">'+
      fld("ff-k","Kcal",f.k)+fld("ff-p","Protein",f.p)+fld("ff-c","Carbs",f.c)+fld("ff-f","Fat",f.f)+
    '</div>' +
    '<div class="tiny" id="ff-eq" style="margin-top:8px"></div>' +
    '<div class="lbl" style="margin-top:12px">Flags</div><div class="chips" id="ff-fl">'+
      '<button class="chip'+(fl.indexOf("milk")>=0?" on":"")+'" data-fl="milk">Contains milk</button>'+
      '<button class="chip'+(fl.indexOf("sugar")>=0?" on":"")+'" data-fl="sugar">Added sugar</button></div>' +
    ((scan && scan.ingredients) || f.ing ? '<details style="margin-top:8px"><summary>Ingredients</summary><div class="ing">'+esc((scan && scan.ingredients) || f.ing)+'</div></details>' : '') +
    '<div id="ff-msg"></div>' +
    '<div class="btnrow">'+
      (o.after === "log" || scan ? '<button class="btn quiet" id="ff-save">Save only</button><button class="btn accent" id="ff-log">Save &amp; log<span class="ic">'+ICON.arrow+'</span></button>'
                                 : '<button class="btn" id="ff-save">Save</button>')+
    '</div>' +
    (scan && scanner.label && scan.source.indexOf("Label photo") < 0 ? '<div style="text-align:center;margin-top:12px"><button class="link" id="ff-relabel">Numbers look wrong? Read the label photo instead</button></div>' : '') +
    (editing && (isMine) ? '<div style="text-align:center;margin-top:14px"><button class="link" id="ff-del" style="color:var(--bad)">'+(builtin ? "Reset to built-in values" : "Delete this food")+'</button></div>' : ''),
    function(root){
      var NUMS = ["ff-k","ff-p","ff-c","ff-f"];
      function labels(){
        $("ff-u100").textContent = "Per 100 " + measure;
        $("ff-sgl").innerHTML = "1 piece / serving, " + measure + (unit === "pc" ? "" : ' <span class="muted">— optional</span>');
      }
      /* show the other basis underneath, so a wrong piece size is obvious at a glance */
      function equiv(){
        var sg = num($("ff-sg").value), k = num($("ff-k").value), p = num($("ff-p").value);
        if (!sg || !k) { $("ff-eq").textContent = unit === "pc" ? "Add the piece size to also log it by weight." : ""; return; }
        var r = unit === "pc" ? 100/sg : sg/100;
        $("ff-eq").textContent = "= " + Math.round(k*r) + " kcal · " + n1((p||0)*r) + " g protein " +
          (unit === "pc" ? "per 100 " + measure : "per piece (" + n1(sg) + " " + measure + ")");
      }
      labels(); equiv();

      $$("[data-mm]", root).forEach(function(b){ b.addEventListener("click", function(){
        measure = b.dataset.mm; $$("[data-mm]", root).forEach(function(x){ x.className = x===b ? "on" : ""; }); labels(); equiv();
      }); });
      $$("[data-u]", root).forEach(function(b){ b.addEventListener("click", function(){
        var to = b.dataset.u; if (to === unit) return;
        var sg = num($("ff-sg").value), has = NUMS.some(function(id){ return num($(id).value); });
        if (has && !sg) {
          $("ff-msg").innerHTML = '<div class="hint">Enter how much one piece weighs first — then the numbers convert.</div>';
          $("ff-sg").focus(); return;
        }
        if (has) {                                        // per piece ⇄ per 100: scale by piece size / 100
          var r = to === "pc" ? sg/100 : 100/sg;
          NUMS.forEach(function(id){ var v = num($(id).value); if (v != null) $(id).value = n1(v*r); });
        }
        unit = to; $$("[data-u]", root).forEach(function(x){ x.className = x===b ? "on" : ""; });
        labels(); check(); equiv();
      }); });
      $$("[data-fl]", root).forEach(function(b){ b.addEventListener("click", function(){ b.classList.toggle("on"); }); });
      NUMS.concat(["ff-sg"]).forEach(function(id){ $(id).addEventListener("input", function(){ check(); equiv(); }); });

      /* labels lie less often than OCR does: protein·4 + carbs·4 + fat·9 should land near the printed kcal */
      function check(){
        var k = num($("ff-k").value), p = num($("ff-p").value)||0, c = num($("ff-c").value)||0, fa = num($("ff-f").value)||0;
        var msg = "";
        if (k && (p||c||fa)) {
          var est = p*4 + c*4 + fa*9;
          if (Math.abs(est - k) > Math.max(25, k*0.2)) msg = '<div class="hint">These don\'t add up — protein, carbs and fat give about '+Math.round(est)+' kcal. Check the label.</div>';
        }
        if (unit === "100g" && k > 900) msg = '<div class="hint">Over 900 kcal per 100 '+measure+' is impossible — is this per piece?</div>';
        if (unit === "pc" && !num($("ff-sg").value)) msg += '<div class="tiny" style="margin-top:6px">Tip: add the piece size and you can log it by weight too.</div>';
        $("ff-msg").innerHTML = msg;
      }
      check();

      function collect(){
        var name = $("ff-n").value.trim(), k = num($("ff-k").value);
        if (!name){ $("ff-msg").innerHTML = '<div class="err">Give it a name.</div>'; $("ff-n").focus(); return null; }
        if (!k){ $("ff-msg").innerHTML = '<div class="err">It needs at least a calorie figure.</div>'; $("ff-k").focus(); return null; }
        var clash = foodByName(name);
        if (clash && name.toLowerCase() !== String(f.n).toLowerCase() && !clash.b) {
          $("ff-msg").innerHTML = '<div class="err">You already have a food called “'+esc(name)+'”.</div>'; return null;
        }
        return { n:name, u:unit, k:k, p:num($("ff-p").value)||0, c:num($("ff-c").value)||0, f:num($("ff-f").value)||0,
                 sg: num($("ff-sg").value), mm: measure,
                 bc: f.bc || (scan && scan.barcode) || "",
                 ing: (scan && scan.ingredients) || f.ing || "",
                 fl: $$("[data-fl]", root).filter(function(b){ return b.classList.contains("on"); }).map(function(b){ return b.dataset.fl; }).join(","),
                 old: editing && f.n !== name ? f.n : "" };
      }
      function save(then){
        var nf = collect(); if (!nf) return;
        myFoods = myFoods.filter(function(x){
          var n = x.n.toLowerCase(); return n !== nf.n.toLowerCase() && n !== String(nf.old).toLowerCase();
        });
        var keep = {}; Object.keys(nf).forEach(function(k){ if (k !== "old") keep[k] = nf[k]; });
        myFoods.unshift(keep);
        api.saveFood(nf, function(){ toast("Saved to your foods"); }, failed("save the food"));
        closeSheet();
        renderFood();
        if (then === "log") openPicker({ name:nf.n });
        else if (o.back) o.back();
      }
      $("ff-save").addEventListener("click", function(){ save(); });
      if ($("ff-log")) $("ff-log").addEventListener("click", function(){ save("log"); });
      if ($("ff-relabel")) $("ff-relabel").addEventListener("click", function(){ runLabelRead(scan.canvas, scan.barcode); });
      if ($("ff-del")) $("ff-del").addEventListener("click", function(){
        var b = $("ff-del");
        if (!b.dataset.sure){ b.dataset.sure = 1; b.textContent = "Tap again to confirm"; return; }
        myFoods = myFoods.filter(function(x){ return x.n.toLowerCase() !== f.n.toLowerCase(); });
        api.deleteFood(f.n, function(){ toast(builtin ? "Back to built-in values" : "Deleted"); }, failed("delete it"));
        closeSheet(); renderFood();
        if (o.back) o.back();
      });
    });
  function fld(id, l, v){ return '<div><label class="lbl" for="'+id+'">'+l+'</label><input class="num" id="'+id+'" type="number" inputmode="decimal" value="'+(v==null||v===""?"":n1(v))+'"></div>'; }
}

/* ---------- the food library ---------- */
function openLibrary(){
  openSheet("My foods",
    '<input id="lib-q" placeholder="Search '+allFoods().length+' foods" autocomplete="off">'+
    '<div class="chips" style="margin-top:10px" id="lib-f"><button class="chip on" data-f="all">All</button><button class="chip" data-f="mine">Added or edited</button><button class="chip" data-f="scanned">Scanned</button></div>'+
    '<div class="results" id="lib-list" style="margin-top:10px"></div>'+
    '<div class="btnrow"><button class="btn quiet" id="lib-new">'+'+ New food'+'</button></div>',
    function(){
      var filter = "all";
      function draw(){
        var q = $("lib-q").value.trim().toLowerCase();
        var list = allFoods().filter(function(f){
          if (filter === "mine" && f.b) return false;
          if (filter === "scanned" && !f.bc) return false;
          return !q || f.n.toLowerCase().indexOf(q) >= 0;
        }).sort(function(a,b){ return a.n.localeCompare(b.n); });
        $("lib-list").innerHTML = list.length ? list.map(function(f){
          var edited = !f.b && builtinNamed(f.n);
          return '<button data-n="'+esc(f.n)+'"><span>'+esc(f.n)+(edited?'<span class="tag edited">edited</span>':(!f.b?'<span class="tag">yours</span>':''))+flagTags(f)+'</span>'+
                 '<span class="meta">'+Math.round(f.k)+' kcal · '+n1(f.p)+' P / '+per(f)+'</span></button>';
        }).join("") : '<div class="empty">Nothing matches.</div>';
        $$("button", $("lib-list")).forEach(function(b){
          b.addEventListener("click", function(){ openFoodForm({ food:foodByName(b.dataset.n), back:openLibrary }); });
        });
      }
      $("lib-q").addEventListener("input", draw);
      $$("[data-f]", $("lib-f")).forEach(function(b){ b.addEventListener("click", function(){
        filter = b.dataset.f; $$("[data-f]", $("lib-f")).forEach(function(x){ x.className = "chip" + (x===b ? " on" : ""); }); draw();
      }); });
      $("lib-new").addEventListener("click", function(){ openFoodForm({ food:{n:"",u:"100g"}, back:openLibrary }); });
      draw();
    });
}

/* ============================ PACKET SCANNER ============================
   1. Photograph the back of the packet.
   2. Look for a barcode on the phone itself. Seen it before → straight to quantity.
   3. Ask Open Food Facts about the barcode.
   4. No barcode, or no data → the label is read on the phone (OCR), then parsed in label.js.
   Every path ends at a form you check before anything is saved. */
function openScanner(){
  var live = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  openSheet("Scan a packet",
    '<div class="scanhero">'+ICON.camera+
      '<div class="t">Scan the packet</div>'+
      '<div class="s">Live scan reads the barcode by itself. A photo can read the nutrition table too.</div></div>'+
    (live ? '<div class="btnrow"><button class="btn accent" id="sc-live">Scan live<span class="ic">'+ICON.arrow+'</span></button></div>' : '')+
    '<div class="btnrow" style="margin-top:8px"><button class="btn'+(live?" quiet":" accent")+'" id="sc-cam">Take photo</button><button class="btn quiet" id="sc-gal">From gallery</button></div>'+
    '<details style="margin-top:14px"><summary>Paste text from Google Lens</summary>'+
      '<p class="tiny" style="margin:8px 0">In Google Lens: point at the nutrition table, tap Text, tap Select all, tap Copy. Paste it here.</p>'+
      '<textarea id="sc-text" placeholder="Energy 480 kcal  Protein 6 g …"></textarea>'+
      '<div class="btnrow"><button class="btn" id="sc-read">Read this text</button></div></details>'+
    '<details><summary>Type the barcode instead</summary>'+
      '<div class="searchrow"><input class="num" id="sc-code" inputmode="numeric" placeholder="8901234567890"><button class="btn sm" id="sc-go">Look up</button></div></details>',
    function(){
      if (live) $("sc-live").addEventListener("click", openLive);
      $("sc-cam").addEventListener("click", function(){ $("cam").click(); });
      $("sc-gal").addEventListener("click", function(){ $("gallery").click(); });
      $("sc-go").addEventListener("click", function(){
        var code = $("sc-code").value.replace(/\D/g,"");
        if (code.length >= 8) handleBarcode(code, null);
      });
      $("sc-read").addEventListener("click", function(){
        var r = parseLabelText_($("sc-text").value);
        if (!r.readable) { toast("No calories found in that text. Copy the whole table.", true); return; }
        r.source = "Pasted text"; r.note = "Check every number against the packet";
        openFoodForm({ scan: scanResult(r, "", null), food: foodFromScan(r, ""), after:"log" });
      });
    });
}

/* ---- live camera ---- */
var liveStream = null, detectorP = null;
function stopLive(){
  if (liveStream) { liveStream.getTracks().forEach(function(t){ t.stop(); }); liveStream = null; }
}
/** The browser's own barcode reader (Android), or a free one downloaded on first use (iPhone, Windows, Mac). */
function getDetector(){
  if (!detectorP) detectorP = ("BarcodeDetector" in window
      ? Promise.resolve(window.BarcodeDetector)
      : import("https://cdn.jsdelivr.net/npm/barcode-detector@2.3.1/dist/es/pure.min.js").then(function(m){ return m.BarcodeDetector; }))
    .then(function(D){ return new D({ formats:["ean_13","ean_8","upc_a","upc_e"] }); })
    .catch(function(){ detectorP = null; return null; });
  return detectorP;
}
function grabFrame(v){
  var c = document.createElement("canvas");
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext("2d").drawImage(v, 0, 0);
  return c;
}
function openLive(){
  openSheet("Live scan",
    '<div class="live"><video id="lv" playsinline muted></video><div class="aim"></div></div>'+
    '<p class="sub" id="lv-msg">Starting the camera…</p>'+
    '<div class="btnrow"><button class="btn" id="lv-snap">Read the nutrition table</button></div>'+
    '<p class="tiny">For the table: fill the frame with it, hold still, then tap the button.</p>',
    function(){
      $("lv-snap").addEventListener("click", function(){
        var v = $("lv"); if (!v || !v.videoWidth) return;
        var c = grabFrame(v); stopLive(); runLabelRead(c, "");
      });
      navigator.mediaDevices.getUserMedia({ audio:false, video:{ facingMode:{ ideal:"environment" }, width:{ ideal:1920 }, height:{ ideal:1080 } } })
        .then(function(st){
          var v = $("lv");
          if (!v) { st.getTracks().forEach(function(t){ t.stop(); }); return; }
          liveStream = st; v.srcObject = st; v.play();
          getDetector().then(function(det){
            if (!$("lv-msg")) return;
            $("lv-msg").textContent = det ? "Point at the barcode. It reads by itself." : "Barcodes can not be read live here. Use the button for the nutrition table.";
            if (!det) return;
            (function tick(){
              if (!liveStream || $("lv") !== v) { stopLive(); return; }       // the sheet was closed or replaced
              if (v.readyState < 2) { setTimeout(tick, 300); return; }
              det.detect(v).then(function(r){
                if (!liveStream) return;
                if (r && r.length) { stopLive(); if (navigator.vibrate) navigator.vibrate(60); handleBarcode(r[0].rawValue, null); }
                else setTimeout(tick, 250);
              }).catch(function(){ setTimeout(tick, 600); });
            })();
          });
        })
        .catch(function(){ scanFail("The camera did not open. Allow the camera for this site, or take a photo instead.", null, ""); });
    }, stopLive);
}

function scanProgress(steps, thumb){
  openSheet("Reading the packet",
    (thumb ? '<img class="thumb" src="'+thumb+'" alt="Photo of the packet">' : '')+
    '<ul class="steps" id="sc-steps">'+steps.map(function(s,i){ return '<li data-i="'+i+'"><span class="dot"></span>'+esc(s)+'</li>'; }).join("")+'</ul>');
}
function stepTo(i){
  $$("#sc-steps li").forEach(function(li){
    var k = +li.dataset.i; li.className = k < i ? "done" : k === i ? "on" : "";
  });
}
function scanFail(msg, canvas, code){
  openSheet("Couldn't read it",
    '<div class="banner bad"><span class="k">Scanner</span>'+esc(msg)+'</div>'+
    '<div class="btnrow"><button class="btn quiet" id="sf-again">Try another photo</button><button class="btn" id="sf-type">Type it in</button></div>',
    function(){
      $("sf-again").addEventListener("click", openScanner);
      $("sf-type").addEventListener("click", function(){ openFoodForm({ food:{n:"",u:"100g",bc:code||""}, after:"log" }); });
    });
}

function onPhoto(file){
  if (!file) return;
  loadToCanvas(file, 1600, function(canvas){
    if (!canvas) { scanFail("That photo couldn't be opened.", null, null); return; }
    var thumb = canvas.toDataURL("image/jpeg", 0.5);
    scanProgress(["Looking for a barcode","Checking the food databases","Reading the label"], thumb);
    stepTo(0);
    detectBarcode(canvas, function(code){
      if (code) handleBarcode(code, canvas);
      else if (scanner.label) runLabelRead(canvas, "");
      else scanFail("No barcode found, and label reading is off. Try a sharper photo of the barcode, or type the food in.", canvas, "");
    });
  });
}

function loadToCanvas(file, max, cb){
  var url = URL.createObjectURL(file), img = new Image();
  img.onload = function(){
    var s = Math.min(1, max/Math.max(img.naturalWidth, img.naturalHeight));
    var c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth*s); c.height = Math.round(img.naturalHeight*s);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url); cb(c);
  };
  img.onerror = function(){ URL.revokeObjectURL(url); cb(null); };
  img.src = url;
}

function detectBarcode(src, cb){
  getDetector().then(function(d){ return d ? d.detect(src) : []; })
    .then(function(r){ cb(r && r.length ? r[0].rawValue : null); })
    .catch(function(){ cb(null); });
}

function handleBarcode(code, canvas){
  var known = foodByBarcode(code);
  if (known) { closeSheet(); toast("Known packet"); openPicker({ name:known.n }); return; }
  if (!canvas) scanProgress(["Looking for a barcode","Checking the food databases","Reading the label"], null);
  stepTo(1);
  api.lookupBarcode(code, function(r){
    if (r && r.found && r.complete) {
      openFoodForm({ scan: scanResult(r, code, canvas), food: foodFromScan(r, code), after:"log" });
    } else if (canvas && scanner.label) {
      runLabelRead(canvas, code);
    } else {
      scanFail(r && r.found ? "That barcode is listed, but without nutrition values. Photograph the nutrition table instead."
                            : "That barcode isn't in Open Food Facts yet. Photograph the nutrition table instead.", canvas, code);
    }
  }, function(){ if (canvas && scanner.label) runLabelRead(canvas, code); else scanFail("Couldn't reach the food database.", canvas, code); });
}

function runLabelRead(canvas, code){
  if (!canvas) { scanFail("No photo to read.", null, code); return; }
  if (!$("sc-steps")) scanProgress(["Looking for a barcode","Checking the food databases","Reading the label"], canvas.toDataURL("image/jpeg",0.5));
  stepTo(2);
  api.readLabel(canvas, function(r){
    if (!r || !r.ok) { scanFail((r && r.error) || "Couldn't read the label.", canvas, code); return; }
    openFoodForm({ scan: scanResult(r, code, canvas), food: foodFromScan(r, code), after:"log" });
  }, function(){ scanFail("The label reader couldn't start. The first label needs an internet connection to download the reader.", canvas, code); });
}

function foodFromScan(r, code){
  var p = r.per100 || {}, fl = [];
  if (r.contains_milk) fl.push("milk");
  if (r.added_sugar) fl.push("sugar");
  var base = { n: (r.name || "").slice(0, 60), u:"100g", k:p.kcal, p:p.protein, c:p.carbs, f:p.fat, mm: r.measure === "ml" ? "ml" : "g",
               sg: r.serving_g, bc: code || "", ing: r.ingredients || "", fl: fl.join(",") };
  // packets are eaten by the piece — when the label prints a serving size, start there
  if (!r.serving_g) return base;
  var x = r.serving_g / 100;
  ["k","p","c","f"].forEach(function(key){ if (base[key] != null) base[key] = n1(base[key]*x); });
  base.u = "pc";
  return base;
}
function scanResult(r, code, canvas){
  return { source:r.source, note:r.note || "", ingredients:r.ingredients || "", per100:r.per100 || {},
           barcode: code || "", canvas: canvas, thumb: canvas ? canvas.toDataURL("image/jpeg", 0.5) : null };
}

/* ============================ RENDER: PROGRESS ============================ */
/** Where the plan says you should be on a day: the start weight, falling at your pace, stopping at the goal. */
function planLineAt(ms){
  var p = plan();
  if (p.w0 == null || p.goal == null) return null;
  return Math.max(p.goal, p.w0 - p.pace * (ms - parseIso(p.start).getTime())/DAY/7);
}
/** When the plan line reaches the goal, in ms. */
function planEnd(){
  var p = plan();
  if (p.w0 == null || p.goal == null || p.w0 <= p.goal) return null;
  return parseIso(p.start).getTime() + (p.w0 - p.goal)/p.pace*7*DAY;
}
/** Share of days in the range with a complete food log (1,200 kcal or more). */
function loggedShare(fromIso, toIso){
  var n = 0, total = 0;
  for (var s = fromIso; s <= toIso; s = addDays(s, 1)){ total++; if (foodTotals(s).kcal >= 1200) n++; }
  return total ? n/total : 0;
}

/**
 * The Sunday verdict. One decision, made with a rule instead of a mood.
 *   c.rate       kg lost per week over the last 3 weeks (positive = losing), or null
 *   c.needed     the pace you chose, kg/week (null with no goal)
 *   c.logged     share of the last 7 days with a complete food log, 0–1
 *   c.steps      average daily steps over the last 7 days (0 if none entered)
 *   c.waistDelta waist change over ~2 weeks in cm (negative = smaller), or null
 *   c.week       current programme week
 * Returns { tone: "good"|"warn"|"bad"|"", title, text, adjust } where adjust is
 * a kcal change to suggest (e.g. -150), or 0 for "change nothing".
 */
function checkinVerdict(c){
  // Order matters: data first, then behaviour, then numbers. Never change calories on a week you didn't log.
  if (c.rate === null)
    return { tone:"", title:"Keep weighing in", text:"Ten or more mornings of weigh-ins over two weeks and the verdict appears. Until then, stick to the target.", adjust:0 };
  if (c.logged < 5/7)
    return { tone:"warn", title:"Fix the logging first", text:"Only " + Math.round(c.logged*7) + " of the last 7 days were fully logged. Without them the numbers can't be trusted — change nothing and log every day this week.", adjust:0 };
  if (c.rate < 0.35 && c.waistDelta !== null && c.waistDelta <= -1)
    return { tone:"good", title:"Recomposition — change nothing", text:"The scale is slow but your waist is down " + Math.abs(c.waistDelta).toFixed(1) + " cm. That's fat leaving while muscle holds. Trust the tape.", adjust:0 };
  if (c.rate < 0.35 && c.steps && c.steps < STEP_GOAL - 1000)
    return { tone:"bad", title:"Stalled — walk first", text:"Under 0.35 kg a week, and steps are averaging " + fmt(c.steps) + ". Get to " + fmt(STEP_GOAL) + " a day before touching food. Still slow next Sunday: take 150 kcal off.", adjust:0 };
  if (c.rate < 0.35)
    return { tone:"bad", title:"Stalled — take 150 off", text:"Under 0.35 kg a week" + (c.steps ? " with steps already at " + fmt(c.steps) : "") + ". Take 150 kcal off, from carbs. Protein stays where it is.", adjust:-150 };
  if (c.rate > 1.1 && c.week > 4)
    return { tone:"warn", title:"Too fast — eat a little more", text:"Over 1.1 kg a week costs muscle and sets up the binge. Add 150 kcal, from carbs around training.", adjust:150 };
  if (c.needed !== null && c.rate < c.needed - 0.15)
    return { tone:"warn", title:"Slower than your pace", text:"A healthy rate, but slower than the " + c.needed.toFixed(2) + " kg/week you chose. Push steps before cutting food, or lower the pace in Settings. The date can move; your muscle can't come back.", adjust:0 };
  return { tone:"good", title:"On track — change nothing", text:"Losing " + c.rate.toFixed(2) + " kg a week with " + Math.round(c.logged*7) + " of 7 days logged. This is the plan working. Same again next week.", adjust:0 };
}

function renderStats(){
  var tr = trendSeries(), last = tr.length ? tr[tr.length-1] : null;
  var rate = lossRate(21), est = maintenanceEstimate(), now = midnight(new Date());
  var p = plan();
  // the finish date is an answer, not a deadline: it moves with your real rate
  var eta = last && p.goal != null && rate !== null && rate > 0.05 && last.t > p.goal ? new Date(now.getTime() + (last.t - p.goal)/rate*7*DAY) : null;
  var line = planLineAt(now.getTime()), vsLine = last && line !== null ? last.t - line : null;
  var html = [
    ['<span>'+(last ? last.t.toFixed(1) : "—")+'</span><small>kg</small>', 'Trend weight', ''],
    ['<span>'+(rate === null ? "—" : (rate>=0?"−":"+")+Math.abs(rate).toFixed(2))+'</span><small>kg/wk</small>', 'Last 3 weeks',
      rate === null ? "" : rate >= 0.45 && rate <= 1.1 ? "good" : rate > 1.1 ? "warn" : "bad"],
    ['<span>'+(eta ? eta.toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—")+'</span><small>'+(eta ? eta.getFullYear() : "")+'</small>',
      p.goal == null ? "Set a goal to see the date" : 'Goal of '+p.goal+' kg at this pace',
      eta === null || rate === null ? "" : rate >= p.pace - 0.15 ? "good" : "warn"],
    ['<span>'+(vsLine === null ? "—" : (vsLine<=0?"−":"+")+Math.abs(vsLine).toFixed(1))+'</span><small>kg</small>', vsLine === null ? "vs plan line" : (vsLine <= 0 ? "Ahead of the plan line" : "Behind the plan line"),
      vsLine === null ? "" : vsLine <= 0.5 ? "good" : vsLine <= 2 ? "warn" : "bad"],
    ['<span>'+(est ? fmt(round50(est.tdee)) : "—")+'</span><small>kcal</small>', est ? "Your maintenance, measured" : "Maintenance — needs 3 weeks of logs", ''],
    ['<span>'+fmt(kcalTarget(day(TODAY)))+'</span><small>kcal</small>', 'Current target', '']
  ].map(function(s){ return '<div class="stat"><div class="n '+s[2]+'">'+s[0]+'</div><div class="l">'+s[1]+'</div></div>'; }).join("");
  $("stats").innerHTML = html;
}

function renderChart(){
  var box = $("chart"), tr = trendSeries(), p = plan();
  $("chart-aside").textContent = p.w0 != null && p.goal != null ? n1(p.w0) + " → " + p.goal + " KG" : "";
  if (tr.length < 2){ box.innerHTML = '<div class="empty">Two mornings of weigh-ins and the line appears.</div>'; return; }
  var W=600,H=260,ml=34,mr=10,mt=14,mb=24, iw=W-ml-mr, ih=H-mt-mb;
  var ms=function(s){ return parseIso(s).getTime(); };
  var today = midnight(new Date()).getTime(), pe = planEnd();
  // the chart runs from your first day to the end of the plan line, and never stops short of next month
  var t0 = Math.min(ms(p.start), ms(tr[0].date)), t1 = Math.max(today + 28*DAY, pe || 0);
  var vals = tr.map(function(q){return q.w;}).concat(p.w0 != null ? [p.w0] : [], p.goal != null ? [p.goal] : []);
  var lo=Math.floor(Math.min.apply(null,vals)-1.5), hi=Math.ceil(Math.max.apply(null,vals)+1.5);
  var x=function(t){ return ml+(t-t0)/(t1-t0)*iw; }, y=function(v){ return mt+(hi-v)/(hi-lo)*ih; };
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Weight trend against the plan line">';
  var step = hi - lo > 16 ? 4 : 2;
  for (var v=Math.ceil(lo/step)*step; v<=hi; v+=step){
    s+='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+y(v).toFixed(1)+'" y2="'+y(v).toFixed(1)+'" stroke="var(--line)" stroke-width="1"/>'+
       '<text x="'+(ml-6)+'" y="'+(y(v)+4).toFixed(1)+'" text-anchor="end" font-size="11" fill="var(--ink-3)">'+v+'</text>';
  }
  var months = (t1 - t0)/DAY/30.4, every = months > 16 ? 3 : months > 8 ? 2 : 1, d0 = new Date(t0), k = 0;
  for (var d = new Date(d0.getFullYear(), d0.getMonth()+1, 1); d.getTime() < t1; d = new Date(d.getFullYear(), d.getMonth()+1, 1), k++){
    if (k % every === 0) s+='<text x="'+(x(d.getTime())+2).toFixed(1)+'" y="'+(H-6)+'" font-size="11" fill="var(--ink-3)">'+d.toLocaleDateString("en-IN",{month:"short"}).toUpperCase()+'</text>';
  }
  if (pe) s+='<path d="M'+x(ms(p.start)).toFixed(1)+' '+y(p.w0).toFixed(1)+' L'+x(pe).toFixed(1)+' '+y(p.goal).toFixed(1)+
     '" fill="none" stroke="var(--ink-3)" stroke-width="1.5" stroke-dasharray="4 5"/>';
  if (p.goal != null) s+='<text x="'+(W-mr)+'" y="'+(y(p.goal)-6).toFixed(1)+'" text-anchor="end" font-size="11" fill="var(--ink-2)">GOAL · '+p.goal+'</text>';
  var nx = x(today);
  s+='<line x1="'+nx.toFixed(1)+'" y1="'+mt+'" x2="'+nx.toFixed(1)+'" y2="'+(mt+ih)+'" stroke="var(--accent)" stroke-opacity=".35" stroke-width="1"/>';
  tr.forEach(function(q){
    s+='<circle cx="'+x(ms(q.date)).toFixed(1)+'" cy="'+y(q.w).toFixed(1)+'" r="2.4" fill="var(--ink-3)" fill-opacity=".55"/>';
  });
  s+='<path d="'+tr.map(function(q,i){ return (i?"L":"M")+x(ms(q.date)).toFixed(1)+" "+y(q.t).toFixed(1); }).join(" ")+
     '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
  var L = tr[tr.length-1], lx = x(ms(L.date)), ly = y(L.t);
  s+='<circle cx="'+lx.toFixed(1)+'" cy="'+ly.toFixed(1)+'" r="4" fill="var(--accent)" stroke="var(--card)" stroke-width="2"/>'+
     '<text x="'+lx.toFixed(1)+'" y="'+(ly-11).toFixed(1)+'" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)" stroke="var(--card)" stroke-width="4" paint-order="stroke">'+L.t.toFixed(1)+'</text>';
  box.innerHTML = s + '</svg>';
}

function renderCheckin(){
  var box = $("checkin"), now = midnight(new Date()), tr = trendSeries();
  var last = tr.length ? tr[tr.length-1] : null, rate = lossRate(21);
  var p = plan(), needed = last && p.goal != null && last.t > p.goal ? p.pace : null;
  var waists = tr.filter(function(p){ return p.waist != null && p.waist !== ""; });
  var wd = null;
  if (waists.length >= 2) {
    var lw = waists[waists.length-1], pw = null;
    waists.forEach(function(p){ if (p.date <= addDays(lw.date, -10)) pw = p; });
    if (pw) wd = Number(lw.waist) - Number(pw.waist);
  }
  var c = { rate:rate, needed:needed, logged:loggedShare(addDays(TODAY,-6), TODAY), steps:avgSteps(addDays(TODAY,-6), TODAY), waistDelta:wd, week:weekNo(TODAY) };
  var v = checkinVerdict(c);
  var est = maintenanceEstimate(), cur = cfg().kcal;
  var suggested = null;
  if (!v.adjust) {
    // the verdict says hold — offering a new number next to "change nothing" would contradict it
  } else {
    // aim from measured maintenance when we have it, but move at most one step, in the verdict's direction
    var aim = cur + v.adjust;
    if (est && needed !== null) {
      var want = clamp(needed, 0.35, Math.min(1.0, (last ? last.t : 100) * 0.01));
      aim = round50(est.tdee - want*KCAL_PER_KG/7);
    }
    var lo = v.adjust < 0 ? cur + v.adjust : cur + 50, hi = v.adjust < 0 ? cur - 50 : cur + v.adjust;
    suggested = clamp(round50(clamp(aim, lo, hi)), 1900, 3200);
  }
  box.className = "card verdict " + (v.tone || "");
  box.innerHTML =
    '<h2>Weekly check-in <span class="aside">'+(rate===null?"NEEDS 10+ DAYS OF WEIGH-INS":"YOUR PACE "+(needed===null?"—":needed.toFixed(2))+" KG/WK")+'</span></h2>'+
    '<div class="title">'+esc(v.title)+'</div><p class="sub">'+esc(v.text)+'</p>'+
    '<div class="tiny">Logged '+Math.round(c.logged*7)+' of 7 days'+(c.steps?' · '+fmt(c.steps)+' steps a day':'')+(wd!==null?' · waist '+(wd<=0?"−":"+")+Math.abs(wd).toFixed(1)+' cm in two weeks':'')+'</div>'+
    (suggested !== null && Math.abs(suggested - cur) >= 50
      ? '<div class="suggest"><div><div class="tiny">'+(est ? "From your measured maintenance of "+fmt(round50(est.tdee)) : "Suggested")+'</div><div class="num">'+fmt(suggested)+' kcal</div></div>'+
        '<button class="btn sm" id="apply-kcal">Use this</button></div>'
      : '');
  if ($("apply-kcal")) $("apply-kcal").addEventListener("click", function(){
    setSetting("kcal", suggested);
    if (est) setSetting("maint", round50(est.tdee));
    toast("Target set to " + fmt(suggested) + " kcal");
    renderAll();
  });
}

function renderWeeks(){
  var w = weekNo(TODAY);
  if (w < 1){ $("weeks").innerHTML = '<div class="empty">No weeks yet.</div>'; return; }
  var rows = [];
  for (var i = w; i >= Math.max(1, w-7); i--){
    var a = weekStart(i), b = addDays(a, 6), k = 0, p = 0, n = 0;
    for (var s = a; s <= b && s <= TODAY; s = addDays(s,1)){
      var t = foodTotals(s);
      if (t.kcal >= 1200){ k += t.kcal; p += t.p; n++; }
    }
    var tEnd = trendOn(b > TODAY ? TODAY : b), tStart = trendOn(addDays(a,-1));
    rows.push({ w:i, k: n ? k/n : null, p: n ? p/n : null, n:n,
                st: avgSteps(a, b > TODAY ? TODAY : b), t:tEnd, d: tEnd!=null && tStart!=null ? tEnd - tStart : null });
  }
  var c = cfg();
  $("weeks").innerHTML = '<table><thead><tr><th>Wk</th><th>Avg kcal</th><th>Protein</th><th>Steps</th><th>Trend</th><th>Δ</th></tr></thead><tbody>'+
    rows.map(function(r){
      return '<tr><td>'+String(r.w).padStart(2,"0")+'</td>'+
        '<td class="'+(r.k==null?"m":Math.abs(r.k-c.kcal)<=200?"g":r.k>c.kcal?"w":"")+'">'+(r.k==null?"—":fmt(r.k))+'</td>'+
        '<td class="'+(r.p==null?"m":r.p>=c.protein-5?"g":"")+'">'+(r.p==null?"—":Math.round(r.p))+'</td>'+
        '<td class="'+(!r.st?"m":r.st>=STEP_GOAL?"g":r.st<STEP_GOAL-3000?"w":"")+'">'+(r.st?(r.st/1000).toFixed(1)+"k":"—")+'</td>'+
        '<td>'+(r.t==null?"—":r.t.toFixed(1))+'</td>'+
        '<td class="'+(r.d==null?"m":r.d<=0?"g":"w")+'">'+(r.d==null?"—":(r.d>0?"+":"−")+Math.abs(r.d).toFixed(1))+'</td></tr>';
    }).join("")+'</tbody></table>';
}

function renderWeighins(){
  var tr = trendSeries().slice().reverse().slice(0,14);
  if (!tr.length){ $("weighins").innerHTML = '<div class="empty">No weigh-ins yet.</div>'; return; }
  $("weighins").innerHTML = '<table><thead><tr><th>Date</th><th>Scale</th><th>Trend</th><th>Waist</th></tr></thead><tbody>'+
    tr.map(function(p){
      return '<tr><td>'+prettyDate(p.date,{day:"numeric",month:"short"})+'</td><td>'+p.w.toFixed(1)+'</td><td>'+p.t.toFixed(1)+'</td><td class="'+(p.waist?"":"m")+'">'+(p.waist||"—")+'</td></tr>';
    }).join("")+'</tbody></table>';
}

function renderProgress(){ renderStats(); renderChart(); renderCheckin(); renderWeeks(); renderWeighins(); }

/* ============================ RENDER: PLAN ============================ */
function renderPlan(){
  var c = cfg(), p = plan(), pi = stageNow(), pe = planEnd();
  $("pane-plan").innerHTML =
  '<div class="card">'+
    '<h2>The shape of it <span class="aside">'+(p.w0 != null && p.goal != null ? n1(p.w0)+" → "+p.goal+" KG" : "NO GOAL YET")+'</span></h2>'+
    '<div class="timeline">'+STAGES.map(function(st,i){
      return '<div class="ph '+(i===pi?"on":i<pi?"done":"")+'"><span class="h">'+st.name+'</span><span class="w">'+st.when.toUpperCase()+'</span>'+
             '<div class="b">'+esc(st.body)+'</div></div>';
    }).join("")+'</div>'+
    '<div class="banner accent" style="margin:14px 0 0;box-shadow:none;background:var(--sunk)"><span class="k">Your plan</span>'+
      (p.goal == null ? 'No goal yet. Set where you are going and how fast.'
        : '<b>'+p.goal+' kg at '+p.pace+' kg a week</b>'+(pe ? ' — about '+new Date(pe).toLocaleDateString("en-IN",{month:"long",year:"numeric"})+' if you hold that pace' : '')+
          '. The date is an answer, not a deadline. It moves when your real pace moves. Change the goal or the pace at any time.')+
      ' <button class="link" id="plan-edit">Change the plan</button></div>'+
  '</div>'+

  '<div class="card">'+
    '<h2>Numbers <span class="aside">LIVE</span></h2>'+
    '<div class="rules">'+
      '<div><div class="if">'+fmt(c.kcal)+' kcal</div><div class="then">Daily target. Set by the weekly check-in from your real maintenance, not a formula. Exam and break days run at maintenance ('+fmt(kKcalMaint())+').</div></div>'+
      '<div><div class="if">'+c.protein+' g protein</div><div class="then">Every day, deficit or not. It\'s what makes the weight that leaves fat instead of muscle.</div></div>'+
      '<div><div class="if">12,000 steps</div><div class="then">The first lever when progress stalls — before cutting food.</div></div>'+
      '<div><div class="if">Fat ≥ 55 g</div><div class="then">Below this, hormones and mood suffer. Carbs fill the rest.</div></div>'+
      '<div><div class="if">3–4 L water</div><div class="then">More on riding days. Pale-yellow urine is the check.</div></div>'+
      '<div><div class="if">7–8 h sleep</div><div class="then">Fixed wake time, phone across the room. Short sleep adds 300+ kcal of hunger the next day.</div></div>'+
    '</div>'+
    '<div class="btnrow"><button class="btn quiet" id="plan-settings">Change targets</button></div>'+
  '</div>'+

  '<div class="card">'+
    '<h2>The Sunday check-in <span class="aside">5 MINUTES</span></h2>'+
    '<p class="sub">Weigh in, measure the waist at the navel, open Progress. Make <b>at most one change</b> a week, and only by these rules — never because of one bad morning.</p>'+
    '<div class="rules">'+
      '<div><div class="if">Losing 0.45–1.0 kg/wk</div><div class="then"><b>Change nothing.</b> This is the plan working.</div></div>'+
      '<div><div class="if">Under 0.35 kg/wk</div><div class="then">Steps under 11,000? Walk first. Already walking: take 150 kcal off, from carbs.</div></div>'+
      '<div><div class="if">Over 1.1 kg/wk after week 4</div><div class="then">Add 150 kcal. Faster loss costs muscle and sets up the binge.</div></div>'+
      '<div><div class="if">Scale flat, waist down</div><div class="then">Recomposition. Change nothing.</div></div>'+
      '<div><div class="if">Fewer than 5 of 7 days logged</div><div class="then">The numbers can\'t be trusted yet. Change nothing — log every day this week.</div></div>'+
    '</div>'+
    '<p class="tiny" style="margin-top:10px">After three weeks of logging, the app measures your actual maintenance from what you ate and what the trend did, and suggests the target. That replaces recalculating by formula.</p>'+
  '</div>'+

  '<div class="card">'+
    '<h2>Food</h2>'+
    '<details open><summary>The day</summary>'+
      '<div class="rules">'+
        '<div><div class="if">Before leaving</div><div class="then">4 boiled eggs, or 2 eggs + a scoop of whey. <b>~320 kcal · 25–30 g P.</b> The keystone — it defuses the night.</div></div>'+
        '<div><div class="if">Midday</div><div class="then">Chapati or whatever the mess has, with chicken or beef curry. Half the plate curry and veg. <b>~700 kcal · 35 g P.</b></div></div>'+
        '<div><div class="if">4–5 pm</div><div class="then">Whey, roasted chana, or a scanned protein bar. <b>~280 kcal · 20–25 g P.</b> This slot saves your evening.</div></div>'+
        '<div><div class="if">Dinner</div><div class="then">Big protein + unlimited veg + 2–3 chapatis, kappa or sweet potato. <b>~900 kcal · 35–40 g P.</b></div></div>'+
      '</div></details>'+
    '<details><summary>Reading a packet in five seconds</summary><ul>'+
      '<li><b>Always per 100 g</b>, never per serving — servings are written to look small.</li>'+
      '<li><b>Protein per 100 kcal:</b> 10 g or more is a protein food. Under 3 g is a treat, whatever the front says.</li>'+
      '<li><b>Sugar in the first three ingredients</b> — sugar, glucose, maltodextrin, invert syrup — means it\'s a sweet.</li>'+
      '<li>“Multigrain”, “baked”, “no added sugar” and “high protein” on the front mean nothing until you see the table.</li>'+
      '<li>Scan once and the barcode is remembered — the next time is one tap.</li>'+
    '</ul></details>'+
    '<details><summary>Why the old pattern failed</summary><p>Skip breakfast → hunger climbs all morning → grab the fastest, densest thing (fried) → still under-fed → arrive home starving → enormous dinner → sugar → sleep badly → no appetite → skip breakfast. You weren\'t short of willpower. You were under-fed for 14 hours and trying to out-discipline a body that was, correctly, screaming. <b>Nobody wins that fight</b> — so the plan doesn\'t pick it.</p></details>'+
    '<details><summary>Sugar — taper, don\'t quit</summary><ul>'+
      '<li><b>Weeks 1–2:</b> halve the sugar in tea and coffee. Imperceptible after four days.</li>'+
      '<li><b>Weeks 3–4:</b> zero, or stevia.</li>'+
      '<li><b>Stop buying sweets.</b> The decision happens at the shop, not at 11 pm.</li>'+
      '<li>One planned treat a week — sitting down, off a plate, no screen. Log it.</li>'+
    '</ul></details>'+
    '<details><summary>Milk test — any two weeks you choose</summary><ul>'+
      '<li><b>Two weeks:</b> no milk in any form — tea, curd, paneer, ghee, whey, milk sweets. The scanner flags milk solids hidden in packets.</li>'+
      '<li><b>Day 15, before food:</b> one large glass of plain milk. Watch the next 6 hours and write it in Notes.</li>'+
      '<li>Bad reaction after two clean weeks → <b>lactose.</b> Curd, aged cheese and whey isolate are still fine.</li>'+
      '<li>Reacts to curd and isolate too → milk protein. Drop dairy entirely and get protein from eggs, meat, soya.</li>'+
      '<li>No reaction → dairy is fine. Milk wasn\'t the problem; you\'ve ruled it out for good.</li>'+
    '</ul></details>'+
    '<details><summary>Exam weeks — the floor</summary><p>When everything falls apart, switch the day to <b>Exam</b>. Calories go to maintenance. Keep only the floor: <b>morning protein, a session or two, your steps, the posture circuit, sleep.</b> Two full-body sessions in the week is enough. Holding weight through an exam week is a successful week — three earlier attempts ended exactly here.</p></details>'+
    '<details><summary>Diet break — every 10 to 12 weeks</summary><p>One week at maintenance, protein unchanged. Switch those days to <b>Break</b>. Expect the scale to rise 0.5–1 kg in the first days: glycogen and water, not fat — the trend line ignores it. It makes the weeks after it much easier.</p></details>'+
  '</div>'+

  '<div class="card">'+
    '<h2>Training <span class="aside">LOGGED IN LYFTA</span></h2>'+
    '<ul>'+
      '<li><b>3–4 sessions a week</b>, upper/lower split. Full body ×2 in exam weeks.</li>'+
      '<li><b>Add a rep or 2.5 kg somewhere every week.</b> If the lifts are going up in a deficit, the weight you\'re losing is fat.</li>'+
      '<li><b>Gait work in every lower session:</b> band side walks, clamshells, single-leg RDL, side plank. These fix the sway and the knees — the squats are just squats.</li>'+
      '<li><b>Conditioning:</b> 2 × 15–20 min incline walk after lifting. Enough.</li>'+
      '<li><b>Deload</b> every 6–8 weeks, or in an exam week: same exercises, half the sets.</li>'+
      '<li>A strength drop of more than 10% for two weeks running → you\'re losing too fast or sleeping too little. Tell the check-in.</li>'+
    '</ul>'+
  '</div>'+

  '<div class="card">'+
    '<h2>Posture &amp; walking</h2>'+
    '<details><summary>8-minute circuit — daily</summary><ul>'+
      '<li>Foam roller thoracic extension — 10 slow reps</li><li>Cat-cow — 10 reps, big range</li>'+
      '<li>Wall angels — 10 reps <i>(your progress test)</i></li><li>Band pull-aparts — 20 reps</li>'+
      '<li>Doorway chest stretch — 30 s each side</li><li>Couch stretch — 45 s each side</li>'+
      '<li>Chin tucks — 15 reps</li><li>Dead hang — 30 s</li></ul>'+
      '<p>The all-day habits matter more: <b>laptop at eye level, phone up to your face, stand every 30 minutes, sit tall on the bike.</b></p></details>'+
    '<details><summary>Why you sway — and why the knees touch</summary><p>Same cause. Your <b>gluteus medius</b> holds the pelvis level when you stand on one leg, and walking is just standing on one leg over and over. When it\'s weak, the opposite hip drops and the torso swings sideways — the sway. The thigh rotates in and the knee drifts to the midline — the knock-knee look, which narrows your base and makes the sway worse. Band walks, clamshells and single-leg work are the medicine.</p></details>'+
    '<details><summary>Gait cues — 5 minutes a day, one at a time</summary><ul>'+
      CUES.map(function(cc){ return '<li><b>Wk '+cc[0]+(cc[1]<99?"–"+cc[1]:"+")+'</b> — '+esc(cc[2])+'</li>'; }).join("")+'</ul>'+
      '<p><b>Film yourself every 2 weeks</b> — 10 s from behind, 10 from the side. You can\'t feel your own walk, but you can see it.</p></details>'+
  '</div>'+

  '<div class="card">'+
    '<h2>Skin &amp; the ride</h2>'+
    '<details><summary>Sun gear — the actual fix</summary><ul>'+
      '<li>Full-face helmet, or visor kept down — <b>the biggest single item</b></li><li>Riding jacket or full-sleeve top</li><li>Gloves</li>'+
      '<li>Closed shoes with socks</li><li>Cotton buff / neck gaiter</li><li>SPF 50 PA++++, two finger-lengths, 15 min before leaving, reapplied at college</li></ul>'+
      '<p>Two hours of equatorial UV a day beats any cream. <b>Cloth and plastic first, sunscreen second.</b> Never fairness creams, steroid creams or glutathione injections — the rebound darkening is worse than where you started.</p></details>'+
    '<details><summary>The armpits and neck aren\'t tan</summary><p>Armpits don\'t see sun. Velvety darkening there and in the neck folds is most likely <b>acanthosis nigricans</b> — commonly a visible sign of insulin resistance. No sunscreen touches it; it fades with fat loss, usually from around month 3. Show a doctor, and get fasting insulin and HbA1c on the panel.</p></details>'+
  '</div>'+

  '<div class="card">'+
    '<h2>Bloodwork <span class="aside">NOW · +4 MONTHS · AT GOAL</span></h2>'+
    '<ul>'+
      '<li><b>HbA1c</b> + fasting glucose · <b>fasting insulin</b> (HOMA-IR) — the key ones, given the skin</li>'+
      '<li>Lipid profile · TSH, free T4</li><li>Vitamin D (25-OH) · B12 · ferritin, CBC</li><li>LFT — fatty liver shows up here first</li>'+
    '</ul>'+
    '<p class="tiny">Take the report to a doctor rather than reading it alone. Fasting insulin and HbA1c falling at the second test is the best proof the plan is working — better than the scale.</p>'+
  '</div>'+

  '<div class="card">'+
    '<h2>After the goal</h2>'+
    '<p class="sub">Add 100 kcal a week until the trend has been flat for two weeks. That number is your new maintenance. Keep weighing daily, keep the morning protein, keep the Sunday check-in — the rule becomes “if the trend rises 1.5 kg above the floor, run two weeks at the old target.” Every previous attempt treated the finish line as the end. It\'s the start of the part that lasts.</p>'+
  '</div>';
  $("plan-settings").addEventListener("click", openSettings);
  $("plan-edit").addEventListener("click", openSettings);
}
function kKcalMaint(){ var e = maintenanceEstimate(); return round50(e ? e.tdee : cfg().maint); }

/* ============================ SETTINGS ============================ */
function openSettings(){
  var c = cfg(), p = plan(), cur = document.documentElement.getAttribute("data-theme") || "auto";
  openSheet("Settings",
    '<h4 class="sect" style="margin-top:0">Your plan</h4>'+
    '<div class="grid2">'+
      '<div class="field"><label class="lbl" for="st-w0">Start weight, kg</label><input class="num" id="st-w0" type="number" step="0.1" inputmode="decimal" placeholder="first weigh-in" value="'+(p.w0 == null ? "" : n1(p.w0))+'"></div>'+
      '<div class="field"><label class="lbl" for="st-g">Goal weight, kg</label><input class="num" id="st-g" type="number" step="0.5" inputmode="decimal" placeholder="e.g. 82" value="'+(p.goal == null ? "" : p.goal)+'"></div>'+
    '</div>'+
    '<div class="field" style="margin-top:10px"><label class="lbl" for="st-pace">Pace, kg a week <span class="muted">— 0.5 gentle · 0.7 steady · 1.0 hard</span></label><input class="num" id="st-pace" type="number" step="0.05" inputmode="decimal" value="'+p.pace+'"></div>'+
    '<p class="tiny">Started '+prettyDate(p.start, {day:"numeric",month:"short",year:"numeric"})+'. No end date: the finish moves with your real pace. <button class="link" id="st-restart">Start again from today</button></p>'+
    '<h4 class="sect">Targets</h4>'+
    '<p class="tiny" style="margin:0 0 8px">These follow your weight and pace until you type your own number.</p>'+
    '<div class="grid2">'+
      '<div class="field"><label class="lbl" for="st-k">Calorie target</label><input class="num" id="st-k" type="number" inputmode="numeric" value="'+c.kcal+'"></div>'+
      '<div class="field"><label class="lbl" for="st-p">Protein, g</label><input class="num" id="st-p" type="number" inputmode="numeric" value="'+c.protein+'"></div>'+
    '</div>'+
    '<div class="field" style="margin-top:10px"><label class="lbl" for="st-m">Maintenance, kcal <span class="muted">— used on exam and break days until it\'s measured</span></label><input class="num" id="st-m" type="number" inputmode="numeric" value="'+c.maint+'"></div>'+
    '<div class="lbl" style="margin-top:14px">Theme</div><div class="seg" style="margin-top:0" id="st-t">'+
      [["auto","Match phone"],["light","Light"],["dark","Dark"]].map(function(t){ return '<button data-t="'+t[0]+'" class="'+(cur===t[0]?"on":"")+'">'+t[1]+'</button>'; }).join("")+'</div>'+
    '<div class="btnrow"><button class="btn" id="st-save">Save</button></div>'+
    '<h4 class="sect">Your data</h4>'+
    '<p class="sub" id="st-sync" style="margin:0 0 10px"></p>'+
    (conn
      ? '<div class="btnrow" style="margin-top:0"><button class="btn quiet" id="st-syncnow">Sync now</button><button class="btn quiet" id="st-off">Disconnect</button></div>'
      : '<details><summary>Connect a Google Sheet</summary>'+
          '<p class="tiny" style="margin:8px 0">Optional. It backs up every change to your own sheet and brings in what is already there. If both have the same day, the sheet wins. It also turns on the better label reader. The steps are in SETUP.md.</p>'+
          '<div class="field"><label class="lbl" for="st-url">Web app URL</label><input id="st-url" inputmode="url" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec"></div>'+
          '<div class="field" style="margin-top:10px"><label class="lbl" for="st-tok">Sync key</label><input id="st-tok" autocomplete="off" placeholder="from setup() in the script editor"></div>'+
          '<div class="btnrow"><button class="btn" id="st-on">Connect</button></div></details>')+
    '<div class="btnrow"><button class="btn quiet" id="st-exp">Export backup</button><button class="btn quiet" id="st-imp">Import backup</button></div>'+
    '<input type="file" id="st-file" accept="application/json,.json" hidden>'+
    '<p class="tiny">Barcodes are looked up in Open Food Facts. Labels are read on this phone. Both are free. The first label read downloads the reader (about 15 MB).</p>',
    function(root){
      paintSync();
      if ($("st-on")) $("st-on").addEventListener("click", function(){
        var u = $("st-url").value.trim(), k = $("st-tok").value.trim(), b = $("st-on");
        if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(u) && !/^http:\/\/localhost/.test(u)) { toast("That is not a web app URL. It ends in /exec.", true); return; }
        if (!k) { toast("Paste the sync key too", true); return; }
        b.disabled = true; b.textContent = "Connecting…";
        connect(u, k, function(err){
          if (err) { b.disabled = false; b.textContent = "Connect"; toast("Couldn't connect: " + err, true); }
          else { closeSheet(); toast("Connected to your sheet"); }
        });
      });
      if ($("st-off")) $("st-off").addEventListener("click", function(){ disconnect(); closeSheet(); toast("Disconnected. Data stays on this phone."); });
      if ($("st-syncnow")) $("st-syncnow").addEventListener("click", function(){ flush(true); });
      $("st-exp").addEventListener("click", function(){
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(snapshot())], { type:"application/json" }));
        a.download = "rebuild-backup-" + TODAY + ".json"; a.click();
        setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
      });
      $("st-imp").addEventListener("click", function(){ $("st-file").click(); });
      $("st-file").addEventListener("change", function(){
        var f = $("st-file").files[0]; if (!f) return;
        f.text().then(function(t){
          var d = JSON.parse(t);
          if (!d || !Array.isArray(d.log) || !Array.isArray(d.foodLog)) throw new Error("not a backup");
          if (conn) { toast("Disconnect the sheet first, then import", true); return; }
          applyData(d); persist(); closeSheet(); renderAll(); toast("Backup imported");
        }).catch(function(){ toast("That file is not a Rebuild backup", true); });
      });
      $$("[data-t]", $("st-t")).forEach(function(b){ b.addEventListener("click", function(){
        $$("[data-t]", $("st-t")).forEach(function(x){ x.className = x===b ? "on" : ""; });
        applyTheme(b.dataset.t);
      }); });
      $("st-restart").addEventListener("click", function(){
        var t = trendOn(TODAY);
        setSetting("planStart", TODAY);
        if (t) setSetting("startWeight", n1(t));
        closeSheet(); renderAll(); toast("Plan starts again from today");
      });
      $("st-save").addEventListener("click", function(){
        var g = num($("st-g").value), w0 = num($("st-w0").value), pc = num($("st-pace").value);
        if (g && g >= 40 && g <= 200 && g !== p.goal) setSetting("goal", g);
        if (w0 && w0 >= 40 && w0 <= 300 && w0 !== p.w0) setSetting("startWeight", w0);
        if (pc && pc >= 0.2 && pc <= 1.2 && pc !== p.pace) setSetting("pace", pc);
        var k = num($("st-k").value), pr = num($("st-p").value), m = num($("st-m").value);
        if (k && k >= 1500 && k <= 4000 && k !== c.kcal) setSetting("kcal", k);
        if (pr && pr >= 60 && pr <= 250 && pr !== c.protein) setSetting("protein", pr);
        if (m && m >= 1800 && m <= 4500 && m !== c.maint) setSetting("maint", m);
        closeSheet(); renderAll(); toast("Settings saved");
      });
    });
}
function applyTheme(t){
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("rb-theme", t); } catch(e){}
}

/* ============================ WIRING ============================ */
function renderAll(){
  renderTop(); renderToday(); renderFood();
  if ($("pane-prog").classList.contains("on")) renderProgress();
  if ($("pane-plan").classList.contains("on")) renderPlan();
}
function show(t){
  $$("nav.tabs [data-t]").forEach(function(x){ x.className = x.dataset.t === t ? "on" : ""; });
  $$(".pane").forEach(function(p){ p.classList.toggle("on", p.id === "pane-"+t); });
  if (t === "prog") renderProgress();
  if (t === "plan") renderPlan();
  window.scrollTo(0, 0);
}
$$("nav.tabs [data-t]").forEach(function(b){ b.addEventListener("click", function(){ show(b.dataset.t); }); });

document.addEventListener("click", function(ev){
  if (ev.target.closest && ev.target.closest("[data-today]")) { CUR = TODAY; renderAll(); return; }
  var b = ev.target.closest && ev.target.closest("[data-step]");
  if (!b || b.disabled) return;
  var next = addDays(CUR, +b.dataset.step);
  if (next > TODAY) return;
  CUR = next; renderAll();
});

$("i-steps").addEventListener("input", function(){
  var v = num($("i-steps").value), d = day(CUR);
  d.steps = v == null ? null : Math.max(0, Math.round(v));
  d.checks["12k steps"] = (d.steps || 0) >= STEP_GOAL;     // keeps the old sheet column meaningful
  renderSteps();
  clearTimeout(notesTimer);
  notesTimer = setTimeout(function(){ queueSave(); }, 800);
});
$("notes").addEventListener("input", function(){
  day(CUR).notes = $("notes").value;
  clearTimeout(notesTimer);
  notesTimer = setTimeout(function(){ queueSave(); }, 800);
});
$("foodsearch").addEventListener("input", renderFoodSearch);
$("open-library").addEventListener("click", openLibrary);
$("open-settings").addEventListener("click", openSettings);
$("scan-nav").addEventListener("click", openScanner);
$("scan-inline").addEventListener("click", openScanner);
$("scrim").addEventListener("click", closeSheet);
$("sheet-x").addEventListener("click", closeSheet);
document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeSheet(); });
["cam","gallery"].forEach(function(id){
  $(id).addEventListener("change", function(){ var f = $(id).files[0]; $(id).value = ""; onPhoto(f); });
});

/* the app is often left open overnight — roll the day over when it comes back */
document.addEventListener("visibilitychange", function(){
  if (document.hidden) { saveNow(); persist(); return; }
  flush(true);
  var now = iso(new Date());
  if (now !== TODAY){ var wasToday = CUR === TODAY; TODAY = now; if (wasToday) CUR = now; renderAll(); }
});

try { var th = localStorage.getItem("rb-theme"); if (th && th !== "auto") document.documentElement.setAttribute("data-theme", th); } catch(e){}

/* ============================ BOOT ============================ */
var stored = DEMO ? demoData() : (lsGet(LS) || {});
outbox = stored.outbox || [];
applyData(stored);
$("boot").hidden = true;
$("app").hidden = false;
$("tabs").hidden = false;
renderAll();
paintSync();
flush(true);
window.addEventListener("online", function(){ flush(true); });
window.addEventListener("pagehide", function(){ saveNow(); persist(); });
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();      // ask the browser not to clear this data when space is short
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js");

function demoData(){
  var M = { log:[], foodLog:[], foods:[], settings:{ goal:92, pace:0.7 } }, mid = 0;
  for (var di = 34, dw = 105.2; di >= 1; di--) {
    var ds = iso(new Date(Date.now() - di*DAY));
    dw += -0.11 + (Math.sin(di*1.7) * 0.45) - (Math.sin((di+1)*1.7) * 0.45);
    M.log.push({ date:ds, weight:n1(dw), steps: 8000 + (di*731 % 6000), waist: new Date(Date.now()-di*DAY).getDay()===0 ? n1(108 - (34-di)*0.12) : null, notes:"", mode:"", checks:{} });
    [["Egg, whole boiled",4,"pc","morning",312,25.2],["Chicken curry, home",250,"100g","midday",375,35],["Chapati",3,"pc","midday",312,9],
     ["Whey protein",1,"pc","evening",120,24],["Rice, cooked",250,"100g","dinner",325,6.8],["Fish curry",200,"100g","dinner",240,28]]
      .forEach(function(x){ if (di % 9 !== 4) M.foodLog.push({ id:"d"+(++mid), date:ds, food:x[0], qty:x[1], unit:x[2], meal:x[3], kcal:x[4] + (di%5)*40, protein:x[5], carbs:20, fat:9 }); });
  }
  return M;
}

})();
