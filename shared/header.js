
(function () {

    const HEADER_CACHE = "hawthorne_shared_header_v3";
    const FOOTER_CACHE = "hawthorne_shared_footer_v3";

    const headerPlaceholder = document.getElementById("sharedHeader");
    const footerPlaceholder = document.getElementById("sharedFooter");

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

    // -----------------------------------------
    // HEADER SETUP
    // -----------------------------------------

    function setupHeader() {

        const header = document.getElementById("siteHeader");
        const menuToggle = document.getElementById("menuToggle");
        const navigation = document.getElementById("navigation");
        const servicesDropdown = document.getElementById("servicesDropdown");
        const servicesTrigger = document.getElementById("servicesTrigger");

        if (!header || !menuToggle || !navigation) return;

        // Prevent duplicate initialisation.
        if (header.dataset.initialised === "true") return;

        header.dataset.initialised = "true";

        function updateHeader() {
            header.classList.toggle("scrolled", window.scrollY > 15);
        }

        window.addEventListener("scroll", updateHeader, {
            passive: true
        });

        updateHeader();

        // Mobile menu.
        menuToggle.addEventListener("click", function () {

            const isOpen = navigation.classList.toggle("open");

            menuToggle.setAttribute("aria-expanded", isOpen);
            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );

            menuToggle.textContent = isOpen ? "✕" : "☰";

        });

        // Mobile services dropdown.
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

        // Close mobile navigation after selecting a link.
        navigation.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {

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

            });

        });

        // Close menus when clicking outside.
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

                navigation.classList.remove("open");

                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.setAttribute("aria-label", "Open navigation");
                menuToggle.textContent = "☰";

            }

        });

        // Reset mobile navigation when returning to desktop.
        window.addEventListener("resize", function () {

            if (window.innerWidth > 760) {

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

        });

    }

    // -----------------------------------------
    // MOUNT HEADER
    // -----------------------------------------

    function mountHeader(html) {

        if (!headerPlaceholder || !html) return;

        headerPlaceholder.innerHTML = html;

        setupHeader();

    }

    // -----------------------------------------
    // MOUNT FOOTER
    // -----------------------------------------

    function mountFooter(html) {

        if (!footerPlaceholder || !html) return;

        footerPlaceholder.innerHTML = html;

        document.querySelectorAll(".site-current-year").forEach(function (year) {
            year.textContent = new Date().getFullYear();
        });

    }

    // -----------------------------------------
    // LOAD CACHED COMPONENTS IMMEDIATELY
    // -----------------------------------------

    const cachedHeader = readCache(HEADER_CACHE);
    const cachedFooter = readCache(FOOTER_CACHE);

    if (cachedHeader) {
        mountHeader(cachedHeader);
    }

    if (cachedFooter) {
        mountFooter(cachedFooter);
    }

    // -----------------------------------------
    // UPDATE CACHE IN THE BACKGROUND
    // Do not replace already-mounted components.
    // -----------------------------------------

    if (headerPlaceholder) {

        fetch("/shared/header.html")
            .then(function (response) {

                if (!response.ok) {
                    throw new Error("Header could not be loaded.");
                }

                return response.text();

            })
            .then(function (html) {

                saveCache(HEADER_CACHE, html);

                // Only mount if no cached header was available.
                if (!cachedHeader) {
                    mountHeader(html);
                }

            })
            .catch(function (error) {
                console.error("Hawthorne Digital header:", error);
            });

    }

    if (footerPlaceholder) {

        fetch("/shared/footer.html")
            .then(function (response) {

                if (!response.ok) {
                    throw new Error("Footer could not be loaded.");
                }

                return response.text();

            })
            .then(function (html) {

                saveCache(FOOTER_CACHE, html);

                // Only mount if no cached footer was available.
                if (!cachedFooter) {
                    mountFooter(html);
                }

            })
            .catch(function (error) {
                console.error("Hawthorne Digital footer:", error);
            });

    }

})();
