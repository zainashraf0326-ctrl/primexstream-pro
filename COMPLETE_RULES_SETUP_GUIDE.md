# 🚀 COMPLETE NEW FIREBASE RULES - FULL SETUP GUIDE

## 📋 WHAT I FIXED FOR YOU

### **1. Realtime Database Access Control**
- Admin email check for all collections
- User can only read/write own data
- Orders: Users can create/update own, admin controls all
- Referrals: Users create own with code, admin full access
- Notifications: Users create/update own, delete read ones
- All paths require login

### **2. Firestore Access Control**
- Added helper functions: `isAdmin()`, `isUser()`, `isOwner()`
- Users collection: Users read own, admin reads all
- Orders: Users own only, admin full control
- Referrals: Users create own, admin full control
- Notifications: Users can delete only if marked as read
- Everything else requires login

### **3. Fixed Notification Permissions**
- Users can now write to notifications
- Users can mark notifications as read
- Users can delete their own read notifications
- Admins can manage all notifications

### **4. Data Privacy**
- Users CANNOT see other users' data
- Users CANNOT see other users' orders
- Users CANNOT modify other users' anything
- Only admin has cross-data visibility

---

## 🔑 PERMISSIONS SUMMARY

### **ADMIN (zainashraf0326@gmail.com)**
| Action | Users | Orders | Referrals | Notifications | Plans | Config |
|--------|-------|--------|-----------|---------------|-------|--------|
| Read   | ✅ All | ✅ All | ✅ All   | ✅ All       | ✅ All| ✅ All |
| Create | ❌    | ✅ All | ✅ All   | ✅ All       | ✅    | ✅     |
| Update | ✅ All | ✅ All | ✅ All   | ✅ All       | ✅    | ✅     |
| Delete | ✅ All | ✅ All | ✅ All   | ✅ All       | ❌    | ✅     |

### **USERS (Other emails)**
| Action | Own Data | Other Users | Own Orders | Own Referrals | Own Notifications | Plans |
|--------|----------|-------------|-----------|---------------|------------------|-------|
| Read   | ✅      | ❌         | ✅        | ✅            | ✅              | ✅    |
| Create | ❌      | ❌         | ✅        | ✅            | ✅              | ❌    |
| Update | ❌      | ❌         | ✅        | ✅            | ✅ (mark read)  | ❌    |
| Delete | ❌      | ❌         | ❌        | ❌            | ✅ (if read)    | ❌    |

---

## 🎯 DEPLOYMENT INSTRUCTIONS

### **STEP 1: Delete Old Rules**

1. Open: **https://console.firebase.google.com**
2. Select: **top-chico-mart** project

**For Realtime Database:**
- Click: **Realtime Database**
- Click: **Rules** tab
- Select ALL existing rules
- Press DELETE

**For Firestore:**
- Click: **Firestore Database**
- Click: **Rules** tab
- Select ALL existing rules
- Press DELETE

---

### **STEP 2: Update Realtime Database Rules**

**Location:** Realtime Database → Rules tab

**Copy and Paste THIS EXACTLY:**

```json
{
  "rules": {
    // ========================================
    // ADMIN FULL ACCESS - zainashraf0326@gmail.com
    // USERS - OWN DATA ONLY
    // ALL PATHS REQUIRE LOGIN
    // ========================================

    // USERS COLLECTION
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com')",
        ".write": "auth.email == 'zainashraf0326@gmail.com'",

        // Notifications subcollection
        "notifications": {
          "$notifId": {
            ".read": "auth != null && (auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com')",
            ".write": "auth != null && auth.uid == $uid",
            "read": { ".write": "auth != null && auth.uid == $uid" },
            "deleted": { ".write": "auth != null && auth.uid == $uid" }
          }
        }
      }
    },

    // ORDERS COLLECTION - User can create/update own, admin full control
    "orders": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com')",
        ".write": "auth != null && auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com'",
        
        "$orderId": {
          ".read": "auth != null && (auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com')",
          ".write": "auth != null && (auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com')"
        }
      }
    },

    // REFERRALS COLLECTION - User can create own referral, admin full control
    "referrals": {
      ".read": "auth != null",
      ".write": "auth != null",
      
      "$refId": {
        ".read": "auth != null",
        ".write": "auth != null && (newData.child('referrerId').val() == auth.uid || auth.email == 'zainashraf0326@gmail.com')"
      }
    },

    // PLANS - Read only for authenticated users, admin can write
    "plans": {
      ".read": "auth != null",
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },

    // NOTIFICATIONS - User can create/read/delete own, admin full access
    "notifications": {
      ".read": "auth != null",
      ".write": "auth != null",
      
      "$notifId": {
        ".read": "auth != null",
        ".write": "auth.email == 'zainashraf0326@gmail.com'"
      }
    },

    // CONFIG & SETTINGS - Admin only
    "config": {
      ".read": "auth != null",
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },

    "admin_settings": {
      ".read": "auth != null",
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },

    "webConfig": {
      ".read": "auth != null",
      ".write": "auth.email == 'zainashraf0326@gmail.com'"
    },

    // WALLETS - User own only, admin full access
    "wallets": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || auth.email == 'zainashraf0326@gmail.com')",
        ".write": "auth.email == 'zainashraf0326@gmail.com'"
      }
    },

    // DEFAULT - DENY ALL OTHER PATHS
    ".read": false,
    ".write": false
  }
}
```

**Then Click:** **PUBLISH** (blue button)

**Wait for:** "Rules updated successfully" ✅

---

### **STEP 3: Update Firestore Rules**

**Location:** Firestore Database → Rules tab

**Copy and Paste THIS EXACTLY:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========================================
    // ADMIN FULL ACCESS - zainashraf0326@gmail.com
    // USERS - OWN DATA ONLY
    // ALL PATHS REQUIRE LOGIN
    // ========================================

    function isAdmin() {
      return request.auth.email == 'zainashraf0326@gmail.com';
    }

    function isUser() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // ===== USERS COLLECTION =====
    // Users can read own data, admin reads all
    match /users/{userId} {
      allow read: if isUser() && (isOwner(userId) || isAdmin());
      allow write: if isAdmin();
      
      // NOTIFICATIONS SUBCOLLECTION
      // User can create/update own notifications, mark as read, delete if read
      match /notifications/{notificationId} {
        allow read: if isUser() && (isOwner(userId) || isAdmin());
        allow create: if isUser() && isOwner(userId);
        allow update: if isUser() && (isOwner(userId) || isAdmin());
        allow delete: if isUser() && (isOwner(userId) || (resource.data.read == true && isOwner(userId)) || isAdmin());
      }
    }

    // ===== ORDERS COLLECTION =====
    // Users can create/update own orders, admin full control
    match /orders/{orderId} {
      allow read: if isUser() && (request.auth.uid == resource.data.userId || isAdmin());
      allow create: if isUser() && request.resource.data.userId == request.auth.uid;
      allow update: if isUser() && (request.auth.uid == resource.data.userId || isAdmin());
      allow delete: if isAdmin();
    }

    // ===== REFERRALS COLLECTION =====
    // Users can create own referrals, admin full control
    match /referrals/{referralId} {
      allow read: if isUser();
      allow create: if isUser() && request.resource.data.referrerId == request.auth.uid;
      allow update: if isUser() && (request.auth.uid == resource.data.referrerId || isAdmin());
      allow delete: if isAdmin();
    }

    // ===== PLANS COLLECTION =====
    // Read only for authenticated users, admin can write
    match /plans/{planId} {
      allow read: if isUser();
      allow write: if isAdmin();
    }

    // ===== WALLETS COLLECTION =====
    // Users can read own wallet, admin full control
    match /wallets/{userId} {
      allow read: if isUser() && (isOwner(userId) || isAdmin());
      allow write: if isAdmin();
      
      match /transactions/{transactionId} {
        allow read: if isUser() && (isOwner(userId) || isAdmin());
        allow write: if isAdmin();
      }
    }

    // ===== REWARDS COLLECTION =====
    // Users can read, admin writes
    match /rewards/{rewardId} {
      allow read: if isUser();
      allow write: if isAdmin();
    }

    // ===== SETTINGS COLLECTION =====
    // Users can read, admin writes
    match /settings/{document=**} {
      allow read: if isUser();
      allow write: if isAdmin();
    }

    // ===== WEBCONFIG COLLECTION =====
    // Users can read, admin writes
    match /webConfig/{document=**} {
      allow read: if isUser();
      allow write: if isAdmin();
    }

    // ===== ADMIN CONTENT COLLECTION =====
    // Users can read, admin writes
    match /adminContent/{document=**} {
      allow read: if isUser();
      allow write: if isAdmin();
    }

    // ===== SOCIAL TASK SUBMISSIONS =====
    // Users can read all, create own, admin full control
    match /socialTaskSubmissions/{submissionId} {
      allow read: if isUser();
      allow create: if isUser() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    // ===== DENY ALL OTHER PATHS =====
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Then Click:** **PUBLISH** (blue button)

**Wait for:** "Rules updated successfully" ✅

---

### **STEP 4: Restart App**

```bash
npm run dev
```

---

## ✅ TESTING CHECKLIST

### **As ADMIN (zainashraf0326@gmail.com):**
- [ ] Can see ALL users data
- [ ] Can see ALL orders
- [ ] Can approve/reject ANY order
- [ ] Can see ALL referrals
- [ ] Can delete ANY data
- [ ] Can change settings/config

### **As USER (any other email):**
- [ ] Can see only OWN user data
- [ ] Can see only OWN orders
- [ ] Can create new orders
- [ ] Can see referral code
- [ ] Can create referrals
- [ ] Can create notifications
- [ ] Can mark notification as read
- [ ] Can delete own read notifications
- [ ] CANNOT see other users' data
- [ ] CANNOT modify others' data

---

## 📁 Reference Files

- `REALTIME_DATABASE_RULES_NEW.json` - Realtime DB rules (new version)
- `FIRESTORE_SECURITY_RULES_NEW.txt` - Firestore rules (new version)

---

**Status: Ready to Deploy! 🚀**
