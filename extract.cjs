const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./migrated_prompt_history/prompt_2026-01-25T10:44:54.420Z.json', 'utf8'));

const files = {};

for (const entry of data) {
  if (entry.payload && entry.payload.entries) {
    for (const action of entry.payload.entries) {
      if (action.diffs && action.diffs[0] && action.diffs[0].replacement) {
        if (action.diffs[0].target === "") { // Full file creation/replacement
          files[action.path] = action.diffs[0].replacement;
        } else {
           if (files[action.path]) {
             files[action.path] = files[action.path].replace(action.diffs[0].target, action.diffs[0].replacement);
           }
        }
      }
    }
  }
}

for (const path of Object.keys(files)) {
  fs.mkdirSync('./restored/' + path.split('/').slice(0, -1).join('/'), { recursive: true });
  fs.writeFileSync('./restored/' + path, files[path], 'utf8');
}
console.log('Restored files:', Object.keys(files));
