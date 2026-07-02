const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');
const appFile = path.join(__dirname, 'src', 'App.jsx');

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
  
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;
  let hasLucide = false;
  let newImports = new Set();
  
  content = content.replace(importRegex, (fullMatch, group1) => {
    hasLucide = true;
    const imports = group1.split(',').map(s => s.trim());
    
    imports.forEach(imp => {
      let originalName = imp;
      let localName = imp;
      if (imp.includes(' as ')) {
        const parts = imp.split(' as ');
        originalName = parts[0].trim();
        if (parts.length > 1) {
           localName = parts[1].trim();
        }
      }
      
      const pixelName = iconMap[originalName] || 'PixelAlert';
      newImports.add(pixelName);
      
      const tagRegex = new RegExp(`<${localName}\\b`, 'g');
      content = content.replace(tagRegex, `<${pixelName}`);
    });
    
    return '';
  });
  
  if (hasLucide) {
    const importStatement = `import { ${Array.from(newImports).join(', ')} } from '${filePath.includes('App.jsx') ? './components/PixelIcons' : './PixelIcons'}';\n`;
    content = importStatement + content;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

const files = fs.readdirSync(srcDir).map(f => path.join(srcDir, f)).filter(f => f.endsWith('.jsx') && !f.includes('PixelIcons'));
files.push(appFile);

files.forEach(processFile);
