# Refund Policy for Presale System

## ✅ What Happens Automatically

When presales fail (time expires without meeting target orders), the system will **automatically**:

1. **📧 Send notification emails** to creators and buyers
2. **🔄 Cancel pending payment intents** (no money taken yet, so no refund needed)
3. **📊 Mark presale threshold as failed** in the database
4. **📋 Log details** for admin review

## ❌ What Does NOT Happen Automatically

The system will **NEVER automatically**:

1. **💰 Process refunds** for completed orders
2. **💳 Charge back payments** to customer cards
3. **🏦 Initiate bank transfers** or reversals

## 🔧 Manual Admin Actions Required

When presales fail, admins must **manually**:

1. **Review failed presales** in the admin dashboard
2. **Process refunds** through Stripe dashboard or API
3. **Verify refund amounts** and customer details
4. **Confirm refund completion** with customers if needed

## 📍 Where Refunds Are Disabled

### 1. Failed Presales (`handleFailedPresales()`)
- **File**: `src/lib/payment-service.ts` lines 667-849
- **Action**: Only sends emails and cancels pending orders
- **No refunds**: Completed orders are left as-is for manual processing

### 2. Failed Capture Attempts (`handleFinalCaptureAttempt()`)
- **File**: `src/lib/payment-service.ts` lines 1190-1225
- **Action**: Marks payments as "requires_manual_refund"
- **No refunds**: Admin must manually review and process

## 🚨 Admin Alerts

The system will log clear warnings when manual refunds are needed:

```
⚠️ Success rate 45.2% below 90%, marking for MANUAL refund processing...
🚨 ADMIN ACTION REQUIRED: Manual refunds needed for failed presale capture
💰 3 captured payments require manual refund review
🔍 Payment pi_1234567890: £26.00 - REQUIRES MANUAL REFUND
```

## 📊 Checking for Required Refunds

To find presales that need manual refund processing:

1. Check the logs for "REQUIRES MANUAL REFUND" messages
2. Query the database for `PresaleThreshold` records with status `failed`
3. Review the admin dashboard for failed presales

## 🔒 Security Note

This manual approach ensures:
- **Financial oversight** - All refunds require admin approval
- **Fraud prevention** - No automated money movements
- **Audit trail** - Clear record of all refund decisions
- **Error prevention** - Reduces risk of incorrect automatic refunds
