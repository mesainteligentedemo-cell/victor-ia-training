/**
 * VTC INITIALIZATION SCRIPT
 * Sets up module structure, data attributes, and UI elements
 * Must run BEFORE scroll-voice-sync.js
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 VTC Initialization starting...');

  // STEP 1: Map module IDs to DOM sections
  const moduleMap = {
    '#bienvenida': 'welcome',
    '#modulo-f': 'module-f',
    '#modulo-0': 'module-0',
    '#modulo-1': 'module-1',
    '#modulo-2': 'module-2',
    '#modulo-3': 'module-3',
    '#modulo-4': 'module-4',
    '#modulo-5': 'module-5',
    '#modulo-6': 'module-6',
    '#modulo-7': 'module-7',
    '#modulo-8': 'module-8',
    '#modulo-9': 'module-9',
    '#modulo-10': 'module-10',
    '#modulo-11': 'module-11',
    '#modulo-12': 'module-12',
    '#lvc': 'module-lvc',
    '#vtc19': 'module-vtc19'
  };

  // STEP 2: Add data-module-id to each section
  Object.entries(moduleMap).forEach(([selector, moduleId]) => {
    const section = document.querySelector(selector);
    if (section) {
      section.setAttribute('data-module-id', moduleId);
      section.setAttribute('id', selector.substring(1)); // Ensure ID is set

      // Add IDs to content blocks within this module
      const contentBlocks = section.querySelectorAll('.content-block');
      contentBlocks.forEach((block, index) => {
        if (!block.id) {
          block.id = `${moduleId}-para-${index}`;
        }
      });

      // Ensure quiz has proper ID
      const quiz = section.querySelector('.quiz');
      if (quiz && !quiz.id) {
        quiz.id = `${moduleId}-quiz`;
      }

      console.log(`✅ Module initialized: ${moduleId}`);
    }
  });

  // STEP 3: Create "Start Full Course" button in Hero
  const heroContinue = document.getElementById('heroContinue');
  if (heroContinue) {
    heroContinue.innerHTML = `
      <button class="hero-continue" onclick="window.startFullCourse()">
        Comenzar Ahora con Víctor
      </button>
    `;
    console.log('✅ Hero CTA button added');
  }

  // STEP 4: Add module navigation via deep linking
  document.querySelectorAll('.module-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const href = card.getAttribute('href');
      const moduleId = moduleMap[href];
      if (moduleId && window.vtcScrollSync) {
        window.goToModule(moduleId);
      } else {
        // Fallback to normal navigation
        window.location.hash = href;
      }
    });
  });

  console.log('✅ VTC Initialization complete');
});