# 🔧 PAYMENT SECTION - CODE REFERENCE GUIDE

## Quick Navigation

### Main File
[src/app/payment/page.tsx](src/app/payment/page.tsx) - Complete payment section implementation

### CSS File
[src/app/globals.css](src/app/globals.css) - New animations for payment section

---

## Code Structure Overview

```typescript
export default function PaymentPage() {
  // Wrapped in Suspense for client-side rendering
  return <Suspense fallback={...}>
    <PaymentContent />
  </Suspense>
}

function PaymentContent() {
  // STATE MANAGEMENT
  - method: selected payment method
  - currentStep: 1 or 2
  - verifying: loader visibility
  - formData: method-specific fields
  - config: Firebase configuration
  - screenshot: uploaded file
  - txId: transaction ID
  
  // CALCULATED VALUES
  - originalPrice, salePrice, finalPrice
  - isSpecialPayment: Binance/Remitly?
  - extraDiscount: 30% for special methods
  
  // SECTIONS
  1. Welcome Popup
  2. Success Receipt
  3. Step 1: Method Selection
  4. Step 2: Payment Details & Upload
}
```

---

## Key Functions Reference

### `getMethodFields(methodId: PaymentMethod)`
Returns form fields specific to payment method

```typescript
// Example: Binance returns these fields
[
  { label: 'Wallet Network', type: 'select', key: 'walletNetwork', ... },
  { label: 'Sender Name', type: 'text', key: 'senderName', ... },
  { label: 'Transaction Hash/ID', type: 'text', key: 'txId', ... }
]
```

**Usage**: Dynamically render form fields based on selected method

---

### `getPaymentMethodDetails(methodId: PaymentMethod)`
Fetches payment instructions and account info from Firebase

```typescript
// Returns object with:
{
  instructions: "How to send payment...",
  accountInfo: [
    { name: "Account Info", value: "details..." }
  ]
}
```

**Usage**: Show payment method details during step 1

---

### `handleMethodSelect(methodId: PaymentMethod)`
Selects a payment method

```typescript
// Actions:
1. setMethod(methodId) - Update selected method
2. setExpandedMethod(methodId) - Expand details accordion
3. Clear previous errors
```

**Trigger**: Click on payment method card

---

### `handleContinueToStep2()`
Validates method selection and advances to step 2

```typescript
// Validation:
if (!method) {
  setError('Please select a payment method')
  return
}
// Success:
setCurrentStep(2)
```

**Trigger**: "Continue to Verification" button

---

### `copyToClipboard(text: string, fieldName: string)`
Copies account info to clipboard with feedback

```typescript
// Actions:
1. navigator.clipboard.writeText(text)
2. Show "✓ Copied" for 2 seconds
3. Revert to "📋 Copy"
```

**Trigger**: Copy button on account information

---

### `handleFileChange(e: React.ChangeEvent<HTMLInputElement>)`
Handles screenshot upload

```typescript
// Actions:
1. Extract file from input
2. Store in screenshot state
3. Clear error messages
```

**Trigger**: File input change event

---

### `handleSubmit(e: React.FormEvent)`
Submits payment with verification

```typescript
// Flow:
1. Validate all required fields
2. Show loading state (1 second)
3. Show verification loader (2 seconds)
4. Upload file to Supabase
5. Create order in Firebase
6. Show success receipt
7. Cleanup states
```

**Trigger**: Submit button click

---

## Component Structure

### Step 1: Payment Method Selection
```jsx
<div className="space-y-6">
  {/* Section Title */}
  <h2>Choose Secure Payment Method</h2>
  <p>Select your preferred method...</p>
  
  {/* Method Cards Grid */}
  <Card>
    <div className="grid grid-cols-5 gap-4">
      {paymentMethods.map(method => (
        <button onClick={() => handleMethodSelect(method.id)}>
          {/* Glow effect for discounted methods */}
          {method.isDiscounted && <div className="animate-pulse" />}
          {/* Badge, icon, name */}
        </button>
      ))}
    </div>
  </Card>
  
  {/* Method Details (if selected) */}
  {method && (
    <>
      {/* Instructions Card */}
      {/* Account Info Card */}
      {/* Savings Info (if special) */}
    </>
  )}
  
  {/* Trust Boosters */}
  <div className="grid grid-cols-4 gap-3">
    {/* 4 trust badges */}
  </div>
  
  {/* Continue Button */}
</div>
```

### Step 2: Payment Details & Upload
```jsx
<div className="space-y-6">
  {/* Verification Loader (overlay) */}
  {verifying && (
    <div className="fixed inset-0 bg-black/50">
      {/* Animated spinner */}
    </div>
  )}
  
  {/* Step Indicator */}
  
  {/* Back Button */}
  
  {/* Selected Method Display */}
  
  {/* Method-Specific Form Fields */}
  <Card>
    {getMethodFields(method).map(field => (
      <input|select {...field} value={formData[field.key]} />
    ))}
  </Card>
  
  {/* Upload Area */}
  <Card>
    <label>
      <div className="border-dashed">
        {screenshot ? <p>✅ filename</p> : <p>📤 Drag & Drop</p>}
      </div>
      <input type="file" onChange={handleFileChange} />
    </label>
  </Card>
  
  {/* Order Summary */}
  <Card>
    {/* Price breakdown */}
    {isSpecialPayment && <DiscountBreakdown />}
  </Card>
  
  {/* Submit Button */}
  <form onSubmit={handleSubmit}>
    <Button type="submit" disabled={!canSubmit}>
      {getDynamicButtonText(method)}
    </Button>
  </form>
</div>
```

### Success Receipt
```jsx
{success && receipt && (
  <Card className="border-emerald-200">
    {/* Close button */}
    
    {/* Receipt header with checkmark */}
    <p className="text-5xl">✅</p>
    <h3>Payment Successful!</h3>
    
    {/* Order details */}
    <div>
      <p>Order ID: {receipt.orderId}</p>
      <p>User: {user?.name}</p>
      <p>Plan: {plan?.name}</p>
      <p>Total: ${finalPrice}</p>
      <p>Transaction ID: {receipt.transactionId}</p>
    </div>
    
    {/* Action buttons */}
    <Button onClick={() => window.print()}>📥 Download</Button>
    <Button onClick={() => navigator.share(...)}>📤 Share</Button>
  </Card>
)}
```

---

## Styling Classes Used

### Glassmorphism
```jsx
<Card className="glass">
  {/* Applies: backdrop-blur-xl, bg-white/20, border, box-shadow */}
</Card>
```

### Animations
```jsx
// Pulsing badge
<div className="animate-pulse">SAVE 30%</div>

// Glow effect
<div className="animate-pulse bg-gradient-to-r from-red-500 to-orange-500" />

// Border pulse
<div className="animate-border-pulse" />

// Fade in
<div className="animate-in fade-in" />
```

### Responsive Grid
```jsx
// Payment methods
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

// Trust boosters
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
```

### States
```jsx
// Selected method
className={method === pm.id 
  ? 'ring-2 ring-red-500 bg-white dark:bg-slate-900 scale-105' 
  : 'bg-slate-50 dark:bg-slate-800'
}

// Form input focus
className="focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none"

// Disabled state
disabled={loading || verifying}
className="disabled:opacity-50"
```

---

## Firebase Integration

### Reading Configuration
```typescript
const configData = await getConfig();
// Returns: ConfigData with paymentMethods, plans, etc.

// Access specific method
const methodConfig = configData.paymentMethods.binance;
// Returns: { instructions, accountInfo }
```

### Creating Orders
```typescript
const order = await createOrder(user.id, {
  planId: planId,
  plan: plan?.name,
  originalPrice: originalPrice,
  salePrice: salePrice,
  finalPrice: finalPrice,
  paymentMethod: method,
  paymentProofPath: proofPath,
  paymentProof: proofUrl,
  transactionId: txId,
  formData: formData, // NEW: method-specific form data
  status: 'pending',
  date: new Date().toLocaleDateString(),
  user: user.name,
});
```

### Uploading Files
```typescript
const { path: proofPath, url: proofUrl } = await uploadPaymentProof(
  user.id,
  screenshot // File object from input
);
```

---

## Type Definitions

```typescript
type PaymentMethod = 'remitly' | 'binance' | 'paypal' | 'cashapp' | 'zelle';

interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  icon: string;
  isDiscounted: boolean;
  description: string;
}

interface FormField {
  label: string;
  type: 'text' | 'email' | 'select';
  key: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormData {
  senderName?: string;
  accountHolderName?: string;
  paypalEmail?: string;
  referenceNumber?: string;
  transferConfirmationId?: string;
  last4Digits?: string;
  walletNetwork?: string;
}
```

---

## Common Customizations

### Change Discount Percentage
```typescript
// Current: 30%
const extraDiscount = isSpecialPayment 
  ? Math.round((salePrice * 0.30) * 100) / 100
  : 0;

// To change to 25%:
const extraDiscount = isSpecialPayment 
  ? Math.round((salePrice * 0.25) * 100) / 100
  : 0;
```

### Add New Payment Method
```typescript
// 1. Update type
type PaymentMethod = 'remitly' | 'binance' | 'paypal' | 'cashapp' | 'zelle' | 'newmethod';

// 2. Add to paymentMethods array
{ id: 'newmethod', name: 'New Method', icon: '🆕', isDiscounted: false, ... }

// 3. Add case to getMethodFields()
if (methodId === 'newmethod') {
  fields.push(
    { label: 'Field 1', type: 'text', key: 'field1', ... }
  );
}

// 4. Add Firebase config entry
config.paymentMethods.newmethod = { instructions: "...", accountInfo: "..." }
```

### Change Colors
```jsx
// Emerald (success/selected) - #10b981
className="text-emerald-600 dark:text-emerald-400 border-emerald-500"

// Red (discount/urgency) - #ef4444
className="text-red-600 dark:text-red-400 border-red-500"

// Orange (accents) - #fed7aa
className="text-orange-600 dark:text-orange-400"
```

### Adjust Animation Speed
```typescript
// In globals.css
@keyframes pulseGlow {
  // Duration: change 3s to desired value
  animation: pulseGlow 3s ease-in-out infinite;
}

// Or in className
className="animate-pulse" // inherits 3s duration from Tailwind
```

---

## Error Handling

### Validation Errors
```typescript
if (!method) {
  setError('Please select a payment method');
  return;
}

if (!screenshot) {
  setError('Please upload a payment proof');
  return;
}

if (!txId) {
  setError('Please enter transaction ID');
  return;
}
```

### Firebase Errors
```typescript
try {
  // Firebase operations
} catch (err: any) {
  setError(err.message || 'Error processing payment');
  setVerifying(false);
} finally {
  setLoading(false);
}
```

### Display Errors
```jsx
{error && (
  <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700/50 rounded-lg text-red-700 dark:text-red-300 text-sm">
    {error}
  </div>
)}
```

---

## Testing Checklist

```javascript
// Unit Tests to Write
- getMethodFields() returns correct fields per method
- getPaymentMethodDetails() loads config correctly
- handleMethodSelect() updates state properly
- handleContinueToStep2() validates method selection
- copyToClipboard() works cross-browser
- handleFileChange() stores file correctly
- handleSubmit() validates all required fields
- Final price calculation is accurate
- Discount applied correctly for special methods

// Integration Tests
- Full flow from method selection to success
- Back button returns to method selection
- Form fields update based on selected method
- File upload shows correct filename
- Verification loader displays and clears
- Success receipt shows correct data

// Visual Tests
- Animations run smoothly (60fps)
- Responsive layout on mobile/tablet/desktop
- Dark mode styling looks correct
- Glowing effects visible on discount methods
- Trust badges appear properly
- All text is readable with good contrast
```

---

## Performance Tips

### Optimize Image Loading
```jsx
// Use Next.js Image for optimized loading
import Image from 'next/image';
<Image src="..." alt="..." />
```

### Memoize Components
```jsx
const MethodCard = React.memo(({ method, selected, onClick }) => (
  // Component code
));
```

### Lazy Load Heavy Sections
```jsx
const VerificationLoader = lazy(() => import('./VerificationLoader'));
<Suspense fallback={null}>
  {verifying && <VerificationLoader />}
</Suspense>
```

---

## Debugging Tips

### Console Logging
```typescript
// Log state changes
console.log('Method selected:', method);
console.log('Form data:', formData);
console.log('Final price:', finalPrice);

// Log Firebase operations
console.log('Config loaded:', config);
console.log('Order created:', order);
```

### Browser DevTools
- Check Network tab for Firebase calls
- Check Storage tab for localStorage (user, theme)
- Check Console for any errors
- Use Performance tab to analyze animations

### Common Issues
| Issue | Solution |
|-------|----------|
| Animations laggy | Check GPU acceleration, reduce blur effects |
| Form fields not showing | Verify method is selected, check getMethodFields() |
| Firebase config not loading | Check Firebase rules, verify auth |
| File upload fails | Check file size, accepted formats, Supabase config |
| Success receipt doesn't show | Check order creation response, verify user exists |

---

## Deployment Notes

1. **Environment Variables**: Ensure Firebase config in `.env.local`
2. **Supabase Setup**: Configure storage bucket for file uploads
3. **Firebase Rules**: Update Realtime Database rules for orders collection
4. **Build Check**: Run `npm run build` before deployment
5. **TypeScript**: No errors (`npm run build` validates)
6. **Testing**: Manually test full payment flow before production

---

Last Updated: April 17, 2026
Version: 1.0.0
