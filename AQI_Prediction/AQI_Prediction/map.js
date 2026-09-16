/* AirSense — India AQI Map Module */

(function() {
  'use strict';

  // 20 Major Indian Cities
  const CITIES = [
    { name: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
    { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
    { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
    { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
    { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
    { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
    { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
    { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
    { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
    { name: 'Chandigarh', state: 'Punjab', lat: 30.7333, lon: 76.7794 },
    { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
    { name: 'Patna', state: 'Bihar', lat: 25.6093, lon: 85.1376 },
    { name: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362 },
    { name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
    { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
    { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
    { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
    { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
    { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366 }
  ];

  let map = null;
  let markers = [];

  function initMap() {
    if (!document.getElementById('aqiMap')) return;

    map = L.map('aqiMap', {
      center: [22.5, 78.9],
      zoom: 5,
      scrollWheelZoom: true,
      zoomControl: true
    });

    // Use OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Load AQI data for all cities
    loadAllCityAQI();

    // Refresh button
    const refreshBtn = document.getElementById('refreshMapBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        clearMarkers();
        loadAllCityAQI();
      });
    }
  }

  function clearMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
  }

  async function loadAllCityAQI() {
    // Fetch AQI for all cities in parallel
    const promises = CITIES.map(city => fetchCityAQI(city));
    const results = await Promise.allSettled(promises);

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        addCityMarker(CITIES[i], result.value);
      } else {
        // Add gray marker for failed fetch
        addCityMarker(CITIES[i], { aqi: null, pm25: null, pm10: null });
      }
    });
  }

  async function fetchCityAQI(city) {
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&hourly=pm2_5,pm10,us_aqi&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      const h = data.hourly;
      const now = new Date();
      let idx = 0;
      for (let i = 0; i < h.time.length; i++) {
        if (new Date(h.time[i]) <= now) idx = i;
        else break;
      }

      return {
        aqi: h.us_aqi[idx] != null ? Math.round(h.us_aqi[idx]) : null,
        pm25: h.pm2_5[idx],
        pm10: h.pm10[idx]
      };
    } catch (e) {
      console.warn(`Failed to fetch AQI for ${city.name}:`, e);
      return null;
    }
  }

  function getAQIColor(aqi) {
    if (aqi == null) return '#999';
    if (aqi <= 50) return '#2ecc71';
    if (aqi <= 100) return '#f1c40f';
    if (aqi <= 150) return '#e67e22';
    if (aqi <= 200) return '#e74c3c';
    if (aqi <= 300) return '#9b59b6';
    return '#7d1128';
  }

  function getAQILabel(aqi) {
    if (aqi == null) return 'No Data';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  function addCityMarker(city, data) {
    const aqi = data?.aqi;
    const color = getAQIColor(aqi);
    const label = getAQILabel(aqi);

    // Custom circle marker with AQI value
    const icon = L.divIcon({
      className: 'aqi-marker',
      html: `<div style="
        background:${color};
        color:#fff;
        width:40px;height:40px;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:12px;
        font-family:'Poppins',sans-serif;
        box-shadow:0 2px 10px ${color}88;
        border:3px solid #fff;
        transition:transform 0.2s;
      ">${aqi != null ? aqi : '?'}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -24]
    });

    const marker = L.marker([city.lat, city.lon], { icon }).addTo(map);

    // Popup content
    const popup = `
      <div style="font-family:'Poppins',sans-serif;min-width:180px;">
        <div class="map-popup-title">${city.name}</div>
        <div class="map-popup-detail">${city.state}, India</div>
        <div class="map-popup-aqi" style="color:${color}">${aqi != null ? aqi : 'N/A'}</div>
        <div class="map-popup-cat" style="background:${color}">${label}</div>
        ${data?.pm25 != null ? `<div class="map-popup-detail">PM2.5: ${data.pm25.toFixed(1)} µg/m³</div>` : ''}
        ${data?.pm10 != null ? `<div class="map-popup-detail">PM10: ${data.pm10.toFixed(1)} µg/m³</div>` : ''}
        <button class="map-popup-btn" onclick="window._reSearch(${city.lat},${city.lon},'${city.name}')">
          <i class="fa-solid fa-chart-simple"></i> Full Analysis
        </button>
      </div>
    `;

    marker.bindPopup(popup);
    markers.push(marker);
  }

  // Init map when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }

})();
