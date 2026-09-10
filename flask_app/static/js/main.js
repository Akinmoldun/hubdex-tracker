/*
 * Hubdex: lightweight client enhancements.
 * Plain JavaScript, no dependencies.
 */
(function () {
  "use strict";

  // Auto-dismiss flash messages after a few seconds.
  var flashes = document.querySelectorAll(".flash");
  flashes.forEach(function (flash) {
    var close = flash.querySelector(".flash-close");
    if (close) {
      close.addEventListener("click", function () {
        flash.remove();
      });
    }
    setTimeout(function () {
      if (document.body.contains(flash)) {
        flash.style.opacity = "0";
        setTimeout(function () { flash.remove(); }, 200);
      }
    }, 5000);
  });

  // Confirm destructive actions (delete forms carry their own message).
  document.querySelectorAll("form[data-confirm]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      var message = form.getAttribute("data-confirm") ||
        "Remove this application from your hub? This cannot be undone.";
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });

  // Inline stage switching: submit the row form when a stage is picked.
  document.querySelectorAll("select.stage-select").forEach(function (select) {
    select.addEventListener("change", function () {
      if (select.form) {
        select.form.submit();
      }
    });
  });

  // Mobile navigation: open/close the collapsible menu.
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("site-nav");
  if (toggle && panel) {
    var setMenu = function (open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    toggle.addEventListener("click", function () {
      setMenu(panel.hidden);
    });
    // Close after choosing a link, on Escape, and when growing past the
    // breakpoint where the inline nav reappears.
    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setMenu(false);
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hidden) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) {
        setMenu(false);
      }
    });
  }

  // Keep the search input focused when a search is active.
  var searchInput = document.querySelector(".search-input[name='q']");
  if (searchInput && searchInput.value) {
    searchInput.focus();
  }

  // Clear the search easily with Escape.
  if (searchInput) {
    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && searchInput.value) {
        window.location.href = searchInput.closest("form").getAttribute("action") || "/dashboard";
      }
    });
  }
})();
