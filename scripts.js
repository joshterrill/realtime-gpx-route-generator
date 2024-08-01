let map;

document.getElementById('gpxForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const startLocation = document.getElementById('startLocation').value;
    const endLocation = document.getElementById('endLocation').value;
    const time = document.getElementById('time').value;
    const steps = document.getElementById('steps').value;
    const travelMode = document.getElementById('travel-mode').value;

    generateGPX(startLocation, endLocation, time, steps, travelMode);
});

async function generateGPX(start, end, time, steps, travelMode) {
    const directionsService = new google.maps.DirectionsService();

    try {
        const startCoords = await geocodeAddress(start);
        const endCoords = await geocodeAddress(end);

        initializeMap(startCoords, endCoords);

        const route = await getRoute(startCoords, endCoords, travelMode);

        const gpxData = createGPX(route, time, steps);

        downloadGPX(gpxData);
        displayRouteOnMap(route);
    } catch (error) {
        console.error('Error:', error);
    }
}

function geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK') {
                resolve(results[0].geometry.location);
            } else {
                reject('Geocode was not successful for the following reason: ' + status);
            }
        });
    });
}

function getRoute(start, end, travelMode) {
    return new Promise((resolve, reject) => {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route({
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode[travelMode],
        },
        (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                resolve(response.routes[0].overview_path);
            } else {
                reject('Directions request failed due to ' + status);
            }
        }
        );
    });
}
function createGPX(route, time, steps) {
    const totalDistance = calculateTotalDistance(route);
    const stepDistance = totalDistance / steps;
    const totalDuration = time * 60;
    const stepDuration = totalDuration / steps;

    let currentTime = new Date();
    const metadataTime = formatGPXTime(currentTime);

    let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    gpx += `<gpx version="1.1" creator="Xcode">\n`;
    gpx += `    <metadata>\n`;
    gpx += `        <time>${metadataTime}</time>\n`;
    gpx += `    </metadata>\n`;

    let accumulatedDistance = 0;

    for (let i = 0; i < route.length - 1; i++) {
        const segmentDistance = google.maps.geometry.spherical.computeDistanceBetween(route[i], route[i + 1]);

        while (accumulatedDistance + stepDistance <= segmentDistance) {
            accumulatedDistance += stepDistance;
           
            const ratio = accumulatedDistance / segmentDistance;
           
            const interpolatedLat = route[i].lat() + ratio * (route[i + 1].lat() - route[i].lat());
            const interpolatedLng = route[i].lng() + ratio * (route[i + 1].lng() - route[i].lng());

           
            currentTime.setSeconds(currentTime.getSeconds() + stepDuration);
            const pointTime = formatGPXTime(currentTime);

           
            gpx += `    <wpt lat="${interpolatedLat}" lon="${interpolatedLng}">\n`;
            gpx += `        <time>${pointTime}</time>\n`;
            gpx += `    </wpt>\n`;
        }
       
        accumulatedDistance -= segmentDistance;
    }

    gpx += `</gpx>`;

    return gpx;
}

function calculateTotalDistance(route) {
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
        distance += google.maps.geometry.spherical.computeDistanceBetween(route[i], route[i + 1]);
    }
    return distance;
}
function formatGPXTime(date) {
    return date.toISOString().split('.')[0] + 'Z';
}

function downloadGPX(gpxData) {
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.getElementById('downloadLink');
    link.href = url;
    link.style.display = 'block';
}

function initializeMap(startCoords, endCoords) {
    const center = {
        lat: (startCoords.lat() + endCoords.lat()) / 2,
        lng: (startCoords.lng() + endCoords.lng()) / 2
    };

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: center
    });

    document.getElementById('map').style.display = 'block';
}

function displayRouteOnMap(route) {
    const path = route.map(point => ({
        lat: point.lat(),
        lng: point.lng()
    }));

    const routeLine = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 4
    });

    routeLine.setMap(map);
}