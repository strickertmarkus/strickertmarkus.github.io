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

  if (timelineMarkers.length > 0 && timelineLine) {
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
      const marketScrollStart = document.querySelector('.academic-timeline')?.offsetTop || 0;
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate timeline line animation
      if (scrollPosition > marketScrollStart - windowHeight) {
        const progress = (scrollPosition - marketScrollStart + windowHeight) / (document.body.scrollHeight - marketScrollStart);
        const clampedProgress = Math.max(0, Math.min(1, progress));
        timelineLine.style.transform = `scaleY(${clampedProgress})`;
      }

      // Update active marker based on card position
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

    // Set initial marker on page load
    if (publicationCards.length > 0) {
      timelineMarkers[0].classList.add('active');
    }
  }
});
