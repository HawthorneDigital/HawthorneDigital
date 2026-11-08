
document.addEventListener("DOMContentLoaded", async function () {
    const placeholder = document.getElementById("sharedHeader");

    if (!placeholder) return;

    try {
        const response = await fetch("/shared/header.html");

        if (!response.ok) {
            throw new Error("Could not load the shared header.");
        }

        placeholder.innerHTML = await response.text();

        const header = document.getElementById("siteHeader");
        const menuToggle = document.getElementById("menuToggle");
        const navigation = document.getElementById("navigation");
        const servicesDropdown = document.getElementById("servicesDropdown");
        const servicesTrigger = document.getElementById("servicesTrigger");

        // HEADER SHADOW
        function updateHeader() {
            header.classList.toggle("scrolled", window.scrollY > 15);
        }

        window.addEventListener("scroll", updateHeader, { passive: true });
        updateHeader();

        // MOBILE MENU
        menuToggle.addEventListener("click", function () {
            const isOpen = navigation.classList.toggle("open");

            menuToggle.setAttribute("aria-expanded", isOpen);
            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );

            menuToggle.textContent = isOpen ? "✕" : "☰";
        });

        // SERVICES DROPDOWN
        servicesTrigger.addEventListener("click", function (event) {
            if (window.innerWidth <= 760) {
                event.preventDefault();

                const isOpen = servicesDropdown.classList.toggle("open");
                servicesTrigger.setAttribute("aria-expanded", isOpen);
            }
        });

        // CLOSE AFTER SELECTING A LINK
        navigation.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navigation.classList.remove("open");
                servicesDropdown.classList.remove("open");

                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.setAttribute("aria-label", "Open navigation");
                menuToggle.textContent = "☰";

                servicesTrigger.setAttribute("aria-expanded", "false");
            });
        });

        // CLOSE MENUS WHEN CLICKING OUTSIDE
        document.addEventListener("click", function (event) {
            if (!servicesDropdown.contains(event.target)) {
                servicesDropdown.classList.remove("open");
                servicesTrigger.setAttribute("aria-expanded", "false");
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

        // RESET WHEN RESIZING TO DESKTOP
        window.addEventListener("resize", function () {
            if (window.innerWidth > 760) {
                navigation.classList.remove("open");
                servicesDropdown.classList.remove("open");

                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.textContent = "☰";
                servicesTrigger.setAttribute("aria-expanded", "false");
            }
        });

    } catch (error) {
        console.error("Hawthorne Digital header:", error);
    }
});
