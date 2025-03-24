// Content script for filtering posts
console.log('TheBatSonar content script loaded');

interface Settings {
  enabled: boolean;
  blockedKeywords: string[];
  platforms: {
    facebook: boolean;
    twitter: boolean;
    youtube: boolean;
  };
}

// Function to check if text contains any blocked keywords
function containsBlockedKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// Function to hide a post
function hidePost(element: HTMLElement) {
  element.style.display = 'none';
}

// Function to process Facebook posts
function processFacebookPosts(settings: Settings) {
  if (!settings.enabled || !settings.platforms.facebook) {
    return;
  }

  // Facebook feed posts are typically in divs with role="article"
  const posts = document.querySelectorAll('div[role="article"]');
  
  posts.forEach((post) => {
    if (!(post instanceof HTMLElement)) return;

    // Get post text content
    const textContent = post.textContent || '';
    
    // Check if post contains blocked keywords
    if (containsBlockedKeywords(textContent, settings.blockedKeywords)) {
      console.log('Found post with blocked keywords:', textContent.substring(0, 100));
      hidePost(post);
    }
  });
}

// Function to observe DOM changes
function observeFeed(settings: Settings) {
  const observer = new MutationObserver((mutations) => {
    processFacebookPosts(settings);
  });

  // Start observing the feed container
  const feedContainer = document.querySelector('div[role="feed"]');
  if (feedContainer) {
    observer.observe(feedContainer, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

// Initialize content script
function initialize() {
  // Get settings from Chrome storage
  chrome.storage.sync.get(['settings'], (result) => {
    const settings: Settings = result.settings || {
      enabled: true,
      blockedKeywords: [],
      platforms: {
        facebook: true,
        twitter: true,
        youtube: true
      }
    };

    // Process existing posts
    processFacebookPosts(settings);

    // Start observing for new posts
    observeFeed(settings);
  });
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    const settings = changes.settings.newValue as Settings;
    processFacebookPosts(settings);
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
} 