# Remote API Testing Setup

## Option 1: GitHub Actions (Recommended - FREE)

### Setup Steps:

1. **Create GitHub Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/travel-booking-app.git
   git push -u origin main
   ```

2. **Add API Key Secret**:
   - Go to your GitHub repository
   - Navigate to: Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AVIATION_STACK_API_KEY`
   - Value: Your actual API key
   - Click "Add secret"

3. **Move GitHub Actions file**:
   ```bash
   # Move the workflow file to the correct location
   mkdir -p .github/workflows
   mv backend/.github/workflows/api-test.yml .github/workflows/
   ```

4. **Push Changes**:
   ```bash
   git add .
   git commit -m "Add API testing workflow"
   git push
   ```

5. **Manual Trigger**:
   - Go to your repository on GitHub
   - Click "Actions" tab
   - Click "API Rate Limiting Test"
   - Click "Run workflow"

### Benefits:
- ✅ **FREE** for public repos (2,000 minutes/month for private)
- ✅ Runs on every push automatically
- ✅ Can be triggered manually
- ✅ Detailed logs and results
- ✅ No server maintenance required

---

## Option 2: DigitalOcean Droplet (Cheapest VPS)

### Setup Steps:

1. **Create $5/month droplet** at DigitalOcean
2. **Install Node.js and Redis**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs redis-server
   ```

3. **Deploy your app**:
   ```bash
   git clone https://github.com/yourusername/travel-booking-app.git
   cd travel-booking-app/backend
   npm install
   echo "AVIATION_STACK_API_KEY=your_actual_key" > .env
   ```

4. **Set up automated testing**:
   ```bash
   # Add to crontab to run every 6 hours
   crontab -e
   # Add this line:
   0 */6 * * * cd /path/to/travel-booking-app/backend && npm start & sleep 10 && node tests/comprehensive-api-test.js
   ```

### Cost: $5/month

---

## Option 3: Railway (Easiest Deploy)

### Setup Steps:

1. **Sign up at Railway.app**
2. **Connect your GitHub repository**
3. **Add environment variables**:
   - `AVIATION_STACK_API_KEY`: Your API key
   - `NODE_ENV`: production

4. **Deploy automatically** on every push

### Cost: $5/month (500 hours included)

---

## Local Testing (While developing)

Run the comprehensive test locally:

```bash
cd backend
npm start &
sleep 5
node tests/comprehensive-api-test.js
```

## Test Results

All tests save results to `test-results.json` with:
- ✅ Pass/fail status
- ⏱️ Response times
- 📊 API source (real vs synthetic)
- 🔢 Flight counts
- 📋 Detailed logs

## Recommended Approach

1. **Start with GitHub Actions** (free)
2. **Use local testing** during development
3. **Consider DigitalOcean** if you need 24/7 monitoring

GitHub Actions is perfect for your use case - it's free, automated, and runs without your laptop!
