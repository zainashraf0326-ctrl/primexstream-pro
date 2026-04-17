# 🎨 PAYMENT SECTION - DESIGN ASSETS & STYLING GUIDE

## Color Palette

### Primary Colors
```
Emerald Green
Hex: #10b981
RGB: 16, 185, 129
Usage: Success states, selected elements, CTA buttons, final amounts
Tailwind: emerald-500, emerald-600, emerald-700

Red (Discount)
Hex: #ef4444
RGB: 239, 68, 68
Usage: Discount badges, urgency signals
Tailwind: red-500, red-600, red-700

Orange (Accent)
Hex: #fed7aa
RGB: 254, 215, 170
Usage: Gradient accents, highlights
Tailwind: orange-300, orange-400, orange-500
```

### Secondary Colors
```
Slate-900 (Text - Light Mode)
Hex: #0f172a
RGB: 15, 23, 42
Usage: Primary text on light backgrounds

Slate-100 (Light Backgrounds)
Hex: #f1f5f9
RGB: 241, 245, 249
Usage: Card backgrounds, section backgrounds

Slate-800 (Dark Backgrounds)
Hex: #1e293b
RGB: 30, 41, 59
Usage: Input backgrounds, dark mode cards

White/Black
Hex: #ffffff / #000000
Usage: Backgrounds in dark/light modes
```

---

## Typography Scale

### Headings
```
H1 (Section Title)
Font Size: 28px (md: 36px, lg: 48px)
Font Weight: Bold (700)
Line Height: 1.2
Example: "Choose Secure Payment Method"

H2 (Card Titles)
Font Size: 20px
Font Weight: Bold (700)
Line Height: 1.25
Example: "How to Send Payment"

H3 (Labels)
Font Size: 14px (sm)
Font Weight: Semibold (600)
Line Height: 1.4
Example: "Wallet Network"

H4 (Badge Text)
Font Size: 12px (xs)
Font Weight: Bold (700)
Example: "SAVE 30% 🔥"
```

### Body Text
```
Regular Text
Font Size: 14px (sm)
Font Weight: Regular (400)
Line Height: 1.6
Example: Instructions, descriptions

Small Text
Font Size: 12px (xs)
Font Weight: Regular (400)
Line Height: 1.5
Example: Help text, hints

Amount Text
Font Size: 24px (2xl) to 32px (3xl)
Font Weight: Bold (700)
Example: "$14.99" final price
```

---

## Spacing System

### Margins & Padding
```
xs: 4px (0.25rem)
sm: 8px (0.5rem)
md: 12px (0.75rem)
base: 16px (1rem)
lg: 24px (1.5rem)
xl: 32px (2rem)
2xl: 48px (3rem)
3xl: 64px (4rem)
```

### Applied Spacing
```
Section Title: mb-8 (32px bottom margin)
Card Content: p-4 to p-6 (padding)
Form Fields: mb-4 (spacing between)
Grid Gap: gap-3 to gap-4
Trust Badges: gap-3
```

---

## Component Styles

### Cards
```
Base Card (.card)
- Rounded: rounded-2xl
- Padding: p-4 to p-6
- Background: White (light), slate-900 (dark)
- Border: 1px solid slate-200/700
- Shadow: Moderate (0 4px 6px rgba(...))

Glass Card (.glass)
- Backdrop Blur: backdrop-blur-xl
- Background: white/20 (light), black/20 (dark)
- Border: 1px solid white/40 (light), white/10 (dark)
- Shadow: 0 8px 32px rgba(31, 38, 135, 0.1)

Selected Card
- Ring: ring-2 ring-{color}-500
- Background: Slight tint of ring color
- Shadow: Enhanced shadow (larger blur)
- Scale: scale-105 (5% larger)
```

### Buttons
```
Primary CTA
- Background: bg-emerald-600
- Hover: hover:bg-emerald-700
- Text: text-white font-bold
- Padding: py-3 to py-4 px-4 to px-6
- Border Radius: rounded-xl to rounded-2xl
- Width: w-full (full width)
- Size: lg (large)

Secondary Button
- Background: bg-slate-200 (light), bg-slate-700 (dark)
- Hover: bg-slate-300 (light), bg-slate-600 (dark)
- Text: text-slate-900 (light), text-white (dark)
- Variant: outline or secondary
```

### Inputs
```
Text Input
- Background: bg-white (light), bg-slate-800 (dark)
- Border: border-2 border-slate-200 (light), border-slate-700 (dark)
- Focus: focus:border-emerald-500
- Padding: px-4 py-3
- Border Radius: rounded-xl
- Transition: transition-colors

File Input
- Display: file:block or hidden (with custom button)
- Drag & Drop: border-dashed border-2
- Hover: hover:border-slate-400 dark:hover:border-slate-500
```

### Badges
```
Discount Badge
- Background: bg-gradient-to-r from-red-500 to-red-600
- Text: text-white text-xs font-bold
- Padding: px-2.5 py-1 to px-3 py-1.5
- Border Radius: rounded-lg to rounded-full
- Position: absolute top-3 right-3
- Animation: animate-pulse
- Transform: -rotate-12 (slight rotation)

Trust Badge
- Background: bg-slate-50 (light), bg-slate-800 (dark)
- Border: border-1 border-slate-200 (light), border-slate-700 (dark)
- Padding: p-4
- Border Radius: rounded-xl
- Icon Size: text-2xl
- Text: text-xs font-semibold
```

---

## Animations

### Pulse (Badge Glow)
```css
@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

.animate-pulse-glow {
  animation: pulseGlow 3s ease-in-out infinite;
}

Usage: On "SAVE 30% 🔥" badge
```

### Border Pulse (Glowing Border)
```css
@keyframes borderPulse {
  0%, 100% {
    box-shadow: 
      0 0 20px rgba(239, 68, 68, 0.3),
      0 0 40px rgba(249, 115, 22, 0.2);
  }
  50% {
    box-shadow:
      0 0 30px rgba(239, 68, 68, 0.5),
      0 0 60px rgba(249, 115, 22, 0.4);
  }
}

.animate-border-pulse {
  animation: borderPulse 2s ease-in-out infinite;
}

Usage: Selected payment method card border
```

### Hover Scale
```css
.hover:scale-105 {
  transform: scale(1.05);
  transition-duration: 300ms;
}

Usage: Payment method cards on hover
```

### Fade In
```css
.animate-in.fade-in {
  animation-duration: 300ms;
  opacity: 1;
}

Usage: Method details appearing
```

---

## Responsive Breakpoints

### Mobile First
```
Default (Mobile): < 768px
- Grid: 1 column (full width)
- Font: Base sizes
- Padding: Reduced (p-4)
- Gap: gap-3

Tablet (md): 768px - 1024px
- Grid: 2-3 columns
- Font: Slightly larger
- Padding: Moderate (p-5)
- Gap: gap-4

Desktop (lg): 1024px+
- Grid: 4-5 columns
- Font: Full size
- Padding: Generous (p-6)
- Gap: gap-4
```

### Applied Breakpoints
```jsx
{/* Payment Methods Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

{/* Trust Badges */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">

{/* Form Section */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

---

## Icon Library

### Lucide React Icons Used
```
Check (Checkmark on selected)
- Size: w-4 h-4
- Color: text-white
- Usage: Selection indicator

Upload
- Size: w-8 h-8
- Color: text-slate-400
- Usage: Upload area icon

Loader
- Size: w-4 h-4
- Color: text-emerald-500
- Animation: animate-spin
- Usage: Loading indicator

ChevronDown
- Size: w-5 h-5
- Transform: rotate-180 when expanded
- Usage: Accordion toggle
```

### Emoji Icons Used
```
🟡 Binance (yellow circle)
🔵 Remitly (blue circle)
💙 PayPal (blue heart)
💚 Cash App (green heart)
💳 Zelle (credit card)
🎁 Discount/Gift (wrapped gift)
🔥 Fire/Urgency (fire)
💰 Money (money bag)
🔒 Security (lock)
⚡ Speed (lightning bolt)
🚀 Speed/Instant (rocket)
👥 People/Trust (people)
📋 Instructions (clipboard)
🔐 Security/Info (locked key)
✅ Success/Check (checkmark)
📸 Camera/Photo (camera)
📤 Upload (up arrow)
```

---

## Dark Mode Styling

### Color Adjustments
```
Light Mode → Dark Mode
bg-white → bg-slate-900
text-slate-900 → text-white
border-slate-200 → border-slate-700
bg-slate-50 → bg-slate-800
text-slate-600 → text-slate-400

Emerald Colors
text-emerald-600 → text-emerald-400
bg-emerald-50 → bg-emerald-900/20
border-emerald-200 → border-emerald-700
```

### Applied Classes
```jsx
// Example of dark mode class
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"

// Border dark mode
className="border-slate-200 dark:border-slate-700"

// Text dark mode
className="text-slate-600 dark:text-slate-400"
```

---

## Focus & Active States

### Focus States
```css
.focus:outline-none
.focus:ring-2
.focus:ring-emerald-500
.dark:focus:ring-emerald-500
.focus:border-emerald-500
.dark:focus:border-emerald-500
```

### Active States
```css
/* Button Active */
.active:bg-emerald-800

/* Form Invalid */
.invalid:border-red-500
.invalid:ring-red-300

/* Disabled States */
.disabled:opacity-50
.disabled:cursor-not-allowed
```

---

## Accessibility Colors

### Color Contrast Ratios
```
Text on White Background
- Slate-900: 16.5:1 (AAA compliant)
- Slate-600: 6.3:1 (AA compliant)

Text on Dark Background
- White: 13.3:1 (AAA compliant)
- Slate-300: 5.2:1 (AA compliant)

Interactive Elements
- Emerald-600: 4.8:1 (AA compliant)
- Red-500: 5.1:1 (AA compliant)

All color combinations meet WCAG AA standards minimum
```

---

## Box Shadow Reference

### Shadow Depths
```
No Shadow: shadow-none
Small Shadow: shadow-sm (0 1px 2px)
Base Shadow: shadow (0 1px 3px)
Medium Shadow: shadow-md (0 4px 6px)
Large Shadow: shadow-lg (0 10px 15px)
Extra Large: shadow-xl (0 20px 25px)
2XL: shadow-2xl (0 25px 50px)
```

### Applied Shadows
```jsx
{/* Card hover */}
className="hover:shadow-lg transition-shadow"

{/* Selected method */}
className="ring-2 ring-emerald-500 shadow-xl"

{/* Badge */}
className="shadow-lg"
```

---

## Gradient Reference

### Used Gradients
```css
/* Discount Badge Gradient */
bg-gradient-to-r from-red-500 to-orange-500

/* Glow Border Gradient */
bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500

/* Discount Savings Box */
bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20

/* Order Summary Highlight */
bg-gradient-to-r from-red-500 to-orange-500
```

### Custom Gradients
```jsx
{/* Example usage */}
<div className="bg-gradient-to-r from-red-500 to-orange-500">
  {/* Content */}
</div>
```

---

## Transition Timings

### Standard Transitions
```css
300ms (default)
- Hover effects
- Focus states
- Opacity changes

500ms (slow)
- Larger animations
- Section transitions
- Modal appearances

Easing: ease-out (most common)
- Quick start, smooth finish
- Good for UI interactions

Easing: ease-in-out
- Smooth start and finish
- For continuous animations
```

---

## Mobile Touch Targets

### Touch-Friendly Sizes
```
Minimum: 44x44px (WCAG)
Recommended: 48x48px
Padding around target: 8px minimum

Applied Sizes:
- Button height: py-3 to py-4 (48-56px)
- Input height: py-3 (48px+)
- Checkbox: w-5 h-5 (20px) with 8px padding
- Close button: w-10 h-10 (40px)
```

---

## Loading States

### Visual Feedback
```
Button Loading
- Show spinner icon
- Text becomes "Processing..."
- Button disabled
- Opacity slightly reduced

File Upload
- Show progress indicator
- Display filename
- Green checkmark when complete

Verification
- Full-screen overlay
- Animated spinner
- Loading message
- Status text
```

---

## Success & Error States

### Success State
```
- Green checkmark icon (✅)
- Green text color (emerald-600)
- Green background (emerald-50)
- Green border (emerald-200)
- Success message

Example:
bg-emerald-50 dark:bg-emerald-900/30
border-emerald-200 dark:border-emerald-700/30
text-emerald-700 dark:text-emerald-300
```

### Error State
```
- Red/Error text
- Red border
- Red background
- Error message
- Clear error icon or styling

Example:
bg-red-50 dark:bg-red-950/30
border-red-200 dark:border-red-700/50
text-red-700 dark:text-red-300
```

---

## Printable Styles

### Print Optimization
```css
/* Hide interactive elements */
@media print {
  button, input[type="file"] {
    display: none;
  }
  
  /* Keep receipt content */
  .receipt-content {
    display: block;
    page-break-inside: avoid;
  }
}
```

---

## Animation Performance

### GPU-Accelerated Properties
```
transform (translateX, translateY, scale, rotate)
opacity
box-shadow
border-radius (when combined with transform)
```

### CPU-Heavy (Avoid Animating)
```
width
height
left/right/top/bottom
background-color (use opacity instead)
font-size
```

---

Last Updated: April 17, 2026
Version: 1.0.0
