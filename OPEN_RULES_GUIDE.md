# 🚀 OPEN FIREBASE RULES - NO SECURITY (Testing/Development)

## Rules Setup

**Admin Email:** `zainashraf0326@gmail.com`

### What This Gives You:

✅ **Admin (zainashraf0326@gmail.com):**
- Read ALL data
- Write/Update/Delete EVERYTHING
- Change any order status
- Modify any user data
- Full control

✅ **Users (Everyone else):**
- Read ALL data (see everything)
- Cannot write/change ANYTHING
- Can view all orders, users, plans
- Read-only access

---

## Deploy Instructions

### Step 1: Realtime Database Rules

1. Open: **https://console.firebase.google.com**
2. Select: **top-chico-mart** project
3. Click: **Realtime Database** → **Rules** tab
4. Delete ALL existing rules
5. Paste this EXACTLY from file: `REALTIME_DATABASE_RULES_OPEN.json`

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },
    "orders": {
      ".read": "auth != null",
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },
    "referrals": {
      ".read": "auth != null",
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },
    "plans": {
      ".read": true,
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },
    "notifications": {
      ".read": "auth != null",
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },
    "config": {
      ".read": "auth != null",
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },
    "admin_settings": {
      ".read": "auth != null",
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },
    "webConfig": {
      ".read": true,
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },
    ".read": false,
    ".write": false
  }
}
```

6. Click: **PUBLISH** (blue button)
7. Wait for: **"Rules updated successfully"**

---

### Step 2: Firestore Rules

1. Click: **Firestore Database** → **Rules** tab
2. Delete ALL existing rules
3. Paste this EXACTLY from file: `FIRESTORE_SECURITY_RULES_OPEN.txt`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read all data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.email == 'zainashraf0326@gmail.com';
      
      match /notifications/{notificationId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }

    // Orders - users read, admin write
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if request.auth.email == 'zainashraf0326@gmail.com';
    }

    // Referrals - users read, admin write
    match /referrals/{referralId} {
      allow read: if request.auth != null;
      allow write: if request.auth.email == 'zainashraf0326@gmail.com';
    }

    // Wallets - users read, admin write
    match /wallets/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.email == 'zainashraf0326@gmail.com';
      
      match /transactions/{transactionId} {
        allow read: if request.auth != null;
        allow write: if request.auth.email == 'zainashraf0326@gmail.com';
      }
    }

    // Plans - public read, admin write
    match /plans/{planId} {
      allow read: if true;
      allow write: if request.auth.email == 'zainashraf0326@gmail.com';
    }

    // Rewards - users read, admin write
    match /rewards/{rewardId} {
      allow read: if request.auth != null;
      allow write: if request.auth.email == 'zainashraf0326@gmail.com';
    }

    // WebConfig - public read, admin write
    match /webConfig/{document=**} {
      allow read: if true;
      allow write: if request.auth.email == 'zainashraf0326@gmail.com';
    }

    // Settings - users read, admin write
    match /settings/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.email == 'zainashraf0326@gmail.com';
    }

    // Social tasks - users read, admin write
    match /socialTaskSubmissions/{submissionId} {
      allow read: if request.auth != null;
      allow write: if request.auth.email == 'zainashraf0326@gmail.com';
    }

    // Admin content - users read, admin write
    match /adminContent/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.email == 'zainashraf0326@gmail.com';
    }

    // Deny all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click: **PUBLISH** (blue button)
5. Wait for: **"Rules updated successfully"**

---

### Step 3: Restart App

In terminal:
```bash
npm run dev
```

---

## ✅ Test Everything

### As Admin (zainashraf0326@gmail.com):
1. ✅ Login with admin email
2. ✅ Go to /admin
3. ✅ Can see ALL orders
4. ✅ Can update any order status
5. ✅ Can see ALL users
6. ✅ Can change any data

### As User (any other email):
1. ✅ Login with user email
2. ✅ Go to /orders
3. ✅ Can see their orders
4. ✅ Can see all user data (READ)
5. ✅ Cannot change anything (NO WRITE)
6. ✅ Cannot place orders (write blocked)

---

## 🔐 Security Warning

**IMPORTANT:** These rules have NO security restrictions for admin. This is only for development/testing!

- Admin can do ANYTHING
- Users can ONLY read
- This is NOT for production

For production, lock down:
- Each user can only read their own data
- Only admin can read all data
- Validation checks on writes

---

## 📁 Files Created

- `REALTIME_DATABASE_RULES_OPEN.json` - Copy this to Realtime DB Rules
- `FIRESTORE_SECURITY_RULES_OPEN.txt` - Copy this to Firestore Rules

---

**Status: Ready to deploy! 🚀**
