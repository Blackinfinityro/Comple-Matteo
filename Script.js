document.addEventListener('DOMContentLoaded', () => {
    console.log('[Script.js] DOMContentLoaded');
    const iframe = document.getElementById('video');
    if (!iframe) {
        console.log('[Script.js] No #video iframe found');
        return;
    }

    iframe.addEventListener('load', () => {
        console.log('[Script.js] iframe #video load event — src:', iframe.getAttribute('src'));
    });

    const src = iframe.getAttribute('src') || '';
    const [base, query] = src.split('?');
    const params = new URLSearchParams(query || '');
    params.set('autoplay', '1');
    params.set('enablejsapi', '1');
    try {
        params.set('origin', window.location.origin);
    } catch (e) {}
    const newSrc = base + '?' + params.toString();
    iframe.setAttribute('src', newSrc);
    console.log('[Script.js] set iframe src ->', newSrc);

    function getYouTubeIDFromUrl(url) {
        if (!url) return null;
        try {
            const u = String(url);
            const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|v\/|shorts\/))([A-Za-z0-9_-]{11})/);
            if (m && m[1]) return m[1];
            const parts = u.split('?');
            if (parts[1]) {
                const p = new URLSearchParams(parts[1]);
                if (p.get('v')) return p.get('v');
            }
        } catch (e) {}
        return null;
    }

    let nextVideoId = getYouTubeIDFromUrl(newSrc) || null;

    const allow = iframe.getAttribute('allow') || '';
    if (!/autoplay/.test(allow)) {
        const newAllow = allow ? allow + '; autoplay' : 'autoplay';
        iframe.setAttribute('allow', newAllow);
        console.log('[Script.js] updated allow attribute ->', newAllow);
    }

    if (!window.YT) {
        console.log('[Script.js] injecting YouTube IFrame API');
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onload = () => console.log('[Script.js] YouTube API script loaded');
        tag.onerror = () => console.error('[Script.js] Failed to load YouTube API script');
        document.head.appendChild(tag);
    } else {
        console.log('[Script.js] window.YT already present');
    }

    let firstPlayer = null;
    let secondPlayer = null;
    let secondRequested = false;

    window.onYouTubeIframeAPIReady = function() {
        console.log('[Script.js] onYouTubeIframeAPIReady');
        try {
            firstPlayer = new YT.Player('video', {
                events: {
                    onStateChange: function(event) {
                        console.log('[Script.js] YT onStateChange', event.data);
                        if (event.data === YT.PlayerState.ENDED) {
                            console.log('[Script.js] video ended -> showNextVideo()');
                            showNextVideo();
                        }
                    }
                }
            });
            console.log('[Script.js] YT.Player created for video');
        } catch (err) {
            console.error('[Script.js] Error creating YT.Player', err);
        }

        if (secondRequested) initSecondPlayer();
    };

    function showNextVideo() {
        console.log('[Script.js] showNextVideo called');
        try {
            const firstIframe = document.getElementById('video');
            if (firstIframe) {
                firstIframe.style.display = 'none';
                console.log('[Script.js] hid #video');
            }
            if (firstPlayer && typeof firstPlayer.stopVideo === 'function') {
                firstPlayer.stopVideo();
                console.log('[Script.js] stopped firstPlayer');
            }
        } catch (e) {
            console.error('[Script.js] error hiding/stopping first video', e);
        }

        let v2 = document.getElementById('video2');
        const vidFromV2 = v2 ? getYouTubeIDFromUrl(v2.getAttribute('src') || '') : null;
        const vidToShow = vidFromV2 || nextVideoId || getYouTubeIDFromUrl(iframe.getAttribute('src') || '') || 'p7YXXieghto';
        const originParam = (typeof window !== 'undefined' && window.location && window.location.origin) ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
        const embedSrc = `https://www.youtube.com/embed/${vidToShow}?autoplay=1&mute=1&enablejsapi=1${originParam}`;
        if (v2) {
            v2.setAttribute('src', embedSrc);
            console.log('[Script.js] updated #video2 src for autoplay ->', embedSrc);
            v2.style.display = '';
            console.log('[Script.js] unhidden existing #video2');
            secondRequested = true;
            if (window.YT && typeof YT.Player === 'function') {
                initSecondPlayer();
            }
            return;
        }

        const container = document.querySelector('.container') || document.body;
        v2 = document.createElement('iframe');
        v2.id = 'video2';
        v2.width = '500';
        v2.height = '300';
        v2.src = embedSrc;
        v2.title = 'Video successivo';
        v2.setAttribute('frameborder', '0');
        v2.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        v2.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        v2.allowFullscreen = true;
        v2.style.marginTop = '16px';
        container.appendChild(v2);
        console.log('[Script.js] appended new #video2');

        secondRequested = true;
        if (window.YT && typeof YT.Player === 'function') initSecondPlayer();
    }

    function initSecondPlayer() {
        const el = document.getElementById('video2');
        if (!el) return;
        if (secondPlayer) {
            try { secondPlayer.playVideo(); console.log('[Script.js] secondPlayer.playVideo() called'); } catch (e) {}
            return;
        }
        try {
            secondPlayer = new YT.Player('video2', {
                events: {
                    onReady: function(evt) {
                        try {
                            evt.target.playVideo();
                            console.log('[Script.js] secondPlayer onReady -> playVideo()');
                        } catch (e) {
                            console.error('[Script.js] secondPlayer playVideo error', e);
                        }
                    }
                }
            });
            console.log('[Script.js] YT.Player created for video2');
        } catch (err) {
            console.error('[Script.js] Error creating second YT.Player', err);
        }
    }

    window.addEventListener('error', (ev) => {
        console.error('[Script.js] window error', ev.error || ev.message);
    });
});