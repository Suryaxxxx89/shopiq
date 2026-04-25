const fs = require('fs');
let content = fs.readFileSync('testp.js', 'utf8');

// Find the triggerSearch function and add page switching logic
const target = '  if (!q) { showEmpty(); return; }\r\n\r\n  // Detect if input is a URL';
const replacement = '  if (!q) { showEmpty(); return; }\r\n\r\n  // Always switch back to search page (in case we are on the compare page)\r\n  document.getElementById("comparePage").style.display = "none";\r\n  document.getElementById("searchPage").style.display = "block";\r\n  showView("search");\r\n\r\n  // Detect if input is a URL';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('testp.js', content);
  console.log('Fixed! Search now switches back from compare page.');
} else {
  console.log('Target not found. Trying without \\r\\n...');
  const target2 = '  if (!q) { showEmpty(); return; }\n\n  // Detect if input is a URL';
  const replacement2 = '  if (!q) { showEmpty(); return; }\n\n  // Always switch back to search page (in case we are on the compare page)\n  document.getElementById("comparePage").style.display = "none";\n  document.getElementById("searchPage").style.display = "block";\n  showView("search");\n\n  // Detect if input is a URL';
  if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
    fs.writeFileSync('testp.js', content);
    console.log('Fixed (LF)!');
  } else {
    console.log('Could not find target string');
  }
}
