javascript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard map
    const map = L.map('dashboardMap').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize activity chart
    const ctx = document.getElementById('activityChart').getContext('2d');
    const activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Active Devices',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Device Activity Over Time'
                }
            }
        }
    });

    // Update dashboard statistics
    function updateStats() {
        fetch('/api/stats')
            .then(response => response.json())
            .then(data => {
                document.getElementById('totalDevices').textContent = data.total;
                document.getElementById('activeDevices').textContent = data.active;
                document.getElementById('offlineDevices').textContent = data.offline;
                document.getElementById('alertStatus').textContent = data.alerts;

                // Update chart
                activityChart.data.labels = data.timeLabels;
                activityChart.data.datasets[0].data = data.activityData;
                activityChart.update();

                // Update map markers
                data.devices.forEach(device => {
                    L.marker([device.lat, device.lng])
                        .bindPopup(`Device: ${device.name}<br>Status: ${device.status}`)
                        .addTo(map);
                });
            })
            .catch(error => console.error('Error updating dashboard:', error));
    }

    // Initial update
    updateStats();

    // Update every 30 seconds
    setInterval(updateStats, 30000);
});