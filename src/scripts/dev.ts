import { exec } from 'child_process';
import { watch } from 'fs';

function clearNodeCache() {
  console.log('🧹 Clearing Node.js module cache...');
  Object.keys(require.cache).forEach((key) => {
    delete require.cache[key];
  });
}

function restartServer() {
  console.log('🔄 Restarting server...');
  exec('yarn dev', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    console.log(stdout);
    console.error(stderr);
  });
}

// Watch for changes in src directory
watch('./src', { recursive: true }, (eventType, filename) => {
  if (filename) {
    console.log(`📝 File changed: ${filename}`);
    clearNodeCache();
    restartServer();
  }
});

// Initial start
restartServer();