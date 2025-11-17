# 📱 Phone Authentication Setup Guide

## ✅ Frontend Changes - DONE!
Phone authentication with OTP verification has been added to SignupPage.jsx

## 🔧 Supabase SMS Provider Setup Required

### Option 1: Twilio (Recommended)

1. **Create Twilio Account**
   - Go to https://www.twilio.com/
   - Sign up and verify your account
   - Get a phone number

2. **Get Credentials**
   - Account SID
   - Auth Token
   - Phone Number

3. **Add to Coolify Supabase Environment Variables:**
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Enable Phone Auth in Supabase Dashboard:**
   - Go to: https://supabase.ashwheel.cloud
   - Authentication → Providers → Phone
   - Enable Phone provider
   - Select Twilio
   - Enter credentials
   - Save

### Option 2: MessageBird

1. **Create MessageBird Account**
   - Go to https://messagebird.com/
   - Sign up and get API key

2. **Add to Coolify:**
   ```env
   MESSAGEBIRD_API_KEY=your_api_key
   MESSAGEBIRD_ORIGINATOR=YourBrand
   ```

### Option 3: Vonage (Nexmo)

1. **Create Vonage Account**
   - Go to https://www.vonage.com/
   - Get API credentials

2. **Add to Coolify:**
   ```env
   VONAGE_API_KEY=your_api_key
   VONAGE_API_SECRET=your_api_secret
   VONAGE_FROM=YourBrand
   ```

### Option 4: Custom SMS Provider (Indian Services)

For Indian SMS services like MSG91, Fast2SMS, etc.:

1. **Get API credentials from your provider**

2. **Create Edge Function in Supabase:**
   ```sql
   -- Enable phone auth in Supabase
   -- Then configure webhook to your SMS provider
   ```

## 🧪 Testing

### Test Mode (Development)
Supabase provides test phone numbers for development:
- Phone: `+1234567890`
- OTP: `123456`

Enable test mode in Supabase Dashboard:
- Authentication → Settings → Phone Auth
- Enable "Test OTP"

## 📋 Features Added

✅ Email/Phone tabs in signup
✅ Phone number validation (with country code)
✅ OTP sending
✅ OTP verification (6-digit)
✅ Change phone number option
✅ User-friendly error messages
✅ Loading states

## 🔐 Security Notes

- Phone numbers stored with country code
- OTP expires in 60 seconds (Supabase default)
- Rate limiting enabled (prevent spam)
- Phone verification required before access

## 💰 Cost Estimate (Twilio)

- Free Trial: $15 credit
- SMS Cost: ~$0.0075 per SMS (India)
- ~2000 SMS with free credit

## 🚀 Next Steps

1. Choose SMS provider (Twilio recommended)
2. Add credentials to Coolify
3. Enable Phone Auth in Supabase Dashboard
4. Test signup with phone number
5. Monitor SMS delivery

## 📞 Support

If you face issues:
1. Check Supabase logs in Coolify
2. Verify SMS provider credentials
3. Check phone number format (+91XXXXXXXXXX)
4. Ensure SMS provider has credits

---

**Made with ❤️ for Ashwheel**
