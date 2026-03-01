# 🚀 GitHub Actions Setup Guide - Automated Crime Data Scraper

## What We've Built

A fully automated data pipeline that:
- ✅ Scrapes crime news every 30 minutes using GitHub Actions
- ✅ Automatically deduplicates entries (no duplicates in DB)
- ✅ Frontend polls for new data every 60 seconds
- ✅ Updates map in real-time when new crimes are added
- ✅ **100% FREE** - No infrastructure costs!

---

## 📁 Files Created

1. **`auto_scraper.py`** - Lightweight scraper for GitHub Actions
2. **`.github/workflows/scraper.yml`** - GitHub Actions workflow
3. **Updated `server.py`** - Added `/api/crime-data/new` endpoint
4. **Updated `App.jsx`** - Added real-time polling

---

## 🔧 Setup Instructions

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Add automated crime data scraper with GitHub Actions"

# Create repository on GitHub.com (via web interface)
# Then link and push:
git remote add origin https://github.com/YOUR_USERNAME/crimepulse.git
git branch -M main
git push -u origin main
```

### Step 2: Add MongoDB Secret to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secret:
   - **Name:** `MONGO_URI`
   - **Value:** Your MongoDB connection string (from `.env` file)
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/fir_data`
5. Click **Add secret**

### Step 3: Enable GitHub Actions

1. Go to **Actions** tab in your repository
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. You should see the workflow **"Auto Crime Data Scraper"**

### Step 4: Test the Workflow

#### Option A: Manual Trigger (Test First)
1. Go to **Actions** tab
2. Click **"Auto Crime Data Scraper"** workflow
3. Click **"Run workflow"** → **"Run workflow"** button
4. Wait 1-2 minutes
5. Click on the running job to see logs
6. Check MongoDB - new entries should appear!

#### Option B: Wait for Schedule
- Runs automatically every 30 minutes
- Check back later to see it working

---

## 📊 How It Works

### Backend Pipeline
```
Every 30 minutes:
  GitHub Actions triggers → 
  Runs auto_scraper.py → 
  Fetches RSS feeds (Times of India, Hindustan Times) → 
  Filters crime-related articles → 
  Checks if URL exists in DB (deduplication) → 
  Adds new crimes to MongoDB → 
  Logs results
```

### Frontend Updates
```
Every 60 seconds:
  React app polls /api/crime-data/new?since={timestamp} → 
  Gets only new records → 
  Updates crimeData state → 
  Updates map markers → 
  Refreshes stats panel
```

---

## 🎛️ Customization

### Change Scraping Frequency

Edit `.github/workflows/scraper.yml`:

```yaml
schedule:
  - cron: '*/15 * * * *'  # Every 15 minutes
  - cron: '0 * * * *'      # Every hour
  - cron: '0 */2 * * *'    # Every 2 hours
```

### Change Polling Frequency

Edit `src/App.jsx` line with `setInterval`:

```javascript
}, 30000)  // 30 seconds
}, 120000) // 2 minutes
```

### Add More News Sources

Edit `auto_scraper.py` and add new methods:

```python
def scrape_indian_express_rss(self):
    rss_url = 'https://indianexpress.com/section/cities/mumbai/feed/'
    # ... similar to existing scrapers
```

Then add to `run()` method:
```python
all_articles.extend(self.scrape_indian_express_rss())
```

---

## 🐛 Troubleshooting

### Workflow Not Running?

**Check:**
1. Go to **Actions** tab → Should see workflow listed
2. Check if Actions are enabled (Settings → Actions → Allow all actions)
3. Verify `MONGO_URI` secret is added correctly

### No New Data Appearing?

**Debug:**
1. Check GitHub Actions logs (Actions tab → Latest run → Click job)
2. Look for "New articles added: X" in logs
3. Verify MongoDB connection string is correct
4. Check if RSS feeds are accessible

### Frontend Not Updating?

**Check:**
1. Open browser console (F12)
2. Look for "🆕 Found X new crime(s)" messages
3. Verify backend is running (`npm run server`)
4. Check API endpoint: `http://localhost:5000/api/crime-data/new`

---

## 📈 Monitoring

### View Scraper Logs
1. Go to **Actions** tab
2. Click on any workflow run
3. Click **"scrape"** job
4. View detailed logs with timestamps

### Check Database Growth
```python
# Run this locally:
python
>>> import pymongo
>>> import os
>>> from dotenv import load_dotenv
>>> load_dotenv()
>>> client = pymongo.MongoClient(os.getenv("MONGO_URI"))
>>> db = client["fir_data"]
>>> print(f"Total crimes: {db.crime_news.count_documents({})}")
```

---

## 🎯 What Happens Now?

1. **Every 30 minutes:** GitHub Actions runs scraper automatically
2. **Every 60 seconds:** Your frontend checks for new data
3. **New crimes appear** on the map without page refresh
4. **Stats update** automatically
5. **Zero infrastructure costs** - All free!

---

## 💡 Pro Tips

1. **Monitor Runs:** Star important workflow runs to track them
2. **Notifications:** Enable email notifications for workflow failures (Settings → Notifications)
3. **Logs:** Download logs if needed (Actions → Run → Download logs)
4. **Free Tier:** GitHub gives 2,000 free minutes/month (enough for ~4,000 runs!)

---

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] `MONGO_URI` secret added
- [ ] GitHub Actions enabled
- [ ] Test run completed successfully
- [ ] New data appears in MongoDB
- [ ] Frontend polling works
- [ ] Map updates automatically

---

## 🚀 You're All Set!

Your crime data pipeline is now **fully automated**! The scraper runs every 30 minutes, and your frontend updates every 60 seconds. Watch the crime heatmap grow over time! 🗺️

**Questions?** Check the logs in GitHub Actions for debugging.
