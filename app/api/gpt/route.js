import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import { NextResponse } from 'next/server';

// Replace with your actual API keys
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GPT_API_KEY);

export async function POST(req) {
  try {
    // Parse the request body
    const { prompt } = await req.json();
    console.log(`Received prompt: ${prompt}`);

    // Validate prompt
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // Convert prompt to lowercase and trim
    const lowerPrompt = prompt.toLowerCase().trim();

    // Always start with assistance prompt
    const assistancePrompt = "How may I assist you?";
    if (lowerPrompt === assistancePrompt.toLowerCase()) {
      return NextResponse.json({ text: assistancePrompt });
    }

    // Define keywords and prepositions
    const weatherKeywords = ['weather'];
    const prepositions = ['in', 'for', 'of', 'about', 'at'];

    // Tokenize the prompt
    const tokens = lowerPrompt.split(/\s+/);

    // Check if the prompt is likely a city name
    if (tokens.length === 1 && /^[a-zA-Z\s]+$/.test(tokens[0])) {
      // Single token that is alphabetic is assumed to be a city name
      let city = tokens[0];
      console.log(`Fetching weather for city: ${city}`);

      // Fetch city weather data
      const weatherResponse = await fetch(`${WEATHER_API_URL}?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
      const weatherData = await weatherResponse.json();
      console.log('Weather data:', weatherData);

      if (weatherData.cod === '404') {
        // Use GPT to correct the city name if not found
        const correctionPrompt = `I couldn't find the weather data for "${city}". Can you help me correct the city name?`;
        const correctionResult = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent(correctionPrompt);
        const correctedCity = await correctionResult.response.text().trim();
        
        if (correctedCity && correctedCity !== city) {
          city = correctedCity;
          const correctedWeatherResponse = await fetch(`${WEATHER_API_URL}?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
          const correctedWeatherData = await correctedWeatherResponse.json();
          console.log('Corrected weather data:', correctedWeatherData);
          
          if (correctedWeatherData.cod === '404') {
            return NextResponse.json({ text: `Sorry, I couldn't find the weather data for "${city}". Please make sure the city name is correct and try again.` });
          }

          if (correctedWeatherData.cod !== 200) {
            return NextResponse.json({ text: `Unable to fetch weather data: ${correctedWeatherData.message}` });
          }

          // Format the weather information with additional details
          const weatherInfo = `The current weather in ${city} is ${correctedWeatherData.weather[0].description}. 
          Temperature: ${correctedWeatherData.main.temp}°C, 
          Humidity: ${correctedWeatherData.main.humidity}%, 
          Wind Speed: ${correctedWeatherData.wind.speed} m/s.`;
          return NextResponse.json({ text: weatherInfo });
        }
        
        return NextResponse.json({ text: `Sorry, I couldn't correct the city name. Please try again.` });
      }

      if (weatherData.cod !== 200) {
        const errorMessage = `Unable to fetch weather data: ${weatherData.message}`;
        console.error('Weather data fetch error:', errorMessage);
        return NextResponse.json({ text: errorMessage });
      }

      // Format the weather information with additional details
      const weatherInfo = `The current weather in ${city} is ${weatherData.weather[0].description}. 
      Temperature: ${weatherData.main.temp}°C, 
      Humidity: ${weatherData.main.humidity}%, 
      Wind Speed: ${weatherData.wind.speed} m/s.`;
      console.log('Weather information:', weatherInfo);

      return NextResponse.json({ text: weatherInfo });
    }

    // Find index of "weather" keyword
    let weatherQueryIndex = tokens.findIndex(token => weatherKeywords.includes(token));
    if (weatherQueryIndex !== -1) {
      // Check for a preposition following the "weather" keyword
      const prepositionIndex = tokens.findIndex((token, index) => {
        return prepositions.includes(token) && index > weatherQueryIndex;
      });

      let cityStartIndex = prepositionIndex !== -1 ? prepositionIndex + 1 : weatherQueryIndex + 1;

      // Extract and clean city name
      if (cityStartIndex < tokens.length) {
        let city = tokens.slice(cityStartIndex).join(' ').trim();
        city = city.replace(/^\b(?:a|the|an)\b\s*/i, '').trim();
        city = city.replace(/[^a-zA-Z\s]/g, '').trim();

        if (city) {
          console.log(`Fetching weather for city: ${city}`);

          // Fetch city weather data
          const weatherResponse = await fetch(`${WEATHER_API_URL}?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
          const weatherData = await weatherResponse.json();
          console.log('Weather data:', weatherData);

          if (weatherData.cod === '404') {
            // Use GPT to correct the city name if not found
            const correctionPrompt = `I couldn't find the weather data for "${city}". Can you help me correct the city name?`;
            const correctionResult = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent(correctionPrompt);
            const correctedCity = await correctionResult.response.text().trim();
            
            if (correctedCity && correctedCity !== city) {
              city = correctedCity;
              const correctedWeatherResponse = await fetch(`${WEATHER_API_URL}?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
              const correctedWeatherData = await correctedWeatherResponse.json();
              console.log('Corrected weather data:', correctedWeatherData);
              
              if (correctedWeatherData.cod === '404') {
                return NextResponse.json({ text: `Sorry, I couldn't find the weather data for "${city}". Please make sure the city name is correct and try again.` });
              }

              if (correctedWeatherData.cod !== 200) {
                return NextResponse.json({ text: `Unable to fetch weather data: ${correctedWeatherData.message}` });
              }

              // Format the weather information with additional details
              const weatherInfo = `The current weather in ${city} is ${correctedWeatherData.weather[0].description}. 
              Temperature: ${correctedWeatherData.main.temp}°C, 
              Humidity: ${correctedWeatherData.main.humidity}%, 
              Wind Speed: ${correctedWeatherData.wind.speed} m/s.`;
              return NextResponse.json({ text: weatherInfo });
            }
            
            return NextResponse.json({ text: `Sorry, I couldn't correct the city name. Please try again.` });
          }

          if (weatherData.cod !== 200) {
            const errorMessage = `Unable to fetch weather data: ${weatherData.message}`;
            console.error('Weather data fetch error:', errorMessage);
            return NextResponse.json({ text: errorMessage });
          }

          // Format the weather information with additional details
          const weatherInfo = `The current weather in ${city} is ${weatherData.weather[0].description}. 
          Temperature: ${weatherData.main.temp}°C, 
          Humidity: ${weatherData.main.humidity}%, 
          Wind Speed: ${weatherData.wind.speed} m/s.`;
          console.log('Weather information:', weatherInfo);

          return NextResponse.json({ text: weatherInfo });
        }
      }
    }

    // Check for developer-related queries
    const creatorRegex = /(who\s+made\s+you|who\s+created\s+you|who\s+developed\s+you|who\s+are\s+you|who\s+is\s+behind\s+you)/i;
    const datasetRegex = /(which\s+dataset\s+do\s+you\s+use|data\s+source)/i;

    if (creatorRegex.test(lowerPrompt)) {
      const customResponse = `I am developed by Ihtesham Jahangir at Alpha Networks. I am designed to assist with various tasks and provide information. If you have any questions or need help, feel free to ask!`;
      console.log('Custom response:', customResponse);
      return NextResponse.json({ text: customResponse });
    }

    if (datasetRegex.test(lowerPrompt)) {
      const customResponse = `I use a variety of datasets and sources, including the OpenWeather API for weather information and a range of other data sources to generate responses. My capabilities are constantly updated to provide accurate and relevant information.`;
      console.log('Custom response:', customResponse);
      return NextResponse.json({ text: customResponse });
    }

    // For other types of prompts, use the GPT model to generate content
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = await result.response.text(); // Await the text() method

    console.log('GPT response:', responseText);

    // Send the response back to the client
    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}
