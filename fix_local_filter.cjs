const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `    if (tagsParam) {
      const rawTags = tagsParam.toString().toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
      if (rawTags.length > 0) {
        filtered = filtered.filter((m) => {
          return rawTags.some((t) => {`;

const replacement = `    if (tagsParam) {
      const rawTags = tagsParam.toString().toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
      // We only need to locally filter for tags that we didn't pass to the upstream API's "tag" array.
      // Upstream handles most generic tags, but we handle specific ones locally.
      const localOnlyTags = rawTags.filter(t => ['lovense', 'lovense toy', 'hd', 'hd 1080p', 'vr', 'vr cams', 'latina'].includes(t));
      
      if (localOnlyTags.length > 0) {
        filtered = filtered.filter((m) => {
          return localOnlyTags.some((t) => {`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('server.ts', content);
