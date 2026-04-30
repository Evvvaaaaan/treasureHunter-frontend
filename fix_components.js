const fs = require('fs');
const path = require('path');

const replaceRules = [
  { match: /color:\s*['"]#111827['"]/g, replace: "color: 'var(--foreground)'" },
  { match: /color:\s*['"]#4b5563['"]/g, replace: "color: 'var(--muted-foreground)'" },
  { match: /color:\s*['"]#6b7280['"]/g, replace: "color: 'var(--muted-foreground)'" },
  { match: /color:\s*['"]#374151['"]/g, replace: "color: 'var(--foreground)'" },
  { match: /color:\s*['"]#1f2937['"]/g, replace: "color: 'var(--foreground)'" },
  { match: /color:\s*['"]#f9fafb['"]/g, replace: "color: 'var(--background)'" },
  { match: /backgroundColor:\s*['"]white['"]/g, replace: "backgroundColor: 'var(--card)'" },
  { match: /backgroundColor:\s*['"]#ffffff['"]/g, replace: "backgroundColor: 'var(--card)'" },
  { match: /background:\s*['"]white['"]/g, replace: "background: 'var(--card)'" },
  { match: /background:\s*['"]#ffffff['"]/g, replace: "background: 'var(--card)'" },
  { match: /backgroundColor:\s*['"]#f9fafb['"]/g, replace: "backgroundColor: 'var(--background)'" },
  { match: /background:\s*['"]#f9fafb['"]/g, replace: "background: 'var(--background)'" },
  { match: /backgroundColor:\s*['"]#f3f4f6['"]/g, replace: "backgroundColor: 'var(--secondary)'" },
  { match: /background:\s*['"]#f3f4f6['"]/g, replace: "background: 'var(--secondary)'" },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const rule of replaceRules) {
        content = content.replace(rule.match, rule.replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src/components');
