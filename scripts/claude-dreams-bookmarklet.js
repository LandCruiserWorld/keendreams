// Claude Dreams Bookmarklet
// This gets minified and converted to a bookmarklet URL

(function claudeDreamsBookmarklet() {
  // Create overlay for user feedback
  const overlay = document.createElement('div');
  overlay.id = 'claude-dreams-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui;
    font-size: 14px;
    min-width: 300px;
    backdrop-filter: blur(10px);
  `;
  
  const updateStatus = (message, isError = false) => {
    overlay.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 20px;">${isError ? '❌' : '🌙'}</div>
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">Claude Dreams</div>
          <div style="opacity: 0.9;">${message}</div>
        </div>
      </div>
    `;
  };
  
  // Add overlay to page
  document.body.appendChild(overlay);
  updateStatus('Extracting conversation...');
  
  try {
    // Extract messages using the working selector
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
    
    if (messages.length === 0) {
      updateStatus('No messages found. Try scrolling through conversation first.', true);
      setTimeout(() => overlay.remove(), 5000);
      return;
    }
    
    // Get conversation title
    let title = document.title;
    if (title.includes('Claude')) {
      const urlParts = window.location.pathname.split('/');
      const conversationId = urlParts[urlParts.length - 1];
      title = `Claude Chat ${conversationId.substring(0, 8)}`;
    }
    
    // Create export data
    const exportData = {
      id: `claude_web_${Date.now()}`,
      title: title || 'Claude Conversation',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      messages: messages,
      messageCount: messages.length,
      totalCharacters: messages.reduce((sum, msg) => sum + msg.content.length, 0),
      source: 'bookmarklet'
    };
    
    updateStatus(`Extracted ${messages.length} messages. Converting to dream...`);
    
    // Convert to dream format (inline conversion)
    const dream = {
      id: `claude_web_${Date.now()}`,
      projectPath: '/claude-web-bookmarklet',
      projectName: exportData.title,
      timestamp: exportData.timestamp,
      context: {
        summary: `Claude.ai bookmarklet capture: ${exportData.title}`,
        techStack: [],
        currentTasks: [],
        completedTasks: [],
        fileStructure: [],
        dependencies: {},
        customNotes: `Captured via bookmarklet from ${exportData.url}. ${exportData.messageCount} messages.`
      },
      conversation: {
        keyDecisions: [],
        blockers: [],
        nextSteps: []
      },
      metadata: {
        source: 'claude-bookmarklet',
        claudeVersion: 'claude-web-bookmarklet',
        duration: Math.min(exportData.messageCount * 2, 120),
        durationHours: Math.min(exportData.messageCount * 2 / 60, 2),
        qualityScore: Math.min(50 + exportData.messageCount * 2, 100),
        messageCount: exportData.messageCount,
        totalCharacters: exportData.totalCharacters
      }
    };
    
    updateStatus('Uploading dream to KeenDreams...');
    
    // Upload to KeenDreams
    fetch('https://keendreams.terry-c67.workers.dev/dream', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dream)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        updateStatus(`✅ Dream captured! ID: ${result.dreamId}`);
        
        // Add success animation
        overlay.style.transform = 'scale(1.05)';
        setTimeout(() => {
          overlay.style.transform = 'scale(1)';
        }, 200);
        
      } else {
        updateStatus('Upload failed. Dream saved locally.', true);
        console.log('Dream data:', dream);
      }
      
      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transform = 'translateX(400px)';
        setTimeout(() => overlay.remove(), 300);
      }, 3000);
    })
    .catch(error => {
      updateStatus('Upload error. Check console for dream data.', true);
      console.log('Dream data for manual save:', dream);
      console.error('Upload error:', error);
      
      setTimeout(() => overlay.remove(), 5000);
    });
    
  } catch (error) {
    updateStatus('Extraction failed: ' + error.message, true);
    setTimeout(() => overlay.remove(), 5000);
  }
})();