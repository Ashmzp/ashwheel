# 🚀 Complete Deployment Guide - Ashwheel (After Code Fixes)

## ✅ Good News: Kuch Delete Karne Ki Zarurat NAHI Hai!

Coolify automatically latest code GitHub se pull kar lega. Bas redeploy karna hai.

---

## 📍 Current Situation:

- ✅ Code fixes GitHub par push ho gaye hain
- ✅ Environment variables use kar rahe hain
- ✅ Hardcoded credentials remove ho gaye
- ⚠️ VPS par purana code chal raha hai (agar deployed hai)

---

## 🎯 Complete Deployment Steps (Order Mein Follow Karo)

### **Step 1: Deploy Supabase in Coolify** ⭐

#### 1.1 Login to Coolify
```
URL: http://31.97.235.213:8000
```

#### 1.2 Create Supabase Service
1. Click **"+ New Resource"**
2. Select **"Service"**
3. Search **"Supabase"**
4. Click on Supabase template

#### 1.3 Configure Supabase
- **Name:** supabase
- **Domain:** `supabase.ashwheel.cloud`
- **SSL:** ✅ Enable (Caddy automatic)

#### 1.4 Deploy
1. Click **"Deploy"**
2. Wait 5-10 minutes ⏰
3. Check logs for completion

#### 1.5 Get Credentials
1. Go to **Supabase service** in Coolify
2. Click **"Environment Variables"** tab
3. **Copy these values:**
   - `ANON_KEY` (Important!)
   - `SERVICE_ROLE_KEY` (Optional)
   - `POSTGRES_PASSWORD` (For database access)

**Save these somewhere safe!** 📝

---

### **Step 2: Import Database** 📊

#### 2.1 Access Supabase Studio
```
URL: https://supabase.ashwheel.cloud
Login: Use credentials from Coolify
```

#### 2.2 Go to SQL Editor
1. Click **"SQL Editor"** in left sidebar
2. Click **"New Query"**

#### 2.3 Import schema.sql
1. Open `dump/schema.sql` in text editor
2. Copy **ALL** content (Ctrl+A, Ctrl+C)
3. Paste in SQL Editor
4. Click **"Run"**
5. Wait 1-2 minutes ⏰

✅ Success: "Success. No rows returned"

#### 2.4 Import roles.sql
1. Open `dump/roles.sql` in text editor
2. Copy **ALL** content
3. Paste in SQL Editor
4. Click **"Run"**

✅ Success: Roles created

#### 2.5 Import data.sql (Optional)
1. Open `dump/data.sql` in text editor (if you have data)
2. Copy **ALL** content
3. Paste in SQL Editor
4. Click **"Run"**

#### 2.6 Verify
1. Go to **"Table Editor"**
2. Check if tables visible:
   - users
   - customers
   - purchases
   - vehicle_invoices
   - job_cards
   - stock
   - etc.

---

### **Step 3: Deploy/Update Ashwheel App** 🚀

#### **Scenario A: Agar Pehle Se Deployed Hai (Update)**

1. **Go to Coolify Dashboard**
   ```
   http://31.97.235.213:8000
   ```

2. **Find Ashwheel Application**
   - Click on your Ashwheel app

3. **Update Environment Variables**
   - Go to **"Environment Variables"** tab
   - Update or Add:
     ```
     VITE_SUPABASE_URL=https://supabase.ashwheel.cloud
     VITE_SUPABASE_ANON_KEY=<PASTE_FROM_STEP_1.5>
     ```
   - Click **"Save"**

4. **Redeploy**
   - Click **"Redeploy"** or **"Deploy"** button
   - Coolify will:
     - Pull latest code from GitHub ✅
     - Build with new environment variables ✅
     - Deploy automatically ✅
   - Wait 3-5 minutes ⏰

5. **Check Logs**
   - Click **"Logs"** tab
   - Verify build successful

#### **Scenario B: Agar Pehli Baar Deploy Kar Rahe Ho (Fresh)**

1. **Go to Coolify Dashboard**
   ```
   http://31.97.235.213:8000
   ```

2. **Create New Application**
   - Click **"+ New Resource"**
   - Select **"Application"**
   - Choose **"Private Repository"**

3. **Configure Repository**
   - **Name:** ashwheel
   - **Repository URL:** `https://github.com/Ashmzp/ashwheel.git`
   - **Branch:** `main`
   - **Build Pack:** Dockerfile

4. **Configure Build**
   - **Port:** `80`
   - **Publish Directory:** (leave empty)

5. **Set Domain**
   - **Domain:** `ashwheel.cloud`
   - **SSL:** ✅ Enable

6. **Add Environment Variables**
   - Click **"Environment Variables"**
   - Add:
     ```
     VITE_SUPABASE_URL=https://supabase.ashwheel.cloud
     VITE_SUPABASE_ANON_KEY=<PASTE_FROM_STEP_1.5>
     ```
   - Click **"Save"**

7. **Deploy**
   - Click **"Deploy"** button
   - Wait 3-5 minutes ⏰

---

### **Step 4: Verify Deployment** ✅

#### 4.1 Check Supabase
```bash
curl https://supabase.ashwheel.cloud/rest/v1/
```
✅ Should return JSON response

#### 4.2 Check Ashwheel App
```bash
curl https://ashwheel.cloud
```
✅ Should return HTML

#### 4.3 Test in Browser
1. Open `https://ashwheel.cloud`
2. Try to **Signup** (create new account)
3. Try to **Login**
4. Check if dashboard loads
5. Try creating a customer/invoice

---

## 🔧 Troubleshooting

### Issue 1: Build Failed in Coolify

**Check:**
1. Coolify logs mein error dekho
2. Environment variables sahi set hain?
3. GitHub repo accessible hai?

**Fix:**
```
Coolify → Ashwheel App → Logs
Error dekho aur fix karo
```

### Issue 2: App Load Nahi Ho Raha

**Check:**
1. Domain DNS propagated hai? (5-10 min wait karo)
2. SSL certificate generated hai?
3. Container running hai?

**Fix:**
```bash
# DNS check
nslookup ashwheel.cloud
# Should show: 31.97.235.213

# Container check (Coolify UI mein)
Coolify → Ashwheel App → Status
```

### Issue 3: Login/Signup Nahi Ho Raha

**Check:**
1. Browser console (F12) mein error dekho
2. Supabase URL sahi hai?
3. ANON_KEY sahi hai?

**Fix:**
```
1. F12 → Console → Error dekho
2. Coolify → Ashwheel App → Environment Variables
3. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### Issue 4: Database Connection Error

**Check:**
1. Supabase running hai?
2. Database tables imported hain?

**Fix:**
```
1. Coolify → Supabase → Status (should be running)
2. Supabase Studio → Table Editor → Verify tables
```

---

## 📋 Complete Checklist

### Pre-Deployment
- [x] Code fixes pushed to GitHub
- [x] customSupabaseClient.js uses env vars
- [x] .gitignore fixed
- [x] Google Analytics removed

### Supabase Setup
- [ ] Supabase deployed in Coolify
- [ ] Domain `supabase.ashwheel.cloud` set
- [ ] SSL enabled
- [ ] ANON_KEY copied
- [ ] Database schema imported
- [ ] Database roles imported
- [ ] Tables visible in Table Editor

### Ashwheel Deployment
- [ ] Ashwheel app created/updated in Coolify
- [ ] Environment variables set
- [ ] Domain `ashwheel.cloud` set
- [ ] SSL enabled
- [ ] Deployed successfully
- [ ] Build logs checked

### Testing
- [ ] https://supabase.ashwheel.cloud accessible
- [ ] https://ashwheel.cloud accessible
- [ ] Signup working
- [ ] Login working
- [ ] Dashboard loading
- [ ] Data saving to database

---

## 🎯 Quick Commands Reference

### Check DNS
```bash
nslookup ashwheel.cloud
nslookup supabase.ashwheel.cloud
```

### Test Supabase API
```bash
curl https://supabase.ashwheel.cloud/rest/v1/
```

### Test Ashwheel App
```bash
curl https://ashwheel.cloud
```

### Check Coolify Logs
```
Coolify UI → Your App → Logs tab
```

---

## ⚡ Important Notes

1. **Kuch Delete Mat Karo:** Coolify automatically latest code pull karega
2. **Environment Variables:** Production mein Coolify UI se set karo
3. **DNS Propagation:** 5-10 minutes lag sakte hain
4. **SSL Certificate:** Caddy automatically generate karega
5. **Database Backup:** Pehle backup le lo (optional)

---

## 🚀 Deployment Time Estimate

| Step | Time |
|------|------|
| Supabase Deploy | 5-10 min |
| Database Import | 2-3 min |
| Ashwheel Deploy | 3-5 min |
| DNS Propagation | 5-10 min |
| **Total** | **15-30 min** |

---

## 📞 Support

Agar koi issue aaye:
1. Coolify logs check karo
2. Browser console (F12) check karo
3. Network tab mein API calls check karo

---

**🎉 Ready to Deploy! Follow steps in order.**

**Key Point:** Purana code delete karne ki zarurat NAHI hai. Coolify automatically update kar dega! 🚀
