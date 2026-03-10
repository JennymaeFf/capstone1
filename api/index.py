from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  

app.secret_key = os.environ.get('SECRET_KEY', 'jbistro-secret-key')
users = {}

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if email in users and users[email]['password'] == password:
        session['user'] = email
        return jsonify({"message": "Login success", "user": email}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if email in users:
        return jsonify({"error": "Email exists"}), 400
    users[email] = {"password": password}
    return jsonify({"message": "Registered!"}), 201

@app.route('/api/hello')
def hello():
    return jsonify({"message": "Hello from J'Bistro Flask API! 🍽️"})


if __name__ == '__main__':
    app.run()