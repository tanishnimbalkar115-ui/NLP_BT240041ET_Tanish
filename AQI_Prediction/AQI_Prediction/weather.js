/* AirSense — Weather Integration Module
   Uses Open-Meteo Weather API (free, no key required) */

(function() {
  'use strict';

  const $ = id => document.getElementById(id);

  // Weather code to emoji + description mapping
  const WEATHER_CODES = {
    0: { emoji: '☀️', desc: 'Clear Sky' },
    1: { emoji: '🌤️', desc: 'Mainly Clear' },
    2: { emoji: '⛅', desc: 'Partly Cloudy' },
    3: { emoji: '☁️', desc: 'Overcast' },
    45: { emoji: '🌫️', desc: 'Foggy' },
    48: { emoji: '🌫️', desc: 'Rime Fog' },
    51: { emoji: '🌦️', desc: 'Light Drizzle' },
    53: { emoji: '🌦️', desc: 'Moderate Drizzle' },
    55: { emoji: '🌧️', desc: 'Dense Drizzle' },
    56: { emoji: '🌧️', desc: 'Freezing Drizzle' },
    57: { emoji: '🌧️', desc: 'Heavy Freezing Drizzle' },
    61: { emoji: '🌧️', desc: 'Slight Rain' },
    63: { emoji: '🌧️', desc: 'Moderate Rain' },
    65: { emoji: '🌧️', desc: 'Heavy Rain' },
    66: { emoji: '🌨️', desc: 'Freezing Rain' },
    67: { emoji: '🌨️', desc: 'Heavy Freezing Rain' },
    71: { emoji: '❄️', desc: 'Slight Snowfall' },
    73: { emoji: '❄️', desc: 'Moderate Snowfall' },
    75: { emoji: '❄️', desc: 'Heavy Snowfall' },
    77: { emoji: '🌨️', desc: 'Snow Grains' },
    80: { emoji: '🌦️', desc: 'Slight Showers' },
    82: { emoji: '🌧️', desc: 'Violent Showers' },
    85: { emoji: '🌨️', desc: 'Slight Snow Showers' },
    86: { emoji: '🌨️', desc: 'Heavy Snow Showers' },
    95: { emoji: '⛈️', desc: 'Thunderstorm' },
    96: { emoji: '⛈️', desc: 'Thunderstorm + Hail' },
    99: { emoji: '⛈️', desc: 'Heavy Thunderstorm + Hail' }
  };

  // Wind degree to compass direction
  function windDirection(deg) {
    if (deg == null) return '--';
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  // UV Index level
  function uvLevel(uv) {
    if (uv == null) return '';
    if (uv <= 2) return ' (Low)';
    if (uv <= 5) return ' (Moderate)';
    if (uv <= 7) return ' (High)';
    if (uv <= 10) return ' (Very High)';
    return ' (Extreme)';
  }

  // Generate weather-AQI impact insight
  function getWeatherImpact(weather, aqi) {
    const insights = [];

    if (weather.humidity > 80) {
      insights.push('High humidity can trap pollutants close to ground level, potentially worsening air quality.');
    }
    if (weather.wind < 5) {
      insights.push('Calm wind conditions allow pollutants to accumulate. Air quality may worsen throughout the day.');
    } else if (weather.wind > 20) {
      insights.push('Strong winds help disperse pollutants, which can improve air quality.');
    }
    if (weather.precipitation > 0) {
      insights.push('Rainfall acts as a natural air cleanser, washing particles from the atmosphere.');
    }
    if (weather.temp > 35) {
      insights.push('High temperatures increase ozone formation at ground level, which can raise AQI.');
    }
    if (weather.uv > 7) {
      insights.push('High UV levels accelerate photochemical reactions that create ground-level ozone.');
    }
    if (weather.weatherCode === 45 || weather.weatherCode === 48) {
      insights.push('Foggy conditions trap pollutants in a shallow boundary layer. Consider wearing a mask outdoors.');
    }

    if (insights.length === 0) {
      insights.push('Current weather conditions are moderate. No significant weather-related impact on air quality is expected.');
    }

    return insights.join(' ');
  }

  // Fetch weather data from Open-Meteo
  async function fetchWeather(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API error');
      const data = await res.json();
      displayWeather(data);
    } catch(e) {
      console.warn('Weather fetch failed:', e);
    }
  }

  // Display weather data in the UI
  function displayWeather(data) {
    const c = data.current;
    const d = data.daily;
    if (!c) return;

    const code = c.weather_code;
    const weatherInfo = WEATHER_CODES[code] || { emoji: '🌡️', desc: 'Unknown' };

    $('weatherEmoji').textContent = weatherInfo.emoji;
    $('weatherTemp').textContent = `${Math.round(c.temperature_2m)}°C`;
    $('weatherDesc').textContent = weatherInfo.desc;
    $('weatherFeels').textContent = `Feels like ${Math.round(c.apparent_temperature)}°C`;

    // Min/Max
    if (d && d.temperature_2m_max) {
      $('weatherHigh').innerHTML = `<i class="fa-solid fa-arrow-up" style="color:#e74c3c"></i> ${Math.round(d.temperature_2m_max[0])}°C`;
      $('weatherLow').innerHTML = `<i class="fa-solid fa-arrow-down" style="color:#3498db"></i> ${Math.round(d.temperature_2m_min[0])}°C`;
    }

    // Details
    $('weatherHumidity').textContent = `${c.relative_humidity_2m}%`;
    $('weatherWind').textContent = `${c.wind_speed_10m} km/h`;
    $('weatherUV').textContent = `${c.uv_index}${uvLevel(c.uv_index)}`;
    $('weatherPrecip').textContent = `${c.precipitation} mm`;
    $('weatherWindDir').textContent = `${windDirection(c.wind_direction_10m)} (${c.wind_direction_10m}°)`;

    // Sunrise/Sunset
    if (d && d.sunrise && d.sunset) {
      const sunrise = new Date(d.sunrise[0]).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
      const sunset = new Date(d.sunset[0]).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
      $('weatherSunrise').textContent = `${sunrise} / ${sunset}`;
    }

    // Weather-AQI Impact insight
    const weatherData = {
      temp: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      wind: c.wind_speed_10m,
      precipitation: c.precipitation,
      uv: c.uv_index,
      weatherCode: code
    };
    $('weatherImpactText').textContent = getWeatherImpact(weatherData);

    // Show section
    $('weather-section').classList.remove('hidden');
    $('weather-section').classList.add('fade-in');
  }

  // Expose globally so app.js can call it when a city is selected
  window._fetchWeather = fetchWeather;

})();
