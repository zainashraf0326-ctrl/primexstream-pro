# 🚨 REAL-TIME FIX - STEP BY STEP

## YOU MUST DO THIS NOW TO SEE DATA

---

## ✅ STEP 1: UPDATE FIREBASE RULES (5 MINUTES)

### Go to Firebase Console:
**URL**: https://console.firebase.google.com

**Step 1a: Realtime Database Rules**
1. Select project: `top-chico-mart`
2. Left menu → **Realtime Database**
3. Click **Rules** tab (at top)
4. **Select ALL** the existing rules (Ctrl+A)
5. **DELETE** everything
6. Paste this exactly:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com')",
        ".write": "auth != null && (auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com')"
      }
    },
    "orders": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com')",
        ".write": "auth != null && (auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com')",
        "$orderId": {
          ".validate": "newData.hasChildren(['plan', 'amount', 'status'])"
        }
      }
    },
    "plans": {
      ".read": true,
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },
    ".read": false,
    ".write": false
  }
}
```

7. Click **PUBLISH** button (blue button bottom right)
8. Wait for "Rules updated successfully" message

---

### Step 1b: Firestore Rules
1. Left menu → **Firestore Database**
2. Click **Rules** tab
3. **Select ALL** and **DELETE**
4. Paste this exactly:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth.email == "zainashraf0326@gmail.com";
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read: if isAdmin() || isOwner(userId);
      allow create: if request.auth.uid == userId;
      allow update: if isAdmin() || isOwner(userId);
      
      match /notifications/{notificationId} {
        allow read: if isAdmin() || isOwner(userId);
        allow create: if request.auth != null;
        allow update, delete: if isAdmin() || isOwner(userId);
      }
    }

    match /referrals/{referralId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if isAdmin();
    }

    match /plans/{planId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **PUBLISH**
6. Wait for success message

---

## ✅ STEP 2: RESTART YOUR APP

In terminal:
```bash
npm run dev
```

You should see:
```
✓ Ready in XXX ms
- Local: http://localhost:3000
```

---

## ✅ STEP 3: TEST NOW

### Go to diagnostics page:
```
http://localhost:3000/diagnostics
```

**Check these:**
- ✅ Shows "✅ Logged in as..."?
- ✅ Shows users in Realtime DB?

---

### If users show, then PLACE A TEST ORDER:
1. Go to `/iptv`
2. Select any plan
3. Click "Proceed"
4. Go to `/payment`
5. Fill in ALL fields:
   - Payment Method: Bank Transfer
   - Transaction ID: TEST123
   - Add a screenshot (any image)
6. Click "Submit Order"
7. Should see ✅ "Order submitted successfully"

---

### After placing order, GO TO:

1. **`http://localhost:3000/diagnostics`**
   - Should now show your order under "Realtime DB - Orders"

2. **`http://localhost:3000/orders`**
   - Should see your pending order

3. **`http://localhost:3000/admin`**
   - Login with: `zainashraf0326@gmail.com` (password: anything)
   - Should see your order in orders list
   - Should see the user in users list
   - Should see stats: Total Orders: 1

---

## 🔧 IF STILL NOT WORKING

### Check browser console:
1. Open browser DevTools: **F12**
2. Go to **Console** tab
3. Look for **RED ERRORS**
4. Copy the error and tell me

### Check Firebase Console:
1. Go to **Realtime Database** → **Data** tab
2. You should see structure like:
```
├── users/
│   └── (user IDs with email, name)
└── orders/
    └── (user ID)/
        └── (order IDs)
```

3. Go to **Firestore** → **Data** tab
2. You should see:
```
├── users/
│   └── (user ID)/
│       └── notifications/
└── plans/
```

---

## 📋 CHECKLIST

After applying rules and restarting:

- [ ] App starts without errors
- [ ] Diagnostics page loads
- [ ] Shows you as logged in
- [ ] Shows at least 1 user
- [ ] Can place an order
- [ ] Order appears in /orders
- [ ] Order appears in /admin
- [ ] Admin stats show numbers (not 0)
- [ ] Can see notifications

---

## ⚠️ COMMON PROBLEMS

**Problem: "Permission denied" in console**
- Solution: You didn't publish the rules correctly
- Fix: Go back to Firebase, click Publish again

**Problem: No users showing**
- Solution: You haven't logged in yet
- Fix: Go to home page, login with any email

**Problem: Order doesn't appear**
- Solution: Rules not published yet
- Fix: Check Firebase Console, see if rules are updated

**Problem: Admin panel still shows nothing**
- Solution: Admin email not matching
- Fix: Use email `zainashraf0326@gmail.com` exactly

---

## 📱 WHAT SHOULD HAPPEN NOW

✅ **When you login:**
- Your user is created in Realtime DB
- Your user is created in Firestore
- You see welcome on dashboard

✅ **When you place an order:**
- Order saved to Realtime DB at `orders/{yourUID}/{orderId}`
- Notification sent to Firestore at `users/{yourUID}/notifications`
- Admin notified

✅ **When you go to /orders:**
- Page fetches orders from Realtime DB
- Shows your pending order with status

✅ **When admin logs in:**
- Admin fetches all orders from Realtime DB
- Admin fetches all users
- Shows stats and lists

✅ **When you get notification:**
- Notification appears in bell icon
- Shows as unread
- Can mark as read/delete

---

## 🆘 IF RULES UPDATE FAILS

If you see error in Firebase Console:

1. Copy the error message
2. Check the rule syntax
3. Make sure you copied exactly
4. Try clicking **Publish** again

---

## 📞 AFTER YOU COMPLETE THIS

Tell me:
1. ✅ Rules published successfully?
2. ✅ App restarted?
3. ✅ Diagnostics page shows users?
4. ✅ Can place order?
5. ✅ Order appears in /orders?
6. ✅ Admin panel shows data?

Then I'll help with any remaining issues!

---

**This is the ACTUAL fix - do this NOW and report back!**
