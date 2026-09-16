/* AirSense — Main Application Logic */

(function() {
  'use strict';

  // DOM References
  const $ = id => document.getElementById(id);
  const cityInput = $('cityInput');
  const acList = $('autocompleteList');
  const geoBtn = $('geolocateBtn');
  const locInfo = $('locationInfo');
  const locCity = $('locationCity');
  const locCountry = $('locationCountry');
  const locCoords = $('locationCoords');
  const loader = $('loader');
  const toast = $('toast');
  const toastMsg = $('toastMsg');
  const modeLive = $('modeLive');
  const modeManual = $('modeManual');
  const manualSection = $('manual-section');
  const resultsSection = $('results-section');
  const chartsSection = $('charts-section');
  const manualForm = $('manualForm');
  const gaugeCanvas = $('gaugeCanvas');
  const aqiValueEl = $('aqiValue');
  const aqiCatEl = $('aqiCategory');
  const healthEl = $('healthAdvisory');
  const domPollEl = $('dominantPollutant');
  const lastUpdEl = $('lastUpdated');
  const pollGrid = $('pollutantGrid');
  const histBody = $('historyBody');
  const dlPdf = $('downloadPdf');
  const themeBtn = $('themeToggle');
  const autoRefresh = $('autoRefreshToggle');

  let currentMode = 'live';
  let currentLocation = null;
  let currentResult = null;
  let forecastData = null;
  let charts = { bar: null, line: null, doughnut: null };
  let refreshTimer = null;
  let debounceTimer = null;

  // ===== THEME =====
  function initTheme() {
    const saved = localStorage.getItem('airsense-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }

  function updateThemeIcon(theme) {
    themeBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }

  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('airsense-theme', next);
    updateThemeIcon(next);
    if (charts.bar) renderCharts();
  });

  // ===== PARTICLES =====
  function createParticles() {
    const container = $('particles');
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random()*100+'%';
      p.style.animationDuration = (4+Math.random()*6)+'s';
      p.style.animationDelay = Math.random()*5+'s';
      p.style.width = p.style.height = (3+Math.random()*5)+'px';
      container.appendChild(p);
    }
  }

  // ===== TOAST =====
  function showToast(msg, type) {
    toastMsg.textContent = msg;
    toast.className = 'toast' + (type === 'success' ? ' toast-success' : '');
    setTimeout(() => toast.classList.add('hidden'), 4000);
  }
  $('toastClose').addEventListener('click', () => toast.classList.add('hidden'));

  // ===== LOADER =====
  function showLoader(show) {
    loader.classList.toggle('hidden', !show);
  }

  // ===== MODE TOGGLE =====
  [modeLive, modeManual].forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      currentMode = mode;
      modeLive.classList.toggle('active', mode === 'live');
      modeManual.classList.toggle('active', mode === 'manual');
      manualSection.classList.toggle('hidden', mode === 'live');
    });
  });

  // ===== GEOCODING & AUTOCOMPLETE =====
  cityInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = cityInput.value.trim();
    if (q.length < 2) { acList.innerHTML = ''; return; }
    debounceTimer = setTimeout(() => searchCities(q), 350);
  });

  async function searchCities(query) {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`);
      const data = await res.json();
      acList.innerHTML = '';
      if (!data.results) return;
      data.results.forEach(r => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fa-solid fa-location-dot"></i>${r.name}, ${r.admin1||''} — ${r.country||''}`;
        li.addEventListener('click', () => selectCity(r));
        acList.appendChild(li);
      });
    } catch(e) { console.error(e); }
  }

  function selectCity(city) {
    acList.innerHTML = '';
    cityInput.value = city.name;
    currentLocation = { name: city.name, country: city.country||'', lat: city.latitude, lon: city.longitude };
    showLocationInfo();
    if (currentMode === 'live') fetchAQIData(city.latitude, city.longitude);
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('#search-container')) acList.innerHTML = '';
  });

  // ===== GEOLOCATION =====
  geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported'); return; }
    showLoader(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        currentLocation = { name:'My Location', country:'', lat: pos.coords.latitude, lon: pos.coords.longitude };
        locCoords.innerHTML = `<i class="fa-solid fa-map-pin"></i> ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        fetchAQIData(pos.coords.latitude, pos.coords.longitude);
      },
      () => { showLoader(false); showToast('Location access denied'); }
    );
  });

  async function reverseGeocode(lat, lon) {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lon.toFixed(2)}&count=1`);
      const data = await res.json();
      if (data.results && data.results[0]) {
        currentLocation.name = data.results[0].name;
        currentLocation.country = data.results[0].country || '';
      }
      showLocationInfo();
    } catch(e) { showLocationInfo(); }
  }

  function showLocationInfo() {
    if (!currentLocation) return;
    locCity.innerHTML = `<i class="fa-solid fa-city"></i> ${currentLocation.name}`;
    locCountry.innerHTML = `<i class="fa-solid fa-earth-americas"></i> ${currentLocation.country}`;
    locCoords.innerHTML = `<i class="fa-solid fa-map-pin"></i> ${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)}`;
    locInfo.classList.remove('hidden');
  }

  // ===== FETCH AQI DATA =====
  async function fetchAQIData(lat, lon) {
    showLoader(true);
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone,us_aqi&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      processAPIData(data);

      // Also fetch weather data for this location
      if (window._fetchWeather) window._fetchWeather(lat, lon);
    } catch(e) {
      showToast('Could not fetch air quality data. Please try again.');
      console.error(e);
    } finally {
      showLoader(false);
    }
  }

  function processAPIData(data) {
    const h = data.hourly;
    if (!h || !h.time) { showToast('Invalid data received'); return; }

    // Find current hour index
    const now = new Date();
    let idx = 0;
    for (let i = 0; i < h.time.length; i++) {
      if (new Date(h.time[i]) <= now) idx = i;
      else break;
    }

    const rawVals = { pm25: h.pm2_5[idx], pm10: h.pm10[idx], no2: h.nitrogen_dioxide[idx], so2: h.sulphur_dioxide[idx], co: h.carbon_monoxide[idx], o3: h.ozone[idx] };
    const converted = AQI.convertUnits(rawVals);
    const result = AQI.calcAQI(converted);

    // Use API's us_aqi as primary AQI so map & search match
    const apiAqi = h.us_aqi[idx];
    if (apiAqi != null && !isNaN(apiAqi)) {
      result.aqi = Math.round(apiAqi);
    }

    result.values = converted;
    result.rawValues = rawVals;
    currentResult = result;

    forecastData = AQI.processForecast(h);
    displayResults(result);
    renderCharts();
    saveHistory(result);
  }

  // ===== MANUAL INPUT =====
  manualForm.addEventListener('submit', e => {
    e.preventDefault();
    const vals = {
      pm25: parseFloat($('inp_pm25').value),
      pm10: parseFloat($('inp_pm10').value),
      no2: parseFloat($('inp_no2').value),
      so2: parseFloat($('inp_so2').value),
      co: parseFloat($('inp_co').value),
      o3: parseFloat($('inp_o3').value)
    };

    let valid = false;
    for (const v of Object.values(vals)) { if (!isNaN(v) && v >= 0) valid = true; }
    if (!valid) { showToast('Please enter at least one valid pollutant value'); return; }

    // Clean NaN values
    for (const k in vals) { if (isNaN(vals[k])) vals[k] = null; }

    const result = AQI.calcAQI(vals);
    result.values = vals;
    result.rawValues = vals;
    currentResult = result;
    currentLocation = currentLocation || { name: 'Manual Input', country: '', lat: 0, lon: 0 };
    forecastData = null;

    displayResults(result);
    renderCharts();
    saveHistory(result);
  });

  manualForm.addEventListener('reset', () => {
    document.querySelectorAll('.input-group input').forEach(inp => inp.classList.remove('invalid'));
  });

  // ===== DISPLAY RESULTS =====
  function displayResults(result) {
    const cat = AQI.getCategory(result.aqi);

    // Animate AQI number
    animateValue(aqiValueEl, 0, result.aqi, 1200);
    aqiCatEl.textContent = cat.label;
    aqiCatEl.style.background = cat.color + '22';
    aqiCatEl.style.color = cat.color;
    healthEl.textContent = cat.health;
    domPollEl.textContent = result.dominant ? `${AQI.POLLUTANT_NAMES[result.dominant]} (${AQI.POLLUTANT_UNITS[result.dominant]})` : '—';
    lastUpdEl.textContent = new Date().toLocaleString();

    // Draw gauge
    setTimeout(() => AQI.drawGauge(gaugeCanvas, result.aqi), 100);

    // Pollutant cards
    pollGrid.innerHTML = '';
    let cardIdx = 0;
    for (const [key, sub] of Object.entries(result.subIndices)) {
      const val = result.values[key];
      const pCat = AQI.getCategory(sub);
      const card = document.createElement('div');
      card.className = 'pollutant-card' + (key === result.dominant ? ' dominant' : '');
      cardIdx++;
      card.innerHTML = `
        <style>.pollutant-card:nth-child(${cardIdx})::before{background:${pCat.color}}</style>
        <div class="poll-name">${AQI.POLLUTANT_NAMES[key]}</div>
        <div class="poll-value">${val != null ? val.toFixed(1) : '—'}</div>
        <div class="poll-aqi" style="background:${pCat.color}22;color:${pCat.color}">AQI: ${sub}</div>
      `;
      pollGrid.appendChild(card);
    }

    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('fade-in');
    chartsSection.classList.remove('hidden');
    chartsSection.classList.add('fade-in');
  }

  function animateValue(el, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + range * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ===== CHARTS =====
  function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#a3c4c9' : '#4a6670',
      grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      bg: isDark ? '#163338' : '#ffffff'
    };
  }

  function renderCharts() {
    if (!currentResult) return;
    const colors = getChartColors();
    const pollColors = ['#2ecc71','#3498db','#e67e22','#f1c40f','#e74c3c','#9b59b6'];

    // Destroy old
    Object.values(charts).forEach(c => c?.destroy());

    const labels = Object.keys(currentResult.subIndices).map(k => AQI.POLLUTANT_NAMES[k]);
    const subVals = Object.values(currentResult.subIndices);

    // Bar Chart
    charts.bar = new Chart($('barChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Sub-Index',
          data: subVals,
          backgroundColor: pollColors.slice(0, labels.length).map(c => c + '88'),
          borderColor: pollColors.slice(0, labels.length),
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text } },
          x: { grid: { display: false }, ticks: { color: colors.text } }
        }
      }
    });

    // Doughnut Chart
    charts.doughnut = new Chart($('doughnutChart'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: subVals,
          backgroundColor: pollColors.slice(0, labels.length),
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: colors.text, padding: 12, font: { family: 'Poppins' } } }
        },
        cutout: '65%'
      }
    });

    // Line Chart - 7-day forecast
    if (forecastData) {
      const dayLabels = forecastData.days.map(d => {
        const dt = new Date(d);
        return dt.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
      });

      charts.line = new Chart($('lineChart'), {
        type: 'line',
        data: {
          labels: dayLabels,
          datasets: [
            {
              label: 'Daily Avg AQI',
              data: forecastData.dailyAvg,
              borderColor: '#3498db',
              backgroundColor: 'rgba(52,152,219,0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: '#3498db'
            },
            {
              label: 'Smoothed Trend',
              data: forecastData.trend,
              borderColor: '#2ecc71',
              borderDash: [6, 3],
              fill: false,
              tension: 0.4,
              pointRadius: 3,
              pointBackgroundColor: '#2ecc71'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: colors.text, font: { family: 'Poppins' } } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text } },
            x: { grid: { color: colors.grid }, ticks: { color: colors.text } }
          }
        }
      });
    } else {
      // No forecast for manual mode
      charts.line = new Chart($('lineChart'), {
        type: 'line',
        data: { labels: ['Now'], datasets: [{ label: 'AQI', data: [currentResult.aqi], borderColor: '#3498db', pointRadius: 6 }] },
        options: { responsive: true, plugins: { legend: { labels: { color: colors.text } } } }
      });
    }
  }

  // ===== HISTORY (LocalStorage) =====
  function getHistory() {
    try { return JSON.parse(localStorage.getItem('airsense-history') || '[]'); }
    catch { return []; }
  }

  function saveHistory(result) {
    const history = getHistory();
    const cat = AQI.getCategory(result.aqi);
    history.unshift({
      city: currentLocation?.name || 'Unknown',
      aqi: result.aqi,
      category: cat.label,
      color: cat.color,
      dominant: result.dominant ? AQI.POLLUTANT_NAMES[result.dominant] : '—',
      date: new Date().toLocaleString(),
      lat: currentLocation?.lat,
      lon: currentLocation?.lon
    });
    if (history.length > 5) history.pop();
    localStorage.setItem('airsense-history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    const history = getHistory();
    if (!history.length) {
      histBody.innerHTML = '<tr class="empty-row"><td colspan="6">No search history yet.</td></tr>';
      return;
    }
    histBody.innerHTML = history.map(h => `
      <tr>
        <td>${h.city}</td>
        <td><span class="aqi-badge" style="background:${h.color}">${h.aqi}</span></td>
        <td>${h.category}</td>
        <td>${h.dominant}</td>
        <td>${h.date}</td>
        <td>${h.lat ? `<button class="history-search-btn" onclick="window._reSearch(${h.lat},${h.lon},'${h.city.replace(/'/g,"\\'")}')"><i class="fa-solid fa-rotate-right"></i> Re-check</button>` : '—'}</td>
      </tr>
    `).join('');
  }

  window._reSearch = function(lat, lon, name) {
    currentLocation = { name, country: '', lat, lon };
    showLocationInfo();
    fetchAQIData(lat, lon);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== PDF EXPORT =====
  dlPdf.addEventListener('click', () => {
    if (!currentResult) { showToast('No results to export'); return; }
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const cat = AQI.getCategory(currentResult.aqi);

      doc.setFontSize(22);
      doc.setTextColor(26, 154, 110);
      doc.text('AirSense — AQI Report', 20, 25);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 33);

      doc.setDrawColor(200);
      doc.line(20, 37, 190, 37);

      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text(`Location: ${currentLocation?.name || 'Manual Input'}`, 20, 47);
      if (currentLocation?.lat) doc.text(`Coordinates: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)}`, 20, 55);

      doc.setFontSize(36);
      // Parse hex color to RGB for jsPDF
      const hexToRgb = hex => {
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        return [r,g,b];
      };
      const catRgb = hexToRgb(cat.color);
      doc.setTextColor(catRgb[0], catRgb[1], catRgb[2]);
      doc.text(`AQI: ${currentResult.aqi}`, 20, 78);

      doc.setFontSize(14);
      doc.text(`Category: ${cat.label}`, 20, 90);

      doc.setFontSize(10);
      doc.setTextColor(60);
      doc.text(`Health Advisory: ${cat.health}`, 20, 100, { maxWidth: 170 });

      doc.setFontSize(11);
      doc.setTextColor(40);
      doc.text('Dominant Pollutant: ' + (currentResult.dominant ? AQI.POLLUTANT_NAMES[currentResult.dominant] : '—'), 20, 115);

      doc.setFontSize(13);
      doc.setTextColor(26, 154, 110);
      doc.text('Pollutant Breakdown', 20, 130);

      let y = 138;
      doc.setFontSize(10);
      doc.setTextColor(60);
      for (const [key, sub] of Object.entries(currentResult.subIndices)) {
        const val = currentResult.values[key];
        doc.text(`${AQI.POLLUTANT_NAMES[key]}: ${val != null ? val.toFixed(1) : '—'} ${AQI.POLLUTANT_UNITS[key]} → Sub-AQI: ${sub}`, 24, y);
        y += 8;
      }

      // Add chart images
      try {
        const barCanvas = $('barChart');
        if (barCanvas) {
          const img = barCanvas.toDataURL('image/png');
          doc.addPage();
          doc.setFontSize(13);
          doc.setTextColor(26, 154, 110);
          doc.text('Charts', 20, 20);
          doc.addImage(img, 'PNG', 15, 28, 180, 90);
        }
        const lineCanvas = $('lineChart');
        if (lineCanvas) {
          const img2 = lineCanvas.toDataURL('image/png');
          doc.addImage(img2, 'PNG', 15, 125, 180, 90);
        }
      } catch(e) { console.warn('Chart export failed:', e); }

      doc.save(`AirSense_Report_${currentLocation?.name || 'Manual'}_${Date.now()}.pdf`);
      showToast('PDF report downloaded!', 'success');
    } catch(e) {
      showToast('PDF generation failed. Check console.');
      console.error(e);
    }
  });

  // ===== AUTO-REFRESH =====
  autoRefresh.addEventListener('change', () => {
    clearInterval(refreshTimer);
    if (autoRefresh.checked && currentLocation?.lat) {
      refreshTimer = setInterval(() => fetchAQIData(currentLocation.lat, currentLocation.lon), 30 * 60 * 1000);
      showToast('Auto-refresh enabled (every 30 min)', 'success');
    } else {
      showToast('Auto-refresh disabled', 'success');
    }
  });

  // ===== INIT =====
  initTheme();
  createParticles();
  renderHistory();

})();
