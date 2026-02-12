// Hamburger Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menu-toggle');
  const dropdownMenu = document.getElementById('dropdown-menu');
  const menuOverlay = document.getElementById('menu-overlay');
  const menuLinks = dropdownMenu.querySelectorAll('a');

  // Toggle menu
  menuToggle.addEventListener('click', function() {
    menuToggle.classList.toggle('active');
    dropdownMenu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
  });

  // Close menu when overlay is clicked
  menuOverlay.addEventListener('click', function() {
    menuToggle.classList.remove('active');
    dropdownMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
  });

  // Close menu when a link is clicked
  menuLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      menuToggle.classList.remove('active');
      dropdownMenu.classList.remove('active');
      menuOverlay.classList.remove('active');
    });
  });

  // Timeline Navigation Functionality
  const timelineItems = document.querySelectorAll('.timeline-nav-item');
  
  if (timelineItems.length > 0) {
    timelineItems.forEach(item => {
      item.addEventListener('click', function() {
        const sectionId = this.getAttribute('data-section');
        const targetSection = document.getElementById(sectionId);
        
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Update active state
          timelineItems.forEach(i => i.classList.remove('active'));
          this.classList.add('active');
        }
      });
    });

    // Update active timeline item on scroll
    window.addEventListener('scroll', function() {
      const sections = document.querySelectorAll('[id]');
      const scrollPosition = window.scrollY + 200;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          timelineItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === section.id) {
              item.classList.add('active');
            }
          });
        }
      });
    });
  }

  // Academic Timeline Functionality
  const timelineMarkers = document.querySelectorAll('.timeline-marker');
  const timelineLine = document.getElementById('timelineLine');
  const publicationCards = document.querySelectorAll('.publication-card');
  const academicPublications = document.querySelector('.academic-publications');

  if (timelineMarkers.length > 0 && timelineLine && academicPublications) {
    // Handle marker click
    timelineMarkers.forEach((marker, index) => {
      marker.addEventListener('click', function() {
        if (publicationCards[index]) {
          publicationCards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });

    // Animate timeline line and markers on scroll
    window.addEventListener('scroll', function() {
      const scrollPosition = window.scrollY;
      const sectionStart = academicPublications.offsetTop;
      const sectionEnd = sectionStart + academicPublications.offsetHeight;
      const timelineEnd = document.querySelector('.academic-timeline').offsetTop + document.querySelector('.academic-timeline').offsetHeight;

      // Calculate timeline line height based on scroll position through publication cards
      const maxTimelineHeight = timelineEnd - sectionStart;
      
      if (scrollPosition >= sectionStart && scrollPosition <= sectionEnd) {
        // Scroll is within the publications section
        const progressInSection = (scrollPosition - sectionStart) / (sectionEnd - sectionStart);
        const lineHeight = maxTimelineHeight * progressInSection;
        timelineLine.style.height = lineHeight + 'px';
        timelineLine.style.top = sectionStart + 'px';
      } else if (scrollPosition > sectionEnd) {
        // Past the section - show full line
        timelineLine.style.height = maxTimelineHeight + 'px';
        timelineLine.style.top = sectionStart + 'px';
      } else {
        // Before section
        timelineLine.style.height = '0';
        timelineLine.style.top = sectionStart + 'px';
      }

      // Update active marker based on card position
      const windowHeight = window.innerHeight;
      publicationCards.forEach((card, index) => {
        const cardTop = card.getBoundingClientRect().top;
        const cardHeight = card.getBoundingClientRect().height;
        const cardCenter = cardTop + cardHeight / 2;

        if (timelineMarkers[index]) {
          // Mark as active if card is in center of viewport
          if (cardCenter > windowHeight * 0.3 && cardCenter < windowHeight * 0.7) {
            timelineMarkers.forEach(m => m.classList.remove('active'));
            timelineMarkers[index].classList.add('active');
          }
        }
      });
    });

    // Trigger initial scroll event
    window.dispatchEvent(new Event('scroll'));
  }
});
