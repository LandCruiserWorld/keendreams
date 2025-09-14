// Enhanced Claude.ai Conversation Extractor
// Run this in claude.ai browser console (F12)

(function extractClaudeConversations() {
  console.log('🌙 KeenDreams Claude.ai Extractor Starting...');
  
  const conversations = [];
  let messageCount = 0;
  
  // Method 1: Look for message containers with various selectors
  const messageSelectors = [
    '[data-testid*="message"]',
    '[data-testid*="conversation"]', 
    '.whitespace-pre-wrap',
    '[role="presentation"]',
    'div[class*="message"]',
    'div[class*="chat"]',
    'div[class*="conversation"]'
  ];
  
  console.log('🔍 Scanning for messages with multiple selectors...');
  
  messageSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      
      elements.forEach((el, i) => {
        if (el.textContent && el.textContent.trim().length > 20) {
          messageCount++;
          console.log(`Message ${messageCount}: ${el.textContent.substring(0, 100)}...`);
          
          // Try to determine if it's user or assistant
          const isUser = el.closest('[data-author="user"]') || 
                        el.textContent.toLowerCase().includes('you:') ||
                        el.classList.toString().includes('user');
          
          conversations.push({
            id: `msg_${messageCount}`,
            role: isUser ? 'user' : 'assistant',
            content: el.textContent.trim(),
            timestamp: new Date().toISOString(),
            selector: selector,
            elementIndex: i
          });
        }
      });
    }
  });
  
  // Method 2: Look for conversation history in sidebar/navigation
  console.log('🔍 Looking for conversation history...');
  const historySelectors = [
    'nav a',
    '[data-testid*="conversation-item"]',
    'button[title*="conversation"]',
    'div[class*="sidebar"] a',
    'div[class*="history"] a'
  ];
  
  historySelectors.forEach(selector => {
    const items = document.querySelectorAll(selector);
    if (items.length > 0) {
      console.log(`Found ${items.length} history items with: ${selector}`);
      
      items.forEach((item, i) => {
        if (item.textContent && item.textContent.trim().length > 3) {
          console.log(`History ${i+1}: ${item.textContent.trim()}`);
          
          conversations.push({
            id: `hist_${i}`,
            type: 'conversation_title',
            title: item.textContent.trim(),
            href: item.href || null,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
  });
  
  // Method 3: Check localStorage and sessionStorage
  console.log('🔍 Checking browser storage...');
  
  const checkStorage = (storage, name) => {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && (key.includes('conversation') || key.includes('chat') || key.includes('message'))) {
        try {
          const value = storage.getItem(key);
          console.log(`${name} key: ${key}`);
          
          if (value && value.length > 100) {
            const parsed = JSON.parse(value);
            conversations.push({
              id: `storage_${key}`,
              type: 'storage_data',
              storageType: name,
              key: key,
              data: parsed,
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          // Not JSON, but might still be useful
          console.log(`${name} key ${key}: ${storage.getItem(key)?.substring(0, 100)}...`);
        }
      }
    }
  };
  
  checkStorage(localStorage, 'localStorage');
  checkStorage(sessionStorage, 'sessionStorage');
  
  // Method 4: Try to find the main conversation container
  console.log('🔍 Looking for main conversation container...');
  const containers = document.querySelectorAll('main, [role="main"], .conversation, .chat-container');
  containers.forEach((container, i) => {
    console.log(`Container ${i+1}:`, container.className, container.children.length, 'children');
    
    // Look for message patterns within container
    const messages = container.querySelectorAll('div');
    let containerMessages = 0;
    messages.forEach(msg => {
      if (msg.textContent && msg.textContent.length > 50 && msg.children.length < 5) {
        containerMessages++;
        if (containerMessages <= 5) { // Log first 5 messages
          console.log(`  Container message: ${msg.textContent.substring(0, 80)}...`);
        }
      }
    });
    
    if (containerMessages > 0) {
      console.log(`  Total messages in container ${i+1}: ${containerMessages}`);
    }
  });
  
  console.log(`\n📊 Extraction Complete!`);
  console.log(`Found ${conversations.length} items total:`);
  console.log(`- ${conversations.filter(c => c.role === 'user').length} user messages`);
  console.log(`- ${conversations.filter(c => c.role === 'assistant').length} assistant messages`);
  console.log(`- ${conversations.filter(c => c.type === 'conversation_title').length} conversation titles`);
  console.log(`- ${conversations.filter(c => c.type === 'storage_data').length} storage items`);
  
  if (conversations.length > 0) {
    console.log('\n📥 Raw extraction data:');
    console.log(JSON.stringify(conversations, null, 2));
    
    console.log('\n🚀 Next steps:');
    console.log('1. Copy the JSON above');
    console.log('2. Save it as claude-web-export.json');
    console.log('3. Run: node scripts/claude-web-to-dreams.js claude-web-export.json');
  } else {
    console.log('\n🤔 No conversations found. Try:');
    console.log('1. Make sure you\'re on claude.ai with conversations visible');
    console.log('2. Scroll through some conversation history');  
    console.log('3. Run this script again');
    console.log('4. Check if Claude.ai has an export feature in Settings');
  }
  
  // Store in window for easy access
  window.claudeExport = conversations;
  
  return conversations;
})();