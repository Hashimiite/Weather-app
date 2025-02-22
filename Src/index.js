const container = document.querySelector('.container');
const searchButton = document.querySelector('#search-button');
const locationInput = document.querySelector('#location-input');
const weatherBox = document.querySelector('#weather-box');
const weatherDetails = document.querySelector('#weather-details');
const notFound = document.querySelector('#not-found');
const loading = document.querySelector('#loading');
const suggestionsContainer = document.querySelector('#suggestions');

const APIKey = 'YOUR-API-KEY';
let debounceTimeout;
const suggestionCache = {}; // Cache for search suggestions

// Event listener for search button
searchButton.addEventListener('click', () => {
    const city = locationInput.value.trim();
    if (city === '') return;

    fetchWeather(city);
});

// Event listener for Enter key
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = locationInput.value.trim();
        if (city === '') return;

        fetchWeather(city);
    }
});

// Event listener for input (search suggestions) with debouncing
locationInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout); // Clear previous timeout
    const query = locationInput.value.trim();

    if (query.length < 3) {
        suggestionsContainer.style.display = 'none'; // Hide suggestions if query is too short
        return;
    }

    // Debounce: Wait 300ms after the user stops typing
    debounceTimeout = setTimeout(async () => {
        const suggestions = await fetchSuggestions(query);
        displaySuggestions(suggestions);
    }, 300);
});

// Fetch weather data
async function fetchWeather(city) {
    loading.style.display = 'block';
    weatherBox.style.display = 'none';
    weatherDetails.style.display = 'none';
    notFound.style.display = 'none';

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${APIKey}`
        );
        const data = await response.json();
        console.log(data); // Log the API response

        if (data.cod === '404') {
            showError();
            return;
        }

        displayWeather(data);
    } catch (error) {
        console.error('Error fetching weather:', error); // Log any errors
        showError();
    } finally {
        loading.style.display = 'none';
    }
}

// Display  data
function displayWeather(data) {
    const weatherIcon = document.querySelector('#weather-icon');
    const temperature = document.querySelector('#temperature');
    const description = document.querySelector('#description');
    const humidity = document.querySelector('#humidity');
    const windSpeed = document.querySelector('#wind-speed');

    weatherIcon.src = getWeatherIcon(data.weather[0].main);
    temperature.innerHTML = `${Math.round(data.main.temp)}<span>°C</span>`;
    description.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${Math.round(data.wind.speed)} km/h`;

    weatherBox.style.display = '';
    weatherDetails.style.display = '';
    weatherBox.classList.add('fadeIn');
    weatherDetails.classList.add('fadeIn');
    container.style.height = '590px';
}

// Fetch search suggestions
async function fetchSuggestions(query) {
    if (suggestionCache[query]) {
        return suggestionCache[query]; // Return cached suggestions 
    }

    const url = `https://api.openweathermap.org/data/2.5/find?q=${query}&type=like&sort=population&cnt=5&appid=${APIKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        suggestionCache[query] = data.list; // Cache the results
        return data.list; // Return an array of matching locations
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
}

// Display search suggestions
function displaySuggestions(suggestions) {
    if (suggestions.length === 0) {
        suggestionsContainer.style.display = 'none'; // Hide if no suggestions
        return;
    }

    // Clear previous suggestions
    suggestionsContainer.innerHTML = '';

    // Add new suggestions
    suggestions.forEach(city => {
        const suggestion = document.createElement('div');
        suggestion.textContent = `${city.name}, ${city.sys.country}`;
        suggestion.addEventListener('click', () => {
            locationInput.value = `${city.name}, ${city.sys.country}`; // Fill input with selected suggestion
            suggestionsContainer.style.display = 'none'; // Hide suggestions
            fetchWeather(city.name); // Fetch weather for the selected city
        });
        suggestionsContainer.appendChild(suggestion);
    });

    suggestionsContainer.style.display = 'block'; // Show suggestions
}

// Get weather icon based on weather condition
function getWeatherIcon(weatherCondition) {
    switch (weatherCondition) {
        case 'Clear':
            return 'clear.png';
        case 'Rain':
            return 'rain.png';
        case 'Snow':
            return 'snow.png';
        case 'Clouds':
            return 'cloud.png';
        case 'Haze':
            return 'mist.png';
        default:
            return '';
    }
}

// Show error message
function showError() {
    container.style.height = '400px';
    notFound.style.display = 'block';
    notFound.classList.add('fadeIn');
}

// Hide suggestions when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-box')) {
        suggestionsContainer.style.display = 'none';
    }
});