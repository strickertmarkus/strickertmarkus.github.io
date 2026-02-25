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

  // Home Page: Toggle between horizontal nav and hamburger menu on scroll (desktop only)
  const isHomePage = document.body.classList.contains('home-page');
  if (isHomePage) {
    const horizontalNav = document.querySelector('.horizontal-nav');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const heroSection = document.querySelector('.hero');
    
    if (horizontalNav && hamburgerMenu && heroSection) {
      // Only apply scroll listener on desktop (> 768px)
      const isDesktop = () => window.innerWidth > 768;
      
      const handleScroll = () => {
        if (!isDesktop()) return; // Don't apply on mobile
        
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        
        if (heroBottom <= 0) {
          // Scrolled past hero - show hamburger, hide horizontal nav
          horizontalNav.classList.add('collapsed');
          hamburgerMenu.classList.add('expanded');
        } else {
          // At hero or above - show horizontal nav, hide hamburger
          horizontalNav.classList.remove('collapsed');
          hamburgerMenu.classList.remove('expanded');
          // Also close the menu if it was open
          if (menuOverlay) {
            menuOverlay.classList.remove('active');
          }
        }
      };
      
      // Only attach scroll listener on desktop
      if (isDesktop()) {
        window.addEventListener('scroll', handleScroll);
      }
      
      // Handle window resize to toggle listener
      window.addEventListener('resize', function() {
        if (isDesktop()) {
          window.addEventListener('scroll', handleScroll);
        } else {
          window.removeEventListener('scroll', handleScroll);
          // Reset classes on mobile
          horizontalNav.classList.remove('collapsed');
          hamburgerMenu.classList.remove('expanded');
        }
      });
    }
  }

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

// ======================================================
// Competence Wheels Page
// ======================================================

(function() {
  // Only run on competence-wheels page
  const wheelContainer = document.getElementById('main-wheel-container');
  if (!wheelContainer) return;

  // Competency data with distinct vibrant color palette and details
  const competencies = [
    { 
      name: 'System Verification & Testing', 
      degrees: 75, 
      color: '#1e5a96',
      details: [
        'Requirement documentation using Doors NG',
        'Reviewing design documents',
        'Automating tests from requirement & design specifications',
        'Test automation for product software',
        'Basic electrical testing',
        'TestStand automation tool'
      ]
    },
    { 
      name: 'Technical Skills', 
      degrees: 75, 
      color: '#ff9a3d',
      details: [
        'Python (scientific computing, automation)',
        'C++ (systems programming)',
        'MATLAB & Bash scripting',
        'Git version control',
        'VS Code development environment',
        'Jupyter notebooks & LaTeX',
        'Linux command line proficiency'
      ]
    },
    { 
      name: 'Research & Scientific Computing', 
      degrees: 50, 
      color: '#2d7a3e',
      details: [
        'HPC simulations & computational modeling',
        '3D MHD (magnetohydrodynamics) simulations',
        'Statistical analysis & visualization',
        'Peer-reviewed scientific publications',
        'Numerical methods & algorithms',
        'Data-driven research methodology'
      ]
    },
    { 
      name: 'Communication & Documentation', 
      degrees: 55, 
      color: '#e8594f',
      details: [
        'Technical presentations & conferences',
        'Academic writing & research papers',
        'Agile documentation practices',
        'Cross-functional team collaboration',
        'Multi-language capability (German, English, French)',
        'Clear explanation of complex concepts'
      ]
    },
    { 
      name: 'Problem Solving & Innovation', 
      degrees: 60, 
      color: '#7b3ff2',
      details: [
        'Complex system analysis & decomposition',
        'Method development & prototyping',
        'Automation framework design',
        'Requirements engineering',
        'Debugging & optimization',
        'Creative solution development'
      ]
    },
    { 
      name: 'Leadership', 
      degrees: 45, 
      color: '#0fa3a3',
      details: [
        'Team leadership & coordination',
        'Agile retrospectives & process improvement',
        'Mentoring & knowledge transfer',
        'Customer & stakeholder interactions',
        'Security-classified project work',
        'Collaborative research environment'
      ]
    }
  ];

  // Helper function to determine heading text color with better contrast for dark colors
  function determineHeadingTextColor(colorHex) {
    const colorMap = {
      '#1e5a96': '#5fa8d3',
      '#2d7a3e': '#5db373',
      '#7b3ff2': '#b88eff'
    };
    const lowerColor = colorHex.toLowerCase();
    return colorMap[lowerColor] || colorHex;
  }

  // Helper function for polar to cartesian conversion
  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  // Store segment data for animations
  let segmentData = [];
  let activeSegment = null;

  // Create main competence wheel (donut chart)
  function createMainWheel() {
    const svgSize = 800;
    const center = svgSize / 2;
    const outerRadius = 210;
    const innerRadius = 130;

    let svg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg" class="competence-wheel">`;
    
    svg += `<defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>`;

    svg += `<circle cx="${center}" cy="${center}" r="${innerRadius}" fill="white"/>`;

    let currentAngle = 0;

    competencies.forEach((skill, index) => {
      const startAngle = currentAngle;
      const endAngle = startAngle + skill.degrees;

      const gradientId = `grad-segment-${index}`;
      svg += `<defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${skill.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${skill.color};stop-opacity:0.85" />
        </linearGradient>
      </defs>`;

      const largeArc = skill.degrees > 180 ? '1' : '0';
      const outerStart = polarToCartesian(center, center, outerRadius, startAngle);
      const outerEnd = polarToCartesian(center, center, outerRadius, endAngle);
      const innerStart = polarToCartesian(center, center, innerRadius, startAngle);
      const innerEnd = polarToCartesian(center, center, innerRadius, endAngle);

      const pathData = [
        'M', outerStart.x, outerStart.y,
        'A', outerRadius, outerRadius, 0, largeArc, 1, outerEnd.x, outerEnd.y,
        'L', innerEnd.x, innerEnd.y,
        'A', innerRadius, innerRadius, 0, largeArc, 0, innerStart.x, innerStart.y,
        'Z'
      ].join(' ');

      const midAngle = (startAngle + endAngle) / 2;
      const midRadius = (outerRadius + innerRadius) / 2;
      const midPoint = polarToCartesian(center, center, midRadius, midAngle);
      
      segmentData.push({
        index: index,
        name: skill.name,
        color: skill.color,
        startAngle: startAngle,
        endAngle: endAngle,
        midPoint: midPoint,
        center: { x: center, y: center }
      });

      svg += `<path class="segment" data-index="${index}" d="${pathData}" fill="url(#${gradientId})" stroke="white" stroke-width="2" opacity="0.95" style="transition: all 0.3s ease;"/>`;

      let fontSize = '12';
      if (skill.degrees >= 80) {
        fontSize = '14';
      } else if (skill.degrees >= 60) {
        fontSize = '13';
      }

      let labelRadius = 270;
      if (skill.name === 'Leadership') {
        labelRadius = 250;
      } else if (skill.name === 'Problem Solving & Innovation') {
        labelRadius = 305;
      } else if (skill.name === 'Communication & Documentation') {
        labelRadius = 285;
      } else if (skill.name === 'Research & Scientific Computing') {
        labelRadius = 260;
      }
      const labelPos = polarToCartesian(center, center, labelRadius, midAngle);
      
      svg += `<text class="segment-label" data-index="${index}" x="${labelPos.x}" y="${labelPos.y}" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" font-weight="700" fill="#333" style="pointer-events: none;">${skill.name}</text>`;

      currentAngle = endAngle;
    });

    svg += `</svg>`;
    return svg;
  }

  // Render wheel
  wheelContainer.innerHTML = createMainWheel();
  wheelContainer.style.position = 'relative';

  // Add interactive event listeners
  const segments = document.querySelectorAll('.segment');
  
  segments.forEach(segment => {
    segment.addEventListener('mouseenter', function() {
      if (!activeSegment) {
        const index = parseInt(this.getAttribute('data-index'));
        const compColor = competencies[index].color;
        this.style.filter = `drop-shadow(0 0 12px ${compColor}88)`;
        this.style.opacity = '1';
      }
    });

    segment.addEventListener('mouseleave', function() {
      if (!activeSegment) {
        this.style.filter = '';
        this.style.opacity = '0.95';
      }
    });

    segment.addEventListener('click', function(e) {
      e.stopPropagation();
      const index = parseInt(this.getAttribute('data-index'));
      showEnlargedSegment(index);
    });
  });

  // Handler for when segment animation completes
  function handleSegmentAnimationEnd(e) {
    // Animation complete
  }

  // Get responsive layout parameters for enlarged segment view
  function getEnlargedLayout() {
    const vw = window.innerWidth;
    if (vw <= 480) {
      return { leftPct: 0.5, topPct: 0.28, size: 150 };
    } else if (vw <= 768) {
      return { leftPct: 0.5, topPct: 0.28, size: 180 };
    } else if (vw <= 1024) {
      return { leftPct: 0.5, topPct: 0.28, size: 220 };
    } else if (vw <= 1440) {
      return { leftPct: 0.25, topPct: 0.5, size: 320 };
    }
    return { leftPct: 0.30, topPct: 0.5, size: 420 };
  }

  // Show enlarged segment with detail pop-out
  function showEnlargedSegment(index) {
    if (activeSegment === index) {
      closeEnlargedSegment();
      return;
    }

    activeSegment = index;
    const data = competencies[index];

    // Calculate segment's midpoint angle for animation starting position
    let currentAngle = 0;
    for (let i = 0; i < index; i++) {
      currentAngle += competencies[i].degrees;
    }
    const midAngle = currentAngle + (data.degrees / 2);
    const wheelCenter = 400;
    const segmentRadius = 170;
    
    const angleRad = (midAngle - 90) * Math.PI / 180;
    const segmentSvgX = wheelCenter + (segmentRadius * Math.cos(angleRad));
    const segmentSvgY = wheelCenter + (segmentRadius * Math.sin(angleRad));
    
    const wheelSvg = document.querySelector('.competence-wheel');
    const svgRect = wheelSvg.getBoundingClientRect();
    
    const segmentViewportX = svgRect.left + (segmentSvgX / 800) * svgRect.width;
    const segmentViewportY = svgRect.top + (segmentSvgY / 800) * svgRect.height;
    
    const layout = getEnlargedLayout();
    const finalX = window.innerWidth * layout.leftPct;
    const finalY = window.innerHeight * layout.topPct;
    
    const offsetX = segmentViewportX - finalX;
    const offsetY = segmentViewportY - finalY;

    // Create dimming overlay
    let overlay = document.getElementById('dim-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'dim-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', closeEnlargedSegment);
    }
    overlay.classList.add('active');

    // Create enlarged segment SVG
    const enlargedSvg = createEnlargedSegmentSVG(index, data, data.degrees * 1.3);
    let enlargedContainer = document.getElementById('enlarged-segment-container');
    if (!enlargedContainer) {
      enlargedContainer = document.createElement('div');
      enlargedContainer.id = 'enlarged-segment-container';
      document.body.appendChild(enlargedContainer);
    }
    
    enlargedContainer.style.setProperty('--segment-start-pos', 
      `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`);
    
    enlargedContainer.innerHTML = enlargedSvg;
    enlargedContainer.dataset.competencyIndex = index;
    enlargedContainer.dataset.competencyColor = data.color;
    
    enlargedContainer.removeEventListener('animationend', handleSegmentAnimationEnd);
    enlargedContainer.addEventListener('animationend', handleSegmentAnimationEnd, { once: true });
    
    enlargedContainer.classList.add('active');

    // Create and show heading
    let heading = document.getElementById('segment-heading');
    if (!heading) {
      heading = document.createElement('div');
      heading.id = 'segment-heading';
      document.body.appendChild(heading);
    }
    heading.textContent = data.name;
    heading.style.color = determineHeadingTextColor(data.color);
    
    heading.style.position = 'fixed';
    heading.style.left = finalX + 'px';
    heading.style.transform = 'translateX(-50%) translateY(0)';
    
    const estimatedSegmentTop = finalY - (layout.size / 2);
    const estimatedHeadingHeight = 30;
    heading.style.top = (estimatedSegmentTop - estimatedHeadingHeight - 15) + 'px';
    
    heading.classList.add('active');

    // Create detail popout
    let detailPopout = document.getElementById('detail-popout');
    if (!detailPopout) {
      detailPopout = document.createElement('div');
      detailPopout.id = 'detail-popout';
      document.body.appendChild(detailPopout);
    }

    const animationAngle = midAngle - 90;
    const itemTransformRotation = animationAngle;

    detailPopout.innerHTML = `
      <ul style="transform-origin: left center;">
        ${data.details.map((detail, idx) => {
          const textColor = determineHeadingTextColor(data.color);
          const bgColor = data.color + '08';
          return `<li class="detail-item" data-detail-index="${idx}" style="--segment-angle: ${itemTransformRotation}deg; color: ${textColor}; background-color: ${bgColor};">${detail}</li>`;
        }).join('')}
      </ul>
    `;
    detailPopout.classList.add('active');

    // Hide original wheel
    if (wheelSvg) {
      wheelSvg.style.opacity = '0';
      wheelSvg.style.pointerEvents = 'none';
    }
  }

  // Create enlarged segment visualization
  function createEnlargedSegmentSVG(index, data, enlargedDegrees) {
    const size = 420;
    const center = size / 2;
    const outerRadius = 160;
    const innerRadius = 90;
    const displayDegrees = enlargedDegrees || data.degrees;
    
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">`;
    
    svg += `<defs>
      <linearGradient id="enlarged-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${data.color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${data.color};stop-opacity:0.8" />
      </linearGradient>
      <filter id="segment-glow">
        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>`;
    
    let currentAngle = 0;
    for (let i = 0; i < index; i++) {
      currentAngle += competencies[i].degrees;
    }
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + displayDegrees;
    const largeArc = displayDegrees > 180 ? '1' : '0';
    
    const outerStart = polarToCartesian(center, center, outerRadius, startAngle);
    const outerEnd = polarToCartesian(center, center, outerRadius, endAngle);
    const innerStart = polarToCartesian(center, center, innerRadius, startAngle);
    const innerEnd = polarToCartesian(center, center, innerRadius, endAngle);
    
    const pathData = [
      'M', outerStart.x, outerStart.y,
      'A', outerRadius, outerRadius, 0, largeArc, 1, outerEnd.x, outerEnd.y,
      'L', innerEnd.x, innerEnd.y,
      'A', innerRadius, innerRadius, 0, largeArc, 0, innerStart.x, innerStart.y,
      'Z'
    ].join(' ');
    
    svg += `<path d="${pathData}" fill="url(#enlarged-grad)" stroke="white" stroke-width="2" opacity="0.95" filter="url(#segment-glow)"/>`;
    svg += `</svg>`;
    return svg;
  }

  // Close enlarged segment
  function closeEnlargedSegment() {
    if (activeSegment !== null) {
      const overlay = document.getElementById('dim-overlay');
      if (overlay) overlay.classList.remove('active');

      const heading = document.getElementById('segment-heading');
      if (heading) heading.classList.remove('active');

      const enlargedContainer = document.getElementById('enlarged-segment-container');
      if (enlargedContainer) enlargedContainer.classList.remove('active');

      const detailPopout = document.getElementById('detail-popout');
      if (detailPopout) detailPopout.classList.remove('active');

      const connectionLines = document.getElementById('connection-lines');
      if (connectionLines) connectionLines.remove();

      const originalWheel = document.querySelector('.competence-wheel');
      if (originalWheel) {
        originalWheel.style.opacity = '1';
        originalWheel.style.pointerEvents = 'auto';
      }

      activeSegment = null;
    }
  }

  // Close on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && activeSegment !== null) {
      closeEnlargedSegment();
    }
  });
})();

// ======================================================
// Portfolio Page - Static Competence Wheel
// ======================================================

(function() {
  const portfolioWheelContainer = document.getElementById('portfolio-wheel-container');
  if (!portfolioWheelContainer) return;

  const portfolioCompetencies = [
    { name: 'System Verification & Testing', degrees: 75, color: '#1e5a96' },
    { name: 'Technical Skills', degrees: 75, color: '#ff9a3d' },
    { name: 'Research & Scientific Computing', degrees: 50, color: '#2d7a3e' },
    { name: 'Communication & Documentation', degrees: 55, color: '#e8594f' },
    { name: 'Problem Solving & Innovation', degrees: 60, color: '#7b3ff2' },
    { name: 'Leadership', degrees: 45, color: '#0fa3a3' }
  ];

  function portfolioPolarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  function createPortfolioWheel() {
    const svgSize = 500;
    const center = svgSize / 2;
    const outerRadius = 130;
    const innerRadius = 80;

    let svg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: block;">`;
    svg += `<circle cx="${center}" cy="${center}" r="${innerRadius}" fill="white"/>`;

    let currentAngle = 0;

    portfolioCompetencies.forEach((skill) => {
      const startAngle = currentAngle;
      const endAngle = startAngle + skill.degrees;
      const largeArc = skill.degrees > 180 ? '1' : '0';
      
      const outerStart = portfolioPolarToCartesian(center, center, outerRadius, startAngle);
      const outerEnd = portfolioPolarToCartesian(center, center, outerRadius, endAngle);
      const innerStart = portfolioPolarToCartesian(center, center, innerRadius, startAngle);
      const innerEnd = portfolioPolarToCartesian(center, center, innerRadius, endAngle);

      const pathData = [
        'M', outerStart.x, outerStart.y,
        'A', outerRadius, outerRadius, 0, largeArc, 1, outerEnd.x, outerEnd.y,
        'L', innerEnd.x, innerEnd.y,
        'A', innerRadius, innerRadius, 0, largeArc, 0, innerStart.x, innerStart.y,
        'Z'
      ].join(' ');

      svg += `<path d="${pathData}" fill="${skill.color}" stroke="white" stroke-width="1.5" opacity="0.9"/>`;

      const midAngle = (startAngle + endAngle) / 2;
      let labelRadius = 170;
      if (skill.name === 'Leadership') {
        labelRadius = 160;
      } else if (skill.name === 'Problem Solving & Innovation') {
        labelRadius = 185;
      } else if (skill.name === 'Communication & Documentation') {
        labelRadius = 180;
      } else if (skill.name === 'Research & Scientific Computing') {
        labelRadius = 165;
      }

      let fontSize = '10';
      if (skill.degrees >= 80) {
        fontSize = '11';
      }

      const labelPos = portfolioPolarToCartesian(center, center, labelRadius, midAngle);
      svg += `<text x="${labelPos.x}" y="${labelPos.y}" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" font-weight="600" fill="#333">${skill.name}</text>`;

      currentAngle = endAngle;
    });

    svg += `</svg>`;
    return svg;
  }

  portfolioWheelContainer.innerHTML = createPortfolioWheel();
})();

// ======================================================
// Work Details Page - Timeline Navigation
// ======================================================

(function() {
  const timelineItems = document.querySelectorAll('.work-timeline-nav .timeline-nav-item');
  if (!timelineItems.length) return;

  timelineItems.forEach(item => {
    item.addEventListener('click', function() {
      const sectionId = this.getAttribute('data-section');
      const targetSection = document.getElementById(sectionId);
      
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
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
})();
