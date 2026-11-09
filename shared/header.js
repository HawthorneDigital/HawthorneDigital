(function () {
    "use strict";

    const HEADER_CACHE = "hawthorne_shared_header_v4";
    const FOOTER_CACHE = "hawthorne_shared_footer_v4";

    const headerPlaceholder = document.getElementById("sharedHeader");
    const footerPlaceholder = document.getElementById("sharedFooter");

    let navigating = false;

    function readCache(key) {
        try {
            return sessionStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function saveCache(key, value) {
        try {
            sessionStorage.setItem(key, value);
        } catch (error) {
            // Continue without caching.
        }
    }

    async function loadSharedFile(url, key, placeholder, mountFunction) {
        if (!placeholder) return;

        const cached = readCache(key);

        if (cached) {
            mountFunction(cached);
        }

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(url + " could not be loaded.");
            }

            const html = await response.text();

            saveCache(key, html);

            if (!cached) {
                mountFunction(html);
            }
        } catch (error) {
            console.error("Hawthorne Digital:", error);

            if (!cached && !placeholder.innerHTML.trim()) {
                placeholder.innerHTML = "";
            }
        }
    }

    function setupHeader() {
        const header = document.getElementById("siteHeader");
        const menuToggle = document.getElementById("menuToggle");
        const navigation = document.getElementById("navigation");
        const servicesDropdown = document.getElementById("servicesDropdown");
        const servicesTrigger = document.getElementById("servicesTrigger");

        if (!header || !menuToggle || !navigation) return;
        if (header.dataset.initialised === "true") return;

        header.dataset.initialised = "true";

        function closeMenu() {
            navigation.classList.remove("open");

            if (servicesDropdown) {
                servicesDropdown.classList.remove("open");
            }

            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
            menuToggle.textContent = "☰";

            if (servicesTrigger) {
                servicesTrigger.setAttribute("aria-expanded", "false");
            }
        }

        function updateHeader() {
            header.classList.toggle("scrolled", window.scrollY > 15);
        }

        window.addEventListener("scroll", updateHeader, {
            passive: true
        });

        updateHeader();

        menuToggle.addEventListener("click", function () {
            const isOpen = navigation.classList.toggle("open");

            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );

            menuToggle.textContent = isOpen ? "✕" : "☰";
        });

        if (servicesTrigger && servicesDropdown) {
            servicesTrigger.addEventListener("click", function (event) {
                if (window.innerWidth <= 760) {
                    event.preventDefault();

                    const isOpen = servicesDropdown.classList.toggle("open");

                    servicesTrigger.setAttribute(
                        "aria-expanded",
                        String(isOpen)
                    );
                }
            });
        }

        navigation.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("click", function (event) {
            if (
                servicesDropdown &&
                !servicesDropdown.contains(event.target)
            ) {
                servicesDropdown.classList.remove("open");

                if (servicesTrigger) {
                    servicesTrigger.setAttribute("aria-expanded", "false");
                }
            }

            if (
                !navigation.contains(event.target) &&
                !menuToggle.contains(event.target)
            ) {
                closeMenu();
            }
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 760) {
                closeMenu();
            }
        });
    }

    function mountHeader(html) {
        if (!headerPlaceholder || !html) return;

        if (!document.getElementById("siteHeader")) {
            headerPlaceholder.innerHTML = html;
        }

        setupHeader();
    }

    function mountFooter(html) {
        if (!footerPlaceholder || !html) return;

        if (!footerPlaceholder.querySelector(".site-footer")) {
            footerPlaceholder.innerHTML = html;
        }

        updateFooterYear();
    }

    function updateFooterYear() {
        document.querySelectorAll(".site-current-year").forEach(function (year) {
            year.textContent = new Date().getFullYear();
        });
    }

    function closeNavigation() {
        const navigation = document.getElementById("navigation");
        const menuToggle = document.getElementById("menuToggle");
        const servicesDropdown = document.getElementById("servicesDropdown");
        const servicesTrigger = document.getElementById("servicesTrigger");

        if (navigation) navigation.classList.remove("open");
        if (servicesDropdown) servicesDropdown.classList.remove("open");

        if (menuToggle) {
            menuToggle.textContent = "☰";
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
        }

        if (servicesTrigger) {
            servicesTrigger.setAttribute("aria-expanded", "false");
        }
    }

    function markExistingPageAssets() {
        document.querySelectorAll("head style").forEach(function (style) {
            style.dataset.pageAsset = "true";
        });

        document.querySelectorAll('head link[rel="stylesheet"]').forEach(function (link) {
            const href = link.getAttribute("href") || "";

            if (
                !href.includes("/shared/header.css") &&
                !href.includes("/shared/footer.css")
            ) {
                link.dataset.pageAsset = "true";
            }
        });

        document.querySelectorAll("body script").forEach(function (script) {
            script.dataset.pageScript = "true";
        });
    }

    function removeOldPageAssets() {
        document.querySelectorAll("[data-page-asset]").forEach(function (asset) {
            asset.remove();
        });

        document.querySelectorAll("body script[data-page-script]").forEach(function (script) {
            script.remove();
        });
    }

    /*
     * Prepare the destination stylesheets without applying them yet.
     * This gives external CSS time to load before the page changes.
     */
    async function preparePageAssets(newDocument) {
        const assets = Array.from(
            newDocument.head.querySelectorAll(
                'style, link[rel="stylesheet"]'
            )
        );

        const preparedLinks = [];
        const inlineStyles = [];

        for (const asset of assets) {
            if (asset.tagName === "LINK") {
                const href = asset.getAttribute("href") || "";

                if (
                    href.includes("/shared/header.css") ||
                    href.includes("/shared/footer.css")
                ) {
                    continue;
                }

                const absoluteHref = new URL(
                    href,
                    window.location.href
                ).href;

                const link = document.createElement("link");

                link.rel = "stylesheet";
                link.href = absoluteHref;

                // Load without applying the stylesheet yet.
                link.media = "not all";

                preparedLinks.push(link);

                await new Promise(function (resolve) {
                    link.onload = resolve;
                    link.onerror = resolve;

                    document.head.appendChild(link);
                });

            } else {
                inlineStyles.push(asset.textContent);
            }
        }

        return {
            links: preparedLinks,
            styles: inlineStyles
        };
    }

    function activatePageAssets(preparedAssets) {
        preparedAssets.links.forEach(function (link) {
            link.media = "all";
            link.dataset.pageAsset = "true";
        });

        preparedAssets.styles.forEach(function (css) {
            const style = document.createElement("style");

            style.textContent = css;
            style.dataset.pageAsset = "true";

            document.head.appendChild(style);
        });
    }

    function updatePageMetadata(newDocument) {
        document.title = newDocument.title || "Hawthorne Digital";

        const newDescription = newDocument.querySelector(
            'meta[name="description"]'
        );

        let description = document.querySelector(
            'meta[name="description"]'
        );

        if (newDescription) {
            if (!description) {
                description = document.createElement("meta");
                description.name = "description";

                document.head.appendChild(description);
            }

            description.content = newDescription.content;
        }

        const newTheme = newDocument.querySelector(
            'meta[name="theme-color"]'
        );

        let theme = document.querySelector(
            'meta[name="theme-color"]'
        );

        if (newTheme) {
            if (!theme) {
                theme = document.createElement("meta");
                theme.name = "theme-color";

                document.head.appendChild(theme);
            }

            theme.content = newTheme.content;
        }
    }

    async function runPageScripts(newDocument) {
        const scripts = Array.from(
            newDocument.body.querySelectorAll("script")
        );

        for (const oldScript of scripts) {
            const type = oldScript.getAttribute("type");

            if (
                type &&
                type !== "text/javascript" &&
                type !== "application/javascript"
            ) {
                continue;
            }

            const script = document.createElement("script");

            script.dataset.pageScript = "true";

            Array.from(oldScript.attributes).forEach(function (attribute) {
                if (attribute.name !== "src") {
                    script.setAttribute(
                        attribute.name,
                        attribute.value
                    );
                }
            });

            if (oldScript.src) {
                script.src = oldScript.src;

                await new Promise(function (resolve) {
                    script.onload = resolve;
                    script.onerror = resolve;

                    document.body.appendChild(script);
                });
            } else {
                script.textContent = oldScript.textContent;

                document.body.appendChild(script);
            }
        }
    }

    async function navigateTo(url, addHistory) {
        if (navigating) return;

        const target = new URL(url, window.location.href);

        if (target.origin !== window.location.origin) {
            window.location.href = target.href;
            return;
        }

        if (
            target.pathname === window.location.pathname &&
            target.search === window.location.search &&
            target.hash
        ) {
            const targetElement = document.getElementById(
                decodeURIComponent(target.hash.slice(1))
            );

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: "smooth"
                });
            }

            return;
        }

        navigating = true;

        try {
            const response = await fetch(target.href, {
                headers: {
                    "X-Requested-With": "Hawthorne-Navigation"
                }
            });

            if (!response.ok) {
                window.location.href = target.href;
                return;
            }

            const html = await response.text();

            const newDocument = new DOMParser().parseFromString(
                html,
                "text/html"
            );

            const newContent = newDocument.querySelector("#pageContent");
            const currentContent = document.querySelector("#pageContent");

            if (!newContent || !currentContent) {
                window.location.href = target.href;
                return;
            }

            // Prepare destination CSS before replacing the current page.
            const preparedAssets = await preparePageAssets(newDocument);

            // Replace the page content.
            currentContent.innerHTML = newContent.innerHTML;

            // Update browser metadata and address bar.
            updatePageMetadata(newDocument);

            if (addHistory) {
                history.pushState(
                    {},
                    "",
                    target.pathname + target.search + target.hash
                );
            }

            closeNavigation();

            // Remove old page styles/scripts and activate the new styles.
            removeOldPageAssets();
            activatePageAssets(preparedAssets);

            window.scrollTo(0, 0);

            // Execute destination page scripts.
            await runPageScripts(newDocument);

            updateFooterYear();

            // Reinitialise reveal animations on the new page.
            if (
                typeof window.initialiseRevealAnimations === "function"
            ) {
                window.initialiseRevealAnimations();
            }

            if (target.hash) {
                requestAnimationFrame(function () {
                    const element = document.getElementById(
                        decodeURIComponent(target.hash.slice(1))
                    );

                    if (element) {
                        element.scrollIntoView();
                    }
                });
            }

        } catch (error) {
            console.error(
                "Hawthorne Digital navigation:",
                error
            );

            window.location.href = target.href;

        } finally {
            navigating = false;
        }
    }

    function handleInternalLinks() {
        document.addEventListener("click", function (event) {
            const link = event.target.closest("a");

            if (!link) return;
            if (event.defaultPrevented) return;
            if (event.button !== 0) return;

            if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            if (link.target && link.target !== "_self") return;
            if (link.hasAttribute("download")) return;
            if (link.hasAttribute("data-no-spa")) return;

            const href = link.getAttribute("href");

            if (
                !href ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("javascript:")
            ) {
                return;
            }

            const target = new URL(
                href,
                window.location.href
            );

            if (target.origin !== window.location.origin) return;

            if (
                target.pathname === window.location.pathname &&
                target.search === window.location.search &&
                target.hash
            ) {
                return;
            }

            event.preventDefault();

            navigateTo(target.href, true);
        });
    }

    window.addEventListener("popstate", function () {
        navigateTo(window.location.href, false);
    });

    markExistingPageAssets();

    handleInternalLinks();

    loadSharedFile(
        "/shared/header.html",
        HEADER_CACHE,
        headerPlaceholder,
        mountHeader
    );

    loadSharedFile(
        "/shared/footer.html",
        FOOTER_CACHE,
        footerPlaceholder,
        mountFooter
    );

})();
