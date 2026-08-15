const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the tag parsing block
const targetTagsMapping = `    if (tagsParam) {
      const rawTags = tagsParam.toString().toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
      
      // Map specific tags to API boolean flags
      if (rawTags.includes('new')) upstreamParams.set('isNew', '1');
      if (rawTags.includes('anal')) upstreamParams.set('isMlAnal', '1');
      if (rawTags.includes('blowjob')) upstreamParams.set('isMlBlowjob', '1');
      if (rawTags.includes('vr cams') || rawTags.includes('vr')) upstreamParams.set('broadcastVR', '1');
      
      // Forward the rest
      const excludedTags = ['new', 'anal', 'blowjob', 'hd', 'hd 1080p', 'vr', 'vr cams', 'lovense', 'lovense toy', 'latina'];
      const validTags = rawTags.filter(t => !excludedTags.includes(t));
      apiTags.push(...validTags);
    }`;

const newTagsMapping = `    if (tagsParam) {
      const rawTags = tagsParam.toString().toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
      
      // Map specific tags to API boolean flags
      if (rawTags.includes('new')) upstreamParams.set('isNew', '1');
      if (rawTags.includes('anal')) upstreamParams.set('isMlAnal', '1');
      if (rawTags.includes('blowjob')) upstreamParams.set('isMlBlowjob', '1');
      if (rawTags.includes('vr cams') || rawTags.includes('vr')) upstreamParams.set('broadcastVR', '1');
      
      // Translate Spanish UI tags to English API tags
      const translationMap: Record<string, string> = {
        'tatuajes': 'tattoo',
        'pareja': 'couples',
        'asiática': 'asian',
        'rubia': 'blonde',
        'morena': 'brunette',
        'madura': 'milf'
      };
      
      // Forward the rest
      const excludedTags = ['new', 'anal', 'blowjob', 'hd', 'hd 1080p', 'vr', 'vr cams', 'lovense', 'lovense toy', 'latina', 'pareja'];
      
      const validTags = rawTags
        .filter(t => !excludedTags.includes(t))
        .map(t => translationMap[t] || t); // translate if exists
        
      if (rawTags.includes('pareja')) {
        apiTags.push('couple'); // Stripchat often uses couple or couples tag
      }

      apiTags.push(...validTags);
    }`;

code = code.replace(targetTagsMapping, newTagsMapping);
fs.writeFileSync('server.ts', code);
console.log("Patched server.ts tags mapping");
