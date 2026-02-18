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

## Bug Fixes (Current)
- [x] Fix "Failed to search product" API error

## Product Contribution Feature
- [x] Create contribution form component
- [x] Implement Open Food Facts API integration for contributions
- [x] Add barcode validation and product data validation
- [x] Create contribution submission modal/dialog
- [x] Add link to contribution feature in error messages
- [x] Test contribution workflow end-to-end

## Enhanced Alternatives Feature (In Progress)
- [x] Improve alternatives matching with category and price filtering
- [x] Add price range comparison to alternatives
- [x] Display similarity metrics (category match, price range, eco-score improvement)
- [x] Enhance alternatives UI with better product comparison

## Scan History Feature (In Progress)
- [x] Create scan history utility functions for localStorage management
- [x] Build ScanHistory UI component to display recent scans
- [x] Integrate scan history into Home page
- [x] Add clear history functionality
- [x] Test scan history with multiple products

## Favorites from Scan History & Error Fix (In Progress)
- [x] Fix "Product not found" error on home page
- [x] Create favorites utility functions for database persistence
- [x] Add favorites button to scan history component
- [x] Integrate favorites with existing Favorites page
- [x] Test favorites workflow with multiple products

## Error Handling Fix (Current)
- [x] Suppress "Product not found" errors from error tracking system
- [x] Improve tRPC error handling for expected NOT_FOUND cases

## Scan History Product Names Fix (Current)
- [ ] Fix scan history to display actual product names instead of "Unknown Product"
- [ ] Ensure product data is properly saved when adding to scan history

## Error Suppression Fix (Current)
- [x] Add error suppression for NOT_FOUND errors in error boundary
- [x] Prevent expected errors from appearing in error tracking

## Scan History Display Fix (Current)
- [x] Fix scan history items not displaying on home page
- [x] Ensure products are properly saved to scan history when clicked
- [x] Display actual product names instead of "Unknown Product"

## tRPC Client Error Suppression (Current)
- [x] Add client-level error suppression for expected NOT_FOUND errors
- [x] Prevent error tracking from reporting expected barcode scanning failures

## Scan History Display Issue (Current)
- [x] Debug why products aren't showing in scan history
- [x] Fix localStorage data persistence
- [x] Ensure products are properly added when clicking search results

## Personal Dashboard Feature (In Progress)
- [x] Create dashboard analytics utilities for data aggregation
- [x] Build dashboard UI with eco-score trend charts
- [x] Add most-scanned categories visualization
- [x] Display sustainability improvement metrics
- [x] Integrate dashboard with navigation
- [x] Test dashboard with various user data

## Toast Notification System (In Progress)
- [x] Install Sonner library for toast notifications
- [x] Create toast utility functions and message constants
- [x] Integrate toast notifications in Home page (search, barcode, alternatives)
- [x] Add toast notifications to ScanHistory component (save, remove, clear)
- [x] Add toast notifications to Favorites page (remove)
- [x] Add toast notifications to Analytics page (load)
- [x] Write integration tests for toast system
- [x] Test toast notifications across all user actions
