
/* =========================================================
   HAWTHORNE DIGITAL
   Shared Header & Footer Loader
   Stable loading — V6
   File: /shared/header.js
   ========================================================= */

(() => {
    'use strict';

    /* -------------------------------------------------------
       PREVENT DUPLICATE INITIALISATION
    ------------------------------------------------------- */

    const STATE_KEY = '__hawthorneSharedWebsiteV6';

    if (window[STATE_KEY]) {
        return;
    }

    window[STATE_KEY] = true;

    /* -------------------------------------------------------
       CONFIGURATION
    ------------------------------------------------------- */

    const HEADER_URL = '/shared/header.html';
    const FOOTER_URL = '/shared/footer.html';

    const HEADER_ID = 'sharedHeader';
    const FOOTER_ID = 'sharedFooter';

    /* -------------------------------------------------------
       LOAD SHARED HTML
    ------------------------------------------------------- */

    async function loadSharedHTML(url) {

        try {

            const response = await fetch(url, {
                cache: 'no-cache',
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to load ${url}: ${response.status}`
                );
            }

            return await response.text();

        } catch (error) {

            console.error(
                'Hawthorne Digital loading error:',
                error
            );

            return null;
        }
    }

    /* -------------------------------------------------------
       LOAD HEADER
    ------------------------------------------------------- */

    async function loadHeader() {

        const container = document.getElementById(HEADER_ID);

        if (!container) return;

        // Prevent unnecessary replacement.
        if (container.dataset.headerLoaded === 'true') {
            return;
        }

        const html = await loadSharedHTML(HEADER_URL);

        if (html === null || !html.trim()) {
            console.error('Hawthorne header could not be loaded.');
            return;
        }

        // Insert the header once.
        container.innerHTML = html;

        container.dataset.headerLoaded = 'true';

        setupHeader(container);

        updateActiveNavigation();

        // Notify other scripts that the header is ready.
        document.dispatchEvent(
            new CustomEvent('hawthorneHeaderReady')
        );
    }

    /* -------------------------------------------------------
       LOAD FOOTER
    ------------------------------------------------------- */

    async function loadFooter() {

        const container = document.getElementById(FOOTER_ID);

        if (!container) return;

        if (container.dataset.footerLoaded === 'true') {
            return;
        }

        const html = await loadSharedHTML(FOOTER_URL);

        if (html === null || !html.trim()) {
            console.error('Hawthorne footer could not be loaded.');
            return;
        }

        container.innerHTML = html;

        container.dataset.footerLoaded = 'true';
    }

    /* -------------------------------------------------------
       HEADER INTERACTIONS
    ------------------------------------------------------- */

    function setupHeader(header) {

        if (header.dataset.eventsAttached === 'true') {
            return;
        }

        header.dataset.eventsAttached = 'true';

        /* -----------------------------------------------
           MOBILE NAVIGATION
        ----------------------------------------------- */

        const menuButton = header.querySelector(
            '.menu-toggle, ' +
            '#menuToggle, ' +
            '#mobileMenuToggle, ' +
            '.mobile-menu-toggle, ' +
            '.hamburger'
        );

        const navigation = header.querySelector(
            '.nav-links, ' +
            '.navigation, ' +
            '#navLinks, ' +
            '#mainNavigation, ' +
            '.main-nav, ' +
            'nav'
        );

        function closeMobileMenu() {

            if (navigation) {
                navigation.classList.remove('active');
            }

            if (menuButton) {

                menuButton.classList.remove('active');

                menuButton.setAttribute(
                    'aria-expanded',
                    'false'
                );
            }
        }

        if (menuButton && navigation) {

            menuButton.setAttribute(
                'aria-expanded',
                'false'
            );

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

            });
        }

        /* -----------------------------------------------
           SERVICES DROPDOWN
        ----------------------------------------------- */

        const servicesContainer = header.querySelector(
            '.services-dropdown, ' +
            '#servicesDropdown, ' +
            '.nav-dropdown'
        );

        const servicesButton = servicesContainer?.querySelector(
            '.services-button, ' +
            '#servicesButton, ' +
            '.dropdown-toggle, ' +
            '[aria-haspopup="true"]'
        );

        if (servicesContainer) {

            function openServices() {

                servicesContainer.classList.add('active');

                if (servicesButton) {
                    servicesButton.setAttribute(
                        'aria-expanded',
                        'true'
                    );
                }
            }

            function closeServices() {

                servicesContainer.classList.remove('active');

                if (servicesButton) {
                    servicesButton.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                }
            }

            if (servicesButton) {

                servicesButton.setAttribute(
                    'aria-expanded',
                    'false'
                );

                servicesButton.addEventListener('click', event => {

                    event.preventDefault();
                    event.stopPropagation();

                    if (
                        servicesContainer.classList.contains('active')
                    ) {
                        closeServices();
                    } else {
                        openServices();
                    }

                });
            }

            // Keep the dropdown open while hovering.
            servicesContainer.addEventListener(
                'mouseenter',
                openServices
            );

            servicesContainer.addEventListener(
                'mouseleave',
                closeServices
            );

            // Keyboard accessibility.
            servicesContainer.addEventListener(
                'focusin',
                openServices
            );

            servicesContainer.addEventListener(
                'focusout',
                event => {

                    if (
                        !servicesContainer.contains(event.relatedTarget)
                    ) {
                        closeServices();
                    }

                }
            );

        }

        /* -----------------------------------------------
           DOCUMENT CLICK HANDLING
        ----------------------------------------------- */

        document.addEventListener('click', event => {

            // Close services dropdown when clicking outside.
            if (
                servicesContainer &&
                !servicesContainer.contains(event.target)
            ) {

                servicesContainer.classList.remove('active');

                if (servicesButton) {
                    servicesButton.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                }
            }

            // Close mobile menu when clicking outside.
            if (!header.contains(event.target)) {
                closeMobileMenu();
            }

        });

        /* -----------------------------------------------
           CLOSE MOBILE MENU AFTER NAVIGATION
        ----------------------------------------------- */

        header.querySelectorAll('a').forEach(link => {

            link.addEventListener('click', () => {
                closeMobileMenu();
            });

        });

    }

    /* -------------------------------------------------------
       ACTIVE NAVIGATION LINK
    ------------------------------------------------------- */

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
                href.startsWith('tel:') ||
                href.startsWith('javascript:')
            ) {
                return;
            }

            try {

                const linkURL = new URL(
                    href,
                    window.location.origin
                );

                if (
                    linkURL.origin !== window.location.origin
                ) {
                    return;
                }

                const linkPath = normalizePath(
                    linkURL.pathname
                );

                link.classList.toggle(
                    'active',
                    linkPath === currentPath
                );

            } catch (error) {

                console.warn(
                    'Invalid navigation link:',
                    href
                );

            }

        });
    }

    /* -------------------------------------------------------
       INITIALISE WEBSITE
    ------------------------------------------------------- */

    async function initialiseSharedWebsite() {

        // Load header and footer independently.
        const results = await Promise.allSettled([
            loadHeader(),
            loadFooter()
        ]);

        results.forEach(result => {

            if (result.status === 'rejected') {
                console.error(
                    'Shared website component failed:',
                    result.reason
                );
            }

        });

        updateActiveNavigation();

    }

    /* -------------------------------------------------------
       START
    ------------------------------------------------------- */

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
