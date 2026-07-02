import React from 'react';

// A helper to wrap paths in a standard 16x16 pixel grid
const SvgBase = ({ size = 24, color = "currentColor", children, className = "", style = {} }) => (
  <svg 
    viewBox="0 0 16 16" 
    width={size} 
    height={size} 
    fill={color} 
    className={className} 
    style={{ shapeRendering: 'crispEdges', ...style }}
  >
    {children}
  </svg>
);

// Navigation / General
export const PixelTracker = (p) => <SvgBase {...p}>
  <rect x="2" y="5" width="12" height="6" />
  <rect x="3" y="4" width="10" height="1" />
  <rect x="3" y="11" width="10" height="1" />
  <rect x="4" y="7" width="3" height="2" fill="white" />
  <rect x="4.5" y="6" width="2" height="4" fill="white" />
  <rect x="10" y="8" width="2" height="2" fill="white" />
  <rect x="12" y="6" width="2" height="2" fill="white" />
</SvgBase>;
export const PixelAnalysis = (p) => <SvgBase {...p}><rect x="2" y="10" width="3" height="4" /><rect x="6" y="6" width="3" height="8" /><rect x="10" y="2" width="3" height="12" /><rect x="0" y="14" width="16" height="2" /></SvgBase>;
export const PixelHistory = (p) => <SvgBase {...p}><rect x="5" y="2" width="6" height="2" /><rect x="3" y="4" width="2" height="8" /><rect x="11" y="4" width="2" height="8" /><rect x="5" y="12" width="6" height="2" /><rect x="3" y="2" width="2" height="2" /><rect x="1" y="4" width="2" height="2" /><rect x="7" y="6" width="2" height="3" /><rect x="7" y="8" width="3" height="2" /></SvgBase>;
export const PixelConfig = (p) => <SvgBase {...p}><rect x="6" y="0" width="4" height="2" /><rect x="6" y="14" width="4" height="2" /><rect x="0" y="6" width="2" height="4" /><rect x="14" y="6" width="2" height="4" /><rect x="2" y="2" width="2" height="2" /><rect x="12" y="2" width="2" height="2" /><rect x="2" y="12" width="2" height="2" /><rect x="12" y="12" width="2" height="2" /><rect x="4" y="4" width="8" height="2" /><rect x="4" y="10" width="8" height="2" /><rect x="4" y="6" width="2" height="4" /><rect x="10" y="6" width="2" height="4" /></SvgBase>;

// UI Actions
export const PixelPlay = (p) => <SvgBase {...p}><rect x="4" y="2" width="2" height="12" /><rect x="6" y="4" width="2" height="8" /><rect x="8" y="6" width="2" height="4" /><rect x="10" y="8" width="2" height="2" transform="translate(0, -1)"/></SvgBase>;
export const PixelPause = (p) => <SvgBase {...p}><rect x="4" y="2" width="3" height="12" /><rect x="9" y="2" width="3" height="12" /></SvgBase>;
export const PixelStop = (p) => <SvgBase {...p}><rect x="3" y="3" width="10" height="10" /></SvgBase>;
export const PixelPlus = (p) => <SvgBase {...p}><rect x="6" y="2" width="4" height="12" /><rect x="2" y="6" width="12" height="4" /></SvgBase>;
export const PixelX = (p) => <SvgBase {...p}><path fill={p.color} d="M2 2h2v2H2zM12 2h2v2h-2zM4 4h2v2H4zM10 4h2v2h-2zM6 6h4v4H6zM4 10h2v2H4zM10 10h2v2h-2zM2 12h2v2H2zM12 12h2v2h-2z"/></SvgBase>;
export const PixelCheck = (p) => <SvgBase {...p}><path fill={p.color} d="M12 2h2v2h-2zM10 4h2v2h-2zM8 6h2v2H8zM6 8h2v2H6zM4 10h2v2H4zM2 8h2v2H2z"/></SvgBase>;
export const PixelTrash = (p) => <SvgBase {...p}><rect x="4" y="4" width="8" height="10" /><rect x="2" y="2" width="12" height="2" /><rect x="6" y="0" width="4" height="2" /><rect x="6" y="6" width="2" height="6" fill="white" /><rect x="10" y="6" width="2" height="6" fill="white" transform="translate(-2,0)"/></SvgBase>;
export const PixelEdit = (p) => <SvgBase {...p}><rect x="10" y="0" width="4" height="4" /><rect x="8" y="2" width="4" height="4" /><rect x="6" y="4" width="4" height="4" /><rect x="4" y="6" width="4" height="4" /><rect x="2" y="8" width="4" height="4" /><rect x="0" y="10" width="4" height="4" /><rect x="0" y="14" width="6" height="2" /></SvgBase>;
export const PixelChevronLeft = (p) => <SvgBase {...p}><rect x="8" y="2" width="2" height="2" /><rect x="6" y="4" width="2" height="2" /><rect x="4" y="6" width="2" height="4" /><rect x="6" y="10" width="2" height="2" /><rect x="8" y="12" width="2" height="2" /></SvgBase>;
export const PixelChevronRight = (p) => <SvgBase {...p}><rect x="6" y="2" width="2" height="2" /><rect x="8" y="4" width="2" height="2" /><rect x="10" y="6" width="2" height="4" /><rect x="8" y="10" width="2" height="2" /><rect x="6" y="12" width="2" height="2" /></SvgBase>;

export const PixelClock = (p) => <SvgBase {...p}><rect x="4" y="2" width="8" height="12" /><rect x="2" y="4" width="12" height="8" /><rect x="7" y="4" width="2" height="5" fill="white" /><rect x="7" y="7" width="4" height="2" fill="white" /></SvgBase>;

// Objects / Concepts
export const PixelMoney = (p) => <SvgBase {...p}><rect x="2" y="4" width="12" height="8" /><rect x="4" y="2" width="8" height="2" /><rect x="4" y="12" width="8" height="2" /><rect x="7" y="5" width="2" height="6" fill="white" /><rect x="6" y="6" width="4" height="2" fill="white" /><rect x="6" y="8" width="4" height="2" fill="white" /></SvgBase>;
export const PixelTrend = (p) => <SvgBase {...p}><rect x="2" y="10" width="2" height="2" /><rect x="4" y="8" width="2" height="2" /><rect x="6" y="10" width="2" height="2" /><rect x="8" y="8" width="2" height="2" /><rect x="10" y="6" width="2" height="2" /><rect x="12" y="4" width="2" height="2" /><rect x="10" y="4" width="4" height="2" /><rect x="12" y="4" width="2" height="4" /></SvgBase>;
export const PixelPrint = (p) => <SvgBase {...p}><rect x="4" y="0" width="8" height="4" /><rect x="2" y="4" width="12" height="6" /><rect x="4" y="10" width="8" height="6" /><rect x="6" y="12" width="4" height="2" fill="white" /></SvgBase>;
export const PixelAlert = (p) => <SvgBase {...p}><rect x="7" y="0" width="2" height="10" /><rect x="7" y="12" width="2" height="2" /><rect x="6" y="0" width="4" height="2" /><rect x="6" y="12" width="4" height="2" /></SvgBase>;
export const PixelSparkle = (p) => <SvgBase {...p}><rect x="7" y="0" width="2" height="4" /><rect x="7" y="12" width="2" height="4" /><rect x="0" y="7" width="4" height="2" /><rect x="12" y="7" width="4" height="2" /><rect x="5" y="5" width="2" height="2" /><rect x="9" y="5" width="2" height="2" /><rect x="5" y="9" width="2" height="2" /><rect x="9" y="9" width="2" height="2" /></SvgBase>;
export const PixelLogin = (p) => <SvgBase {...p}><rect x="8" y="2" width="6" height="2" /><rect x="12" y="2" width="2" height="12" /><rect x="8" y="12" width="6" height="2" /><rect x="4" y="6" width="6" height="2" /><rect x="4" y="8" width="6" height="2" /><rect x="6" y="4" width="2" height="2" /><rect x="6" y="10" width="2" height="2" /></SvgBase>;
export const PixelLock = (p) => <SvgBase {...p}><rect x="4" y="6" width="8" height="8" /><rect x="6" y="2" width="4" height="2" /><rect x="4" y="4" width="2" height="2" /><rect x="10" y="4" width="2" height="2" /><rect x="7" y="9" width="2" height="2" fill="white"/></SvgBase>;
export const PixelMail = (p) => <SvgBase {...p}><rect x="2" y="4" width="12" height="8" /><rect x="2" y="4" width="2" height="2" fill="white" /><rect x="4" y="6" width="2" height="2" fill="white" /><rect x="6" y="8" width="4" height="2" fill="white" /><rect x="10" y="6" width="2" height="2" fill="white" /><rect x="12" y="4" width="2" height="2" fill="white" /></SvgBase>;
export const PixelDB = (p) => <SvgBase {...p}><rect x="2" y="2" width="12" height="4" /><rect x="2" y="10" width="12" height="4" /><rect x="4" y="4" width="2" height="2" fill="white" /><rect x="4" y="12" width="2" height="2" fill="white" /></SvgBase>;
export const PixelFile = (p) => <SvgBase {...p}><rect x="3" y="0" width="10" height="16" /><rect x="5" y="4" width="6" height="2" fill="white" /><rect x="5" y="8" width="6" height="2" fill="white" /><rect x="5" y="12" width="6" height="2" fill="white" /></SvgBase>;
export const PixelLogout = (p) => <SvgBase {...p}><rect x="2" y="2" width="6" height="2" /><rect x="2" y="2" width="2" height="12" /><rect x="2" y="12" width="6" height="2" /><rect x="10" y="6" width="6" height="4" /><rect x="8" y="4" width="2" height="2" /><rect x="8" y="10" width="2" height="2" /></SvgBase>;
export const PixelPhone = (p) => <SvgBase {...p}><rect x="3" y="0" width="10" height="16" /><rect x="5" y="12" width="6" height="2" fill="white" /></SvgBase>;
export const PixelGlobe = (p) => <SvgBase {...p}><rect x="2" y="2" width="12" height="12" /><rect x="6" y="2" width="4" height="12" fill="white" /><rect x="2" y="6" width="12" height="4" fill="white" /></SvgBase>;
export const PixelKey = (p) => <SvgBase {...p}><rect x="10" y="2" width="4" height="4" /><rect x="2" y="8" width="8" height="2" /><rect x="4" y="10" width="2" height="2" /><rect x="6" y="10" width="2" height="2" /></SvgBase>;
export const PixelShield = (p) => <SvgBase {...p}><rect x="2" y="2" width="12" height="2" /><rect x="2" y="2" width="2" height="8" /><rect x="12" y="2" width="2" height="8" /><rect x="4" y="10" width="2" height="2" /><rect x="10" y="10" width="2" height="2" /><rect x="6" y="12" width="4" height="2" /></SvgBase>;
