/**
 * VTC SCROLL + VOICE SYNC SYSTEM
 * Handles sequential scroll, paragraph highlighting, viewport detection, and voice sync
 *
 * Critical Rules:
 * - Hero → Syllabus (skip reading) → Welcome video → Modules (F→0→1→...→12)
 * - Each paragraph highlighted while Victor reads it
 * - No jumping ahead or backtracking
 * - User position tracked via IntersectionObserver
 * - Interruptions freeze scroll and trigger explanation
 */

class VTCScrollVoiceSync {
  constructor() {
    this.currentModule = null;
    this.currentParagraph = 0;
    this.isReading = false;
    this.isScrollLocked = false;
    this.activeViewportSection = null;
    this.pausedAtSection = null;

    // Section IDs for navigation
    this.sections = {
      hero: '#hero',
      syllabus: '#index-section',
      welcomeVideo: '#welcome-video',
      modules: [] // Will populate from DOM
    };

    this.initializeObservers();
    this.initializeScrollBehavior();
    this.listenForVictorCommands();
  }

  /**
   * SECTION 1: VIEWPORT DETECTION
   * Uses IntersectionObserver to track which section user is viewing
   */
  initializeObservers() {
    const options = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.activeViewportSection = entry.target.id;
          this.updateViewportDebug();
        }
      });
    }, options);

    // Observe all major sections
    document.querySelectorAll('section[id], #hero, #index-section, #welcome-video, [data-module-id]').forEach((section) => {
      observer.observe(section);
    });

    console.log('✅ Viewport observers initialized');
  }

  /**
   * SECTION 2: SCROLL BEHAVIOR
   * Prevents erratic jumping by enforcing sequential execution
   */
  initializeScrollBehavior() {
    // Intercept manual scroll to detect user movement
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      if (!this.isScrollLocked && this.isReading) {
        // User scrolled manually while Victor is reading
        this.pauseVictorReading();
        this.isScrollLocked = true;
      }
      scrollTimeout = setTimeout(() => {
        if (this.isScrollLocked && !this.isReading) {
          this.isScrollLocked = false;
        }
      }, 500);
    });

    console.log('✅ Scroll behavior initialized');
  }

  /**
   * SECTION 3: COURSE INITIALIZATION
   * Full course flow: Hero → Syllabus → Welcome Video → Modules
   */
  async startFullCourse() {
    console.log('🎬 Starting Full Course Flow...');

    try {
      // Step 1: Position at Hero
      await this.scrollToSection('#hero');
      await this.delay(500);
      console.log('✅ Step 1: Hero section positioned');

      // Trigger Victor to read hero
      this.triggerVictorAction('read', {
        section: 'hero',
        text: this.getHeroText()
      });

      // Wait for Victor to finish hero
      await this.waitForVictorCompletion();

      // Step 2: Skip Syllabus (no reading)
      await this.scrollToSection('#index-section');
      await this.delay(300);
      console.log('✅ Step 2: Syllabus section skipped (no reading)');

      // Step 3: Target Welcome Video
      await this.scrollToSection('#welcome-video');
      await this.delay(500);
      console.log('✅ Step 3: Welcome video container positioned');

      // Video Protocol
      this.triggerVictorAction('prompt', {
        message: 'We are about to watch a video. Please press Play.'
      });

      // Pause Victor while video plays
      this.pauseVictorSystem();
      console.log('⏸️  Victor system paused for video');

      // Wait for video to end
      await this.waitForVideoEnd('#welcome-video video');
      console.log('✅ Video ended');

      // Reactivate voice system and proceed to modules
      this.resumeVictorSystem();
      console.log('▶️  Victor system resumed');

      // Begin Module 0
      await this.startModule('module-0');

    } catch (error) {
      console.error('❌ Course flow error:', error);
    }
  }

  /**
   * SECTION 4: STANDARD MODULE LOOP
   * Video → Text → Explanation → Quiz (in strict sequence)
   */
  async startModule(moduleId) {
    console.log(`\n📚 Starting module: ${moduleId}`);
    this.currentModule = moduleId;

    try {
      // A. Video Anchor
      const videoElement = document.querySelector(`[data-module-id="${moduleId}"] video`);
      if (videoElement) {
        const videoContainer = videoElement.closest('.lesson-video');
        await this.scrollToElement(videoContainer);
        await this.delay(300);
        console.log(`✅ Module video positioned: ${moduleId}`);

        // Trigger video playback from Victor
        this.triggerVictorAction('prompt', {
          message: 'Video starting now. Please watch carefully.'
        });

        this.pauseVictorSystem();
        await this.waitForVideoEnd(videoElement);
        this.resumeVictorSystem();
        console.log(`✅ Module video ended: ${moduleId}`);
      }

      // B. Complete Text Scan (100% of paragraphs)
      const contentBlocks = document.querySelectorAll(`[data-module-id="${moduleId}"] .content-block`);
      console.log(`📖 Found ${contentBlocks.length} content blocks`);

      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        await this.readAndHighlightParagraph(block);
      }

      // C. Explanation
      await this.delay(500);
      this.triggerVictorAction('explain', {
        module: moduleId,
        tone: 'professional-motivating'
      });

      await this.waitForVictorCompletion();

      // D. Quiz Handling
      const quizElement = document.querySelector(`[data-module-id="${moduleId}"] .quiz`);
      if (quizElement) {
        await this.executeQuiz(quizElement, moduleId);
      }

      console.log(`✅ Module complete: ${moduleId}`);

      // Proceed to next module (if exists)
      const nextModuleNum = parseInt(moduleId.split('-')[1]) + 1;
      const nextModuleId = `module-${nextModuleNum}`;

      if (document.querySelector(`[data-module-id="${nextModuleId}"]`)) {
        await this.startModule(nextModuleId);
      } else {
        console.log('🎉 All modules completed!');
        this.triggerVictorAction('celebration', {
          message: 'You have completed the full course. Congratulations!'
        });
      }

    } catch (error) {
      console.error(`❌ Module error (${moduleId}):`, error);
    }
  }

  /**
   * SECTION 5: PARAGRAPH READING & HIGHLIGHT
   * Marks paragraph as .vtc-reading while Victor speaks
   */
  async readAndHighlightParagraph(blockElement) {
    if (!blockElement) return;

    const blockText = blockElement.innerText;
    if (!blockText.trim()) return;

    // Highlight paragraph
    blockElement.classList.add('vtc-reading');

    // Scroll to center this paragraph
    await this.scrollToElement(blockElement, true);

    this.isReading = true;

    // Trigger Victor to read this specific paragraph
    this.triggerVictorAction('read', {
      section: blockElement.id,
      text: blockText,
      highlight: blockElement
    });

    // Wait for Victor to finish this paragraph
    await this.waitForVictorCompletion();

    // Remove highlight
    blockElement.classList.remove('vtc-reading');
    this.isReading = false;

    await this.delay(200);
  }

  /**
   * SECTION 6: DEEP LINKING
   * "Go to Module X" direct navigation
   */
  async goToModule(moduleId) {
    console.log(`🎯 Direct navigation to: ${moduleId}`);

    // Instantly scroll to module
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    if (moduleElement) {
      await this.scrollToElement(moduleElement);
      await this.startModule(moduleId);
    } else {
      console.error(`❌ Module not found: ${moduleId}`);
    }
  }

  /**
   * SECTION 7: INTERRUPTION HANDLING
   * User says "explain this part" or similar
   */
  handleUserInterruption(command) {
    console.log('🎤 User interruption detected:', command);

    if (command.type === 'explain-current') {
      // Freeze scroll at current section
      this.isScrollLocked = true;
      this.pauseVictorReading();

      // Get text of current section
      const currentSection = document.getElementById(this.activeViewportSection);
      if (currentSection) {
        const sectionText = currentSection.innerText;

        // Trigger immediate explanation
        this.triggerVictorAction('explain', {
          section: this.activeViewportSection,
          text: sectionText,
          tone: 'detailed'
        });

        this.waitForVictorCompletion().then(() => {
          this.isScrollLocked = false;
          // Resume normal flow (ask if user wants to continue)
          this.triggerVictorAction('prompt', {
            message: 'Should I continue from here?'
          });
        });
      }
    } else if (command.type === 'go-to-module') {
      this.goToModule(command.moduleId);
    } else if (command.type === 'pause') {
      this.pauseVictorReading();
    } else if (command.type === 'resume') {
      this.resumeVictorReading();
    }
  }

  /**
   * SECTION 8: QUIZ EXECUTION
   */
  async executeQuiz(quizElement, moduleId) {
    console.log(`📝 Quiz started for ${moduleId}`);

    // Scroll to quiz
    await this.scrollToElement(quizElement);

    // Get quiz questions
    const questions = quizElement.querySelectorAll('.q');
    const correctAnswers = [];

    questions.forEach((questionEl) => {
      const correctOption = questionEl.querySelector('.q-opt[data-correct="true"]');
      if (correctOption) {
        correctAnswers.push({
          question: questionEl.querySelector('.q-text').innerText,
          answer: correctOption.innerText.replace(/^[A-D]\.\s*/, '')
        });
      }
    });

    // Trigger Victor to read correct answers only
    this.triggerVictorAction('read-quiz-answers', {
      module: moduleId,
      answers: correctAnswers
    });

    await this.waitForVictorCompletion();

    console.log(`✅ Quiz complete for ${moduleId}`);
  }

  /**
   * SECTION 9: SCROLL HELPERS
   */
  async scrollToSection(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await this.delay(600);
    }
  }

  async scrollToElement(element, center = false) {
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: center ? 'center' : 'start'
      });
      await this.delay(500);
    }
  }

  /**
   * SECTION 10: VICTOR INTEGRATION
   */
  triggerVictorAction(action, data) {
    // Send command to ElevenLabs Victor agent
    console.log(`🎙️  Victor action: ${action}`, data);

    // This communicates with the ElevenLabs Client Tools
    if (window.victorAgent) {
      window.victorAgent.executeAction(action, data);
    } else {
      console.warn('Victor agent not available');
    }
  }

  pauseVictorReading() {
    console.log('⏸️  Pausing Victor reading');
    if (window.victorAgent) {
      window.victorAgent.pause();
    }
  }

  resumeVictorReading() {
    console.log('▶️  Resuming Victor reading');
    if (window.victorAgent) {
      window.victorAgent.resume();
    }
  }

  pauseVictorSystem() {
    console.log('⏸️  Victor system on standby');
    if (window.victorAgent) {
      window.victorAgent.standby();
    }
  }

  resumeVictorSystem() {
    console.log('▶️  Victor system active');
    if (window.victorAgent) {
      window.victorAgent.activate();
    }
  }

  waitForVictorCompletion() {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        if (window.victorAgent && window.victorAgent.isFinished) {
          resolve();
        } else {
          setTimeout(checkCompletion, 200);
        }
      };
      checkCompletion();
    });
  }

  /**
   * SECTION 11: UTILITY FUNCTIONS
   */
  getHeroText() {
    const hero = document.querySelector('.hero');
    if (hero) {
      return hero.innerText;
    }
    return '';
  }

  waitForVideoEnd(videoSelector) {
    return new Promise((resolve) => {
      const video = document.querySelector(videoSelector);
      if (video) {
        video.addEventListener('ended', resolve, { once: true });
      } else {
        resolve(); // No video found, continue anyway
      }
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  updateViewportDebug() {
    console.log(`📍 Current viewport: ${this.activeViewportSection}`);
  }

  /**
   * SECTION 12: VICTOR COMMAND LISTENER
   */
  listenForVictorCommands() {
    // Listen for commands from ElevenLabs Victor agent
    window.addEventListener('victor-command', (e) => {
      const { command, data } = e.detail;
      this.handleUserInterruption({ type: command, ...data });
    });

    console.log('✅ Victor command listener initialized');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.vtcScrollSync = new VTCScrollVoiceSync();
  console.log('✅ VTC Scroll + Voice Sync System ready');

  // Expose start function globally for HTML buttons
  window.startFullCourse = () => window.vtcScrollSync.startFullCourse();
  window.goToModule = (moduleId) => window.vtcScrollSync.goToModule(moduleId);
});