const apiKey = "8ce41c5a9754486295710916232906"
const forecastApiURL = "http://api.weatherapi.com/v1/forecast.json?key=<key>&q=<location>&aqi=no&days=<days>"
let locationString = ""
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let currentLocationData = null;

//set location to toronto by default
document.getElementById("locationField").value = "Toronto"

//metric by default
let metric = true
let imperial = false

//pointers to the slider switch and the units display label elements in the dom
const untisSwitch = document.getElementById("untsSwitch");
const unitsDisplay = document.getElementById("unitsDisplay");


const fetchWeather = function(){
    //current weather
    locationString = document.getElementById("locationField").value

    //forecast request string       (we always get the 14 day forecast since it contains all the data needed for: current, 24hour, 7 day and 14 day)
    let requestString = forecastApiURL.replace("<key>", apiKey).replace("<location>", locationString).replace("<days>", 14)



    //check if the weather data is still in memory: if so, update the page with it, otherwise make a new api call
    //      -> so we need to make sure the data in memory is: pertaining to the same location, and the most recent possible data (data that wass last updated < 15 minutes ago)

    var minutesSinceLastWeatherWasUpdated;

    if(currentLocationData != null && locationString === currentLocationData[0]){
        //minutes since the data we have stored was updated
        minutesSinceLastWeatherWasUpdated = (currentLocationData[1].location.localtime_epoch-currentLocationData[1].current.last_updated_epoch)/60;

        if(minutesSinceLastWeatherWasUpdated<15){
            //set values of weather page based off of what we have stored in memory
            updatePageValues(currentLocationData[1]);
        }
        else{
            //make api call
            get14DayForecast(requestString);
        }
    }else{
        //make api call
        get14DayForecast(requestString);
    }

}

//get weather
fetchWeather();



function updatePageValues(data){
    // set the location, and timestamps
    document.getElementById("location").innerHTML = data.location.name+", "+data.location.region+", "+data.location.country
    document.getElementById("timestamp").innerHTML = data.location.localtime
    document.getElementById("lastUpdatedTime").innerHTML = data.current.last_updated

    //set the current weather conditions inside first rectangle using the api response: data
    setCurrentData(data);
    
    //set the contents of second rectangle based off what option is currently selected in the drop down menu with id "durations" and using the api response: data
    if(document.getElementById("durations").value === "24hour"){
        set24HourData(data);
    }
    else if(document.getElementById("durations").value === "7day"){
        setMultipleDayData(data, 7);
    }
    else if(document.getElementById("durations").value === "14day"){
        setMultipleDayData(data, 14);
    }
}


async function get14DayForecast(requestString){
    try{
        const response = await fetch(requestString)
        const data = await response.json()
        fetchSucessful = true

        //console.log(data)
        
        //store an array containing a deep copy of the string used in api request to refer to the location, and the data of the api response 
        //(this is used to avoid making multiple sucessive calls for the same data)
        currentLocationData = [(' ' + locationString).slice(1), data];



        updatePageValues(data);
        

    }catch(error){
        console.log("There was an error in your api call: "+error)
    }


    
}



function setCurrentData(data){
        
        if(metric){
            document.getElementById("temperature").innerHTML = data.current.temp_c+"°C"
            document.getElementById("feelsLike").innerHTML = data.current.feelslike_c+"°C"

            document.getElementById("windSpeed").innerHTML = data.current.wind_kph+"km/h"
            document.getElementById("windGustSpeed").innerHTML = data.current.gust_kph+"km/h"
        }
        else{
            document.getElementById("temperature").innerHTML = data.current.temp_f+"°F"
            document.getElementById("feelsLike").innerHTML = data.current.feelslike_f+"°F"

            document.getElementById("windSpeed").innerHTML = data.current.wind_mph+"mi/h"
            document.getElementById("windGustSpeed").innerHTML = data.current.gust_mph+"mi/h"
        }

        document.getElementById("conditionText").innerHTML = data.current.condition.text

        document.getElementById("windDirection").innerHTML = data.current.wind_dir
        document.getElementById("humidity").innerHTML = data.current.humidity+"%"
        document.getElementById("uv").innerHTML = data.current.uv+" mW/m2"
}



function set24HourData(data){
    const gridContainer = document.getElementById("grid-container")
    const gridItems = gridContainer.getElementsByClassName("grid-item")
    document.getElementById("infoLabelForecast").innerHTML = "24 Hours";
    

    //remove all existing grid items
    for(i=0; i<gridItems.length; i){
        
        gridItems[i].remove();
    }
    

    //add 24 grid items and add information to the 24 grid items
    const currentHour=(new Date()).getHours();
    let hour = currentHour+1;
    let day = 0;
    for(i = 0; i<24; i++){
        const div = document.createElement("div");


        //          |time element|
        const time = document.createElement("span");
        if(hour%12==0){
            time.innerHTML = 12;
        }else{
            time.innerHTML = hour%12;
        }
        if(12/hour>1){
            time.innerHTML+="am"
        }else{
            time.innerHTML+="pm"
        }
        time.className = "grid-item-medium";


        //          |temperature element|
        const temperature = document.createElement("span");
        if(metric){
            temperature.innerHTML = data.forecast.forecastday[day].hour[hour].temp_c+"°C";
        }else{
            temperature.innerHTML = data.forecast.forecastday[day].hour[hour].temp_f+"°F";
        }
        temperature.className = "grid-item-large";

        
        //          |precip element|
        const precip = document.createElement("span")
        if(metric){
            precip.innerHTML = data.forecast.forecastday[day].hour[hour].precip_mm+"mm 🌧";
        }else{
            precip.innerHTML = data.forecast.forecastday[day].hour[hour].precip_in+"\" 🌧";
        }
        precip.className = "grid-item-small";
        

        //add the elements to grid item
        div.appendChild(time);
        div.appendChild(document.createElement("br"));
        div.appendChild(temperature);
        div.appendChild(document.createElement("br"));
        div.appendChild(precip);
        div.appendChild(document.createElement("br"));
        div.className = "grid-item";

        //update styles
        div.style.width = "10%";

        //add grid item to grid container
        gridContainer.appendChild(div);

        if(hour===23){
            hour=0;
            day=1;
        }else{
            hour++;
        }
    }

    //update styles for more concise data
    gridContainer.style.height = "100px";
    document.getElementsByClassName("grid-item").array.forEach(element => {
        element.style.width = "14%";
    });
    
}

function setMultipleDayData(data, numDays){
    const gridContainer = document.getElementById("grid-container")
    const gridItems = gridContainer.getElementsByClassName("grid-item")
    
    

    document.getElementById("infoLabelForecast").innerHTML = numDays+" Days";

    //remove all existing grid items
    for(i=0; i<gridItems.length; i){
        
        gridItems[i].remove();
    }
    

    //add 14 grid items and add information to the 14 grid items
    //determine day of week
    const currentDayOfWeek = (new Date()).getDay();
    let dayOfWeek = currentDayOfWeek;
    let date = new Date();
    for(day = 0; day<numDays; day++){

        //create grid item
        const div = document.createElement("div");


        //          |day of week text element|
        //create text element
        const dayOfWeekElement = document.createElement("span");
        //set text element to day of week
        dayOfWeekElement.innerHTML = daysOfWeek[date.getDay()];
        dayOfWeekElement.className = "grid-item-large";

        //          |Date element|
        //create text element
        const dateElement = document.createElement("span");
        //set text element to day of week
        dateElement.innerHTML = `${months[date.getMonth()]} ${date.getDate()}`;
        dateElement.className = "grid-item-small";




        //          |temperature element: high|
        const temperature = document.createElement("span");
        if(metric){
            temperature.innerHTML = data.forecast.forecastday[day].day.maxtemp_c+"°C";
        }else{
            temperature.innerHTML = data.forecast.forecastday[day].day.maxtemp_f+"°F";
        }
        temperature.className = "grid-item-large";

        //          |temperature element: low|
        const temperatureNight = document.createElement("span");
        if(metric){
            temperatureNight.innerHTML = data.forecast.forecastday[day].day.mintemp_c+"°C Night";
        }else{
            temperatureNight.innerHTML = data.forecast.forecastday[day].day.mintemp_f+"°F Night";
        }
        temperatureNight.className = "grid-item-small";

        
        //precip amount element
        const precipAmoount = document.createElement("span");

        if(metric){
            precipAmoount.innerHTML = data.forecast.forecastday[day].day.totalprecip_mm+"mm";
        }else{
            precipAmoount.innerHTML = data.forecast.forecastday[day].day.totalprecip_in+"\"";
        }
        precipAmoount.className = "grid-item-small";
        
        //precip chance element
        const precipChance = document.createElement("span")
        if(metric){
            precipChance.innerHTML = data.forecast.forecastday[day].day.daily_chance_of_rain+"% 🌧";
        }else{
            precipChance.innerHTML = data.forecast.forecastday[day].day.daily_chance_of_rain+"% 🌧";
        }
        precipChance.className = "grid-item-small";
        

        //add the elements
        div.appendChild(dayOfWeekElement);
        div.appendChild(document.createElement("br"));
        div.appendChild(dateElement);
        div.appendChild(document.createElement("br"));
        div.appendChild(temperature);
        div.appendChild(document.createElement("br"));
        div.appendChild(temperatureNight);
        div.appendChild(document.createElement("br"));
        //display total precip amount if it is nonzero
        if(data.forecast.forecastday[day].day.totalprecip_mm>0){
            div.appendChild(precipAmoount);
        }
        div.appendChild(document.createElement("br"));
        div.appendChild(precipChance);
        div.appendChild(document.createElement("br"));
        div.className = "grid-item";


        //add grid item to grid container
        gridContainer.appendChild(div);

        //increment the day
        date.setDate(date.getDate()+1);

    }

    //update styles for more verbose daily data 
    gridContainer.style.height = "150px";
    document.getElementsByClassName("grid-item").array.forEach(element => {
        element.style.width = "14%";
    });

}



untsSwitch.onclick = function(){
    if(untisSwitch.checked){
        metric = false
        imperial = true
        unitsDisplay.innerHTML= "Imperial"
    }else{
        metric = true
        imperial = false
        unitsDisplay.innerHTML= "Metric"
    }
    fetchWeather();
}

document.getElementById("enterButton").onclick = fetchWeather

function handleTextBoxKey(e){
    if(e.keyCode === 13 && document.getElementById("locationField").value !== ""){
        e.preventDefault(); // Ensure it is only this code that runs

        fetchWeather()
    }
}