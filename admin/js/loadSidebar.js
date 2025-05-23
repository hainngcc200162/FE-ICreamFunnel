
fetch('../components/sidebar.html')
  .then(res => res.text())
  .then(data => {
    const menuContainer = document.getElementById('layout-menu');
    menuContainer.innerHTML = data;

    highlightActiveMenu();
    initSidebarMenu();
    filterMenuByRole();
  });

function highlightActiveMenu() {
  const currentPath = window.location.pathname;
  const menuLinks = document.querySelectorAll(".menu-link");

  menuLinks.forEach(link => {
    const href = link.getAttribute("href");

    if (!href || href.startsWith("javascript")) return;

    if (currentPath.includes(href.split('.')[0])) { 

      const menuItem = link.closest(".menu-item");
      if (menuItem) {
        menuItem.classList.add("active");
      }

      const parentSubmenu = menuItem.closest(".menu-sub");
      if (parentSubmenu) {
        const parentItem = parentSubmenu.closest(".menu-item");
        if (parentItem) {
          parentItem.classList.add("active", "open");
        }
      }
    }
  });
}

function initSidebarMenu() {
  (function () {
    // Initialize menu
    //-----------------

    let layoutMenuEl = document.querySelectorAll('#layout-menu');
    layoutMenuEl.forEach(function (element) {
      menu = new Menu(element, {
        orientation: 'vertical',
        closeChildren: false
      });
      // Change parameter to true if you want scroll animation
      window.Helpers.scrollToActive((animate = false));
      window.Helpers.mainMenu = menu;
    });

    // Initialize menu togglers and bind click on each
    let menuToggler = document.querySelectorAll('.layout-menu-toggle');
    menuToggler.forEach(item => {
      item.addEventListener('click', event => {
        event.preventDefault();
        window.Helpers.toggleCollapsed();
      });
    });

    // Display menu toggle (layout-menu-toggle) on hover with delay
    let delay = function (elem, callback) {
      let timeout = null;
      elem.onmouseenter = function () {
        // Set timeout to be a timer which will invoke callback after 300ms (not for small screen)
        if (!Helpers.isSmallScreen()) {
          timeout = setTimeout(callback, 300);
        } else {
          timeout = setTimeout(callback, 0);
        }
      };

      elem.onmouseleave = function () {
        // Clear any timers set to timeout
        document.querySelector('.layout-menu-toggle').classList.remove('d-block');
        clearTimeout(timeout);
      };
    };
    if (document.getElementById('layout-menu')) {
      delay(document.getElementById('layout-menu'), function () {
        // not for small screen
        if (!Helpers.isSmallScreen()) {
          document.querySelector('.layout-menu-toggle').classList.add('d-block');
        }
      });
    }

    // Display in main menu when menu scrolls
    let menuInnerContainer = document.getElementsByClassName('menu-inner'),
      menuInnerShadow = document.getElementsByClassName('menu-inner-shadow')[0];
    if (menuInnerContainer.length > 0 && menuInnerShadow) {
      menuInnerContainer[0].addEventListener('ps-scroll-y', function () {
        if (this.querySelector('.ps__thumb-y').offsetTop) {
          menuInnerShadow.style.display = 'block';
        } else {
          menuInnerShadow.style.display = 'none';
        }
      });
    }

    // Init helpers & misc
    // --------------------

    // Init BS Tooltip
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Accordion active class
    const accordionActiveFunction = function (e) {
      if (e.type == 'show.bs.collapse' || e.type == 'show.bs.collapse') {
        e.target.closest('.accordion-item').classList.add('active');
      } else {
        e.target.closest('.accordion-item').classList.remove('active');
      }
    };

    const accordionTriggerList = [].slice.call(document.querySelectorAll('.accordion'));
    const accordionList = accordionTriggerList.map(function (accordionTriggerEl) {
      accordionTriggerEl.addEventListener('show.bs.collapse', accordionActiveFunction);
      accordionTriggerEl.addEventListener('hide.bs.collapse', accordionActiveFunction);
    });

    // Auto update layout based on screen size
    window.Helpers.setAutoUpdate(true);

    // Toggle Password Visibility
    window.Helpers.initPasswordToggle();

    // Speech To Text
    window.Helpers.initSpeechToText();

    // Manage menu expanded/collapsed with templateCustomizer & local storage
    //------------------------------------------------------------------

    // If current layout is horizontal OR current window screen is small (overlay menu) than return from here
    if (window.Helpers.isSmallScreen()) {
      return;
    }


    // Auto update menu collapsed/expanded based on the themeConfig
    window.Helpers.setCollapsed(true, false);
  })();
}

function filterMenuByRole() {
  const userRole = localStorage.getItem("userRole"); // Lấy vai trò từ localStorage

  if (!userRole) {
    console.warn("Không tìm thấy userRole trong localStorage");
    return;
  }

  const menuItems = document.querySelectorAll(".menu-item");
  const menuHeaders= document.querySelectorAll(".menu-header");

  menuItems.forEach(item => {
    const requiredRole = item.getAttribute("data-role");

    if (requiredRole && requiredRole !== userRole) {
      item.style.display = "none";
    }
  });


  menuHeaders.forEach(item => {
    const requiredRole = item.getAttribute("data-role");

    if (requiredRole && requiredRole !== userRole) {
      item.style.display = "none";
    }
  });
}


