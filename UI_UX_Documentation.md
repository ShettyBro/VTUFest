# VTUFest Project UI/UX Documentation

This document provides a comprehensive breakdown of the design system, color palette, glassmorphism specs, and animations used in the VTUFest web project. It is intended to serve as a reference guide for adapting these styles into an Android application (e.g., using Jetpack Compose or XML).

## 1. Core Aesthetic: Vibrant Glass & Academic Dark Theme
The general UI pattern relies heavily on **Glassmorphism** combined with a deep, rich dark mode referred to as the **"Academic Dark Theme"**. It contrasts deep navy/slate backgrounds with vibrant gold and neon accents.

### Typography
- **Primary Font**: `Outfit` (Used globally across dashboards and most components).
- **Secondary Font**: `Poppins` (Used specifically on Auth/Login/Register pages).
- **Fallback**: `sans-serif`, `system-ui`.

---

## 2. Color Palette

### Backgrounds
- **Navy Dark (Base)**: `#0f172a` (slate-900)
- **Navy Medium**: `#1e293b` (slate-800)
- **Navy Royal**: `#1e3a8a` (blue-900)
- **Fluid Auth Background**: `linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)`

### Accents & Gradients
- **Academic Gold (Gradient)**: `linear-gradient(135deg, #d4af37, #f5d76e)` (Used for badges, highlights, and borders).
- **Gold Solid**: `#d4af37`
- **Gold Light (Hover)**: `#fbbf24`
- **Gold Glow**: `rgba(212, 175, 55, 0.25)` to `0.35`
- **Auth Button Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### Semantic Colors
- **Success/Emerald**: `#10b981` (rgb: 16, 185, 129)
- **Info/Blue**: `#60a5fa`
- **Warning/Amber**: `#f59e0b`
- **Error/Red**: `#EF5350` (rgb: 239, 83, 80)

### Text Colors
- **Primary Text**: `#f1f5f9` (White/Slate-100)
- **Secondary Text**: `#cbd5e1` (Slate-300)
- **Muted Text**: `#94a3b8` (Slate-400)

---

## 3. Glassmorphism Specifications (Android Equivalents)
To replicate the glass look on Android, you will need translucent backgrounds paired with background blurs (RenderEffect/BlurMaskFilter) and subtle white borders.

- **Glass Background**: `rgba(255, 255, 255, 0.06)` (for auth pages it goes up to `0.1` or `0.15`).
- **Glass Border**: `1px solid rgba(255, 255, 255, 0.15)` (Auth pages use `0.2`).
- **Backdrop Blur**: `12px` to `18px`.
- **Glass Shadow**: `0 8px 32px rgba(0, 0, 0, 0.3)` (or `rgba(31, 38, 135, 0.37)`).

---

## 4. Animations & Effects

### Background Animations
1. **Academic Gradient (`academicGradient`)**: 
   - A slow, 28-second infinite animated gradient that pans across the deep navy background (`#0f172a` -> `#1e293b` -> `#1e3a8a`).
2. **Floating Orb (`floatSlow`)**:
   - A large, blurred radial gradient `radial-gradient(circle, rgba(30, 58, 138, 0.15) 0%, transparent 70%)` that linearly translates and scales infinitely over 20 seconds.
3. **Auth Dynamic Gradient (`gradientBG`)**:
   - 15-second infinite panning of a bright 4-color gradient used strictly on login/register screens.

### Micro-Interactions & Notifications
1. **Sparkle Effect (`SparkleEffect.jsx`)**:
   - Used for premium notifications. Contains two layers:
     - **Shimmer Wipe**: A gold light (`rgba(255, 215, 0, 0.18)` to `0.35`) sweeps left-to-right across the notification banner taking `0.85s`.
     - **Ember Rise**: Sparkle glyphs (✨, ⋆, ✦) randomly rise `30px - 65px` upwards while drifting horizontally, fading out over `0.9s - 1.3s`.
2. **Ticker Message (`fadeInMessage`)**:
   - Text drops in smoothly (`translateY(-10px)` to `0`) while fading in over `0.5s`.
3. **Glow Pulse (`glowPulse`)**:
   - Infinite box-shadow pulse alternating between `0.2` and `0.6` opacity using a cyan/blue color (`rgba(0,242,255)`).

*(Note: There are no dedicated "Spinkit" or Lottie loading spinners. Loading states typically rely on glassmorphism skeleton loaders or simple text fades.)*

---

## 5. UI Component Specs

### 1. Glass Cards (Containers)
- **Border Radius**: `16px` to `20px`
- **Padding**: `26px`
- **Interactive State**: On hover/press, the card elevates (`translateY(-3px)`), the background opacity shifts to `0.08`, and the border color changes to `Gold Solid`. A strong `gold-glow` shadow is applied.

### 2. Neon Buttons (`.neon-btn`)
- **Background**: Transparent.
- **Border**: `2px solid #d4af37`.
- **Text Color**: `#d4af37` (Uppercase, bold, 1px letter spacing).
- **Border Radius**: `12px`.
- **Interactive State**: On hover/press, it fills with the `Academic Gold` gradient, text turns Navy Dark, and a heavy gold drop-shadow is applied.

### 3. Auth Buttons (`.auth-btn`)
- **Background**: Solid White or Linear Gradient (`#667eea` to `#764ba2`).
- **Text Color**: `#333333` or White.
- **Border Radius**: `10px` or `50px` (for file uploads).
- **Interactive State**: Translates Y by `-2px`, elevates shadow.

### 4. Inputs & Text Fields
- **Background**: `rgba(255, 255, 255, 0.15)`
- **Border**: `1px solid rgba(255, 255, 255, 0.2)`
- **Border Radius**: `10px`
- **Text**: White text, placeholder is `rgba(255, 255, 255, 0.7)`
- **Focus State**: Background becomes slightly more opaque (`0.25`), border turns solid white, and a faint white shadow appears.

### 5. Status Badges
- **Form Factor**: Pill-shaped (`border-radius: 50px`).
- **Colors**:
  - Pending: Amber text/border with `0.2` opacity background.
  - Submitted: Blue text/border with `0.2` opacity background.
  - Approved: Emerald text/border with `0.2` opacity background.
  - Rejected: Red text/border with `0.2` opacity background. 

---
**Summary for Android AI**: To adapt this to Android, focus on `RenderEffect.createBlurEffect()` for the glassy backgrounds. Use `ObjectAnimator` or Jetpack Compose `InfiniteTransition` for the slow background panning and the active sparkle/shimmer effects. Rely heavily on custom outlines and gradient borders to match the "neon/gold" interactive feeling.
