
document.addEventListener("DOMContentLoaded", function () {

    const HEADER_CACHE = "hawthorne_shared_header_v2";
    const FOOTER_CACHE = "hawthorne_shared_footer_v2";

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
            // Continue without caching if storage is unavailable.
        }
    }

    function setupHeader() {

        const header = document.getElementById("siteHeader");
        const menuToggle = document.getElementById("menuToggle");
        const navigation = document.getElementById("navigation");
        const servicesDropdown = document.getElementById("servicesDropdown");
        const servicesTrigger = document.getElementById("servicesTrigger");

        if (!header || !menuToggle || !navigation) return;

        function updateHeader() {
            header.classList.toggle("scrolled", window.scrollY > 15);
        }

        window.addEventListener("scroll", updateHeader, {
            passive: true
        });

        updateHeader();

        if (menuToggle.dataset.initialised === "true") return;

        menuToggle.dataset.initialised = "true";

        menuToggle.addEventListener("click", function () {

            const isOpen = navigation.classList.toggle("open");

            menuToggle.setAttribute("aria-expanded", isOpen);

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
                        isOpen
                    );

                }

            });

        }

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

        window.addEventListener("resize", function () {

            if (window.innerWidth > 760) {

                navigation.classList.remove("open");

                if (servicesDropdown) {
                    servicesDropdown.classList.remove("open");
                }

                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.textContent = "☰";

                if (servicesTrigger) {
                    servicesTrigger.setAttribute("aria-expanded", "false");
                }

            }

        });

    }

    function mountHeader(html) {

        if (!headerPlaceholder || !html) return;

        headerPlaceholder.innerHTML = html;

        setupHeader();

    }

    function mountFooter(html) {

        if (!footerPlaceholder || !html) return;

        footerPlaceholder.innerHTML = html;

        document.querySelectorAll(".site-current-year").forEach(function (year) {
            year.textContent = new Date().getFullYear();
        });

    }

    // Load cached components immediately where available.
    const cachedHeader = readCache(HEADER_CACHE);
    const cachedFooter = readCache(FOOTER_CACHE);

    if (cachedHeader) {
        mountHeader(cachedHeader);
    }

    if (cachedFooter) {
        mountFooter(cachedFooter);
    }

    // Fetch the latest shared components.
    const requests = [];

    if (headerPlaceholder) {
        requests.push(
            fetch("/shared/header.html")
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Header could not be loaded.");
                    }
                    return response.text();
                })
                .then(html => {

                    saveCache(HEADER_CACHE, html);

                    if (!cachedHeader || cachedHeader !== html) {
                        mountHeader(html);
                    }

                })
        );
    }

    if (footerPlaceholder) {
        requests.push(
            fetch("/shared/footer.html")
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Footer could not be loaded.");
                    }
                    return response.text();
                })
                .then(html => {

                    saveCache(FOOTER_CACHE, html);

                    if (!cachedFooter || cachedFooter !== html) {
                        mountFooter(html);
                    }

                })
        );
    }

    Promise.all(requests).catch(function (error) {
        console.error("Hawthorne Digital shared components:", error);
    });

});
