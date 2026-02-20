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
      const windowHeight = window.innerHeight;

      timelineItems.forEach(item => {
        const sectionId = item.getAttribute('data-section');
        const section = document.getElementById(sectionId);
        
        if (section) {
          const sectionTop = section.getBoundingClientRect().top;
          const sectionBottom = sectionTop + section.getBoundingClientRect().height;

          // Clear active class first
          item.classList.remove('active');

          // Check if section is visible on screen
          const isVisible = sectionBottom > 0 && sectionTop < windowHeight;

          if (isVisible) {
            item.classList.add('active');
          }
        }
      });
    });
    
    // Trigger initial scroll event
    window.dispatchEvent(new Event('scroll'));
  }

  // Academic Timeline Functionality
  const timelineMarkers = document.querySelectorAll('.timeline-marker');
  const publicationCards = document.querySelectorAll('.publication-card');

  if (timelineMarkers.length > 0) {
    // Handle marker click
    timelineMarkers.forEach((marker, index) => {
      marker.addEventListener('click', function() {
        if (publicationCards[index]) {
          publicationCards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });

    // Update marker visibility based on scroll position through publications
    window.addEventListener('scroll', function() {
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY;

      publicationCards.forEach((card, index) => {
        if (timelineMarkers[index]) {
          const cardTop = card.getBoundingClientRect().top;
          const cardBottom = cardTop + card.getBoundingClientRect().height;
          const cardAbsoluteTop = card.offsetTop;

          // Clear all classes first
          timelineMarkers[index].classList.remove('active', 'reached', 'visible');

          // Check if card is visible on screen
          const isVisible = cardBottom > 0 && cardTop < windowHeight;

          if (isVisible) {
            timelineMarkers[index].classList.add('visible');
            // Apply active class while card is visible on screen
            timelineMarkers[index].classList.add('active');
          }

          // Check if card has been passed (scrolled past top)
          if (cardTop < 0) {
            timelineMarkers[index].classList.add('reached');
          }
        }
      });
    });

    // Trigger initial scroll event
    window.dispatchEvent(new Event('scroll'));
  }

  // Publication Plot Click Functionality
  publicationCards.forEach((card) => {
    const plotBtn = card.querySelector('.plot-btn');
    const plotPlaceholder = card.querySelector('.publication-plot-placeholder');
    const closeButton = plotPlaceholder.querySelector('.publication-plot-close');

    // Click button to toggle plot visibility
    plotBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (!plotPlaceholder.classList.contains('visible')) {
        // Position plot to the right of the button
        const btnRect = plotBtn.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        
        // Position plot relative to button, 80px to the right and 80px down
        const plotOffsetX = btnRect.right - cardRect.left + 80;
        const plotOffsetY = btnRect.top - cardRect.top + 80;
        
        plotPlaceholder.style.left = plotOffsetX + 'px';
        plotPlaceholder.style.top = plotOffsetY + 'px';
      }
      
      plotPlaceholder.classList.toggle('visible');
    });

    // Close button functionality
    closeButton.addEventListener('click', function(e) {
      e.stopPropagation();
      plotPlaceholder.classList.remove('visible');
    });
  });

  // Project Video Hover Autoplay Functionality
  const projectVideos = document.querySelectorAll('.project-video');
  
  projectVideos.forEach(video => {
    // Play on hover
    video.addEventListener('mouseenter', function() {
      this.play();
    });
    
    // Pause on mouse leave
    video.addEventListener('mouseleave', function() {
      this.pause();
      this.currentTime = 0; // Reset to beginning
      this.load(); // Reload to show poster image
    });

    // Click to expand to modal
    video.addEventListener('click', function(e) {
      e.stopPropagation();
      openVideoModal(this);
    });
  });

  // Video Modal Functions
  function openVideoModal(videoElement) {
    // Create modal overlay if it doesn't exist
    let overlay = document.getElementById('video-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'video-modal-overlay';
      overlay.className = 'video-modal-overlay';
      
      const container = document.createElement('div');
      container.className = 'video-modal-container';
      container.id = 'video-modal-container';
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'video-modal-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', closeVideoModal);
      
      container.appendChild(closeBtn);
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      
      // Close when clicking outside the container
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          closeVideoModal();
        }
      });
    }
    
    // Replace video content
    const container = document.getElementById('video-modal-container');
    const existingVideo = container.querySelector('video');
    if (existingVideo) {
      existingVideo.remove();
    }
    
    const videoClone = videoElement.cloneNode(true);
    videoClone.autoplay = true;
    container.insertBefore(videoClone, container.firstChild);
    
    overlay.classList.add('active');
    const video = overlay.querySelector('video');
    video.play();
  }

  function closeVideoModal() {
    const overlay = document.getElementById('video-modal-overlay');
    if (overlay) {
      const video = overlay.querySelector('video');
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      overlay.classList.remove('active');
    }
  }

  // Mind Map Functionality
  const heroImageTrigger = document.getElementById('hero-image-trigger');
  const mindMapContainer = document.getElementById('mind-map-container');
  const mindMapClose = document.getElementById('mind-map-close');
  const mindMapBlobs = document.querySelectorAll('.mind-map-blob');
  const svg = document.getElementById('mind-map-svg');
  const connectionLines = document.getElementById('connection-lines');

  // Initialize: ensure all blobs are hidden on page load
  mindMapBlobs.forEach(blob => {
    blob.classList.remove('active');
  });
  mindMapContainer.classList.remove('active');

  // Function to check if a blob is visible in the viewport
  function isBlobVisible(blob) {
    const containerRect = mindMapContainer.getBoundingClientRect();
    const blobAngle = parseInt(blob.getAttribute('data-angle'));
    const radius = 380;
    const rad = (blobAngle * Math.PI) / 180;
    
    // Calculate blob's position relative to container center
    const x = radius * Math.cos(rad);
    const y = radius * Math.sin(rad);
    
    // Calculate blob's absolute screen position (center point)
    const blobScreenX = containerRect.left + containerRect.width / 2 + x - 50; // -50 for blob radius
    const blobScreenY = containerRect.top + containerRect.height / 2 + y - 50;
    
    // Hard boundary check - entire blob must be within viewport
    return (
      blobScreenX - 50 >= 0 && // blob left edge is fully in bounds
      blobScreenX + 50 <= window.innerWidth && // blob right edge is fully in bounds
      blobScreenY - 50 >= 0 && // blob top edge is fully in bounds
      blobScreenY + 50 <= window.innerHeight // blob bottom edge is fully in bounds
    );
  }

  if (heroImageTrigger) {
    heroImageTrigger.addEventListener('click', function(e) {
      e.stopPropagation();
      mindMapContainer.classList.add('active');
      
      // Trigger blob animations with staggered timing - only for visible blobs
      mindMapBlobs.forEach((blob, index) => {
        if (isBlobVisible(blob)) {
          setTimeout(() => {
            blob.classList.add('active');
            drawConnectionLine(blob);
          }, index * 100);
        }
      });
    });
  }

  // Close mind map
  if (mindMapClose) {
    mindMapClose.addEventListener('click', function(e) {
      e.stopPropagation();
      closeMindMap();
    });
  }

  // Close when clicking outside the mind map
  document.addEventListener('click', function(e) {
    if (mindMapContainer.classList.contains('active') && 
        !mindMapContainer.contains(e.target) &&
        !heroImageTrigger.contains(e.target)) {
      closeMindMap();
    }
  });


  function closeMindMap() {
    mindMapContainer.classList.remove('active');
    mindMapBlobs.forEach(blob => blob.classList.remove('active'));
    connectionLines.innerHTML = '';
  }

  // Prevent closing when clicking on blobs
  mindMapBlobs.forEach(blob => {
    blob.addEventListener('click', function(e) {
      e.stopPropagation();
      // Navigate to the blob's linked page if it has a data-link attribute
      const link = blob.getAttribute('data-link');
      if (link) {
        window.location.href = link;
      }
    });
  });

  function drawConnectionLine(blob) {
    const angle = parseInt(blob.getAttribute('data-angle'));
    const radius = 380;
    const imageRadius = 100; // Half of 200px image width
    
    // Convert angle to radians
    const rad = (angle * Math.PI) / 180;
    
    // Calculate blob position
    const x2 = 500 + radius * Math.cos(rad);
    const y2 = 500 + radius * Math.sin(rad);
    
    // Start from the edge of the image circle
    const x1 = 500 + imageRadius * Math.cos(rad);
    const y1 = 500 + imageRadius * Math.sin(rad);
    
    // Create SVG line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#3f4556');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('opacity', '0.3');
    line.setAttribute('stroke-dasharray', '1000');
    line.setAttribute('stroke-dashoffset', '1000');
    
    connectionLines.appendChild(line);
    
    // Animate the line drawing
    setTimeout(() => {
      line.style.transition = 'stroke-dashoffset 1.2s ease-out';
      line.setAttribute('stroke-dashoffset', '0');
    }, 50);
  }

  // Position blobs in a circle
  function positionBlobs() {
    mindMapBlobs.forEach(blob => {
      const angle = parseInt(blob.getAttribute('data-angle'));
      const radius = 380;
      const rad = (angle * Math.PI) / 180;
      const x = radius * Math.cos(rad);
      const y = radius * Math.sin(rad);
      
      // Set CSS custom properties for animation
      blob.style.setProperty('--blob-x', `calc(50% + ${x}px)`);
      blob.style.setProperty('--blob-y', `calc(50% + ${y}px)`);
      
      // Initial center position before animation
      blob.style.left = '50%';
      blob.style.top = '50%';
    });
  }

  positionBlobs();

  // Handle window resize for responsive positioning
  window.addEventListener('resize', positionBlobs);

  // ============================================
  // PROJECT CARDS INTERACTIVE FUNCTIONALITY
  // ============================================
  
  function toggleProject(cardElement) {
    // Get the details and close button
    const details = cardElement.querySelector('.card-details');
    const closeBtn = cardElement.querySelector('.close-btn');
    const isVisible = details.classList.contains('visible');

    // If already open, close it
    if (isVisible) {
      details.classList.remove('visible');
      return;
    }

    // Close all other open cards
    document.querySelectorAll('.project-card').forEach(card => {
      const otherDetails = card.querySelector('.card-details');
      if (otherDetails && otherDetails !== details) {
        otherDetails.classList.remove('visible');
      }
    });

    // Open this card
    details.classList.add('visible');

    // Add close button event listener
    if (closeBtn && !closeBtn.hasListener) {
      closeBtn.hasListener = true;
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        details.classList.remove('visible');
      });
    }
  }

  // Prevent close when clicking inside details
  document.querySelectorAll('.card-details').forEach(details => {
    details.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });

  // Make toggleProject available globally for onclick attributes
  window.toggleProject = toggleProject;

  // ============================================
  // FALLING STAR LINES ANIMATION
  // ============================================
  
  function createFallingStar() {
    const svg = document.querySelector('.falling-star-lines');
    if (!svg) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', 'url(#starGradient)');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('filter', 'url(#starGlow)');
    
    const animationType = Math.random();
    let animation;
    let duration = 2.5 + Math.random() * 1.5;
    
    // SVG viewBox is "0 0 1000 500", so coordinates are 0-1000 for x, 0-500 for y
    if (animationType < 0.33) {
      // Diagonal left to right
      line.setAttribute('x1', '100');
      line.setAttribute('y1', '-50');
      line.setAttribute('x2', '100');
      line.setAttribute('y2', '-40');
      animation = 'starFallDiagonal1';
    } else if (animationType < 0.66) {
      // Diagonal right to left
      line.setAttribute('x1', '900');
      line.setAttribute('y1', '-50');
      line.setAttribute('x2', '900');
      line.setAttribute('y2', '-40');
      animation = 'starFallDiagonal2';
    } else {
      // Straight down from random x position
      const xPos = 200 + Math.random() * 600;
      line.setAttribute('x1', xPos);
      line.setAttribute('y1', '-50');
      line.setAttribute('x2', xPos);
      line.setAttribute('y2', '-40');
      animation = 'starFallStraight';
    }
    
    line.style.animation = `${animation} ${duration}s ease-in forwards`;
    svg.appendChild(line);
    
    // Remove line after animation completes
    setTimeout(() => line.remove(), duration * 1000);
  }
  
  // Check if we're on projects page
  const fallingStarSvg = document.querySelector('.falling-star-lines');
  if (fallingStarSvg) {
    // Initial animation on page load
    setTimeout(createFallingStar, 500);
    
    // Random falling stars every 3-6 seconds
    setInterval(() => {
      if (Math.random() > 0.6) {
        createFallingStar();
      }
    }, 2000);
  }
});

