
/* =========================================================
   HAWTHORNE DIGITAL
   Shared Header & Footer Loader
   Stable Version — V9
   File: /shared/header.js
   ========================================================= */

(() => {
    'use strict';

    const STATE_KEY = '__hawthorneSharedWebsiteV9';

    if (window[STATE_KEY]) return;
    window[STATE_KEY] = true;

    const HEADER_URL = '/shared/header.html';
    const FOOTER_URL = '/shared/footer.html';

    const HEADER_ID = 'sharedHeader';
    const FOOTER_ID = 'sharedFooter';

    /* =====================================================
       LOAD SHARED HTML
       ===================================================== */

    async function loadSharedHTML(url) {
        try {
            const response = await fetch(url, {
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.status}`);
            }

            return await response.text();

        } catch (error) {
            console.error('Hawthorne Digital loading error:', error);
            return null;
        }
    }

    /* =====================================================
       LOAD HEADER
       ===================================================== */

    async function loadHeader() {

        const container = document.getElementById(HEADER_ID);

        if (!container) {
            console.warn('Hawthorne header container not found.');
            return;
        }

        if (container.dataset.headerLoaded === 'true') return;

        const html = await loadSharedHTML(HEADER_URL);

        if (!html || !html.trim()) return;

        container.innerHTML = html;
        container.dataset.headerLoaded = 'true';

        setupHeader(container);
        updateActiveNavigation();

        document.dispatchEvent(
            new CustomEvent('hawthorneHeaderReady')
        );
    }

    /* =====================================================
       LOAD FOOTER
       ===================================================== */

    async function loadFooter() {

        const container = document.getElementById(FOOTER_ID);

        if (!container) return;

        if (container.dataset.footerLoaded === 'true') return;

        const html = await loadSharedHTML(FOOTER_URL);

        if (!html || !html.trim()) return;

        container.innerHTML = html;
        container.dataset.footerLoaded = 'true';
    }

    /* =====================================================
       HEADER INTERACTIONS
       ===================================================== */

    function setupHeader(header) {

        const menuButton = header.querySelector('.site-menu-toggle');
        const navigation = header.querySelector('.site-navigation');

        const servicesContainer =
            header.querySelector('.site-nav-dropdown');

        const servicesButton =
            header.querySelector('.site-services-trigger');

        if (header.dataset.eventsAttached === 'true') return;
        header.dataset.eventsAttached = 'true';

        /* MOBILE MENU */

        function closeMobileMenu() {

            if (navigation) {
                navigation.classList.remove('active');
            }

            if (menuButton) {
                menuButton.classList.remove('active');
                menuButton.setAttribute('aria-expanded', 'false');
                menuButton.setAttribute('aria-label', 'Open navigation');
            }

            closeServices();
        }

        if (menuButton && navigation) {

            menuButton.addEventListener('click', event => {

                event.preventDefault();
                event.stopPropagation();

                const isOpen =
                    !navigation.classList.contains('active');

                navigation.classList.toggle('active', isOpen);
                menuButton.classList.toggle('active', isOpen);

                menuButton.setAttribute(
                    'aria-expanded',
                    String(isOpen)
                );

                menuButton.setAttribute(
                    'aria-label',
                    isOpen ? 'Close navigation' : 'Open navigation'
                );
            });
        }

        /* SERVICES DROPDOWN */

        function openServices() {

            if (!servicesContainer) return;

            servicesContainer.classList.add('active');

            if (servicesButton) {
                servicesButton.setAttribute('aria-expanded', 'true');
            }
        }

        function closeServices() {

            if (!servicesContainer) return;

            servicesContainer.classList.remove('active');

            if (servicesButton) {
                servicesButton.setAttribute('aria-expanded', 'false');
            }
        }

        if (servicesContainer && servicesButton) {

            servicesButton.addEventListener('click', event => {

                event.preventDefault();
                event.stopPropagation();

                const isOpen =
                    servicesContainer.classList.contains('active');

                if (isOpen) {
                    closeServices();
                } else {
                    openServices();
                }
            });

            servicesContainer.addEventListener('mouseenter', openServices);
            servicesContainer.addEventListener('mouseleave', closeServices);

            servicesContainer.addEventListener('focusin', openServices);

            servicesContainer.addEventListener('focusout', event => {

                if (!servicesContainer.contains(event.relatedTarget)) {
                    closeServices();
                }
            });
        }

        /* CLICK OUTSIDE */

        document.addEventListener('click', event => {

            if (
                servicesContainer &&
                !servicesContainer.contains(event.target)
            ) {
                closeServices();
            }

            if (!header.contains(event.target)) {
                closeMobileMenu();
            }
        });

        /* CLOSE MOBILE MENU AFTER LINK CLICK */

        header.querySelectorAll('a').forEach(link => {

            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

        /* ESCAPE KEY */

        header.addEventListener('keydown', event => {

            if (event.key === 'Escape') {
                closeMobileMenu();
            }
        });
    }

    /* =====================================================
       ACTIVE NAVIGATION
       ===================================================== */

    function normalizePath(path) {

        if (!path) return '/';

        let normalized = path
            .split('?')[0]
            .split('#')[0];

        normalized = normalized.replace(
            /\/index\.html$/i,
            '/'
        );

        if (!normalized.startsWith('/')) {
            normalized = '/' + normalized;
        }

        if (!normalized.endsWith('/')) {
            normalized += '/';
        }

        return normalized;
    }

    function updateActiveNavigation() {

        const currentPath = normalizePath(
            window.location.pathname
        );

        document.querySelectorAll(
            '#sharedHeader a[href]'
        ).forEach(link => {

            const href = link.getAttribute('href');

            if (
                !href ||
                href.startsWith('#') ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:')
            ) return;

            try {

                const linkURL = new URL(
                    href,
                    window.location.origin
                );

                if (linkURL.origin !== window.location.origin) return;

                const linkPath = normalizePath(linkURL.pathname);

                link.classList.toggle(
                    'active',
                    linkPath === currentPath
                );

            } catch (error) {

                console.warn('Invalid navigation link:', href);
            }
        });
    }

    /* =====================================================
       INITIALISE
       ===================================================== */

    async function initialiseSharedWebsite() {

        await Promise.allSettled([
            loadHeader(),
            loadFooter()
        ]);

        updateActiveNavigation();
    }

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            initialiseSharedWebsite,
            { once: true }
        );

    } else {

        initialiseSharedWebsite();
    }

})();
