const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');

const iconMap = {
  'LayoutDashboard': 'PixelTracker',
  'BarChart2': 'PixelAnalysis',
  'Calendar': 'PixelHistory',
  'SettingsIcon': 'PixelConfig',
  'Settings': 'PixelConfig',
  'AlertCircle': 'PixelAlert',
  'Sparkles': 'PixelSparkle',
  'Loader2': 'PixelAlert',
  'DollarSign': 'PixelMoney',
  'ChevronLeft': 'PixelChevronLeft',
  'ChevronRight': 'PixelChevronRight',
  'TrendingUp': 'PixelTrend',
  'Printer': 'PixelPrint',
  'Clock': 'PixelClock',
  'LogIn': 'PixelLogin',
  'Lock': 'PixelLock',
  'Mail': 'PixelMail',
  'Database': 'PixelDB',
  'ShieldAlert': 'PixelShield',
  'Plus': 'PixelPlus',
  'Trash2': 'PixelTrash',
  'Edit2': 'PixelEdit',
  'FileText': 'PixelFile',
  'X': 'PixelX',
  'AlertTriangle': 'PixelAlert',
  'LogOut': 'PixelLogout',
  'Smartphone': 'PixelPhone',
  'Globe': 'PixelGlobe',
  'Key': 'PixelKey',
  'Shield': 'PixelShield',
  'Check': 'PixelCheck',
  'Play': 'PixelPlay',
  'Pause': 'PixelPause',
  'Square': 'PixelStop',
  'Coins': 'PixelMoney'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const [oldTag, newTag] of Object.entries(iconMap)) {
    const regex = new RegExp(`<${oldTag}\\b`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `<${newTag}`);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed tags in', filePath);
  }
}

const files = fs.readdirSync(srcDir).map(f => path.join(srcDir, f)).filter(f => f.endsWith('.jsx'));
files.forEach(processFile);

// Also check App.jsx
const appFile = path.join(__dirname, 'src', 'App.jsx');
processFile(appFile);
