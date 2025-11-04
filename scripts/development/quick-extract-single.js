// Quick Single Conversation Extractor for Claude.ai
// Copy-paste this into browser console (F12) on any Claude.ai conversation

(function quickExtractSingle() {
  console.log('⚡ Quick Single Conversation Extractor');
  
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
  
  // Try to get conversation title
  let title = document.title;
  if (title.includes('Claude')) {
    // Extract title from URL or page elements
    const urlParts = window.location.pathname.split('/');
    const conversationId = urlParts[urlParts.length - 1];
    title = `Claude Conversation ${conversationId.substring(0, 8)}`;
  }
  
  const result = {
    id: `claude_web_${Date.now()}`,
    title: title || 'Claude Conversation',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    messages: messages,
    messageCount: messages.length,
    totalCharacters: messages.reduce((sum, msg) => sum + msg.content.length, 0)
  };
  
  console.log(`✅ Extracted: ${result.messageCount} messages (${result.totalCharacters} chars)`);
  console.log(`🏷️  Title: ${result.title}`);
  console.log('\n📋 Copy this JSON and save as conversation-XX.json:');
  console.log('\n' + JSON.stringify(result, null, 2));
  
  // Store globally for easy copying
  window.currentConversationExport = result;
  window.currentConversationJSON = JSON.stringify(result, null, 2);
  
  console.log('\n💡 TIP: Run `copy(window.currentConversationJSON)` to copy to clipboard');
  
  return result;
})();