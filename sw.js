/* Offline shell. Network first, so a new version shows up on the next load; the cache is the fallback when offline. */
var CACHE = "rebuild-v3";
var SHELL = ["./", "app.css", "app.js", "label.js", "manifest.webmanifest", "icon-192.png"];
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function(e){
  var u = new URL(e.request.url);
  // only our own files and the fonts; never the sheet, the food database or the label reader
  if (e.request.method !== "GET" || (u.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))) return;
  e.respondWith(fetch(e.request).then(function(r){
    var copy = r.clone();
    if (r.ok || r.type === "opaque") caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
    return r;
  }).catch(function(){ return caches.match(e.request, { ignoreSearch:true }); }));
});
