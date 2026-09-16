# AirSense — AQI Prediction Web Application

Real-time Air Quality Index prediction, EPA-standard calculations, and 7-day forecasts.

## How to Run

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
2. No installation, no build tools, no backend required

## Features

- **Live AQI Data** — Fetches real-time data from Open-Meteo Air Quality API (free, no key needed)
- **Manual Input** — Enter pollutant values manually for custom AQI prediction
- **EPA AQI Formula** — Standard breakpoint calculation for PM2.5, PM10, NO₂, SO₂, CO, O₃
- **7-Day Forecast** — Trend analysis with linear regression + moving average smoothing
- **Interactive Charts** — Bar, Line, and Doughnut charts via Chart.js
- **Gauge Visualization** — Animated Canvas-based AQI gauge
- **City Autocomplete** — Geocoding search with Open-Meteo
- **Geolocation** — "Use My Location" with HTML5 Geolocation API
- **Dark/Light Mode** — Theme toggle with localStorage persistence
- **Search History** — Last 5 searches saved in localStorage
- **PDF Export** — Download reports via jsPDF
- **Auto-Refresh** — Optional 30-minute automatic data refresh
- **Responsive** — Mobile, tablet, and desktop layouts

## File Structure

```
/AQI_Prediction
├── index.html      # Main HTML page
├── styles.css      # Responsive CSS with dark mode
├── aqi-engine.js   # AQI calculation engine & EPA breakpoints
├── app.js          # App logic, API calls, charts, UI
└── README.md       # This file
```

## APIs Used

- [Open-Meteo Air Quality API](https://open-meteo.com/) — No API key required
- [Open-Meteo Geocoding API](https://open-meteo.com/) — City name to coordinates

## CDN Dependencies

- Chart.js 4.x — Charts
- Font Awesome 6.x — Icons
- jsPDF 2.x — PDF export
- Google Fonts (Poppins) — Typography
