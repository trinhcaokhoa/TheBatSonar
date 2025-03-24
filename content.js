// Initialize content script
console.log('TheBatSonar: Content script loaded');

// Configuration for different platforms
const platformConfigs = {
  facebook: {
    postSelector: '[role="article"]',
    contentSelector: '[data-ad-comet-preview="message"]',
    observerConfig: { childList: true, subtree: true }
  },
  twitter: {
    postSelector: 'article[data-testid="tweet"]',
    contentSelector: '[data-testid="tweetText"]',
    observerConfig: { childList: true, subtree: true }
  },
  youtube: {
    postSelector: 'ytd-rich-item-renderer',
    contentSelector: '#video-title',
    observerConfig: { childList: true, subtree: true }
  }
};

// Get current platform
const currentPlatform = getCurrentPlatform();
if (!currentPlatform) {
  console.log('TheBatSonar: Unsupported platform');
  return;
}

// Initialize content observer
const observer = new MutationObserver(handleContentChanges);
observer.observe(document.body, platformConfigs[currentPlatform].observerConfig);

// Handle content changes
async function handleContentChanges(mutations) {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const posts = node.querySelectorAll(platformConfigs[currentPlatform].postSelector);
        for (const post of posts) {
          await processPost(post);
        }
      }
    }
  }
}

// Process individual posts
async function processPost(post) {
  const contentElement = post.querySelector(platformConfigs[currentPlatform].contentSelector);
  if (!contentElement) return;

  const content = contentElement.textContent;
  
  // Send content for analysis
  chrome.runtime.sendMessage(
    { type: 'ANALYZE_CONTENT', content },
    response => {
      if (response.error) {
        console.error('TheBatSonar: Analysis error:', response.error);
        return;
      }

      if (response.shouldBlock) {
        // Add visual indicator and hide content
        post.style.opacity = '0.5';
        post.style.filter = 'blur(5px)';
        addBlockedIndicator(post, response.reason);
      }
    }
  );
}

// Add visual indicator for blocked content
function addBlockedIndicator(post, reason) {
  const indicator = document.createElement('div');
  indicator.className = 'batsonar-blocked-indicator';
  indicator.innerHTML = `
    <div style="
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      margin: 10px;
      border-radius: 5px;
      text-align: center;
    ">
      <strong>🚫 Blocked by TheBatSonar</strong><br>
      <small>${reason}</small>
    </div>
  `;
  post.appendChild(indicator);
}

// Helper function to determine current platform
function getCurrentPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('youtube.com')) return 'youtube';
  return null;
} 