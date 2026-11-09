/* =========================================================
   HAWTHORNE DIGITAL — SHARED HEADER / FOOTER / SPA ROUTER
   File: shared/header.js
   ========================================================= */

(() => {
    'use strict';

    /* ---------------------------------------------------------
       CONFIGURATION
    --------------------------------------------------------- */

    const HEADER_URL = '/shared/header.html';
    const FOOTER_URL = '/shared/footer.html';

    const HEADER_CACHE_KEY = 'hawthorne_shared_header_v4';
    const FOOTER_CACHE_KEY = 'hawthorne_shared_footer_v4';

    let navigationInProgress = false;

    /* ---------------------------------------------------------
       FETCH SHARED HEADER / FOOTER
    --------------------------------------------------------- */

    async function loadSharedContent(url, cacheKey) {
        try {
            const cachedContent = sessionStorage.getItem(cacheKey);

            if (cachedContent) {
                return cachedContent;
            }

            const response = await fetch(url, {
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`Failed to load ${url}`);
            }

            const content = await response.text();

            sessionStorage.setItem(cacheKey, content);

            return content;

        } catch (error) {
            console.error('Hawthorne Digital shared content error:', error);

            try {
                const response = await fetch(url);

                if (response.ok) {
                    return await response.text();
                }
            } catch (fallbackError) {
                console.error('Fallback loading failed:', fallbackError);
            }

            return '';
        }
    }

    async function loadSharedHeader() {
        const headerContainer = document.getElementById('sharedHeader');

        if (!headerContainer) return;

        const headerHTML = await loadSharedContent(
            HEADER_URL,
            HEADER_CACHE_KEY
        );

        headerContainer.innerHTML = headerHTML;

        setupHeader();
    }

    async function loadSharedFooter() {
        const footerContainer = document.getElementById('sharedFooter');

        if (!footerContainer) return;

        const footerHTML = await loadSharedContent(
            FOOTER_URL,
            FOOTER_CACHE_KEY
        );

        footerContainer.innerHTML = footerHTML;
    }

    /* ---------------------------------------------------------
       HEADER NAVIGATION
    --------------------------------------------------------- */

    function setupHeader() {
        const header = document.querySelector('#sharedHeader');

        if (!header) return;

        const menuToggle = header.querySelector(
            '.menu-toggle, #menuToggle, #mobileMenuToggle'
        );

        const navigation = header.querySelector(
            '.nav-links, .navigation, #navLinks, #mainNavigation'
        );

        const servicesDropdown = header.querySelector(
            '.services-dropdown, #servicesDropdown'
        );

        const servicesButton = header.querySelector(
            '.services-button, #servicesButton'
        );

        /* Mobile navigation toggle */

        if (menuToggle && navigation) {
            menuToggle.addEventListener('click', function (event) {
                event.preventDefault();

                const isOpen = navigation.classList.toggle('active');

                menuToggle.classList.toggle('active', isOpen);

                menuToggle.setAttribute(
                    'aria-expanded',
                    isOpen ? 'true' : 'false'
                );
            });
        }

        /* Services dropdown */

        if (servicesDropdown && servicesButton) {
            servicesButton.addEventListener('click', function (event) {
                event.preventDefault();

                const isOpen =
                    servicesDropdown.classList.toggle('active');

                servicesButton.setAttribute(
                    'aria-expanded',
                    isOpen ? 'true' : 'false'
                );
            });

            servicesDropdown.addEventListener('mouseenter', function () {
                servicesDropdown.classList.add('active');

                servicesButton.setAttribute(
                    'aria-expanded',
                    'true'
                );
            });

            servicesDropdown.addEventListener('mouseleave', function () {
                servicesDropdown.classList.remove('active');

                servicesButton.setAttribute(
                    'aria-expanded',
                    'false'
                );
            });
        }

        /* Close mobile navigation when clicking outside */

        document.addEventListener('click', function (event) {
            if (!header.contains(event.target)) {
                if (navigation) {
                    navigation.classList.remove('active');
                }

                if (menuToggle) {
                    menuToggle.classList.remove('active');

                    menuToggle.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                }
            }
        });

        /* Close navigation when a link is selected */

        header.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function () {
                if (navigation) {
                    navigation.classList.remove('active');
                }

                if (menuToggle) {
                    menuToggle.classList.remove('active');

                    menuToggle.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                }
            });
        });

        /* Mark current page in navigation */

        updateActiveNavigation();
    }

    function updateActiveNavigation() {
        const currentPath = normalizePath(window.location.pathname);

        document.querySelectorAll('#sharedHeader a[href]').forEach(link => {
            const href = link.getAttribute('href');

            if (!href || href.startsWith('#')) return;

            try {
                const linkURL = new URL(href, window.location.origin);

                if (linkURL.origin !== window.location.origin) return;

                const linkPath = normalizePath(linkURL.pathname);

                link.classList.toggle(
                    'active',
                    linkPath === currentPath
                );

            } catch (error) {
                // Ignore invalid navigation links.
            }
        });
    }

    function normalizePath(path) {
        if (!path) return '/';

        let normalized = path.split('?')[0].split('#')[0];

        if (!normalized.startsWith('/')) {
            normalized = '/' + normalized;
        }

        if (normalized.endsWith('/index.html')) {
            normalized = normalized.replace('/index.html', '/');
        }

        if (!normalized.endsWith('/')) {
            normalized += '/';
        }

        return normalized;
    }

    /* ---------------------------------------------------------
       PAGE ASSET MANAGEMENT
    --------------------------------------------------------- */

    function markExistingPageAssets() {
        document.querySelectorAll(
            'head style, head link[rel="stylesheet"]'
        ).forEach(element => {
            if (
                element.href &&
                (
                    element.href.includes('/shared/header.css') ||
                    element.href.includes('/shared/footer.css')
                )
            ) {
                return;
            }

            element.dataset.pageAsset = 'true';
        });
    }

    function removeOldPageAssets() {
        document.querySelectorAll('[data-page-asset="true"]').forEach(
            element => {
                element.remove();
            }
        );
    }

    async function loadPageAssets(newDocument) {
        const newHead = newDocument.querySelector('head');

        if (!newHead) return;

        const assetPromises = [];

        /* Import inline page styles */

        newHead.querySelectorAll('style').forEach(style => {
            const newStyle = document.createElement('style');

            newStyle.textContent = style.textContent;
            newStyle.dataset.pageAsset = 'true';

            document.head.appendChild(newStyle);
        });

        /* Import page stylesheet links */

        newHead.querySelectorAll(
            'link[rel="stylesheet"]'
        ).forEach(link => {
            const href = link.getAttribute('href');

            if (!href) return;

            if (
                href.includes('/shared/header.css') ||
                href.includes('/shared/footer.css')
            ) {
                return;
            }

            const absoluteURL = new URL(
                href,
                window.location.origin
            ).href;

            const existingLink = Array.from(
                document.querySelectorAll('link[rel="stylesheet"]')
            ).find(existing => existing.href === absoluteURL);

            if (existingLink) return;

            const newLink = document.createElement('link');

            newLink.rel = 'stylesheet';
            newLink.href = absoluteURL;
            newLink.dataset.pageAsset = 'true';

            const loadedPromise = new Promise(resolve => {
                newLink.onload = resolve;
                newLink.onerror = resolve;
            });

            document.head.appendChild(newLink);

            assetPromises.push(loadedPromise);
        });

        await Promise.all(assetPromises);
    }

    /* ---------------------------------------------------------
       PAGE METADATA
    --------------------------------------------------------- */

    function updatePageMetadata(newDocument) {
        const newTitle = newDocument.querySelector('title');

        if (newTitle) {
            document.title = newTitle.textContent;
        }

        const description = newDocument.querySelector(
            'meta[name="description"]'
        );

        let currentDescription = document.querySelector(
            'meta[name="description"]'
        );

        if (description) {
            if (!currentDescription) {
                currentDescription = document.createElement('meta');

                currentDescription.name = 'description';

                document.head.appendChild(currentDescription);
            }

            currentDescription.content = description.content;
        }

        const canonical = newDocument.querySelector(
            'link[rel="canonical"]'
        );

        let currentCanonical = document.querySelector(
            'link[rel="canonical"]'
        );

        if (canonical) {
            if (!currentCanonical) {
                currentCanonical = document.createElement('link');

                currentCanonical.rel = 'canonical';

                document.head.appendChild(currentCanonical);
            }

            currentCanonical.href = canonical.href;
        }

        updateActiveNavigation();
    }

    /* ---------------------------------------------------------
       PAGE SCRIPT EXECUTION
    --------------------------------------------------------- */

    function runPageScripts(newDocument) {
        const pageContent = document.getElementById('pageContent');

        if (!pageContent) return;

        const scripts = newDocument.querySelectorAll(
            '#pageContent script, body script'
        );

        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');

            Array.from(oldScript.attributes).forEach(attribute => {
                newScript.setAttribute(
                    attribute.name,
                    attribute.value
                );
            });

            if (oldScript.src) {
                newScript.src = new URL(
                    oldScript.src,
                    window.location.origin
                ).href;

                newScript.async = false;
            } else {
                newScript.textContent = oldScript.textContent;
            }

            document.body.appendChild(newScript);

            if (newScript.src) {
                newScript.addEventListener('load', function () {
                    newScript.remove();
                });

                newScript.addEventListener('error', function () {
                    console.error(
                        'Failed to load page script:',
                        newScript.src
                    );

                    newScript.remove();
                });
            } else {
                newScript.remove();
            }
        });

        /* Reinitialise page functions after navigation */

        if (typeof window.initialiseRevealAnimations === 'function') {
            window.initialiseRevealAnimations();
        }

        if (typeof window.initialiseContactForm === 'function') {
            window.initialiseContactForm();
        }
    }

    /* ---------------------------------------------------------
       SPA NAVIGATION
    --------------------------------------------------------- */

    async function navigateTo(url, addHistory = true) {
        if (navigationInProgress) return;

        navigationInProgress = true;

        try {
            const targetURL = new URL(
                url,
                window.location.origin
            );

            if (targetURL.origin !== window.location.origin) {
                window.location.href = targetURL.href;
                return;
            }

            const response = await fetch(targetURL.href, {
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(
                    `Page request failed: ${response.status}`
                );
            }

            const html = await response.text();

            const newDocument = new DOMParser().parseFromString(
                html,
                'text/html'
            );

            const newPageContent = newDocument.querySelector(
                '#pageContent'
            );

            const currentPageContent = document.getElementById(
                'pageContent'
            );

            if (!newPageContent || !currentPageContent) {
                window.location.href = targetURL.href;
                return;
            }

            /* Load new page styles before removing old styles */

            await loadPageAssets(newDocument);

            /* Replace page content */

            currentPageContent.innerHTML =
                newPageContent.innerHTML;

            /* Remove old page styles */

            removeOldPageAssets();

            /* Update title, description and canonical */

            updatePageMetadata(newDocument);

            /* Update browser history */

            if (addHistory) {
                window.history.pushState(
                    {},
                    '',
                    targetURL.pathname +
                    targetURL.search +
                    targetURL.hash
                );
            }

            /* Close mobile navigation */

            const navigation = document.querySelector(
                '#sharedHeader .nav-links, ' +
                '#sharedHeader .navigation, ' +
                '#sharedHeader #navLinks, ' +
                '#sharedHeader #mainNavigation'
            );

            if (navigation) {
                navigation.classList.remove('active');
            }

            const menuToggle = document.querySelector(
                '#sharedHeader .menu-toggle, ' +
                '#sharedHeader #menuToggle, ' +
                '#sharedHeader #mobileMenuToggle'
            );

            if (menuToggle) {
                menuToggle.classList.remove('active');

                menuToggle.setAttribute(
                    'aria-expanded',
                    'false'
                );
            }

            /* Scroll to top unless a hash target exists */

            if (targetURL.hash) {
                setTimeout(() => {
                    const targetElement = document.querySelector(
                        targetURL.hash
                    );

                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                    } else {
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            } else {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }

            /* Run new page scripts */

            runPageScripts(newDocument);

            /* Refresh active navigation state */

            updateActiveNavigation();

        } catch (error) {
            console.error(
                'Hawthorne Digital page navigation error:',
                error
            );

            window.location.href = url;

        } finally {
            navigationInProgress = false;
        }
    }

    /* ---------------------------------------------------------
       INTERNAL LINK HANDLING
    --------------------------------------------------------- */

    function handleInternalLinks() {
        document.addEventListener('click', function (event) {
            const link = event.target.closest('a[href]');

            if (!link) return;

            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            if (
                link.target &&
                link.target !== '_self'
            ) {
                return;
            }

            if (link.hasAttribute('download')) {
                return;
            }

            const href = link.getAttribute('href');

            if (
                !href ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                href.startsWith('javascript:')
            ) {
                return;
            }

            let targetURL;

            try {
                targetURL = new URL(
                    href,
                    window.location.origin
                );
            } catch (error) {
                return;
            }

            if (
                targetURL.origin !== window.location.origin
            ) {
                return;
            }

            /* Same-page hash links should work normally */

            if (
                targetURL.pathname === window.location.pathname &&
                targetURL.search === window.location.search &&
                targetURL.hash
            ) {
                return;
            }

            event.preventDefault();

            navigateTo(targetURL.href);
        });
    }

    /* ---------------------------------------------------------
       BROWSER BACK / FORWARD
    --------------------------------------------------------- */

    window.addEventListener('popstate', function () {
        navigateTo(window.location.href, false);
    });

    /* ---------------------------------------------------------
       INITIALISE
    --------------------------------------------------------- */

    async function initialiseHawthorneShared() {
        markExistingPageAssets();

        await Promise.all([
            loadSharedHeader(),
            loadSharedFooter()
        ]);

        handleInternalLinks();

        updateActiveNavigation();

        /* Initialise homepage reveal effects if available */

        if (typeof window.initialiseRevealAnimations === 'function') {
            window.initialiseRevealAnimations();
        }

        /* Initialise contact form if available */

        if (typeof window.initialiseContactForm === 'function') {
            window.initialiseContactForm();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            initialiseHawthorneShared
        );
    } else {
        initialiseHawthorneShared();
    }

    /* ---------------------------------------------------------
       EXPOSE NAVIGATION FUNCTION
    --------------------------------------------------------- */

    window.hawthorneNavigate = navigateTo;

})();
