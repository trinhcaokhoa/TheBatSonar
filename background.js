// Initialize extension settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    enabled: true,
    blockedKeywords: [],
    sensitivity: 'medium',
    platforms: {
      facebook: true,
      twitter: true,
      youtube: true
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ANALYZE_CONTENT') {
    analyzeContent(request.content)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  }
});

// Content analysis function using NLP
async function analyzeContent(content) {
  // TODO: Implement actual NLP processing
  // For now, we'll use a simple keyword-based approach
  const settings = await chrome.storage.sync.get(['blockedKeywords', 'sensitivity']);
  const { blockedKeywords, sensitivity } = settings;
  
  // Simple content analysis
  const contentLower = content.toLowerCase();
  const containsBlockedKeyword = blockedKeywords.some(keyword => 
    contentLower.includes(keyword.toLowerCase())
  );

  return {
    shouldBlock: containsBlockedKeyword,
    confidence: containsBlockedKeyword ? 1.0 : 0.0,
    reason: containsBlockedKeyword ? 'Contains blocked keyword' : 'Content acceptable'
  };
}

// Listen for platform-specific content
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    // Check if the extension is enabled for this platform
    chrome.storage.sync.get(['enabled', 'platforms'], function(result) {
      if (!result.enabled) return;
      
      const url = new URL(details.url);
      const platform = getPlatformFromUrl(url.hostname);
      
      if (platform && result.platforms[platform]) {
        // Process the request
        // TODO: Implement platform-specific content processing
      }
    });
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

function getPlatformFromUrl(hostname) {
  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('youtube.com')) return 'youtube';
  return null;
} 