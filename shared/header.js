/* =========================================================
   HAWTHORNE DIGITAL
   Shared Header & Footer Loader
   Stable version — normal page navigation
   File: /shared/header.js
   ========================================================= */

(() => {
    'use strict';

    /* -------------------------------------------------------
       CONFIGURATION
    ------------------------------------------------------- */

    const HEADER_URL = '/shared/header.html';
    const FOOTER_URL = '/shared/footer.html';

    const HEADER_CACHE_KEY = 'hawthorne_shared_header_v4';
    const FOOTER_CACHE_KEY = 'hawthorne_shared_footer_v4';

    /* -------------------------------------------------------
       LOAD SHARED HTML
    ------------------------------------------------------- */

    async function loadSharedHTML(url, cacheKey) {
        try {
            // Use cached shared HTML when available.
            const cached = sessionStorage.getItem(cacheKey);

            if (cached) {
                return cached;
            }

            const response = await fetch(url, {
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(
                    `Could not load ${url}: ${response.status}`
                );
            }

            const html = await response.text();

            sessionStorage.setItem(cacheKey, html);

            return html;

        } catch (error) {
            console.error(
                'Hawthorne Digital shared content error:',
                error
            );

            // Attempt one uncached request.
            try {
                const response = await fetch(url);

                if (response.ok) {
                    return await response.text();
                }
            } catch (fallbackError) {
                console.error(
                    'Shared content fallback failed:',
                    fallbackError
                );
            }

            return '';
        }
    }

    /* -------------------------------------------------------
       HEADER
    ------------------------------------------------------- */

    async function loadHeader() {
        const container = document.getElementById('sharedHeader');

        if (!container) {
            console.warn(
                'Hawthorne Digital: #sharedHeader was not found.'
            );
            return;
        }

        const html = await loadSharedHTML(
            HEADER_URL,
            HEADER_CACHE_KEY
        );

        if (!html) return;

        container.innerHTML = html;

        setupHeader();
    }

    /* -------------------------------------------------------
       FOOTER
    ------------------------------------------------------- */

    async function loadFooter() {
        const container = document.getElementById('sharedFooter');

        if (!container) {
            console.warn(
                'Hawthorne Digital: #sharedFooter was not found.'
            );
            return;
        }

        const html = await loadSharedHTML(
            FOOTER_URL,
            FOOTER_CACHE_KEY
        );

        if (!html) return;

        container.innerHTML = html;
    }

    /* -------------------------------------------------------
       HEADER INTERACTIONS
    ------------------------------------------------------- */

    function setupHeader() {
        const header = document.getElementById('sharedHeader');

        if (!header) return;

        /*
         * Mobile menu selectors.
         * Supports common class and ID naming conventions.
         */

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

        /* Mobile menu button */

        if (menuButton && navigation) {
            menuButton.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();

                const isOpen =
                    navigation.classList.toggle('active');

                menuButton.classList.toggle('active', isOpen);

                menuButton.setAttribute(
                    'aria-expanded',
                    String(isOpen)
                );
            });
        }

        /*
         * Services dropdown.
         * Supports common class and ID naming conventions.
         */

        const servicesContainer = header.querySelector(
            '.services-dropdown, ' +
            '#servicesDropdown, ' +
            '.dropdown, ' +
            '.nav-dropdown'
        );

        const servicesButton = header.querySelector(
            '.services-button, ' +
            '#servicesButton, ' +
            '.dropdown-toggle, ' +
            '[aria-haspopup="true"]'
        );

        if (servicesContainer && servicesButton) {

            // Click/tap behaviour for mobile and accessibility.
            servicesButton.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();

                const isOpen =
                    servicesContainer.classList.toggle('active');

                servicesButton.setAttribute(
                    'aria-expanded',
                    String(isOpen)
                );
            });

            // Keep dropdown open while hovering.
            servicesContainer.addEventListener(
                'mouseenter',
                () => {
                    servicesContainer.classList.add('active');

                    servicesButton.setAttribute(
                        'aria-expanded',
                        'true'
                    );
                }
            );

            servicesContainer.addEventListener(
                'mouseleave',
                () => {
                    servicesContainer.classList.remove('active');

                    servicesButton.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                }
            );
        }

        /* Close mobile menu when clicking outside */

        document.addEventListener('click', event => {
            if (!header.contains(event.target)) {
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
        });

        /* Close mobile menu after selecting a navigation link */

        header.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
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
            });
        });

        updateActiveNavigation();
    }

    /* -------------------------------------------------------
       ACTIVE NAVIGATION LINK
    ------------------------------------------------------- */

    function normalizePath(path) {
        if (!path) return '/';

        let normalized = path.split('?')[0].split('#')[0];

        if (normalized.endsWith('/index.html')) {
            normalized = normalized.replace(
                '/index.html',
                '/'
            );
        }

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
                // Ignore invalid URLs.
            }
        });
    }

    /* -------------------------------------------------------
       INITIALISE WEBSITE
    ------------------------------------------------------- */

    async function initialiseSharedWebsite() {
        await Promise.all([
            loadHeader(),
            loadFooter()
        ]);

        updateActiveNavigation();

        console.log(
            'Hawthorne Digital shared header and footer loaded.'
        );
    }

    /* -------------------------------------------------------
       START
    ------------------------------------------------------- */

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            initialiseSharedWebsite
        );
    } else {
        initialiseSharedWebsite();
    }

})();
