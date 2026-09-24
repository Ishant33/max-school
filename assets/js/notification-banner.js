/* ==========================================================================
   Notification Banner — fetches the featured notification and renders it
   as a dismissible strip on the homepage, remembering dismissal per ID.
   ========================================================================== */

(() => {
    'use strict';

    const BANNER_ID = 'notification-banner';
    const STORAGE_KEY = 'max_dismissed_notification';

    function getDismissedId() {
        try {
            return localStorage.getItem(STORAGE_KEY) || '';
        } catch (e) {
            return '';
        }
    }

    function setDismissedId(id) {
        try {
            localStorage.setItem(STORAGE_KEY, String(id));
        } catch (e) {
            // Silently fail if localStorage is blocked
        }
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/[&<>"']/g, c => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
            }[c]));
    }

    fetch('backend/cms_list.php?module=notifications&featured=1&limit=1')
        .then(res => res.ok ? res.json() : Promise.reject('Network error'))
        .then(items => {
            if (!items || !items.length) return;

            const notification = items[0];
            const dismissedId = getDismissedId();

            if (String(notification.id) === dismissedId) {
                return;
            }

            const header = document.querySelector('header');
            if (!header) return;

            const banner = document.createElement('div');
            banner.id = BANNER_ID;
            banner.className = 'notification-banner';

            const badge = notification.badge ? `<span class="banner-badge">${esc(notification.badge)}</span>` : '';
            const link = notification.link_url
                ? `<a href="${esc(notification.link_url)}" class="banner-link" target="_blank" rel="noopener">Details →</a>`
                : '';

            banner.innerHTML = `
                <div class="banner-content">
                    ${badge}
                    <strong>${esc(notification.title)}</strong>
                    <span>${esc(notification.body)}</span>
                    ${link}
                </div>
                <button class="banner-close" aria-label="Dismiss">×</button>
            `;

            header.insertAdjacentElement('afterend', banner);

            banner.querySelector('.banner-close').addEventListener('click', () => {
                setDismissedId(notification.id);
                banner.style.transition = 'opacity .25s';
                banner.style.opacity = '0';
                setTimeout(() => banner.remove(), 260);
            });
        })
        .catch(() => {
            // Silently fail — banner is optional
        });
})();
