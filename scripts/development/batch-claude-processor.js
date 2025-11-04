#!/usr/bin/env node
/**
 * Batch Claude Conversation Processor
 * Converts multiple Claude JSON exports to Dreams format in bulk
 */

const fs = require('fs');
const path = require('path');
const { convertClaudeExportToDream } = require('./quick-claude-converter');

function processDirectory(dirPath) {
  console.log('🚀 Batch Claude to Dreams Processor v2.0');
  console.log(`📁 Processing directory: ${dirPath}`);
  
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Directory not found: ${dirPath}`);
    process.exit(1);
  }
  
  // Find all JSON files
  const files = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.json'))
    .filter(file => !file.startsWith('claude-dream-')); // Skip already converted dreams
  
  console.log(`📊 Found ${files.length} JSON files to process`);
  
  const results = [];
  let processed = 0;
  let errors = 0;
  
  files.forEach((filename, index) => {
    const filepath = path.join(dirPath, filename);
    console.log(`\n🔄 Processing ${index + 1}/${files.length}: ${filename}`);
    
    try {
      // Read and parse JSON
      const exportData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      // Extract title from filename or data
      const title = exportData.title || 
                   exportData.projectName || 
                   filename.replace('.json', '').replace(/[-_]/g, ' ');
      
      // Convert to dream format
      const dream = convertClaudeExportToDream(exportData, title);
      
      // Save dream
      const dreamFilename = `claude-dream-${dream.id.replace('claude_web_', '')}.json`;
      const dreamPath = path.join(dirPath, dreamFilename);
      fs.writeFileSync(dreamPath, JSON.stringify(dream, null, 2));
      
      console.log(`✅ Converted: ${dream.metadata.messageCount} messages → ${dreamFilename}`);
      console.log(`📊 Tech: ${dream.context.techStack.join(', ') || 'None detected'}`);
      
      results.push({
        original: filename,
        dream: dreamFilename,
        messages: dream.metadata.messageCount,
        tech: dream.context.techStack,
        qualityScore: dream.metadata.qualityScore
      });
      
      processed++;
      
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
      errors++;
    }
  });
  
  // Generate summary
  console.log(`\n🎉 BATCH PROCESSING COMPLETE!`);
  console.log(`✅ Processed: ${processed}/${files.length} files`);
  console.log(`❌ Errors: ${errors}`);
  
  if (results.length > 0) {
    const totalMessages = results.reduce((sum, r) => sum + r.messages, 0);
    const avgQuality = Math.round(results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length);
    const allTech = [...new Set(results.flatMap(r => r.tech))];
    
    console.log(`📊 Total messages: ${totalMessages}`);
    console.log(`📈 Average quality: ${avgQuality}/100`);
    console.log(`🔧 Technologies: ${allTech.join(', ')}`);
    
    // Save processing summary
    const summary = {
      timestamp: new Date().toISOString(),
      processed: processed,
      errors: errors,
      totalMessages: totalMessages,
      averageQuality: avgQuality,
      technologies: allTech,
      results: results
    };
    
    const summaryPath = path.join(dirPath, `batch-summary-${Date.now()}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`💾 Summary saved: ${summaryPath}`);
    
    // Generate upload script
    const uploadScript = results.map(r => 
      `echo "Uploading ${r.dream}..."\n` +
      `curl -X POST -H "Authorization: Bearer ${KEENDREAMS_API_KEY}" \\\\\n` +
      `  -H "Content-Type: application/json" \\\\\n` +
      `  -d @"${r.dream}" \\\\\n` +
      `  https://keendreams.workers.dev/dream\n` +
      `sleep 1\n`
    ).join('\n');
    
    const uploadScriptPath = path.join(dirPath, 'upload-all-dreams.sh');
    fs.writeFileSync(uploadScriptPath, '#!/bin/bash\n\n' + uploadScript);
    fs.chmodSync(uploadScriptPath, '755');
    
    console.log(`\n🚀 NEXT STEPS:`);
    console.log(`1. Review converted dreams in: ${dirPath}`);
    console.log(`2. Run bulk upload: ./${path.basename(uploadScriptPath)}`);
    console.log(`3. Check KeenDreams for uploaded dreams`);
    
    return summary;
  }
}

function processSingleFile(filepath) {
  console.log('🔄 Processing single file:', filepath);
  
  try {
    const exportData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const title = path.basename(filepath, '.json').replace(/[-_]/g, ' ');
    const dream = convertClaudeExportToDream(exportData, title);
    
    const dreamPath = filepath.replace('.json', '-dream.json');
    fs.writeFileSync(dreamPath, JSON.stringify(dream, null, 2));
    
    console.log(`✅ Converted: ${dream.metadata.messageCount} messages`);
    console.log(`💾 Saved as: ${dreamPath}`);
    
    console.log(`\n🚀 To upload:`);
    console.log(`curl -X POST -H "Authorization: Bearer ${KEENDREAMS_API_KEY}" \\\\`);
    console.log(`  -H "Content-Type: application/json" \\\\`);
    console.log(`  -d @"${dreamPath}" \\\\`);
    console.log(`  https://keendreams.workers.dev/dream`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🌙 Batch Claude to Dreams Processor');
    console.log('');
    console.log('Usage:');
    console.log('  node batch-claude-processor.js /path/to/conversations/');
    console.log('  node batch-claude-processor.js single-conversation.json');
    console.log('');
    console.log('Directory mode: Processes all .json files in directory');
    console.log('Single mode: Processes one file');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const stat = fs.statSync(inputPath);
  
  if (stat.isDirectory()) {
    processDirectory(inputPath);
  } else if (stat.isFile() && inputPath.endsWith('.json')) {
    processSingleFile(inputPath);
  } else {
    console.error('❌ Input must be a directory or .json file');
    process.exit(1);
  }
}

module.exports = { processDirectory, processSingleFile };