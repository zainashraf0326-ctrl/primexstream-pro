# 💎 Payment Section - Quick Visual Guide

## SECTION LAYOUT

```
┌─────────────────────────────────────────────────┐
│   Choose Secure Payment Method                  │
│   Select your preferred method to              │
│   complete order instantly.                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  PAYMENT METHOD CARDS (5 per row on desktop)    │
│                                                  │
│  ✨ [BINANCE]    ✨ [REMITLY]   [PayPal]        │
│  💰 SAVE 30% 🔥  💰 SAVE 30% 🔥               │
│  Glow Border     Glow Border                    │
│  Pulse Anim      Pulse Anim                     │
│                                                  │
│  [Cash App]      [Zelle]                        │
│  (Standard)      (Standard)                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  METHOD DETAILS (Only shows if selected)        │
│  ├─ 📋 How to Send Payment                     │
│  ├─ 🔐 Account Information                     │
│  └─ 🎁 Save 30% Today (if Binance/Remitly)   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  TRUST BOOSTERS (4 columns, 2 on mobile)       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ 🔒     │ │ ⚡     │ │ 🚀     │ │ 👥     │  │
│  │Secure  │ │Fast    │ │Instant │ │Trusted │  │
│  │Verify  │ │Confirm │ │Delivery│ │Others  │  │
│  └────────┘ └────────┘ └────────┘ └────────┘  │
└─────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  → Continue to Verification [Full Width Button]  │
└──────────────────────────────────────────────────┘


STEP 2: PAYMENT DETAILS
┌─────────────────────────────────────────────────┐
│  Step Indicator: 2/2 - Verify & Submit Payment │
│  [← Back Button]                               │
│                                                 │
│  Selected Method Card                           │
│  [Icon] Method Name                             │
│         💰 Save 30% Today (if applicable)      │
│                                                 │
│  PAYMENT DETAILS FORM                           │
│  Method-specific fields appear here             │
│  • Sender Name [TextField]                      │
│  • Reference [TextField]                        │
│  • etc...                                       │
│                                                 │
│  UPLOAD PAYMENT PROOF                           │
│  ┌─────────────────────────────┐               │
│  │  📤 Drag & Drop Here        │               │
│  │  or Click to Upload         │               │
│  │                              │               │
│  │  JPG, PNG, PDF • Max 10MB   │               │
│  └─────────────────────────────┘               │
│                                                 │
│  ORDER SUMMARY                                  │
│  Sale Price:        $10.00                      │
│  30% Discount:      -$3.00                      │
│  ─────────────────────────────                  │
│  Final Amount:      $7.00  ✅                   │
│                                                 │
│  ✓ Complete Payment & Save 30% ($7.00)         │
└─────────────────────────────────────────────────┘
```

---

## PAYMENT METHOD CARD STATES

### DEFAULT STATE (Unselected)
```
┌─────────────────────┐
│                     │
│       🟡            │   Light gray background
│                     │   No border emphasis
│    BINANCE          │   Hover: slight shadow
│    Instant Crypto   │
│    Payment          │
│                     │
│  💰 SAVE 30% 🔥     │   Pulsing badge
│  Recommended        │   at top-right
│  Lowest Cost        │
│                     │
└─────────────────────┘
```

### SELECTED STATE
```
┌═════════════════════┐
│                     │
│   ✅ (checkmark)    │   Green ring border
│       🟡            │   Enlarged (scale-105)
│                     │   Enhanced shadow
│    BINANCE          │   Glassmorphic effect
│    Instant Crypto   │
│    Payment          │
│                     │
│  💰 SAVE 30% 🔥     │   Still pulsing
│  Recommended        │
│  Lowest Cost        │
│                     │
└═════════════════════┘
    Glowing Border
    (Red → Orange → Yellow)
```

---

## ANIMATIONS

### Pulsing Badge (Binance/Remitly)
```
Timeline: 0s ──────── 1.5s ────────── 3s (repeats)
Opacity:  80%  →→→→→ 100%  →→→→→ 80%
Scale:    1.0  →→→→→ 1.05  →→→→→ 1.0
```

### Border Glow
```
Timeline: 0s ────────── 1s ─────────── 2s (repeats)
Glow:     Dim  →→→→→ Bright →→→→→ Dim
Effect:   Shadow becomes more prominent
```

### Hover Effect
```
Default → Hover:
Scale: 1.0 → 1.05 (in 300ms)
Shadow: Light → Medium (in 300ms)
```

---

## FORM FIELDS PER METHOD

### BINANCE
```
┌─────────────────────────────────────┐
│ 📝 PAYMENT DETAILS                  │
├─────────────────────────────────────┤
│                                     │
│ Wallet Network *                    │
│ [Select ▼] (TRC20, BEP20, ERC20)   │
│                                     │
│ Sender Name *                       │
│ [Your Full Name_________]           │
│                                     │
│ Transaction Hash/ID *               │
│ [Paste tx hash here_____]           │
│                                     │
└─────────────────────────────────────┘
```

### REMITLY
```
┌─────────────────────────────────────┐
│ 📝 PAYMENT DETAILS                  │
├─────────────────────────────────────┤
│                                     │
│ Sender Full Name *                  │
│ [Your Full Name_________]           │
│                                     │
│ Reference Number *                  │
│ [Remitly tracking number_]          │
│                                     │
└─────────────────────────────────────┘
```

### PAYPAL
```
┌─────────────────────────────────────┐
│ 📝 PAYMENT DETAILS                  │
├─────────────────────────────────────┤
│                                     │
│ PayPal Account Holder Name *        │
│ [Name on PayPal_________]           │
│                                     │
│ PayPal Email Used *                 │
│ [your.email@example.com_]           │
│                                     │
│ Transaction ID (Optional)           │
│ [Optional PayPal TX ID___]          │
│                                     │
└─────────────────────────────────────┘
```

### CASH APP
```
┌─────────────────────────────────────┐
│ 📝 PAYMENT DETAILS                  │
├─────────────────────────────────────┤
│                                     │
│ Sender Name *                       │
│ [Your Full Name_________]           │
│                                     │
│ Last 4 Digits / Reference *         │
│ [1234_________________]             │
│                                     │
└─────────────────────────────────────┘
```

### ZELLE
```
┌─────────────────────────────────────┐
│ 📝 PAYMENT DETAILS                  │
├─────────────────────────────────────┤
│                                     │
│ Sender Full Name *                  │
│ [Your Full Name_________]           │
│                                     │
│ Transfer Confirmation ID *          │
│ [Zelle confirmation ID__]           │
│                                     │
└─────────────────────────────────────┘
```

---

## UPLOAD AREA

### DEFAULT
```
┌──────────────────────────────────────┐
│  📤 Drag & Drop Screenshot Here     │
│  or Click to Upload                 │
│                                      │
│  JPG, PNG, PDF • Max 10MB           │
│                                      │
│  ┌─────────────────────────────┐    │
│  │ (Dashed border)             │    │
│  │ Light gray background       │    │
│  └─────────────────────────────┘    │
└──────────────────────────────────────┘
```

### FILE SELECTED
```
┌──────────────────────────────────────┐
│  ✅ payment-proof.png               │
│  Ready to upload                    │
│                                      │
│  ┌─────────────────────────────┐    │
│  │ (Solid border)              │    │
│  │ Green background            │    │
│  └─────────────────────────────┘    │
└──────────────────────────────────────┘
```

---

## VERIFICATION LOADER

```
┌─────────────────────────────────────┐
│                                     │
│              ◐◄►◑                   │  Rotating gradient
│              ↙   ↘                  │  spinner
│         Verifying Payment...        │
│                                     │
│  Please wait while we confirm      │
│  your transaction.                 │
│                                     │
│                                     │
│  [Glassmorphic card]               │
│  [Semi-transparent bg overlay]     │
│  [Blur backdrop]                   │
│                                     │
└─────────────────────────────────────┘
```

---

## DYNAMIC BUTTON TEXT

| Method | Button Text |
|--------|------------|
| Binance | ✓ Complete Payment & Save 30% ($X.XX) |
| Remitly | ✓ Transfer Now & Save 30% ($X.XX) |
| PayPal | ✓ Submit PayPal Proof ($X.XX) |
| Cash App | ✓ Submit Cash App Proof ($X.XX) |
| Zelle | ✓ Submit Zelle Proof ($X.XX) |

---

## COLORS REFERENCE

### Primary Colors
- **Emerald**: `#10b981` - Success, selected state, final amount
- **Red**: `#ef4444` - Discounted badge, highlights
- **Orange**: `#fed7aa` - Accents, gradients
- **Blue**: `#3b82f6` - PayPal styling

### Secondary Colors
- **Slate-100**: `#f1f5f9` - Light backgrounds
- **Slate-800**: `#1e293b` - Dark backgrounds
- **White**: `#ffffff` - Cards in dark mode
- **Gray**: `#6b7280` - Text and borders

---

## RESPONSIVE BREAKPOINTS

### Mobile (< 768px)
- Payment cards: 1 column
- Trust boosters: 2x2 grid
- Full-width inputs
- Large touch targets (44px+ height)

### Tablet (768px - 1024px)
- Payment cards: 2-3 columns
- Trust boosters: 2x2 grid
- Comfortable spacing

### Desktop (> 1024px)
- Payment cards: 5 columns (all visible)
- Trust boosters: 4 columns
- Maximum visual impact

---

## CONVERSION SIGNALS

✨ **Visual Urgency**: Glowing badges, pulsing animations
🛡️ **Trust**: Security badges, trust boosters
💰 **Value**: "SAVE 30%" prominently displayed
⚡ **Speed**: "Fast Manual Confirmation" messaging
✅ **Social Proof**: "Trusted by Thousands"
🎯 **Clarity**: Step indicators, method-specific fields

---

## SUCCESS FLOW

```
1. Select Payment Method
   ↓ [Visual feedback]
2. Review Details
   ↓ [Form auto-fills some fields]
3. Upload Proof + Enter Details
   ↓ [Validation confirms all required fields]
4. Click Submit
   ↓ [Loading state, then verification loader]
5. Success!
   ├─ Receipt page displays
   ├─ Order ID shown
   ├─ Amount confirmed
   ├─ Download receipt option
   └─ Share button option
```

---

Last Updated: April 17, 2026
