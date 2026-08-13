import express from 'express';
import axios from 'axios';
import logger from '../config/logger.js';

const router = express.Router();

// Weather API endpoint (using OpenWeatherMap as example)
router.get('/', async (req, res) => {
  try {
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    const LOCATION = process.env.WEATHER_LOCATION || 'Mandaue,PH'; // Default to Mandaue, Philippines

    if (!API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Weather service not configured',
      });
    }

    // Call OpenWeatherMap API
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${LOCATION}&units=metric&appid=${API_KEY}`
    );

    const weatherData = {
      temperature: Math.round(response.data.main.temp),
      condition: response.data.weather[0].main,
      description: response.data.weather[0].description,
      feelsLike: Math.round(response.data.main.feels_like),
      location: `${response.data.name}, ${response.data.sys.country}`,
      icon: response.data.weather[0].icon,
    };

    res.json(weatherData);
  } catch (error) {
    logger.error('Weather API error:', error.message);
    res.status(503).json({
      success: false,
      message: 'Weather service unavailable',
    });
  }
});

export default router;
