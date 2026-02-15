import sqlite3
import datetime
import os

DB_PATH = 'dispenser.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_token TEXT,
            amount_ml INTEGER,
            status TEXT,
            reason TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_event(user_token, amount_ml, status, reason=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO events (timestamp, user_token, amount_ml, status, reason)
        VALUES (?, ?, ?, ?, ?)
    ''', (datetime.datetime.now(), user_token, amount_ml, status, reason))
    conn.commit()
    conn.close()

def get_logs(limit=20):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT timestamp, user_token, amount_ml, status, reason FROM events ORDER BY timestamp DESC LIMIT ?', (limit,))
    logs = cursor.fetchall()
    conn.close()
    return logs

if __name__ == '__main__':
    init_db()
    print("Database initialized.")
