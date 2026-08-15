const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetToRemove = `    // Read query params for filtering
    const genderParam = req.query.gender || req.query.g;
    const tagsParam = req.query.tags || req.query.category;
    const statusParam = req.query.status;
    const queryParam = req.query.search || req.query.q;
    const sortParam = req.query.sort || 'viewers';
    const isLovenseOnlyParam = req.query.isLovenseOnly === 'true';
    const isHdOnlyParam = req.query.isHdOnly === 'true';
    const languageParam = req.query.language;
    const limitParam = parseInt((req.query.limit || req.query.per_page || '60').toString(), 10);
    const pageParam = parseInt((req.query.page || '1').toString(), 10);
    const offsetParam = parseInt((req.query.offset || '0').toString(), 10) || (pageParam - 1) * limitParam;`;

content = content.replace(targetToRemove, '    // Read query params for filtering done at top');
fs.writeFileSync('server.ts', content);
