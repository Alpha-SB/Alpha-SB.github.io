//declares a default location of cookeville incase GPS fails
const objDefaultLocation = {
    strName: 'Cookeville, TN',
    numLatitude: 36.1628,
    numLongitude: -85.5016
}

// Maps Open-Meteo weather codes to user-friendly text and icons
const objWeatherCodeMap = {
    0: { strText: 'Clear Sky', strIconPath: 'icons/sun-fill.svg' },
    1: { strText: 'Mainly Clear', strIconPath: 'icons/sun-fill.svg' },
    2: { strText: 'Partly Cloudy', strIconPath: 'icons/cloud-sun-fill.svg' },
    3: { strText: 'Overcast', strIconPath: 'icons/cloud-fill.svg' },
    45: { strText: 'Fog', strIconPath: 'icons/cloud-fill.svg' },
    48: { strText: 'Rime Fog', strIconPath: 'icons/cloud-fill.svg' },
    51: { strText: 'Light Drizzle', strIconPath: 'icons/cloud-drizzle-fill.svg' },
    53: { strText: 'Drizzle', strIconPath: 'icons/cloud-drizzle-fill.svg' },
    55: { strText: 'Dense Drizzle', strIconPath: 'icons/cloud-drizzle-fill.svg' },
    61: { strText: 'Slight Rain', strIconPath: 'icons/cloud-drizzle-fill.svg' },
    63: { strText: 'Rain', strIconPath: 'icons/cloud-drizzle-fill.svg' },
    65: { strText: 'Heavy Rain', strIconPath: 'icons/cloud-drizzle-fill.svg' },
    71: { strText: 'Slight Snow', strIconPath: 'icons/cloud-snow-fill.svg' },
    73: { strText: 'Snow', strIconPath: 'icons/cloud-snow-fill.svg' },
    75: { strText: 'Heavy Snow', strIconPath: 'icons/cloud-snow-fill.svg' },
    80: { strText: 'Rain Showers', strIconPath: 'icons/umbrella.svg' },
    81: { strText: 'Rain Showers', strIconPath: 'icons/umbrella.svg' },
    82: { strText: 'Violent Rain Showers', strIconPath: 'icons/umbrella.svg' },
    95: { strText: 'Thunderstorm', strIconPath: 'icons/cloud-lightning-fill.svg' },
    96: { strText: 'Thunderstorm with Hail', strIconPath: 'icons/cloud-lightning-fill.svg' },
    99: { strText: 'Thunderstorm with Hail', strIconPath: 'icons/cloud-lightning-fill.svg' }
}

document.querySelector('#btnRefresh').addEventListener('click', loadWeather)

loadWeather()

function loadWeather() {
    // Hides old errors before each new API request
    document.querySelector('#txtError').classList.add('d-none')
    getUserLocation()
        .then(objLocation => fetchWeatherData(objLocation))
        .then(objData => renderWeather(objData))
        .catch(objError => {
            document.querySelector('#txtError').classList.remove('d-none')
            document.querySelector('#txtError').textContent = objError.message
        })
}

function getUserLocation() {
    return new Promise(resolve => {
        // If geolocation fails it will default to cookeville
        if (!navigator.geolocation) {
            resolve(objDefaultLocation)
            return
        }

        // It tries GPS location first then fallsback to default on timeout/denied permission
        navigator.geolocation.getCurrentPosition(
            objPosition => {
                resolve({
                    strName: 'Your Current Location',
                    numLatitude: objPosition.coords.latitude,
                    numLongitude: objPosition.coords.longitude
                })
            },
            () => resolve(objDefaultLocation),
            { enableHighAccuracy: true, timeout: 7000 }
        )
    })
}

function fetchWeatherData(objLocation) {
    // Build one API call to get current conditions and today's summary
    const strApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${objLocation.numLatitude}&longitude=${objLocation.numLongitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`

    return fetch(strApiUrl)
        .then(objResponse => {
            if (!objResponse.ok) {
                throw new Error('Unable to retrieve weather data right now.')
            }
            return objResponse.json()
        })
        .then(objApiData => {
            objApiData.objLocation = objLocation
            return objApiData
        })
}

function renderWeather(objApiData) {
    const objCurrent = objApiData.current
    const objDaily = objApiData.daily
    const numCode = objCurrent.weather_code
    const numTemperature = Math.round(objCurrent.temperature_2m)

    const objCondition = objWeatherCodeMap[numCode] || {
        strText: 'Unknown Conditions',
        strIconPath: 'icons/cloud-fill.svg'
    }

    document.querySelector('#txtLocation').textContent = `${objApiData.objLocation.strName} Weather`
    document.querySelector('#txtHeaderSummary').innerHTML = `${numTemperature}&deg; | ${objCondition.strText}`
    document.querySelector('#txtUpdated').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    document.querySelector('#txtTemperature').innerHTML = `${numTemperature}&deg;F`
    document.querySelector('#txtFeelsLike').innerHTML = `Feels like ${Math.round(objCurrent.apparent_temperature)}&deg;F`
    document.querySelector('#txtWind').textContent = `Wind ${Math.round(objCurrent.wind_speed_10m)} mph`
    document.querySelector('#txtHumidity').textContent = `${objCurrent.relative_humidity_2m}%`
    document.querySelector('#txtConditionText').textContent = objCondition.strText
    document.querySelector('#imgConditionIcon').src = objCondition.strIconPath
    document.querySelector('#imgConditionIcon').alt = objCondition.strText

    document.querySelector('#txtHighToday').innerHTML = `${Math.round(objDaily.temperature_2m_max[0])}&deg;F`
    document.querySelector('#txtLowToday').innerHTML = `${Math.round(objDaily.temperature_2m_min[0])}&deg;F`

    const objSunsetDate = new Date(objDaily.sunset[0])
    document.querySelector('#txtSunset').textContent = objSunsetDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

    // Use the daily max rain probability for a simple visual indicator
    const numRainChance = objDaily.precipitation_probability_max[0] || 0
    const objRainBar = document.querySelector('#divRainChanceBar')
    objRainBar.style.width = `${numRainChance}%`
    objRainBar.textContent = `${numRainChance}%`
    objRainBar.setAttribute('aria-valuenow', numRainChance.toString())

}

// AI usage disclosure 
// OpenAI Codex (GPT-5) was used to help implement the weathercodemap and comment this assignment code