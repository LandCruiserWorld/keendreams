// Batch Extract First 5 Conversations from Claude.ai
// Run this in claude.ai browser console (F12)

(function extractFirst5Conversations() {
  console.log('🎯 Extracting First 5 Claude Conversations');
  console.log('⚠️  Make sure you have 5+ conversations in your sidebar!');
  
  // Get conversation links from sidebar
  const sidebarLinks = Array.from(document.querySelectorAll('div[class*="sidebar"] a'))
    .filter(link => link.href && link.textContent.trim().length > 3)
    .slice(0, 5); // Take first 5
  
  if (sidebarLinks.length < 5) {
    console.warn(`⚠️  Only found ${sidebarLinks.length} conversations. Proceeding with available ones.`);
  }
  
  console.log(`📊 Will extract ${sidebarLinks.length} conversations:`);
  sidebarLinks.forEach((link, i) => {
    console.log(`  ${i + 1}. ${link.textContent.trim()}`);
  });
  
  const extractions = [];
  let currentIndex = 0;
  
  // Extract current conversation function
  function extractCurrentConversation(title, url) {
    const messages = [];
    const presentationElements = document.querySelectorAll('[role="presentation"]');
    
    presentationElements.forEach((el, i) => {
      const content = el.textContent?.trim();
      if (content && content.length > 20) {
        messages.push({
          id: `msg_${i}`,
          content: content,
          timestamp: new Date().toISOString(),
          length: content.length
        });
      }
    });
    
    return {
      id: `claude_web_${Date.now()}_${currentIndex}`,
      title: title || `Conversation ${currentIndex + 1}`,
      url: url || window.location.href,
      timestamp: new Date().toISOString(),
      messages: messages,
      messageCount: messages.length,
      totalCharacters: messages.reduce((sum, msg) => sum + msg.content.length, 0)
    };
  }
  
  // Process conversations sequentially
  async function processConversations() {
    console.log('\n🚀 Starting extraction in 3 seconds...');
    console.log('📝 Keep this console open and don\'t navigate away!\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    for (let i = 0; i < sidebarLinks.length; i++) {
      currentIndex = i;
      const link = sidebarLinks[i];
      const title = link.textContent.trim();
      
      console.log(`\n🔄 [${i + 1}/${sidebarLinks.length}] Processing: "${title}"`);
      
      // Click the conversation link
      try {
        link.click();
        console.log('  ⏳ Loading conversation...');
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Extract the conversation
        const extraction = extractCurrentConversation(title, link.href);
        extractions.push(extraction);
        
        console.log(`  ✅ Extracted: ${extraction.messageCount} messages (${extraction.totalCharacters} chars)`);
        
        // Save individual file data for easy copying
        const jsonData = JSON.stringify(extraction, null, 2);
        console.log(`  💾 JSON for conversation-${String(i + 1).padStart(2, '0')}.json:`);
        console.log('  📋 ===== COPY FROM HERE =====');
        console.log(jsonData);
        console.log('  📋 ===== COPY TO HERE =====\n');
        
        // Store in window for easy access
        window[`conversation${i + 1}JSON`] = jsonData;
        window[`conversation${i + 1}Data`] = extraction;
        
      } catch (error) {
        console.error(`  ❌ Error processing "${title}":`, error.message);
        extractions.push({
          error: true,
          title: title,
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // Brief pause between extractions
      if (i < sidebarLinks.length - 1) {
        console.log('  ⏸️  Pausing 2 seconds before next extraction...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final summary
    const successful = extractions.filter(e => !e.error);
    const failed = extractions.filter(e => e.error);
    
    console.log('\n🎉 BATCH 1 EXTRACTION COMPLETE!');
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      const totalMessages = successful.reduce((sum, conv) => sum + (conv.messageCount || 0), 0);
      console.log(`📊 Total messages: ${totalMessages}`);
      
      console.log('\n💡 QUICK ACCESS:');
      for (let i = 0; i < successful.length; i++) {
        console.log(`  conversation${i + 1}JSON - Copy with: copy(window.conversation${i + 1}JSON)`);
      }
    }
    
    // Store complete batch
    window.batch1Results = {
      extractions: extractions,
      successful: successful.length,
      failed: failed.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Save each JSON as conversation-01.json, conversation-02.json, etc.');
    console.log('2. Run: node scripts/batch-claude-processor.js conversations/');
    console.log('3. Then run: ./upload-all-dreams.sh');
    console.log('\n📝 OR copy all individually using: copy(window.conversationXJSON)');
    
    return extractions;
  }
  
  // Start the process
  return processConversations();
})();