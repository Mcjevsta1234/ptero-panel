import styled from 'styled-components/macro';
import tw from 'twin.macro';

/**
 * WitchyWorlds Unique Design System
 * Completely original aesthetic - not based on any standard panel design
 * 
 * Core Concept: Enchanted Forest meets Cyberpunk
 * - Organic flowing shapes (nature base)
 * - Crystalline geometric accents (tech layer)
 * - Mystical glow effects and animations
 * - Deep purples, forest greens, crystalline blues
 */

// Color Palette - Completely custom
export const Colors = {
  // Primary mystical colors
  arcane_purple: '#6b21a8',      // Deep magic purple
  arcane_glow: '#c084fc',        // Glowing purple
  
  // Nature colors
  forest_dark: '#0f2818',        // Deep forest base
  forest_mid: '#1a4d2e',         // Mid forest
  forest_light: '#2d6a4f',       // Light forest
  
  // Crystalline accents
  crystal_blue: '#06b6d4',       // Cyan crystal
  crystal_violet: '#a78bfa',     // Violet crystal
  
  // Mystical effects
  mist_white: 'rgba(255, 255, 255, 0.08)',
  void_black: '#0a0e27',
  
  // Glow colors
  glow_purple: 'rgba(167, 139, 250, 0.3)',
  glow_green: 'rgba(45, 106, 79, 0.2)',
  glow_cyan: 'rgba(6, 182, 212, 0.2)',
};

// Unique Background with animated mystical elements
export const MysticalBackground = styled.div`
  background: linear-gradient(135deg, #0a0e27 0%, #0f2818 50%, #1a1429 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
      radial-gradient(circle at 20% 50%, rgba(167, 139, 250, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(45, 106, 79, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 20%, rgba(6, 182, 212, 0.05) 0%, transparent 50%);
    pointer-events: none;
    animation: mystical-drift 20s ease-in-out infinite;
  }
  
  @keyframes mystical-drift {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(20px); }
  }
`;

// Hexagon Pattern Divider (mystical element)
export const HexagonDivider = styled.div`
  position: relative;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent,
    rgba(167, 139, 250, 0.3) 20%,
    rgba(6, 182, 212, 0.3) 50%,
    rgba(167, 139, 250, 0.3) 80%,
    transparent
  );
  
  &::before,
  &::after {
    content: '◆';
    position: absolute;
    color: ${Colors.crystal_violet};
    font-size: 10px;
    top: -5px;
  }
  
  &::before { left: 10%; }
  &::after { right: 10%; }
`;

// Crystalline Card - unique geometric design
export const CrystallineCard = styled.div`
  position: relative;
  background: linear-gradient(135deg, 
    rgba(15, 40, 24, 0.4) 0%,
    rgba(26, 77, 46, 0.2) 100%
  );
  border: 1px solid rgba(167, 139, 250, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(167, 139, 250, 0.1) 90deg,
      transparent 180deg
    );
    animation: crystal-rotate 30s linear infinite;
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
      rgba(6, 182, 212, 0.1) 0%, 
      transparent 80%
    );
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:hover {
    border-color: rgba(167, 139, 250, 0.4);
    box-shadow: 
      0 0 20px rgba(167, 139, 250, 0.2),
      inset 0 0 20px rgba(45, 106, 79, 0.1);
    transform: translateY(-2px);
    
    &::after { opacity: 1; }
  }
  
  @keyframes crystal-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Enchanted Navigation - flowing organic design
export const EnchantedNav = styled.nav`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  
  a {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.95rem;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, 
        rgba(167, 139, 250, 0.1) 0%,
        rgba(45, 106, 79, 0.05) 100%
      );
      border-radius: 8px;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: -1;
    }
    
    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      height: 0px;
      width: 3px;
      background: linear-gradient(180deg, 
        transparent,
        ${Colors.crystal_violet} 50%,
        transparent
      );
      transform: translateY(-50%);
      border-radius: 2px;
      transition: height 0.4s ease;
    }
    
    &:hover,
    &.active {
      color: ${Colors.crystal_violet};
      
      &::before {
        opacity: 1;
      }
      
      &::after {
        height: 100%;
      }
    }
  }
`;

// Arcane Portal Button - mystical interactive element
export const ArcaneButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  position: relative;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: white;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${({ variant = 'primary' }) => {
    switch (variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, ${Colors.arcane_purple} 0%, ${Colors.crystal_violet} 100%);
          box-shadow: 0 0 20px rgba(167, 139, 250, 0.3);
        `;
      case 'secondary':
        return `
          background: linear-gradient(135deg, ${Colors.forest_mid} 0%, ${Colors.forest_light} 100%);
          box-shadow: 0 0 20px rgba(45, 106, 79, 0.2);
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        `;
      default:
        return '';
    }
  }}
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ variant = 'primary' }) => {
      switch (variant) {
        case 'primary':
          return `0 0 30px rgba(167, 139, 250, 0.5), 0 8px 20px rgba(0, 0, 0, 0.3)`;
        case 'secondary':
          return `0 0 30px rgba(45, 106, 79, 0.4), 0 8px 20px rgba(0, 0, 0, 0.3)`;
        case 'danger':
          return `0 0 30px rgba(239, 68, 68, 0.5), 0 8px 20px rgba(0, 0, 0, 0.3)`;
        default:
          return '';
      }
    }};
    
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

// Mystical Input Field - flowing organic design
export const MysticalInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, 
    rgba(15, 40, 24, 0.3) 0%,
    rgba(10, 14, 39, 0.3) 100%
  );
  border: 1px solid rgba(167, 139, 250, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(167, 139, 250, 0.5);
    background: linear-gradient(135deg, 
      rgba(15, 40, 24, 0.5) 0%,
      rgba(10, 14, 39, 0.5) 100%
    );
    box-shadow: 
      0 0 20px rgba(167, 139, 250, 0.2),
      inset 0 0 10px rgba(167, 139, 250, 0.1);
  }
  
  &:hover:not(:focus) {
    border-color: rgba(167, 139, 250, 0.3);
  }
`;

// Rune Circle - unique loading/status indicator
export const RuneCircle = styled.div<{ status?: 'active' | 'inactive' | 'warning' | 'error' }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: relative;
  
  ${({ status = 'inactive' }) => {
    switch (status) {
      case 'active':
        return `
          background: radial-gradient(circle, ${Colors.crystal_violet} 0%, ${Colors.arcane_purple} 100%);
          box-shadow: 0 0 10px ${Colors.crystal_violet}, inset 0 0 5px rgba(255, 255, 255, 0.3);
          animation: rune-pulse-active 2s ease-in-out infinite;
        `;
      case 'warning':
        return `
          background: radial-gradient(circle, #fbbf24 0%, #f59e0b 100%);
          box-shadow: 0 0 10px #fbbf24, inset 0 0 5px rgba(255, 255, 255, 0.3);
          animation: rune-pulse-warning 1.5s ease-in-out infinite;
        `;
      case 'error':
        return `
          background: radial-gradient(circle, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 0 10px #ef4444, inset 0 0 5px rgba(255, 255, 255, 0.3);
          animation: rune-pulse-error 1s ease-in-out infinite;
        `;
      default:
        return `
          background: radial-gradient(circle, #6b7280 0%, #4b5563 100%);
          box-shadow: 0 0 5px rgba(107, 114, 128, 0.5);
        `;
    }
  }}
  
  @keyframes rune-pulse-active {
    0%, 100% { box-shadow: 0 0 10px ${Colors.crystal_violet}, inset 0 0 5px rgba(255, 255, 255, 0.3); }
    50% { box-shadow: 0 0 20px ${Colors.crystal_violet}, inset 0 0 10px rgba(255, 255, 255, 0.5); }
  }
  
  @keyframes rune-pulse-warning {
    0%, 100% { box-shadow: 0 0 10px #fbbf24, inset 0 0 5px rgba(255, 255, 255, 0.3); }
    50% { box-shadow: 0 0 20px #fbbf24, inset 0 0 10px rgba(255, 255, 255, 0.5); }
  }
  
  @keyframes rune-pulse-error {
    0%, 100% { box-shadow: 0 0 10px #ef4444, inset 0 0 5px rgba(255, 255, 255, 0.3); }
    50% { box-shadow: 0 0 20px #ef4444, inset 0 0 10px rgba(255, 255, 255, 0.5); }
  }
`;

// Enchanted Sidebar - flowing organic layout
export const EnchantedSidebar = styled.aside`
  width: 280px;
  background: linear-gradient(180deg, 
    rgba(15, 40, 24, 0.4) 0%,
    rgba(10, 14, 39, 0.3) 100%
  );
  border-right: 1px solid rgba(167, 139, 250, 0.15);
  backdrop-filter: blur(10px);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent,
      rgba(167, 139, 250, 0.2),
      transparent
    );
  }
  
  scrollbar-color: rgba(167, 139, 250, 0.3) transparent;
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(167, 139, 250, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba(167, 139, 250, 0.5);
    }
  }
`;

// Flowing Page Title
export const FlowingTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, 
    ${Colors.crystal_violet} 0%,
    ${Colors.arcane_glow} 50%,
    ${Colors.crystal_blue} 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(167, 139, 250, 0.2);
  margin: 0;
  letter-spacing: -1px;
  
  &::after {
    content: '';
    display: block;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent,
      ${Colors.crystal_violet} 20%,
      ${Colors.crystal_blue} 80%,
      transparent
    );
    margin-top: 0.5rem;
    border-radius: 1px;
  }
`;

// Void Container - completely unique modal/dialog design
export const VoidContainer = styled.div`
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, 
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.8) 100%
  );
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  animation: void-appear 0.3s ease-out;
  
  @keyframes void-appear {
    from {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(8px);
    }
  }
`;

export const VoidPortal = styled.div`
  position: relative;
  background: linear-gradient(135deg, 
    rgba(15, 40, 24, 0.6) 0%,
    rgba(26, 20, 41, 0.6) 100%
  );
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 0 50px rgba(167, 139, 250, 0.2),
    inset 0 0 50px rgba(45, 106, 79, 0.05);
  
  animation: portal-emerge 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  @keyframes portal-emerge {
    from {
      transform: scale(0.8) rotateX(20deg);
      opacity: 0;
    }
    to {
      transform: scale(1) rotateX(0deg);
      opacity: 1;
    }
  }
`;
