from flask import Flask, jsonify, request, render_template, send_file, g
from flask_babel import Babel
from flask_caching import Cache
import requests
import csv
from io import BytesIO
import logging
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = "your-secret-key-here"

# Configure caching
cache = Cache(app, config={
    'CACHE_TYPE': 'simple',
    'CACHE_DEFAULT_TIMEOUT': 300
})

# Configure internationalization
babel = Babel(app)

# Supported languages
LANGUAGES = {
    'en': 'English',
    'fr': 'Français'
}

def get_locale():
    # Try to get the language from the request first
    lang = request.args.get('lang')
    if lang and lang in LANGUAGES:
        return lang
    # Then try to detect it from the browser
    return request.accept_languages.best_match(LANGUAGES.keys())

babel.init_app(app, locale_selector=get_locale)

def format_sim_number(sim):
    if not sim:
        return None
    # Supprimer tous les caractères non numériques
    digits = ''.join(c for c in sim if c.isdigit())
    logger.debug(f"SIM number digits after cleaning: {digits}")

    if len(digits) >= 9:  # Au moins 9 chiffres pour un numéro valide
        # Essayer différents formats
        if digits.startswith('032'):
            formatted = f"{digits[:3]} {digits[3:5]} {digits[5:8]} {digits[8:]}"
            logger.debug(f"Formatted SIM number: {formatted}")
            return formatted

    logger.debug(f"Returning original SIM number: {sim}")
    return sim

def clean_input(text, keep_spaces=False):
    if not text:
        return None
    if keep_spaces:
        return format_sim_number(text)
    return ''.join(c for c in text if c.isdigit())

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/search_history')
def get_search_history():
    history = request.cookies.get('search_history')
    if history:
        return jsonify(json.loads(history))
    return jsonify([])

@app.route('/data', methods=['GET', 'POST'])
def display_data():
    items = []
    imei = None
    sim = None
    error_message = None

    if request.method == 'POST':
        imei = clean_input(request.form.get('imei'))
        sim = clean_input(request.form.get('sim'), keep_spaces=True)
        logger.debug(f"Recherche avec IMEI: {imei}, SIM: {sim}")

        if imei or sim:
            try:
                # URL de l'API
                url = "https://gps-gps.online/api/get_devices"
                querystring = {
                    "lang": "en",
                    "user_api_hash": "$2y$10$J0/6yiODpvMhgBmpLFa8BuAX3JaxzP4U3Y32hUJm32YKFG5Ovroka"
                }

                if imei:
                    querystring["imei"] = imei
                elif sim:
                    querystring["sim_number"] = sim

                headers = {"Accept": "application/json"}
                logger.debug(f"API request params: {querystring}")
                response = requests.get(url, headers=headers, params=querystring)
                logger.debug(f"API response status: {response.status_code}")
                logger.debug(f"API full URL: {response.url}")

                if response.status_code == 200:
                    data = response.json()
                    logger.debug(f"API response data: {data}")
                    if data and len(data) > 0:
                        device_data = data[0]  # Prendre le premier appareil
                        items = device_data.get('items', [])
                        if not items:
                            logger.debug(f"No items found in response for SIM: {sim}")
                    else:
                        error_message = "Aucune donnée disponible pour cet appareil."
                        logger.debug(f"No data in response for SIM: {sim}")
                else:
                    error_message = f"Erreur lors de la requête : {response.status_code}"
                    logger.error(f"API request failed with status {response.status_code}")

            except Exception as e:
                error_message = str(e)
                logger.error(f"Error fetching data: {e}")

    return render_template('data.html', 
                         items=items, 
                         imei=imei,
                         sim=sim,
                         error_message=error_message)

@cache.memoize(timeout=300)
def get_device_data(imei):
    url = "https://gps-gps.online/api/get_devices"
    querystring = {
        "lang": "en",
        "user_api_hash": "$2y$10$J0/6yiODpvMhgBmpLFa8BuAX3JaxzP4U3Y32hUJm32YKFG5Ovroka",
        "imei": imei
    }
    headers = {"Accept": "application/json"}

    response = requests.get(url, headers=headers, params=querystring)

    if response.status_code != 200:
        raise Exception("La requête API a échoué")

    data = response.json()
    if not data:
        raise Exception("Aucune donnée disponible pour cet IMEI")

    return data

@app.route('/advanced_search', methods=['POST'])
def advanced_search():
    search_params = request.get_json()
    # Implement advanced search logic here
    return jsonify({"status": "success", "message": "Recherche terminée"})

@app.route('/export/<imei>')
def export_data(imei):
    try:
        data = get_device_data(imei)

        if data and len(data) > 0:
            items = data[0].get('items', [])
            if items:
                output = BytesIO()
                output.write(u'\ufeff'.encode('utf-8'))  # BOM pour Excel
                writer = csv.writer(output, delimiter=',', quoting=csv.QUOTE_MINIMAL)

                # Écrire l'en-tête
                writer.writerow(['Propriété', 'Valeur'])

                # Écrire les données
                for item in items:
                    name = item.get('name', '')
                    value = item.get('value', '')
                    writer.writerow([name, value])

                output.seek(0)
                return send_file(
                    output,
                    mimetype='text/csv',
                    as_attachment=True,
                    download_name=f'device_data_{imei}.csv'
                )
        return "Aucune donnée à exporter", 404

    except Exception as e:
        logger.error(f"Erreur d'exportation: {e}")
        return "L'exportation a échoué", 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
