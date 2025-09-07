// PPV Purchase Sound Effects - cash register style "cha‑ching"
// Make creators FEEL the money coming in

export interface SoundEffect {
  id: string;
  name: string;
  description: string;
  audioUrl: string;
  category: 'sale' | 'tip' | 'message' | 'milestone';
  minAmount?: number; // Only play for sales above this amount
}

export const PPV_SOUND_EFFECTS: SoundEffect[] = [
  // SALE SOUNDS - The money makers
  {
    id: 'cash-register',
    name: 'Classic Cash Register',
    description: 'Cha-ching! The satisfying sound of money',
    audioUrl: '/sounds/cash-register.mp3',
    category: 'sale'
  },
  {
    id: 'coins-drop',
    name: 'Coins Drop',
    description: 'Gold coins falling into your treasure chest',
    audioUrl: '/sounds/coins-drop.mp3',
    category: 'sale'
  },
  {
    id: 'slot-machine',
    name: 'Jackpot',
    description: 'Vegas slot machine winning sound',
    audioUrl: '/sounds/slot-machine.mp3',
    category: 'sale',
    minAmount: 50 // Big sales only
  },
  {
    id: 'sexy-moan',
    name: 'Sexy Notification',
    description: 'A subtle, flirty sound for the OF vibe',
    audioUrl: '/sounds/sexy-moan.mp3',
    category: 'sale'
  },
  {
    id: 'champagne-pop',
    name: 'Champagne Pop',
    description: 'Celebration time! Pop that bottle',
    audioUrl: '/sounds/champagne.mp3',
    category: 'sale',
    minAmount: 100 // VIP sales
  },
  
  // TIP SOUNDS
  {
    id: 'kiss',
    name: 'Kiss',
    description: 'Mwah! Thank you for the tip',
    audioUrl: '/sounds/kiss.mp3',
    category: 'tip'
  },
  {
    id: 'heart-beat',
    name: 'Heartbeat',
    description: 'Make their heart race',
    audioUrl: '/sounds/heartbeat.mp3',
    category: 'tip'
  },
  
  // MILESTONE SOUNDS
  {
    id: 'level-up',
    name: 'Level Up',
    description: 'You hit a new revenue milestone!',
    audioUrl: '/sounds/level-up.mp3',
    category: 'milestone'
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    description: 'Celebrate big achievements',
    audioUrl: '/sounds/fireworks.mp3',
    category: 'milestone'
  }
];

export class SoundEffectService {
  private audio: HTMLAudioElement | null = null;
  private enabled: boolean = true;
  private selectedSound: string = 'cash-register';
  private volume: number = 0.7;
  
  // Play the SELECTED sound for EVERY sale (creators pick their favorite)
  async playPurchaseSound(amount: number): Promise<void> {
    if (!this.enabled) return;
    
    // Always use the sound the creator selected
    const sound = PPV_SOUND_EFFECTS.find(s => s.id === this.selectedSound);
    if (!sound) return;
    
    try {
      this.audio = new Audio(sound.audioUrl);
      this.audio.volume = this.volume;
      await this.audio.play();
      
      // Visual feedback too
      this.showMoneyAnimation(amount);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }
  
  // Show floating money animation
  private showMoneyAnimation(amount: number): void {
    // Create floating money element
    const moneyEl = document.createElement('div');
    moneyEl.className = 'floating-money';
    moneyEl.innerHTML = `💵 +$${amount}`;
    moneyEl.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
      z-index: 9999;
      animation: float-up 2s ease-out forwards;
      pointer-events: none;
    `;
    
    document.body.appendChild(moneyEl);
    
    // Remove after animation
    setTimeout(() => moneyEl.remove(), 2000);
  }
  
  // Settings
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('ppv_sounds_enabled', enabled.toString());
  }
  
  setSound(soundId: string): void {
    this.selectedSound = soundId;
    localStorage.setItem('ppv_sound_selected', soundId);
  }
  
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('ppv_sound_volume', this.volume.toString());
  }
  
  // Test sound
  async testSound(): Promise<void> {
    await this.playPurchaseSound(25);
  }
}

// Global instance
export const soundEffects = new SoundEffectService();

// CSS for floating money animation
export const MONEY_ANIMATION_CSS = `
@keyframes float-up {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translateY(-20px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(1);
  }
}

.floating-money {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
`;
