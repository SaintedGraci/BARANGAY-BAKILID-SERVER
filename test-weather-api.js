import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const LOCATION = process.env.WEATHER_LOCATION || 'Mandaue,PH';

console.log('Testing OpenWeather API...');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('Location:', LOCATION);

async function testWeather() {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${LOCATION}&units=metric&appid=${API_KEY}`
    );

    console.log('\n✅ Weather API Response:');
    console.log('Temperature:', response.data.main.temp, '°C');
    console.log('Condition:', response.data.weather[0].main);
    console.log('Description:', response.data.weather[0].description);
    console.log('Location:', response.data.name, ',', response.data.sys.country);
    console.log('\nFull response data:', JSON.stringify({
      temperature: Math.round(response.data.main.temp),
      condition: response.data.weather[0].main,
      description: response.data.weather[0].description,
      feelsLike: Math.round(response.data.main.feels_like),
      location: `${response.data.name}, ${response.data.sys.country}`,
      icon: response.data.weather[0].icon,
    }, null, 2));
  } catch (error) {
    console.error('\n❌ Weather API Error:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testWeather();
