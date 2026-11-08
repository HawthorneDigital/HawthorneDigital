
/* HAWTHORNE DIGITAL - SHARED WEBSITE SETTINGS */

const HAWTHORNE_CONFIG = {

    announcement: "PREMIUM WEBSITES WITHOUT THE PREMIUM PRICE."

};


/* UPDATE ANNOUNCEMENT ACROSS ALL PAGES */

document.addEventListener("DOMContentLoaded", function () {

    const announcement = document.getElementById("siteAnnouncement");

    if (announcement) {
        announcement.textContent = HAWTHORNE_CONFIG.announcement;
    }

});
