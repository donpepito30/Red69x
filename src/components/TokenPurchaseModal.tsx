

import React, { useState } from 'react';
import { Coins, X, CheckCircle2, ShieldCheck, Zap, CreditCard, Lock } from 'lucide-react';

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  setUserTokens: React.Dispatch<React.SetStateAction<number>>;
}

const TOKEN_PACKAGES = [
  { id: 'p1', tokens: 100, bonus: 0, price: 9.99, popular: false, label: 'Paquete Básico' },
  { id: 'p2', tokens: 500, bonus: 50, price: 39.99, popular: true, label: 'Paquete Popular ⭐' },
  { id: 'p3', tokens: 1500, bonus: 250, price: 99.99, popular: false, label: 'Paquete VIP Gold' },
  { id: 'p4', tokens: 5000, bonus: 1000, price: 299.99, popular: false, label: 'Paquete Ultra Diamond' },
];

export const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
  isOpen,
  onClose,
  setUserTokens,
}) => {
  const [selectedPack, setSelectedPack] = useState(TOKEN_PACKAGES[1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleBuy = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setUserTokens((prev) => prev + selectedPack.tokens + selectedPack.bonus);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40">
            <Coins className="w-6 h-6 text-zinc-950" />
          </div>
          <h2 className="font-extrabold text-xl text-white">Comprar Tokens / Propinas</h2>
          <p className="text-xs text-zinc-400">
            Los tokens te permiten interactuar en vivo, activar juguetes Lovense y pedir shows privados.
          </p>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="bg-emerald-950/80 border border-emerald-500/50 p-6 rounded-2xl text-center space-y-2 animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-extrabold text-base text-emerald-200">¡Compra Completada con Éxito!</h3>
            <p className="text-xs text-emerald-300">
              Se han acreditado <strong>{selectedPack.tokens + selectedPack.bonus} Tokens</strong> a tu billetera.
            </p>
          </div>
        ) : (
          <>
            {/* Packages Grid */}
            <div className="grid grid-cols-2 gap-3">
              {TOKEN_PACKAGES.map((pack) => {
                const isSelected = selectedPack.id === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500 shadow-xl shadow-amber-950/20'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                        MEJOR VALOR
                      </span>
                    )}

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-zinc-400">{pack.label}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-2xl text-amber-400">{pack.tokens}</span>
                        <span className="text-xs font-bold text-zinc-400">TK</span>
                      </div>
                      {pack.bonus > 0 && (
                        <div className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" /> +{pack.bonus} TK GRATIS
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="font-extrabold text-sm text-white">${pack.price} USD</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-amber-400 bg-amber-400 text-zinc-950' : 'border-zinc-700'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Summary & Button */}
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Total Tokens a Recibir:</span>
                <strong className="text-amber-400 font-extrabold text-sm">
                  {selectedPack.tokens + selectedPack.bonus} TK
                </strong>
              </div>

              <button
                onClick={handleBuy}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:opacity-95 text-zinc-950 font-black text-sm shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? (
                  <span>Procesando pago seguro...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pagar ${selectedPack.price} USD Ahora</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Pago encriptado 256-Bit SSL • Discreto en tu estado de cuenta</span>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
