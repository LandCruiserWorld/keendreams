// Focused Claude.ai Extractor - Targets the working selectors
// Run this in claude.ai browser console (F12)

(function focusedClaudeExtractor() {
  console.log('🎯 Focused Claude.ai Extractor - Targeting Working Selectors');
  
  const results = {
    conversations: [],
    messages: [],
    historyTitles: []
  };
  
  // Extract the 8 presentation elements (messages)
  console.log('📝 Extracting messages from presentation elements...');
  const presentationElements = document.querySelectorAll('[role="presentation"]');
  
  presentationElements.forEach((el, i) => {
    const content = el.textContent?.trim();
    if (content && content.length > 20) {
      console.log(`Message ${i+1}: ${content.substring(0, 150)}...`);
      
      results.messages.push({
        id: `presentation_${i}`,
        content: content,
        element: el.tagName + (el.className ? '.' + el.className : ''),
        timestamp: new Date().toISOString(),
        length: content.length
      });
    }
  });
  
  // Extract the 37 history items from sidebar
  console.log('\\n📚 Extracting conversation history from sidebar...');
  const sidebarItems = document.querySelectorAll('div[class*="sidebar"] a');
  
  sidebarItems.forEach((item, i) => {
    const title = item.textContent?.trim();
    const href = item.href;
    
    if (title && title.length > 2) {
      console.log(`History ${i+1}: ${title}`);
      
      results.historyTitles.push({
        id: `history_${i}`,
        title: title,
        href: href,
        clickable: !!href,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Try to get current conversation title
  console.log('\\n🏷️  Looking for current conversation title...');
  const titleSelectors = ['h1', 'title', '[data-testid*="title"]', '.conversation-title'];
  let currentTitle = null;
  
  titleSelectors.forEach(selector => {
    const titleEl = document.querySelector(selector);
    if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 2) {
      currentTitle = titleEl.textContent.trim();
      console.log(`Found title with ${selector}: ${currentTitle}`);
    }
  });
  
  // Create a complete conversation object
  if (results.messages.length > 0) {
    const conversation = {
      id: `claude_web_${Date.now()}`,
      title: currentTitle || 'Claude.ai Conversation',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      messages: results.messages,
      messageCount: results.messages.length,
      totalCharacters: results.messages.reduce((sum, msg) => sum + msg.content.length, 0)
    };
    
    results.conversations.push(conversation);
  }
  
  console.log('\\n📊 EXTRACTION RESULTS:');
  console.log(`✅ Messages extracted: ${results.messages.length}`);
  console.log(`✅ History items found: ${results.historyTitles.length}`);
  console.log(`✅ Current conversation: ${currentTitle || 'Untitled'}`);
  
  if (results.messages.length > 0) {
    console.log('\\n🎯 READY FOR CONVERSION!');
    console.log('Copy this JSON and save as claude-export.json:');
    console.log('\\n📋 JSON DATA:');
    console.log(JSON.stringify(results, null, 2));
    
    console.log('\\n🚀 NEXT STEPS:');
    console.log('1. Copy the JSON above');
    console.log('2. Save it as claude-export.json'); 
    console.log('3. Run: node scripts/claude-web-to-dreams.js claude-export.json "' + (currentTitle || 'Claude Conversation') + '"');
    console.log('4. Upload the generated dream to KeenDreams!');
    
    // Also try to create a simplified text version
    const conversationText = results.messages.map((msg, i) => {
      const role = i % 2 === 0 ? 'You' : 'Claude'; // Alternate user/assistant
      return `${role}: ${msg.content}`;
    }).join('\\n\\n');
    
    console.log('\\n📝 ALTERNATIVE: Simple text format:');
    console.log('Copy this if you prefer the text approach:');
    console.log('\\n' + conversationText.substring(0, 1000) + '...\\n');
    
  } else {
    console.log('\\n🤔 No messages found in current view.');
    console.log('Try:');
    console.log('1. Navigate to a conversation with visible messages');
    console.log('2. Scroll through the conversation to load messages');
    console.log('3. Run this script again');
  }
  
  // Check for conversation navigation
  console.log('\\n🔍 CONVERSATION NAVIGATION:');
  console.log(`Found ${results.historyTitles.length} conversations in history.`);
  if (results.historyTitles.length > 0) {
    console.log('You can click on these to extract each conversation:');
    results.historyTitles.slice(0, 5).forEach(item => {
      console.log(`  • ${item.title}`);
    });
    if (results.historyTitles.length > 5) {
      console.log(`  ... and ${results.historyTitles.length - 5} more`);
    }
  }
  
  // Store globally for easy access
  window.claudeExtractResults = results;
  window.claudeExportJSON = JSON.stringify(results, null, 2);
  
  return results;
})();