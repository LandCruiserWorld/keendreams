#!/usr/bin/env node
/**
 * Create Claude Dreams Bookmarklet
 * Converts the bookmarklet script to a clickable bookmark URL
 */

const fs = require('fs');
const path = require('path');

function createBookmarklet() {
  console.log('🔖 Creating Claude Dreams Bookmarklet...');
  
  // Read the bookmarklet script
  const scriptPath = path.join(__dirname, 'claude-dreams-bookmarklet.js');
  let script = fs.readFileSync(scriptPath, 'utf8');
  
  // Remove comments and minify
  script = script
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, ';}') // Clean up semicolons
    .replace(/\s*{\s*/g, '{') // Clean up braces
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*,\s*/g, ',') // Clean up commas
    .replace(/\s*:\s*/g, ':') // Clean up colons
    .replace(/\s*=\s*/g, '=') // Clean up equals
    .trim();
  
  // Create bookmarklet URL
  const bookmarkletUrl = `javascript:${encodeURIComponent(script)}`;
  
  // Create HTML file with bookmarklet
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Dreams Bookmarklet</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        
        .bookmarklet {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            font-weight: bold;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s;
        }
        
        .bookmarklet:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        
        .instructions {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        
        .step {
            margin: 15px 0;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        
        .step-number {
            background: #667eea;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            flex-shrink: 0;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 30px 0;
        }
        
        .feature {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #28a745;
        }
        
        .feature-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        
        .feature-desc {
            color: #666;
            font-size: 14px;
        }
        
        code {
            background: #f1f3f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>
            🌙 Claude Dreams Bookmarklet
        </h1>
        <div class="subtitle">One-click capture of Claude.ai conversations as dreams</div>
        
        <div class="instructions">
            <h3>📖 How to Install:</h3>
            
            <div class="step">
                <div class="step-number">1</div>
                <div>
                    <strong>Drag this button to your bookmarks bar:</strong><br>
                    <a href="${bookmarkletUrl}" class="bookmarklet">🌙 Capture Claude Dream</a>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">2</div>
                <div>Go to any <code>claude.ai</code> conversation page</div>
            </div>
            
            <div class="step">
                <div class="step-number">3</div>
                <div>Click the bookmarklet to instantly capture and upload the conversation as a dream!</div>
            </div>
        </div>
        
        <div class="features">
            <div class="feature">
                <div class="feature-title">⚡ One-Click Capture</div>
                <div class="feature-desc">No console commands, no copy-pasting</div>
            </div>
            
            <div class="feature">
                <div class="feature-title">🚀 Auto-Upload</div>
                <div class="feature-desc">Directly uploads to KeenDreams</div>
            </div>
            
            <div class="feature">
                <div class="feature-title">📱 Works Everywhere</div>
                <div class="feature-desc">Chrome, Firefox, Safari, Edge</div>
            </div>
            
            <div class="feature">
                <div class="feature-title">✨ Beautiful UI</div>
                <div class="feature-desc">Shows progress with overlay notifications</div>
            </div>
            
            <div class="feature">
                <div class="feature-title">🛡️ Safe & Secure</div>
                <div class="feature-desc">Only runs on claude.ai pages</div>
            </div>
            
            <div class="feature">
                <div class="feature-title">💾 Fallback Ready</div>
                <div class="feature-desc">Logs data to console if upload fails</div>
            </div>
        </div>
        
        <div class="instructions">
            <h3>🎯 How it Works:</h3>
            <p>The bookmarklet extracts all messages from the current Claude conversation, converts them to dream format, and uploads to your KeenDreams system. You'll see a beautiful overlay showing the progress.</p>
            
            <p><strong>Perfect for:</strong></p>
            <ul>
                <li>Capturing interesting conversations instantly</li>
                <li>Building your dream library without manual work</li>
                <li>One-click archiving of important Claude sessions</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 40px; color: #666;">
            <p>🌙 Part of the Claude Memory System</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
  
  // Save HTML file
  const htmlPath = path.join(__dirname, '..', 'claude-dreams-bookmarklet.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log('✅ Bookmarklet created successfully!');
  console.log(`📁 HTML file: ${htmlPath}`);
  console.log(`📏 Script size: ${script.length} characters`);
  console.log(`🔗 Bookmarklet URL length: ${bookmarkletUrl.length} characters`);
  
  // Also save just the URL for easy copying
  const urlPath = path.join(__dirname, '..', 'bookmarklet-url.txt');
  fs.writeFileSync(urlPath, bookmarkletUrl);
  console.log(`📋 URL saved: ${urlPath}`);
  
  console.log('\n🚀 Next steps:');
  console.log(`1. Open: ${htmlPath}`);
  console.log('2. Drag the bookmark button to your bookmarks bar');
  console.log('3. Go to claude.ai and test it!');
  
  return {
    htmlPath,
    urlPath,
    scriptSize: script.length,
    bookmarkletUrl
  };
}

// Main execution
if (require.main === module) {
  createBookmarklet();
}

module.exports = { createBookmarklet };