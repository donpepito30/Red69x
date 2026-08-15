const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetTagMapping = `      // Translate Spanish UI tags to English API tags
      const translationMap: Record<string, string> = {
        'tatuajes': 'tattoo',
        'pareja': 'couples',
        'asiática': 'asian',
        'rubia': 'blonde',
        'morena': 'brunette',
        'madura': 'milf'
      };
      
      // Forward the rest
      const excludedTags = ['new', 'anal', 'blowjob', 'hd', 'hd 1080p', 'vr', 'vr cams', 'lovense', 'lovense toy', 'latina', 'pareja'];`;

const newTagMapping = `      // Translate Spanish UI tags to English API tags
      const translationMap: Record<string, string> = {
        'tatuajes': 'tattoo',
        'pareja': 'couples',
        'asiática': 'asian',
        'rubia': 'blonde',
        'morena': 'brunette',
        'madura': 'milf',
        'latina': 'ethnicityLatino',
        'lovense toy': 'lovense',
        'lovense': 'lovense'
      };
      
      // Forward the rest
      const excludedTags = ['new', 'anal', 'blowjob', 'hd', 'hd 1080p', 'vr', 'vr cams', 'pareja'];`;

code = code.replace(targetTagMapping, newTagMapping);

const targetLocalFilter = `      const localOnlyTags = rawTags.filter(t => ['lovense', 'lovense toy', 'hd', 'hd 1080p', 'vr', 'vr cams', 'latina'].includes(t));`;
const newLocalFilter = `      const localOnlyTags = rawTags.filter(t => ['hd', 'hd 1080p', 'vr', 'vr cams'].includes(t));`;

code = code.replace(targetLocalFilter, newLocalFilter);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts to send everything upstream");
