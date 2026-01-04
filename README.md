Koel Material Inward Process -
Tech Stack
Frontend
React (Vite)
Ant Design
Axios
QRCode (qrcode@1.5.4)
Backend
Python (Flask)
Flask-CORS
SQLAlchemy
PostgreSQL / MySQL
Tools
Git
Postman

Material Discrepancy Report (MDR) System- 
A full-stack Material Discrepancy Report (MDR) Management System used to create, view, print, and track material discrepancies during goods receipt and unloading operations.
The system includes a React + Ant Design frontend and a Flask backend API, supporting QR-based MDR identification and print-ready MDR formats.

Key Features
Create and manage Material Discrepancy Reports
View MDRs in a tabular format
Read-only printable MDR form
QR code generation for MDR number & unloading location
Backend APIs to fetch MDR details
Image handling for received material (if available)
Clean, structured MDR layout for audits

Tech Stack
Frontend:React (Vite) + Ant Design
Backend: Python (Flask)
Database: PostgreSQL
API: REST APIs (Flask-based)
State & Data Handling: Axios, React Hooks
UI Components: Ant Design Forms, Tables
Printing & QR: react-to-print, qrcode

Frontend Pages
MDR.jsx
Main MDR form page
Captures GRR / Invoice details, MDR number & dates
Vehicle, transporter, supplier, and unloading location details
Submits MDR data to backend APIs

MDRTable.jsx
Displays MDR records in tabular format
Used for viewing and navigating MDRs
Supports row-level actions

Print.jsx
Read-only, print-ready MDR view
Fetches MDR data using mdr_number
Displays company header, MDR details, unloading location, and QR code
Supports printing via react-to-print

Printing & QR Code
QR code includes:
MDR Number
Unloading Location

Generated using:
qrcode.react

Backend (mdr.py)
Built using Flask
Provides REST APIs for MDR operations

Handles:
Saving MDR master and detail records
Fetching MDR data by mdr_number
Supplying data for printable MDR view
Validates incoming request data
Returns structured JSON responses to frontend
