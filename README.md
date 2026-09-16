# 🌬️ AirSense — Real-Time AQI Prediction & Forecast

**AirSense** is a web-based air quality monitoring and AQI prediction application designed to help users understand the current air quality of a selected location.

The application provides **real-time air quality information, pollutant analysis, AQI prediction, weather information, an interactive India AQI map, visualizations, recent search history, and downloadable AQI reports**.

The project combines atmospheric data with the **US EPA AQI standard** to calculate and present an understandable air quality index.

---

## 📌 Project Overview

Air pollution is a major environmental concern that can directly affect human health and quality of life. Many users find raw pollutant measurements difficult to interpret.

AirSense addresses this problem by converting air-quality and pollutant information into an easy-to-understand **Air Quality Index (AQI)**.

Users can:

* Search for any city
* View air-quality information
* Calculate AQI from manually entered pollutant concentrations
* Identify the dominant pollutant
* View health advisories
* Check current weather conditions
* Explore AQI across major Indian cities
* View pollutant charts and a 7-day AQI forecast
* Maintain recent search history
* Download an AQI report as a PDF
* Switch between light and dark themes
* Enable automatic data refresh

---

## 🎯 Problem Statement

Air quality data is often available through different monitoring platforms, but users may have difficulty understanding raw pollutant concentrations and determining what those values mean for their health.

AirSense provides a centralized and interactive interface that converts pollutant information into an understandable AQI value and presents supporting weather and pollutant information.

---

## 💡 Objectives

The main objectives of AirSense are:

1. To provide an easy-to-use air-quality monitoring interface.
2. To calculate AQI using the **US EPA AQI standard**.
3. To allow users to search for air quality by city.
4. To support manual pollutant data entry and AQI prediction.
5. To identify the dominant pollutant affecting the AQI.
6. To provide health-related AQI advisories.
7. To display current weather conditions alongside air-quality information.
8. To visualize pollutant data using interactive charts.
9. To provide a 7-day AQI forecast trend.
10. To display air-quality information for major Indian cities on an interactive map.
11. To allow users to download an AQI report in PDF format.

---

## ✨ Key Features

### 🔎 1. City Search

Users can search for a city using the search bar.

The interface includes:

* City search
* Autocomplete suggestions
* Location information
* Latitude and longitude information
* Geolocation support

The application provides location information including city, country, and coordinates.

---

### 📡 2. Live API Data

AirSense includes a **Live API Data** mode for retrieving air-quality information from external data sources.

The interface also provides an **Auto-Refresh** option so that users can refresh air-quality information automatically.

---

### ⌨️ 3. Manual AQI Prediction

Users can manually enter pollutant concentrations and calculate the corresponding AQI.

Supported pollutants include:

| Pollutant | Unit  |
| --------- | ----- |
| PM2.5     | µg/m³ |
| PM10      | µg/m³ |
| NO₂       | ppb   |
| SO₂       | ppb   |
| CO        | ppm   |
| O₃        | ppb   |

The application provides a dedicated manual-input interface with validation ranges for these pollutants.

After entering the values, users can select **Predict AQI** to calculate the AQI.

---

### 📊 4. AQI Results

The AQI results section displays:

* AQI numerical value
* AQI category
* Health advisory
* Dominant pollutant
* Last updated time
* Pollutant information
* Downloadable report

The interface uses a visual AQI gauge to make the result easier to understand.

---

### ❤️ 5. Health Advisory

Based on the calculated AQI category, AirSense provides a corresponding health advisory.

This helps users understand the potential implications of the current air-quality level instead of viewing only a numerical AQI value.

---

### 🌫️ 6. Dominant Pollutant

The application identifies and displays the pollutant contributing most significantly to the calculated air-quality result.

This allows users to understand which pollutant is primarily affecting the AQI.

---

### 🌤️ 7. Current Weather

AirSense also displays current weather information.

Weather information includes:

* Current temperature
* Weather condition
* Feels-like temperature
* High temperature
* Low temperature
* Humidity
* Wind speed
* UV index
* Precipitation
* Wind direction
* Sunrise and sunset

The application also includes a **Weather & Air Quality Impact** section explaining how weather conditions can affect pollutant concentration.

---

### 🗺️ 8. India AQI Map

The application provides an interactive **India AQI Map**.

Users can click markers representing major Indian cities to view air-quality information.

The map includes AQI categories ranging from:

* Good
* Moderate
* Unhealthy for Sensitive Groups
* Unhealthy
* Very Unhealthy
* Hazardous

The application also provides a **Refresh Map Data** button.

---

### 📈 9. Data Visualization

AirSense provides multiple visualizations using Chart.js.

The project includes:

#### Pollutant Sub-Index Comparison

A bar chart compares pollutant sub-index values.

#### 7-Day AQI Forecast Trend

A line chart displays the AQI forecast trend over seven days.

#### Pollutant Composition

A doughnut chart visualizes pollutant composition.

These visualizations are included in the application's Visualization section.

---

### 🕒 10. Recent Search History

AirSense maintains a recent-search section containing information such as:

* City
* AQI
* AQI category
* Dominant pollutant
* Date
* Action

This allows users to review previously searched locations.

---

### 📄 11. PDF Report

Users can generate and download an AQI report using the **Download Report** option.

The project uses **jsPDF** for PDF generation.

---

### 🌙 12. Light/Dark Mode

AirSense includes a theme toggle that allows users to switch between light and dark mode.

---

## 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript

### Libraries and Frameworks

* **Leaflet.js** for interactive maps
* **Chart.js** for charts and data visualization
* **Font Awesome** for icons
* **jsPDF** for PDF report generation
* **Google Fonts / Poppins** for typography

The HTML implementation loads Leaflet.js, Font Awesome, Chart.js, jsPDF, and Poppins through external resources.
