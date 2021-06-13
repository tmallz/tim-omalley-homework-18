const { response } = require("express");

//cache all files in public folder
const FILES_TO_CACHE = [
    "/",
    "index.js",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/manifest.webmanifest",
    "/indexedDB.js"
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// install
self.addEventListener("install", function(evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log("Your files were pre-cached successfully!");
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    self.skipWaiting();
  });

  self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      }).catch(err => {
        console.log("error: ", err);
      })
    );
  
    self.clients.claim();
  });
  
  // fetch
  self.addEventListener("fetch", function(evt) {
    if (evt.request.method != "GET" || !evt.request.url.startsWith(self.location.origin)){
      evt.respondWith(fetch(evt.request));
      return;
    }

    if (evt.request.url.includes("/api/transaction")) {
      evt.respondWith(
        caches.open(RUNTIME_CACHE).then(cache => {
          return fetch(evt.request)
            .then(response => {
              cache.put(evt.request, response.clone());
              return response;
            })
            .catch(() => caches.match(evt.request));
        })
      );
      return;
    }

    evt.respondWith(
      caches.match(evt.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME_CACHE).then(cache => {
          return fetch(evt.request).then(response => {
            return cache.put(evt.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  });
  
  // if (evt.request.url.includes("/api/transaction")) {
  //   evt.respondWith(
  //     caches.open(DATA_CACHE_NAME).then(cache => {
  //       return fetch(evt.request)
  //         .then(response => {
  //           if (response.status === 200) {
  //             cache.put(evt.request.url, response.clone());
  //           }

  //           return response;
  //         })
  //         .catch(err => {
  //           return cache.match(evt.request);
  //         });
  //     }).catch(err => console.log(err))
  //   );

  //   return;
  // }

  // evt.respondWith(
  //   caches.match(evt.request).then(function(response) {
  //     return response || fetch(evt.request);
  //   })
  // );