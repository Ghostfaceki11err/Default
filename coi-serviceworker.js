/*! coi-serviceworker v0.1.7 | MIT License | https://github.com/gzguidoti/coi-serviceworker */
const coepCredentialless = false;

if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", (event) => {
        const { request } = event;
        if (
            request.url.startsWith('blob:') ||
            request.url.startsWith('data:') ||
            (request.cache === "only-if-cached" && request.mode !== "same-origin")
        ) {
            return;
        }

        let r = request;

        if (coepCredentialless && request.mode === "no-cors") {
            r = new Request(request, {
                credentials: "omit",
            });
        }

        event.respondWith(
            fetch(r)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => {
                    console.error("COI Service Worker fetch error:", e);
                })
        );
    });
} else {
    (() => {
        const currentScript = window.document.currentScript;
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register(currentScript.src)
                .then((registration) => {
                    console.log("COI Service Worker registered:", registration.scope);
                    
                    registration.addEventListener("updatefound", () => {
                        console.log("COI Service Worker update found. Reloading...");
                        window.location.reload();
                    });
                    
                    if (!navigator.serviceWorker.controller) {
                        console.log("Reloading to activate COI Service Worker...");
                        window.location.reload();
                    }
                })
                .catch((err) => {
                    console.error("COI Service Worker registration failed:", err);
                });
        }
    })();
}
