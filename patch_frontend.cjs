const fs = require('fs');

// 1. Update types.ts
let typesContent = fs.readFileSync('src/lib/types.ts', 'utf8');
typesContent = typesContent.replace(
  "  language: string;",
  "  language: string;\n  ethnicity: string;\n  hairColor: string;\n  bodyType: string;"
);
fs.writeFileSync('src/lib/types.ts', typesContent);

// 2. Update App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  "language: 'all',",
  "language: 'all',\n    ethnicity: 'all',\n    hairColor: 'all',\n    bodyType: 'all',"
);

appContent = appContent.replace(
  "if (filters.language !== 'all') params.set('language', filters.language);",
  "if (filters.language !== 'all') params.set('language', filters.language);\n      if (filters.ethnicity !== 'all') params.set('profileEthnicity', filters.ethnicity);\n      if (filters.hairColor !== 'all') params.set('profileHairColor', filters.hairColor);\n      if (filters.bodyType !== 'all') params.set('profileBodyType', filters.bodyType);"
);

fs.writeFileSync('src/App.tsx', appContent);

// 3. Update FilterDrawer.tsx
let drawerContent = fs.readFileSync('src/components/FilterDrawer.tsx', 'utf8');

const targetFilters = `          {/* Idioma */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Idioma Hablado</label>
            <select
              value={filters.language}
              onChange={(e) => setFilters((prev) => ({ ...prev, language: e.target.value }))}
              className="w-full bg-zinc-900 text-xs text-white p-3 rounded-2xl border border-zinc-800 outline-none text-center"
            >
              <option value="all">Todos los idiomas</option>
              <option value="Español">Español</option>
              <option value="Inglés">Inglés</option>
              <option value="Portugués">Portugués</option>
              <option value="Italiano">Italiano</option>
            </select>
          </div>`;

const newFilters = targetFilters + `

          {/* Etnia */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Etnia</label>
            <select
              value={filters.ethnicity}
              onChange={(e) => setFilters((prev) => ({ ...prev, ethnicity: e.target.value }))}
              className="w-full bg-zinc-900 text-xs text-white p-3 rounded-2xl border border-zinc-800 outline-none text-center"
            >
              <option value="all">Cualquiera</option>
              <option value="ethnicityMiddleEastern">Medio Oriente</option>
              <option value="ethnicityAsian">Asiática</option>
              <option value="ethnicityEbony">Ebony (Negra)</option>
              <option value="ethnicityIndian">India</option>
              <option value="ethnicityLatino">Latina/Hispana</option>
              <option value="ethnicityMixed">Mixta</option>
              <option value="ethnicityWhite">Blanca</option>
              <option value="ethnicityFrench">Francesa</option>
              <option value="ethnicityGerman">Alemana</option>
              <option value="ethnicityItalian">Italiana</option>
              <option value="ethnicityRussian">Rusa</option>
              <option value="ethnicitySpanish">Española</option>
            </select>
          </div>

          {/* Color de Cabello */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Color de Cabello</label>
            <select
              value={filters.hairColor}
              onChange={(e) => setFilters((prev) => ({ ...prev, hairColor: e.target.value }))}
              className="w-full bg-zinc-900 text-xs text-white p-3 rounded-2xl border border-zinc-800 outline-none text-center"
            >
              <option value="all">Cualquiera</option>
              <option value="hairColorBlonde">Rubio</option>
              <option value="hairColorRed">Rojo/Pelirroja</option>
              <option value="hairColorBlack">Negro</option>
              <option value="hairColorColorful">Fantasía / Colores</option>
              <option value="hairColorHairless">Sin Cabello</option>
              <option value="hairColorOther">Otro</option>
            </select>
          </div>

          {/* Tipo de Cuerpo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Tipo de Cuerpo</label>
            <select
              value={filters.bodyType}
              onChange={(e) => setFilters((prev) => ({ ...prev, bodyType: e.target.value }))}
              className="w-full bg-zinc-900 text-xs text-white p-3 rounded-2xl border border-zinc-800 outline-none text-center"
            >
              <option value="all">Cualquiera</option>
              <option value="bodyTypeThin">Delgada</option>
              <option value="bodyTypeAverage">Promedio</option>
              <option value="bodyTypeAthletic">Atlética</option>
              <option value="bodyTypeLarge">Robusta / Talla Grande</option>
              <option value="bodyTypeCurvy">Curvilínea</option>
            </select>
          </div>`;

drawerContent = drawerContent.replace(targetFilters, newFilters);

drawerContent = drawerContent.replace(
  "setFilters({ ...filters, gender: 'all', status: 'all', sortBy: 'viewers', isLovenseOnly: false, isHdOnly: false, language: 'all' });",
  "setFilters({ ...filters, gender: 'all', status: 'all', sortBy: 'viewers', isLovenseOnly: false, isHdOnly: false, language: 'all', ethnicity: 'all', hairColor: 'all', bodyType: 'all' });"
);

fs.writeFileSync('src/components/FilterDrawer.tsx', drawerContent);

console.log("Patches applied successfully.");
