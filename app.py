from flask import Flask, render_template, jsonify, request
import requests
import time
from database import init_db, log_event, get_logs

app = Flask(__name__, template_folder='.')

# ESP32 Configuration
ESP32_URL = "http://esp32.local"  # Update this as needed
MAX_DISPENSE_ML = 60

# Global state to prevent concurrent dispensing
is_pouring = False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/status')
def status():
    try:
        # Attempt to reach ESP32
        # In a real scenario, this might timeout if ESP32 is offline
        resp = requests.get(f"{ESP32_URL}/status", timeout=1.0)
        esp_status = resp.json()
        online = True
    except Exception as e:
        esp_status = {
            "state": "offline",
            "glass_present": False,
            "error": str(e),
            "uptime": 0,
            "last_pour_ml": 0
        }
        online = False

    return jsonify({
        "server_online": True,
        "esp_online": online,
        "esp_status": esp_status,
        "timestamp": time.time(),
        "is_pouring": is_pouring
    })

@app.route('/api/dispense', methods=['POST'])
def dispense():
    global is_pouring
    
    data = request.json
    amount_ml = data.get('amount_ml', 0)
    user_token = data.get('user_token', 'anonymous')

    # Basic safety checks
    if is_pouring:
        log_event(user_token, amount_ml, "failed", "Already pouring")
        return jsonify({"success": False, "reason": "Already pouring"}), 400
    
    if amount_ml <= 0 or amount_ml > MAX_DISPENSE_ML:
        log_event(user_token, amount_ml, "failed", f"Invalid amount: {amount_ml}ml")
        return jsonify({"success": False, "reason": f"Invalid amount (max {MAX_DISPENSE_ML}ml)"}), 400

    try:
        # Check ESP32 status before pouring
        status_resp = requests.get(f"{ESP32_URL}/status", timeout=1.0)
        current_status = status_resp.json()
        
        if not current_status.get('glass_present', False):
            log_event(user_token, amount_ml, "failed", "No glass present")
            return jsonify({"success": False, "reason": "No glass present"}), 400
        
        if current_status.get('state') != 'idle':
            log_event(user_token, amount_ml, "failed", f"ESP32 not idle: {current_status.get('state')}")
            return jsonify({"success": False, "reason": "Device is busy"}), 400

        # Start dispense
        is_pouring = True
        dispense_resp = requests.post(
            f"{ESP32_URL}/dispense", 
            json={"amount_ml": amount_ml, "request_id": f"req_{int(time.time())}"},
            timeout=2.0
        )
        
        if dispense_resp.status_code == 200:
            log_event(user_token, amount_ml, "started")
            # In a more complex version, we'd poll for completion or use a webhook
            # For this simple version, we'll reset is_pouring after a brief delay or wait for status poll
            # However, since its single-threaded Flask dev server usually, we'll just return
            # and let the next /status check update is_pouring based on ESP32 state
            is_pouring = False # Reset for next request assuming ESP32 handled it
            return jsonify({"success": True, "message": "Dispense started"})
        else:
            is_pouring = False
            log_event(user_token, amount_ml, "failed", "ESP32 rejected request")
            return jsonify({"success": False, "reason": "ESP32 rejected request"}), 500

    except Exception as e:
        is_pouring = False
        log_event(user_token, amount_ml, "failed", f"Connection error: {str(e)}")
        return jsonify({"success": False, "reason": f"Connection error: {str(e)}"}), 500

@app.route('/api/logs')
def logs():
    limit = request.args.get('limit', 20, type=int)
    event_logs = get_logs(limit)
    # Format logs for JSON
    formatted_logs = []
    for log in event_logs:
        formatted_logs.append({
            "timestamp": log[0],
            "user_token": log[1],
            "amount_ml": log[2],
            "status": log[3],
            "reason": log[4]
        })
    return jsonify(formatted_logs)

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
