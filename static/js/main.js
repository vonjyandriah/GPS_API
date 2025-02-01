document.addEventListener('DOMContentLoaded', function() {
    // IMEI input validation
    const imeiInput = document.getElementById('imei');
    if (imeiInput) {
        imeiInput.addEventListener('input', function(e) {
            // Ne garder que les chiffres pour IMEI
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 16) {
                this.value = this.value.slice(0, 16);
            }
        });
    }

    // SIM input validation
    const simInput = document.getElementById('sim');
    if (simInput) {
        simInput.addEventListener('input', function(e) {
            // Permettre les chiffres et les espaces
            let value = this.value;
            value = value.replace(/[^0-9\s]/g, '');
            value = value.replace(/\s+/g, ' ');
            this.value = value.trim();
        });

        // Gérer le collage (paste)
        simInput.addEventListener('paste', function(e) {
            setTimeout(() => {
                let value = this.value;
                value = value.replace(/[^0-9\s]/g, '');
                value = value.replace(/\s+/g, ' ');
                this.value = value.trim();
            }, 0);
        });
    }

    // Search history management
    function saveToSearchHistory(searchData) {
        let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');

        // Vérifier si l'élément existe déjà (par IMEI ou SIM)
        const existingIndex = history.findIndex(item => 
            (searchData.imei && item.imei === searchData.imei) || 
            (searchData.sim && item.sim === searchData.sim)
        );

        if (existingIndex !== -1) {
            // Mettre à jour l'entrée existante
            history.splice(existingIndex, 1);
        }

        // Ajouter la nouvelle entrée au début
        if ((searchData.searchType === 'imei' && searchData.imei) || 
            (searchData.searchType === 'sim' && searchData.sim)) {
            history.unshift(searchData);
            if (history.length > 5) history.pop();
            localStorage.setItem('searchHistory', JSON.stringify(history));
            displaySearchHistory();
        }
    }

    function displaySearchHistory() {
        const searchHistory = document.getElementById('searchHistory');
        if (searchHistory) {
            const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            searchHistory.innerHTML = history.map(item => {
                let displayText = '';
                let searchTypeIcon = '';
                let details = [];

                if (item.searchType === 'imei') {
                    details.push(`IMEI: ${item.imei}`);
                    if (item.name) details.push(`Nom: ${item.name}`);
                    if (item.sim) details.push(`SIM: ${item.sim}`);
                    searchTypeIcon = 'barcode';
                } else {
                    details.push(`SIM: ${item.sim}`);
                    if (item.name) details.push(`Nom: ${item.name}`);
                    if (item.imei) details.push(`IMEI: ${item.imei}`);
                    searchTypeIcon = 'sim-card';
                }

                displayText = details.join(' | ');

                return `
                    <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                       onclick="event.preventDefault(); 
                                document.getElementById('${item.searchType}').value='${item.searchType === 'imei' ? item.imei : item.sim}';
                                document.querySelector('.nav-link[data-bs-target="#${item.searchType}-search"]').click();
                                document.getElementById('searchForm').submit();">
                        <span>
                            <i class="fas fa-${searchTypeIcon} me-2"></i>
                            ${displayText}
                        </span>
                        <span class="badge bg-primary rounded-pill">
                            <i class="fas fa-chevron-right"></i>
                        </span>
                    </a>
                `;
            }).join('');
        }
    }

    // Vérifier si la recherche a réussi et récupérer les données
    const deviceDataElement = document.getElementById('device-data');
    if (deviceDataElement) {
        try {
            const deviceData = JSON.parse(deviceDataElement.textContent);
            const searchData = {
                searchType: deviceData.searchType,
                imei: deviceData.imei,
                sim: deviceData.sim,
                name: deviceData.name
            };
            saveToSearchHistory(searchData);
        } catch (e) {
            console.error('Error parsing device data:', e);
        }
    }

    // Display search history on page load
    displaySearchHistory();

    // Alert auto-dismiss
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.classList.add('fade');
            setTimeout(() => {
                alert.remove();
            }, 500);
        }, 5000);
    });

    // Enable tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Language switcher
    const langSwitcher = document.querySelectorAll('[data-lang]');
    langSwitcher.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.dataset.lang;
            document.cookie = `lang=${lang};path=/`;
            window.location.reload();
        });
    });
});