import { ChatMessage } from './types';

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'c1', sender: 'Carlos_99', message: '¡Hola hermosa! Saludos desde México 🇲🇽', timestamp: '20:58', badge: 'FAN' },
  { id: 'c2', sender: 'VIP_Donator', message: 'Enviando 100 tokens para hacer vibrar el juguete! ⚡', timestamp: '20:58', isTip: true, tipAmount: 100, badge: 'TOP_TIPPER' },
  { id: 'c3', sender: 'Sistema', message: '¡Disfruten el show en vivo!', timestamp: '20:59', badge: 'MOD' }
];
