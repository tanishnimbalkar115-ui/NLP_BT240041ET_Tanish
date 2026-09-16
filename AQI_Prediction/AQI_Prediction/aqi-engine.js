/* AirSense — AQI Calculation Engine */

const AQI = (() => {
  // EPA Breakpoint tables: [C_low, C_high, I_low, I_high]
  const BP = {
    pm25: [[0,12,0,50],[12.1,35.4,51,100],[35.5,55.4,101,150],[55.5,150.4,151,200],[150.5,250.4,201,300],[250.5,350.4,301,400],[350.5,500.4,401,500]],
    pm10: [[0,54,0,50],[55,154,51,100],[155,254,101,150],[255,354,151,200],[355,424,201,300],[425,504,301,400],[505,604,401,500]],
    no2:  [[0,53,0,50],[54,100,51,100],[101,360,101,150],[361,649,151,200],[650,1249,201,300],[1250,1649,301,400],[1650,2049,401,500]],
    so2:  [[0,35,0,50],[36,75,51,100],[76,185,101,150],[186,304,151,200],[305,604,201,300],[605,804,301,400],[805,1004,401,500]],
    co:   [[0,4.4,0,50],[4.5,9.4,51,100],[9.5,12.4,101,150],[12.5,15.4,151,200],[15.5,30.4,201,300],[30.5,40.4,301,400],[40.5,50.4,401,500]],
    o3:   [[0,54,0,50],[55,70,51,100],[71,85,101,150],[86,105,151,200],[106,200,201,300],[201,404,301,400],[405,604,401,500]]
  };

  const CATEGORIES = [
    {min:0,max:50,label:'Good',color:'#2ecc71',health:'Air quality is satisfactory. Little or no risk.'},
    {min:51,max:100,label:'Moderate',color:'#f1c40f',health:'Acceptable. Sensitive individuals may experience minor issues.'},
    {min:101,max:150,label:'Unhealthy for Sensitive Groups',color:'#e67e22',health:'Sensitive groups may experience health effects. General public less likely affected.'},
    {min:151,max:200,label:'Unhealthy',color:'#e74c3c',health:'Everyone may begin to experience health effects. Sensitive groups more serious.'},
    {min:201,max:300,label:'Very Unhealthy',color:'#9b59b6',health:'Health alert: everyone may experience serious health effects.'},
    {min:301,max:500,label:'Hazardous',color:'#7d1128',health:'Health warning of emergency conditions. Entire population likely affected.'}
  ];

  const POLLUTANT_NAMES = {pm25:'PM2.5',pm10:'PM10',no2:'NO₂',so2:'SO₂',co:'CO',o3:'O₃'};
  const POLLUTANT_UNITS = {pm25:'µg/m³',pm10:'µg/m³',no2:'ppb',so2:'ppb',co:'ppm',o3:'ppb'};

  function calcSubIndex(pollutant, conc) {
    const table = BP[pollutant];
    if (!table || conc < 0) return 0;
    for (const [cl, ch, il, ih] of table) {
      if (conc >= cl && conc <= ch) {
        return Math.round(((ih - il) / (ch - cl)) * (conc - cl) + il);
      }
    }
    return conc > table[table.length-1][1] ? 500 : 0;
  }

  function calcAQI(values) {
    const subs = {};
    let maxAqi = 0, dominant = '';
    for (const [key, val] of Object.entries(values)) {
      if (val == null || isNaN(val)) continue;
      const sub = calcSubIndex(key, val);
      subs[key] = sub;
      if (sub > maxAqi) { maxAqi = sub; dominant = key; }
    }
    return { aqi: maxAqi, subIndices: subs, dominant };
  }

  function getCategory(aqi) {
    for (const c of CATEGORIES) {
      if (aqi >= c.min && aqi <= c.max) return c;
    }
    return CATEGORIES[CATEGORIES.length - 1];
  }

  // Convert Open-Meteo units (µg/m³) to EPA units
  function convertUnits(raw) {
    return {
      pm25: raw.pm25 ?? null,
      pm10: raw.pm10 ?? null,
      no2: raw.no2 != null ? raw.no2 / 1.88 : null,
      so2: raw.so2 != null ? raw.so2 / 2.62 : null,
      co: raw.co != null ? raw.co / 1145 : null,
      o3: raw.o3 != null ? raw.o3 / 2.0 : null
    };
  }

  // Simple linear regression
  function linearRegression(data) {
    const n = data.length;
    if (n < 2) return { predict: () => data[0] || 0 };
    let sx=0,sy=0,sxx=0,sxy=0;
    data.forEach((y,x) => { sx+=x; sy+=y; sxx+=x*x; sxy+=x*y; });
    const slope = (n*sxy - sx*sy) / (n*sxx - sx*sx);
    const intercept = (sy - slope*sx) / n;
    return { slope, intercept, predict: x => Math.max(0, Math.round(slope*x + intercept)) };
  }

  // Moving average
  function movingAverage(data, window) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(window/2));
      const end = Math.min(data.length, i + Math.ceil(window/2));
      const slice = data.slice(start, end);
      result.push(Math.round(slice.reduce((a,b) => a+b, 0) / slice.length));
    }
    return result;
  }

  // Process 7-day forecast from API
  function processForecast(hourlyData) {
    const times = hourlyData.time || [];
    const aqiVals = hourlyData.us_aqi || [];
    const dailyMap = {};

    times.forEach((t, i) => {
      const day = t.split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = [];
      if (aqiVals[i] != null) dailyMap[day].push(aqiVals[i]);
    });

    const days = Object.keys(dailyMap).sort();
    const dailyAvg = days.map(d => {
      const vals = dailyMap[d];
      return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
    });

    const smoothed = movingAverage(dailyAvg, 3);
    const lr = linearRegression(dailyAvg);
    const trend = dailyAvg.map((v, i) => Math.round((v + smoothed[i] + lr.predict(i)) / 3));

    return { days, dailyAvg, smoothed, trend };
  }

  // Draw gauge on canvas
  function drawGauge(canvas, aqi) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h - 10;
    const r = Math.min(w/2 - 20, h - 30);

    ctx.clearRect(0, 0, w, h);

    const segments = [
      {end:50/500, color:'#2ecc71'},{end:100/500, color:'#f1c40f'},
      {end:150/500, color:'#e67e22'},{end:200/500, color:'#e74c3c'},
      {end:300/500, color:'#9b59b6'},{end:500/500, color:'#7d1128'}
    ];

    let startAngle = Math.PI;
    segments.forEach(seg => {
      const endAngle = Math.PI + seg.end * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.lineWidth = 18;
      ctx.strokeStyle = seg.color;
      ctx.lineCap = 'butt';
      ctx.stroke();
      startAngle = endAngle;
    });

    // Needle
    const clampedAqi = Math.min(500, Math.max(0, aqi));
    const needleAngle = Math.PI + (clampedAqi / 500) * Math.PI;
    const nx = cx + (r - 30) * Math.cos(needleAngle);
    const ny = cy + (r - 30) * Math.sin(needleAngle);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.lineWidth = 3;
    ctx.strokeStyle = getCategory(aqi).color;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2*Math.PI);
    ctx.fillStyle = getCategory(aqi).color;
    ctx.fill();
  }

  return { calcAQI, calcSubIndex, getCategory, convertUnits, processForecast, drawGauge, linearRegression, movingAverage, POLLUTANT_NAMES, POLLUTANT_UNITS, CATEGORIES };
})();
