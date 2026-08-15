

import React from 'react';
import { FilterState, ModelStatus } from '@/lib/types';
import { SlidersHorizontal, X, RotateCcw, Check, Zap, Video, Radio, Flame } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalResults: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  totalResults,
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    setFilters({
      gender: 'all',
      tags: [],
      search: '',
      minAge: 18,
      maxAge: 60,
      status: 'online',
      sortBy: 'viewers',
      isLovenseOnly: false,
      isHdOnly: false,
      language: 'all',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="bg-zinc-950 border-l border-zinc-800 w-full max-w-md h-full flex flex-col p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-rose-500" />
            <h2 className="font-extrabold text-base text-white">Filtros Avanzados</h2>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Content */}
        <div className="flex-1 py-6 space-y-6">
          
          {/* Ordenar Por */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Ordenar Modelos</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'viewers', label: 'Más Espectadores' },
                { id: 'rank', label: 'Top Ranking' },
                { id: 'rating', label: 'Mejor Valoración' },
                { id: 'tokens', label: 'Menor Tarifa TK' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFilters((prev) => ({ ...prev, sortBy: opt.id as any }))}
                  className={`p-2.5 rounded-xl text-xs font-bold transition text-center flex items-center justify-center border ${
                    filters.sortBy === opt.id
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Feature Toggles */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Características Especiales</label>
            <div className="space-y-2">
              <label
                onClick={() => setFilters((prev) => ({ ...prev, isLovenseOnly: !prev.isLovenseOnly }))}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-amber-500/50 transition"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Solo con Juguete Lovense Interactivo</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    filters.isLovenseOnly ? 'bg-amber-500 border-amber-400 text-zinc-950' : 'border-zinc-700'
                  }`}
                >
                  {filters.isLovenseOnly && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </label>

              <label
                onClick={() => setFilters((prev) => ({ ...prev, isHdOnly: !prev.isHdOnly }))}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-rose-500/50 transition"
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white">Solo Transmisión HD / 4K</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    filters.isHdOnly ? 'bg-rose-600 border-rose-500 text-white' : 'border-zinc-700'
                  }`}
                >
                  {filters.isHdOnly && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </label>
            </div>
          </div>

          {/* Idioma */}
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
          </div>

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
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-950/40"
          >
            Ver {totalResults} Modelos Coincidentes
          </button>

          <button
            onClick={handleReset}
            className="w-full py-2 text-zinc-400 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        </div>

      </div>
    </div>
  );
};
