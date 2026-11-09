
/* =========================================================
   HAWTHORNE DIGITAL
   Shared Header & Footer Loader
   Improved loading and navigation handling
   File: /shared/header.js
   ========================================================= */

(() => {
    'use strict';

    /* -------------------------------------------------------
       CONFIGURATION
    ------------------------------------------------------- */

    const HEADER_URL = '/shared/header.html';
    const FOOTER_URL = '/shared/footer.html';

    // Updated cache version to prevent old header HTML being used.
    const HEADER_CACHE_KEY = 'hawthorne_shared_header_v5';
    const FOOTER_CACHE_KEY = 'hawthorne_shared_footer_v5';

    /* -------------------------------------------------------
       LOAD SHARED HTML
    ------------------------------------------------------- */

    async function loadSharedHTML(url, cacheKey) {
        try {
            const cached = sessionStorage.getItem(cacheKey);

            if (cached) {
                return cached;
            }
        } catch (error) {
            console.warn('Session storage unavailable:', error);
        }

        try {
            const response = await fetch(url, {
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(
                    `Could not load ${url}: ${response.status}`
                );
            }

            const html = await response.text();

            try {
                sessionStorage.setItem(cacheKey, html);
            } catch (error) {
                console.warn('Could not cache shared HTML:', error);
            }

            return html;

        } catch (error) {
            console.error(
                'Hawthorne Digital shared content error:',
                error
            );

            return '';
        }
    }

    /* -------------------------------------------------------
       HEADER
    ------------------------------------------------------- */

    async function loadHeader() {
        const container = document.getElementById('sharedHeader');

        if (!container) return;

        const html = await loadSharedHTML(
            HEADER_URL,
            HEADER_CACHE_KEY
        );

        if (!html) return;

        container.innerHTML = html;

        setupHeader();
        updateActiveNavigation();
    }

    /* -------------------------------------------------------
       FOOTER
    ------------------------------------------------------- */

    async function loadFooter() {
        const container = document.getElementById('sharedFooter');

        if (!container) return;

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

        /* Mobile menu */

        if (menuButton && navigation) {
            menuButton.setAttribute(
                'aria-expanded',
                'false'
            );

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

        /* Services dropdown */

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
            servicesButton.setAttribute(
                'aria-expanded',
                'false'
            );

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

        /* Close dropdown when clicking outside */

        document.addEventListener('click', event => {
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

            /* Close mobile navigation */

            if (!header.contains(event.target)) {
                closeMobileMenu();
            }
        });

        /* Close mobile navigation after selecting a link */

        header.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

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
    }

    /* -------------------------------------------------------
       ACTIVE NAVIGATION LINK
    ------------------------------------------------------- */

    function normalizePath(path) {
        if (!path) return '/';

        let normalized = path
            .split('?')[0]
            .split('#')[0];

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
                // Ignore invalid links.
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
