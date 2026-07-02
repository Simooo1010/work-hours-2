import React from 'react';

// A helper to wrap paths in a standard 24x24 pixel grid
const SvgBase = ({ size = 24, color = "currentColor", children, className = "", style = {} }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill={color} 
    className={className} 
    style={{ shapeRendering: 'crispEdges', minWidth: size, minHeight: size, ...style }}
  >
    {children}
  </svg>
);

// Navigation / General
// Controller / Gamepad - Tracker
export const PixelTracker = (p) => (
  <SvgBase {...p}>
    {/* Gamepad body */}
    <rect x="2" y="8" width="20" height="10" />
    <rect x="4" y="6" width="16" height="2" />
    <rect x="4" y="18" width="16" height="2" />
    <rect x="3" y="7" width="18" height="12" />
    
    {/* D-Pad (cutout/bg-primary) */}
    <rect x="6" y="11" width="3" height="3" fill="var(--bg-primary, #000)" />
    <rect x="5" y="12" width="5" height="1" fill="var(--bg-primary, #000)" />
    <rect x="7" y="10" width="1" height="5" fill="var(--bg-primary, #000)" />
    
    {/* Action Buttons (cutout/bg-primary) */}
    <rect x="15" y="12" width="2" height="2" fill="var(--bg-primary, #000)" />
    <rect x="17" y="10" width="2" height="2" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// Chart / Analytics - Analysis
export const PixelAnalysis = (p) => (
  <SvgBase {...p}>
    <rect x="2" y="2" width="2" height="20" />
    <rect x="2" y="20" width="20" height="2" />
    
    {/* Bars */}
    <rect x="6" y="14" width="3" height="6" />
    <rect x="11" y="9" width="3" height="11" />
    <rect x="16" y="5" width="3" height="15" />
  </SvgBase>
);

// Clock / Calendar - History
export const PixelHistory = (p) => (
  <SvgBase {...p}>
    {/* Clock circle */}
    <rect x="5" y="5" width="14" height="14" />
    <rect x="4" y="7" width="16" height="10" />
    <rect x="7" y="4" width="10" height="16" />
    
    {/* Clock face inner (cutout) */}
    <rect x="7" y="7" width="10" height="10" fill="var(--bg-primary, #000)" />
    
    {/* Hands (fill currentColor to contrast with cutout face) */}
    <rect x="11" y="9" width="2" height="3" />
    <rect x="11" y="11" width="4" height="2" />
  </SvgBase>
);

// Gear - Config
export const PixelConfig = (p) => (
  <SvgBase {...p}>
    {/* Gear body */}
    <rect x="8" y="8" width="8" height="8" />
    <rect x="10" y="6" width="4" height="12" />
    <rect x="6" y="10" width="12" height="4" />
    
    {/* Diagonal teeth */}
    <rect x="7" y="7" width="2" height="2" />
    <rect x="15" y="7" width="2" height="2" />
    <rect x="7" y="15" width="2" height="2" />
    <rect x="15" y="15" width="2" height="2" />
    
    {/* Gear inner hole (cutout) */}
    <rect x="11" y="11" width="2" height="2" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// Play
export const PixelPlay = (p) => (
  <SvgBase {...p}>
    <rect x="6" y="4" width="2" height="16" />
    <rect x="8" y="5" width="2" height="14" />
    <rect x="10" y="6" width="2" height="12" />
    <rect x="12" y="7" width="2" height="10" />
    <rect x="14" y="8" width="2" height="8" />
    <rect x="16" y="9" width="2" height="6" />
    <rect x="18" y="10" width="2" height="4" />
    <rect x="20" y="11" width="2" height="2" />
  </SvgBase>
);

// Pause
export const PixelPause = (p) => (
  <SvgBase {...p}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </SvgBase>
);

// Stop
export const PixelStop = (p) => (
  <SvgBase {...p}>
    <rect x="5" y="5" width="14" height="14" />
  </SvgBase>
);

// Plus
export const PixelPlus = (p) => (
  <SvgBase {...p}>
    <rect x="11" y="4" width="2" height="16" />
    <rect x="4" y="11" width="16" height="2" />
  </SvgBase>
);

// X (Close)
export const PixelX = (p) => (
  <SvgBase {...p}>
    <rect x="5" y="5" width="3" height="3" />
    <rect x="16" y="5" width="3" height="3" />
    <rect x="8" y="8" width="3" height="3" />
    <rect x="13" y="8" width="3" height="3" />
    <rect x="10" y="10" width="4" height="4" />
    <rect x="8" y="13" width="3" height="3" />
    <rect x="13" y="13" width="3" height="3" />
    <rect x="5" y="16" width="3" height="3" />
    <rect x="16" y="16" width="3" height="3" />
  </SvgBase>
);

// Check
export const PixelCheck = (p) => (
  <SvgBase {...p}>
    <rect x="4" y="12" width="3" height="3" />
    <rect x="7" y="15" width="3" height="3" />
    <rect x="10" y="18" width="3" height="3" />
    <rect x="13" y="15" width="3" height="3" />
    <rect x="16" y="12" width="3" height="3" />
    <rect x="19" y="9" width="3" height="3" />
    <rect x="22" y="6" width="2" height="3" />
  </SvgBase>
);

// Trash Can
export const PixelTrash = (p) => (
  <SvgBase {...p}>
    <rect x="4" y="5" width="16" height="2" />
    <rect x="9" y="3" width="6" height="2" />
    <rect x="6" y="7" width="12" height="14" />
    {/* Cutouts */}
    <rect x="8" y="10" width="2" height="8" fill="var(--bg-primary, #000)" />
    <rect x="11" y="10" width="2" height="8" fill="var(--bg-primary, #000)" />
    <rect x="14" y="10" width="2" height="8" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// Pencil - Edit
export const PixelEdit = (p) => (
  <SvgBase {...p}>
    <rect x="16" y="4" width="4" height="4" />
    <rect x="13" y="7" width="4" height="4" />
    <rect x="10" y="10" width="4" height="4" />
    <rect x="7" y="13" width="4" height="4" />
    <rect x="4" y="16" width="4" height="4" />
    {/* Tip cutout */}
    <rect x="2" y="19" width="3" height="3" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// Chevron Left
export const PixelChevronLeft = (p) => (
  <SvgBase {...p}>
    <rect x="14" y="4" width="3" height="3" />
    <rect x="11" y="7" width="3" height="3" />
    <rect x="8" y="10" width="3" height="4" />
    <rect x="11" y="14" width="3" height="3" />
    <rect x="14" y="17" width="3" height="3" />
  </SvgBase>
);

// Chevron Right
export const PixelChevronRight = (p) => (
  <SvgBase {...p}>
    <rect x="7" y="4" width="3" height="3" />
    <rect x="10" y="7" width="3" height="3" />
    <rect x="13" y="10" width="3" height="4" />
    <rect x="10" y="14" width="3" height="3" />
    <rect x="7" y="17" width="3" height="3" />
  </SvgBase>
);

// Clock
export const PixelClock = (p) => <PixelHistory {...p} />;

// Money - Bag/Bill
export const PixelMoney = (p) => (
  <SvgBase {...p}>
    <rect x="3" y="5" width="18" height="12" />
    <rect x="5" y="3" width="14" height="16" />
    {/* Inner detail (cutout) */}
    <rect x="5" y="5" width="14" height="12" fill="var(--bg-primary, #000)" />
    {/* Dollar sign inside */}
    <rect x="11" y="7" width="2" height="8" />
    <rect x="9" y="8" width="6" height="2" />
    <rect x="9" y="11" width="6" height="2" />
  </SvgBase>
);

// Trend Up
export const PixelTrend = (p) => (
  <SvgBase {...p}>
    <rect x="4" y="16" width="3" height="3" />
    <rect x="7" y="13" width="3" height="3" />
    <rect x="10" y="10" width="3" height="3" />
    <rect x="13" y="7" width="3" height="3" />
    <rect x="16" y="4" width="5" height="3" />
    <rect x="18" y="7" width="3" height="5" />
  </SvgBase>
);

// Printer
export const PixelPrint = (p) => (
  <SvgBase {...p}>
    <rect x="6" y="3" width="12" height="5" />
    <rect x="3" y="8" width="18" height="8" />
    <rect x="6" y="14" width="12" height="7" />
    {/* Paper cutout */}
    <rect x="8" y="16" width="8" height="3" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// Alert (Exclamation mark inside sign)
export const PixelAlert = (p) => (
  <SvgBase {...p}>
    <rect x="11" y="4" width="2" height="11" />
    <rect x="11" y="17" width="2" height="2" />
    <rect x="10" y="4" width="4" height="2" />
    <rect x="10" y="17" width="4" height="2" />
  </SvgBase>
);

// Sparkle
export const PixelSparkle = (p) => (
  <SvgBase {...p}>
    <rect x="11" y="3" width="2" height="6" />
    <rect x="11" y="15" width="2" height="6" />
    <rect x="3" y="11" width="6" height="2" />
    <rect x="15" y="11" width="6" height="2" />
    <rect x="9" y="9" width="2" height="2" />
    <rect x="13" y="9" width="2" height="2" />
    <rect x="9" y="13" width="2" height="2" />
    <rect x="13" y="13" width="2" height="2" />
  </SvgBase>
);

// Login / Door
export const PixelLogin = (p) => (
  <SvgBase {...p}>
    <rect x="4" y="3" width="12" height="18" />
    <rect x="6" y="5" width="8" height="14" fill="var(--bg-primary, #000)" />
    {/* Arrow pointing in */}
    <rect x="12" y="11" width="8" height="2" />
    <rect x="16" y="9" width="2" height="6" />
    <rect x="14" y="10" width="2" height="4" />
  </SvgBase>
);

// Lock
export const PixelLock = (p) => (
  <SvgBase {...p}>
    <rect x="5" y="10" width="14" height="11" />
    <rect x="8" y="4" width="8" height="6" />
    {/* Shackle inner cutout */}
    <rect x="10" y="6" width="4" height="4" fill="var(--bg-primary, #000)" />
    {/* Keyhole cutout */}
    <rect x="11" y="13" width="2" height="4" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// Mail / Envelope
export const PixelMail = (p) => (
  <SvgBase {...p}>
    <rect x="3" y="5" width="18" height="14" />
    {/* Inner detail (V-line) */}
    <rect x="5" y="7" width="2" height="2" fill="var(--bg-primary, #000)" />
    <rect x="7" y="9" width="2" height="2" fill="var(--bg-primary, #000)" />
    <rect x="9" y="11" width="6" height="2" fill="var(--bg-primary, #000)" />
    <rect x="15" y="9" width="2" height="2" fill="var(--bg-primary, #000)" />
    <rect x="17" y="7" width="2" height="2" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// Database
export const PixelDB = (p) => (
  <SvgBase {...p}>
    <rect x="4" y="3" width="16" height="6" />
    <rect x="4" y="10" width="16" height="6" />
    <rect x="4" y="17" width="16" height="4" />
    {/* Stripe details (cutouts) */}
    <rect x="6" y="5" width="12" height="2" fill="var(--bg-primary, #000)" />
    <rect x="6" y="12" width="12" height="2" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// File / Document
export const PixelFile = (p) => (
  <SvgBase {...p}>
    <rect x="4" y="3" width="16" height="18" />
    {/* Lines (cutouts) */}
    <rect x="7" y="7" width="10" height="2" fill="var(--bg-primary, #000)" />
    <rect x="7" y="11" width="10" height="2" fill="var(--bg-primary, #000)" />
    <rect x="7" y="15" width="10" height="2" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// Logout
export const PixelLogout = (p) => (
  <SvgBase {...p}>
    <rect x="10" y="3" width="10" height="18" />
    <rect x="12" y="5" width="6" height="14" fill="var(--bg-primary, #000)" />
    {/* Arrow pointing out */}
    <rect x="2" y="11" width="8" height="2" />
    <rect x="2" y="9" width="2" height="6" />
    <rect x="4" y="10" width="2" height="4" />
  </SvgBase>
);

// Phone
export const PixelPhone = (p) => (
  <SvgBase {...p}>
    <rect x="6" y="2" width="12" height="20" />
    {/* Screen cutout */}
    <rect x="8" y="4" width="8" height="14" fill="var(--bg-primary, #000)" />
    {/* Home button cutout */}
    <rect x="11" y="19" width="2" height="2" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// Globe
export const PixelGlobe = (p) => (
  <SvgBase {...p}>
    <rect x="5" y="5" width="14" height="14" />
    <rect x="4" y="7" width="16" height="10" />
    <rect x="7" y="4" width="10" height="16" />
    {/* Globe grid lines (cutout) */}
    <rect x="11" y="4" width="2" height="16" fill="var(--bg-primary, #000)" />
    <rect x="4" y="11" width="16" height="2" fill="var(--bg-primary, #000)" />
  </SvgBase>
);

// Key
export const PixelKey = (p) => (
  <SvgBase {...p}>
    {/* Key ring */}
    <rect x="3" y="8" width="8" height="8" />
    <rect x="5" y="10" width="4" height="4" fill="var(--bg-primary, #000)" />
    {/* Key shaft */}
    <rect x="11" y="11" width="10" height="2" />
    {/* Teeth */}
    <rect x="17" y="13" width="2" height="2" />
    <rect x="20" y="13" width="2" height="2" />
  </SvgBase>
);

// Shield
export const PixelShield = (p) => (
  <SvgBase {...p}>
    <rect x="4" y="3" width="16" height="12" />
    <rect x="6" y="15" width="12" height="3" />
    <rect x="8" y="18" width="8" height="3" />
    <rect x="11" y="21" width="2" height="1" />
    {/* Shield inner details (cutouts) */}
    <rect x="6" y="5" width="12" height="8" fill="var(--bg-primary, #000)" />
    <rect x="8" y="13" width="8" height="3" fill="var(--bg-primary, #000)" />
  </SvgBase>
);
