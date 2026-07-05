# PredictIQ: AI-Powered Predictive Analytics Platform

PredictIQ is a high-fidelity web application prototype designed as a hackathon submission and credible startup MVP. It empowers business decision-makers to convert historical raw logs into robust, seasonal forecasts.

## 🎯 Value Proposition
> **"Turn historical business data into accurate forecasts for demand, inventory, staffing, and revenue."**

---

## 🚀 Key Features

1. **Clean, Modern SaaS-Style Dashboard**: Designed with deep space backgrounds, glowing cyber-neon highlights, and glassmorphism layouts (`backdrop-filter`).
2. **7 Target Industry Profiles**: Tailored metrics, seasonal waves, and presets for **Retail, Restaurants, Healthcare, Manufacturing, Education, Marketing, and Finance**.
3. **4 Key Predictive Modules**:
   - **Demand Forecasting**: Predict customer transactions, foot traffic, and orders.
   - **Inventory Optimization**: Recommend safety stocks, optimal buffer limits, and reorder alerts.
   - **Staffing Forecasting**: Calculate ideal FTE rosters to control resource wait times.
   - **Revenue Projections**: Extrapolate cash inflows, subscription increments, or contracts.
4. **Time-Series AI Engine**:
   - Computes Ordinary Least Squares (OLS) Linear Regression: \( y = mx + c \).
   - Combines baseline trends with seasonal sine-wave cyclic multipliers.
   - Generates confidence bands using \( \pm 1.96 \times S_e \) (Standard Error).
5. **Interactive Data Lab**:
   - Drag-and-drop CSV parser that automatically maps Date/Value headers.
   - Quick presets toggle to load standard datasets.
   - Raw data tabular inspector.
6. **Prescriptive AI Insights**: Adapts dynamically based on active modules, slope shifts, and threshold margins.
7. **Infographic Pipeline**: Explains the technical mapping: Ingestion → AI Model → Visual Output → Decisions.

---

## 🛠️ Getting Started

You can launch this application in two ways:

### Method 1: Local HTTP Web Server (Recommended)
1. Run the local Node.js static web server (requires Node.js):
   ```bash
   node server.js
   ```
2. Open your web browser and navigate to: [http://localhost:3000](http://localhost:3000)

### Method 2: Direct File Open
1. Double-click the `index.html` file or open it directly in Google Chrome, Microsoft Edge, or Safari.
2. Note: Ensure you are connected to the internet to load Chart.js and Google Fonts via CDN.

---

## 📈 Forecasting Math Formulas

PredictIQ uses a multi-layered statistical time-series model:

$$ \hat{Y}_t = (\beta_0 + \beta_1 t) \times S_t + \epsilon_t $$

- **Linear Trend**: \(\beta_0 + \beta_1 t\) represents OLS trend lines.
- **Seasonal Factor**: \(S_t\) represents cyclical multipliers representing calendar variations.
- **95% Confidence Band**: Shaded margins represent prediction standard error, scaling outward over the forecast horizon.
