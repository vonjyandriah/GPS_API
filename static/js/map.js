document.addEventListener('DOMContentLoaded', function() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Récupérer les données de localisation depuis le template
    const deviceLocationElement = document.getElementById('device-location-data');
    console.log('Device location element:', deviceLocationElement); // Debug log
    const deviceLocation = deviceLocationElement ? JSON.parse(deviceLocationElement.textContent) : null;
    console.log('Parsed device location:', deviceLocation); // Debug log

    // Initialiser la carte
    const map = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Si nous avons des coordonnées valides, afficher le marqueur
    if (deviceLocation && deviceLocation.lat && deviceLocation.lng) {
        console.log('Setting marker at:', deviceLocation.lat, deviceLocation.lng); // Debug log
        const position = [deviceLocation.lat, deviceLocation.lng];

        // Créer un marqueur personnalisé avec une icône
        const deviceIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            shadowSize: [41, 41]
        });

        // Ajouter le marqueur à la carte
        L.marker(position, {icon: deviceIcon})
            .bindPopup(`
                <div class="device-popup">
                    <h5>Position actuelle</h5>
                    <p>Dernière mise à jour: ${deviceLocation.last_update || 'N/A'}</p>
                    <p>Vitesse: ${deviceLocation.speed || 0} km/h</p>
                    <p>Latitude: ${deviceLocation.lat}</p>
                    <p>Longitude: ${deviceLocation.lng}</p>
                </div>
            `)
            .addTo(map);

        // Centrer la carte sur la position du dispositif
        map.setView(position, 13);
    } else {
        console.log('No valid coordinates found, showing world view'); // Debug log
        map.setView([0, 0], 2);
    }
});