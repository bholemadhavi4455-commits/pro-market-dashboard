# 🔌 API Integration Setup Guide

## Overview

This guide will help you connect your PRO Market Dashboard to **real marketplace APIs** to fetch live, accurate product prices.

---

## 📋 Prerequisites

- ✅ Application already running (backend + frontend)
- ✅ Basic understanding of API keys
- ✅ Email addresses for API account registration
- ⏱️ Time required: 30-60 minutes for all APIs

---

## 🎯 Recommended APIs (For Indian Market)

### 1. **Flipkart Affiliate API** ⭐ RECOMMENDED
- **Best for:** Indian products with real INR prices
- **Cost:** FREE (commission-based)
- **Difficulty:** Easy
- **Coverage:** Electronics, Fashion, Home, Books, etc.

### 2. **Amazon Product Advertising API**
- **Best for:** Wide product selection
- **Cost:** FREE (requires Amazon Associates account)
- **Difficulty:** Medium (requires AWS signing)
- **Coverage:** Almost everything

### 3. **eBay Finding API**
- **Best for:** Comparison shopping
- **Cost:** FREE (with rate limits)
- **Difficulty:** Easy
- **Coverage:** Global marketplace

---

## 🚀 Step-by-Step Setup

### STEP 1: Setup Flipkart API (EASIEST - Start Here!)

#### 1.1 Create Flipkart Affiliate Account
```
1. Go to: https://affiliate.flipkart.com/
2. Click "Sign Up" or "Register"
3. Fill in your details:
   - Name
   - Email
   - Phone number
   - PAN card (for Indian users)
   - Bank details (for commission payouts)
4. Wait for approval (usually 24-48 hours)
```

#### 1.2 Get API Credentials
```
1. Login to Flipkart Affiliate dashboard
2. Go to: API > Get API Credentials
3. You'll receive:
   - Affiliate ID (Tracking ID)
   - Affiliate Token (API Token)
4. Copy these values
```

#### 1.3 Add to Your Application
```bash
# Open backend folder
cd "c:\Users\Admin\Desktop\PRO MARKET DASHBOARD\backend"

# Copy the example file
copy .env.example .env

# Edit .env file and add:
FLIPKART_AFFILIATE_ID=your_affiliate_id_here
FLIPKART_AFFILIATE_TOKEN=your_token_here
```

#### 1.4 Test Flipkart Integration
```bash
# Restart backend server
# It will automatically use Flipkart API if credentials are configured

# Test with:
curl "http://localhost:3000/api/search?q=laptop"
```

---

### STEP 2: Setup Amazon Product Advertising API

#### 2.1 Create Amazon Associates Account
```
1. Go to: https://affiliate-program.amazon.in/
2. Click "Join Now for Free"
3. Fill in:
   - Name and address
   - Website/mobile app details (you can use your GitHub repo)
   - Traffic and monetization details
4. Wait for approval
```

#### 2.2 Get Product Advertising API Access
```
1. Login to Amazon Associates Central
2. Go to: Tools > Product Advertising API
3. Request API access
4. Once approved, go to AWS Console:
   https://console.aws.amazon.com/iam/
5. Create IAM credentials for PA-API
6. Get:
   - Access Key
   - Secret Key
   - Partner Tag (from Associates Central)
```

#### 2.3 Install Required Package
```bash
cd backend
npm install amazon-paapi
```

#### 2.4 Add to Configuration
```bash
# Edit .env file:
AMAZON_ACCESS_KEY=your_access_key
AMAZON_SECRET_KEY=your_secret_key
AMAZON_PARTNER_TAG=your_partner_tag
AMAZON_REGION=in
```

---

### STEP 3: Setup eBay Finding API

#### 3.1 Create eBay Developer Account
```
1. Go to: https://developer.ebay.com/
2. Click "Register"
3. Create eBay account if you don't have one
4. Complete developer registration
```

#### 3.2 Get API Keys
```
1. Go to: https://developer.ebay.com/my/keys
2. Create a "Production Keyset"
3. Get:
   - App ID (Client ID)
   - Dev ID
   - Cert ID (Client Secret)
```

#### 3.3 Add to Configuration
```bash
# Edit .env file:
EBAY_APP_ID=your_app_id
EBAY_DEV_ID=your_dev_id
EBAY_CERT_ID=your_cert_id
EBAY_SITE_ID=203
```

---

## 🔧 Configuration File

Your `.env` file should look like this:

```env
# Server
PORT=3000
NODE_ENV=development

# Flipkart (Start with this!)
FLIPKART_AFFILIATE_ID=your_flipkart_affiliate_id
FLIPKART_AFFILIATE_TOKEN=your_flipkart_token

# Amazon
AMAZON_ACCESS_KEY=your_amazon_access_key
AMAZON_SECRET_KEY=your_amazon_secret_key
AMAZON_PARTNER_TAG=your_amazon_partner_tag
AMAZON_REGION=in

# eBay
EBAY_APP_ID=your_ebay_app_id
EBAY_CERT_ID=your_ebay_cert_id
EBAY_DEV_ID=your_ebay_dev_id
EBAY_SITE_ID=203

# Cache
CACHE_TTL_SECONDS=600
```

---

## ✅ Testing Your Setup

### Test Individual APIs

```bash
# Test if credentials are loaded
cd backend
npm run dev

# Check console output, should show:
# ✅ Flipkart API configured
# ✅ Amazon API configured
# ✅ eBay API configured
```

### Test Search with Real API

```bash
# Search for a real product
curl "http://localhost:3000/api/search?q=iphone"

# You should see real prices from configured APIs!
```

---

## 📊 What Happens After Setup

### Before (Mock Data):
```
Search "laptop"
→ Shows: Made-up prices (₹54,999)
→ Source: Fake data
```

### After (Real API):
```
Search "laptop"
→ Shows: Real current prices from Flipkart/Amazon
→ Source: Live API data
→ Updated: Real-time
```

---

## 🎯 Quick Start (Minimum Setup)

**If you want to start FAST, just do Flipkart:**

1. ✅ Sign up at https://affiliate.flipkart.com/
2. ✅ Get Affiliate ID and Token
3. ✅ Add to `.env` file
4. ✅ Restart backend
5. ✅ **DONE!** You now have real Indian market prices!

---

## ⚠️ Important Notes

### Rate Limits
- **Flipkart**: 1000 requests/day (free tier)
- **Amazon**: Varies by account type
- **eBay**: 5000 calls/day (free tier)

### Caching
- The app caches results for 10 minutes
- Reduces API calls
- Saves your quota

### Error Handling
- If API fails → Falls back to mock data
- No API credentials → Uses mock data
- Partial failures → Shows available data

### Legal/Terms
- ✅ Read each API's Terms of Service
- ✅ Comply with usage guidelines
- ✅ Display required attributions
- ✅ Don't violate rate limits

---

## 🆘 Troubleshooting

### "API credentials not configured"
→ Check your `.env` file exists
→ Verify credentials are correct
→ Restart backend server

### "Request timeout"
→ Check internet connection
→ Verify API endpoints are accessible
→ Try increasing timeout in adapter

### "Invalid API key"
→ Double-check credentials in `.env`
→ Ensure no extra spaces
→ Verify API account is approved

### "Rate limit exceeded"
→ You've hit the daily quota
→ Wait 24 hours or upgrade plan
→ Check cache is working properly

---

## 📚 Additional Resources

### Documentation Links:
- **Flipkart API Docs**: https://affiliate.flipkart.com/api-docs
- **Amazon PA-API 5.0**: https://webservices.amazon.com/paapi5/documentation/
- **eBay Finding API**: https://developer.ebay.com/devzone/finding/

### Support:
- Flipkart: support@affiliate.flipkart.com
- Amazon: Product Advertising API Forum
- eBay: eBay Developer Forums

---

## 🎉 Success Indicators

✅ Console shows "API configured" messages
✅ Search returns real product names
✅ Prices match actual marketplace prices
✅ Product images load (if available)
✅ Multiple sources show different prices
✅ Reviews are marketplace-specific

---

## 🚀 Next Steps After Setup

1. **Test thoroughly** - Search different products
2. **Monitor usage** - Check API quotas
3. **Optimize caching** - Reduce API calls
4. **Add more sources** - Integrate additional marketplaces
5. **Deploy** - Host on a server for 24/7 availability

---

**Need help? The application is designed to work with OR without API keys. Start with mock data, add real APIs when ready!**

