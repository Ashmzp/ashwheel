# 🔒 Ashwheel Security Guide

## ✅ Security Fixes Applied

### 1. Environment Variables
- Admin credentials moved to `.env` file
- Never commit `.env` to Git
- Use different credentials for production

### 2. XSS Protection
- Created `src/utils/sanitize.js` for input sanitization
- Use `sanitizeHTML()` before rendering user input
- Use `escapeHTML()` for text content

### 3. CSRF Protection
- Created `src/utils/csrf.js` for CSRF tokens
- Add CSRF tokens to all forms
- Validate tokens on backend

---

## 🛡️ How to Use Security Utils

### Sanitize User Input (XSS Prevention)

```javascript
import { sanitizeHTML, escapeHTML } from '@/utils/sanitize';

// Before rendering HTML
const safeHTML = sanitizeHTML(userInput);

// For text content
const safeText = escapeHTML(userInput);
```

### Add CSRF Protection

```javascript
import { getCSRFToken, addCSRFToHeaders } from '@/utils/csrf';

// In forms
<input type="hidden" name="csrf_token" value={getCSRFToken()} />

// In API calls
const headers = addCSRFToHeaders({
  'Content-Type': 'application/json'
});
```

### Validate URLs (SSRF Prevention)

```javascript
import { sanitizeURL } from '@/utils/sanitize';

const safeURL = sanitizeURL(userProvidedURL);
if (safeURL) {
  // Safe to use
  fetch(safeURL);
}
```

### Validate File Paths (Path Traversal Prevention)

```javascript
import { isValidPath, sanitizeFilename } from '@/utils/sanitize';

if (isValidPath(filePath)) {
  const safeName = sanitizeFilename(filename);
  // Safe to use
}
```

---

## 🚨 Critical Security Checklist

### Before Deployment:

- [ ] Change admin password in `.env`
- [ ] Update Supabase credentials
- [ ] Enable RLS (Row Level Security) in Supabase
- [ ] Add rate limiting
- [ ] Enable HTTPS only
- [ ] Set secure headers
- [ ] Review all API endpoints
- [ ] Test authentication flows
- [ ] Scan for hardcoded secrets
- [ ] Update dependencies

### Supabase Security:

```sql
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only see their own data"
ON customers FOR SELECT
USING (auth.uid() = user_id);
```

---

## 🔐 Environment Variables Setup

### Development (`.env`)
```env
VITE_SUPABASE_URL=https://supabase.ashwheel.cloud
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_EMAIL=your-admin@email.com
VITE_ADMIN_PASSWORD=your-strong-password
```

### Production (Coolify)
1. Go to Coolify Dashboard
2. Select Ashwheel project
3. Environment Variables tab
4. Add all variables
5. **Never use same password as development**

---

## 📝 Security Best Practices

### 1. Input Validation
- Always validate user input
- Sanitize before storing
- Escape before rendering

### 2. Authentication
- Use strong passwords
- Implement 2FA (future)
- Session timeout
- Secure password reset

### 3. Authorization
- Check user permissions
- Implement RLS in Supabase
- Validate on backend

### 4. Data Protection
- Encrypt sensitive data
- Use HTTPS only
- Secure cookies
- No sensitive data in logs

### 5. API Security
- Rate limiting
- CORS configuration
- API key rotation
- Request validation

---

## 🐛 Common Vulnerabilities Fixed

| Vulnerability | Status | Fix Location |
|--------------|--------|--------------|
| Hardcoded Credentials | ✅ Fixed | `.env` + `AdminLogin.jsx` |
| XSS | ✅ Utils Created | `src/utils/sanitize.js` |
| CSRF | ✅ Utils Created | `src/utils/csrf.js` |
| SSRF | ⚠️ Needs Implementation | Use `sanitizeURL()` |
| Path Traversal | ⚠️ Needs Implementation | Use `isValidPath()` |

---

## 🔄 Next Steps

### Immediate (Do Now):
1. ✅ Admin credentials moved to `.env`
2. ⚠️ Apply sanitization in forms
3. ⚠️ Add CSRF tokens to forms
4. ⚠️ Enable Supabase RLS

### Short Term (This Week):
1. Review all file upload functions
2. Add rate limiting
3. Implement input validation
4. Test security fixes

### Long Term (This Month):
1. Security audit
2. Penetration testing
3. Add 2FA
4. Implement logging & monitoring

---

## 📞 Need Help?

If you need help implementing these fixes:
1. Check Code Issues Panel for specific issues
2. Use the security utils provided
3. Test in development first
4. Deploy to production after testing

---

**Remember:** Security is ongoing, not one-time!

**Last Updated:** $(date)
