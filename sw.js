// Chili-Stiche offline: Spiel beim ersten Öffnen speichern, danach auch ohne Internet starten.
// Mit Internet wird immer zuerst die neueste Version geholt (Updates kommen automatisch).
const CACHE="chili-stiche-v1";
const FILES=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const url=new URL(req.url);
  // Schrift von Google: einmal laden, dann aus dem Speicher
  if(url.hostname.endsWith("googleapis.com")||url.hostname.endsWith("gstatic.com")){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{c.put(req,r.clone());return r}).catch(()=>new Response("",{status:504})))));
    return;
  }
  if(url.origin!==location.origin)return;
  // Eigene Dateien: erst Netz (max. 3 Sekunden), sonst gespeicherte Version
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    try{
      const r=await Promise.race([fetch(req),new Promise((_,rej)=>setTimeout(()=>rej(new Error("langsam")),3000))]);
      if(r&&r.ok)c.put(req,r.clone());
      return r;
    }catch(err){
      return (await c.match(req,{ignoreSearch:true}))||(req.mode==="navigate"?await c.match("index.html"):undefined)||Response.error();
    }
  })());
});
