const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// WeatherAPI configuration
const API_KEY = '58a219c7dbf14a82ad074206240307';
const BASE_URL = 'http://api.weatherapi.com/v1';

// IP Geolocation API configuration
const GEO_API_KEY = '4c1986eb3f1641208e682ece0c3eda99';
const GEO_API_URL = 'https://api.ipgeolocation.io/ipgeo';

// API endpoint
app.get('/api/hello', async (req, res) => {
  const visitorName = req.query.visitor_name;

  // Get IP from X-Forwarded-For header, if available
  let clientIp = req.headers['x-forwarded-for'];

  // If X-Forwarded-For is not available, use req.socket.remoteAddress as a fallback
  if (!clientIp) {
    clientIp = req.socket.remoteAddress;
  }

  // If still no IP, send an error response
  if (!clientIp) {
    return res.status(400).json({ error: 'Unable to determine client IP address.' });
  }

  try {
    // Fetch the visitor's location based on IP address
    const geoResponse = await axios.get(`${GEO_API_URL}?apiKey=${GEO_API_KEY}&ip=${clientIp}`);

    // Check for API errors
    if (geoResponse.status !== 200) {
      throw new Error(geoResponse.data.message);
    }

    const { city } = geoResponse.data;
    const location = `${city}`;

    // Fetch the weather data from WeatherAPI
    const weatherResponse = await axios.get(`${BASE_URL}/current.json?key=${API_KEY}&q=${location}&aqi=no`);

    const { name: cityName } = weatherResponse.data.location;
    const { temp_c } = weatherResponse.data.current;

    res.json({
      client_ip: clientIp,
      location: `${cityName}`,
      greeting: `Hello, ${visitorName}! The temperature is ${temp_c} degrees Celsius in ${cityName}.`,
    });
  } catch (error) {
    console.error('Error fetching weather or geolocation data:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});