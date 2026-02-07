# EcoScore Finder - Project TODO

## Core Features
- [x] Product barcode/name search interface with instant lookup
- [x] Display sustainability scores with color-coded ratings (0-100 scale)
- [x] Show detailed breakdown of score components (environmental footprint, packaging, carbon)
- [x] List alternative products with comparable scores and price ranges
- [x] Product comparison view for side-by-side evaluation
- [x] Save favorite products and track personal sustainability choices
- [x] Open Food Facts API integration for eco-scores and product data
- [x] LLM-powered personalized recommendations based on saved products
- [x] Automated email notifications for price drops and new eco-friendly alternatives
- [x] User dashboard to view saved favorites and recommendations

## Design & UX
- [x] Elegant and refined visual design
- [x] Responsive layout for mobile and desktop
- [x] Color-coded eco-score indicators (green/yellow/red)
- [x] Intuitive navigation and product discovery flow

## Backend & Database
- [x] Database schema for products, favorites, comparisons, notifications
- [x] tRPC procedures for search, favorites, comparisons, recommendations
- [x] Open Food Facts API integration service
- [x] LLM integration for recommendations
- [x] Email notification system

## Testing
- [ ] Unit tests for core features
- [ ] Integration tests for API calls
- [ ] End-to-end testing of user flows

## Bug Fixes
- [x] Fix "Failed to find alternatives" API error on home page

## New Features
- [x] Barcode camera scanning for product lookup
- [x] Enhanced product search with real-time results
- [x] Fully functional alternatives display on product detail page
- [x] Search result filtering and sorting

## QR/Barcode Scanning Enhancement
- [x] Install jsQR library
- [x] Implement real-time QR code detection from camera feed
- [x] Add visual feedback for detected barcodes
- [x] Test barcode scanning with various QR codes

## Extended Barcode Format Support (Quagga2)
- [x] Install Quagga2 library
- [x] Implement EAN-13 barcode detection
- [x] Implement UPC barcode detection
- [x] Implement Code128 barcode detection
- [x] Combine jsQR and Quagga2 for hybrid detection
- [x] Test with various barcode formats
