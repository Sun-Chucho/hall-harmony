

# Kuringe Halls Management System - MVP Plan

## Overview
A comprehensive hall booking and management system for Kuringe Halls in Tanzania. The system will handle online booking inquiries, internal scheduling, customer management, payments with a two-cashier control model, and car/asset rentals.

**Design Theme:** Red, Black & White color scheme with the Kuringe logo

---

## Phase 1: Foundation & Authentication

### 1.1 User Authentication & Roles
- Secure login system with role-based access
- Four staff roles: **Hall Manager**, **Assistant Hall Manager**, **Cashier 1** (Receives payments), **Cashier 2** (Cash handling)
- Role-specific dashboards and permissions
- Audit trail for all user actions

### 1.2 System Configuration
- 3-5 Halls setup (Hall A, B, C, D, E)
- Tanzania Shilling (TZS) currency formatting
- Business hours and operating days configuration

---

## Phase 2: Core Booking System

### 2.1 Hall & Calendar Management
- Visual booking calendar (day/week/month views)
- Filter by hall, status, or staff member
- Conflict detection and prevention
- Color-coded booking statuses

### 2.2 Booking Workflow
Complete status lifecycle:
1. **Pending Request** → 2. **Quotation Sent** → 3. **Provisional Hold** → 4. **Deposit Received** → 5. **Confirmed** → 6. **In Service** → 7. **Completed**

With **Cancelled** and **Rescheduled** paths (requires approval)

### 2.3 Booking Details
- Customer link, hall selection, date/time
- Event type (Wedding, Meeting, Party, Corporate, etc.)
- Guest count estimate
- Assigned staff member
- Notes, attachments (contracts, IDs)
- Complete audit history

---

## Phase 3: Customer Management (CRM-lite)

### 3.1 Customer Profiles
- Full name, company/organization
- Multiple phone numbers, email, address
- National ID/TIN (optional)
- Preferred contact method
- VIP flag and special notes

### 3.2 Customer History
- All past bookings with outcomes
- Outstanding balances tracking
- Attached documents (ID copies, contracts)
- Communication log (calls, follow-ups)

### 3.3 Follow-up System
- Manual reminder scheduling
- Deposit due reminders
- Final payment due alerts
- Event day preparation notes

---

## Phase 4: Pricing & Services

### 4.1 Hall Pricing Configuration
- Base price per hall
- Weekday vs. weekend rates
- Full day / Half day options
- Manager-controlled pricing updates

### 4.2 Event Packages
- Silver, Gold, Platinum tiers
- Each package includes predefined services
- Package discounts automatically applied

### 4.3 Services Catalog (Flexible)
Categories with individual items:
- **Food:** Catering packages, menu items
- **Drinks:** Soft drinks, water, alcohol
- **Decoration:** Themes, flower arrangements
- **Utilities:** Generator, cleaning, security, lights/sound, chairs/tables, PA system

### 4.4 Dynamic Service Management
- Managers can create new categories
- Add/edit service items anytime
- Set prices and units
- Assign vendors (optional)

---

## Phase 5: Payments & Cash Control

### 5.1 Payment Recording (Cashier 1)
- Link payment to booking
- Amount in TZS
- Payment methods: Cash, Cheque, Bank Transfer, Mobile Money
- Reference numbers (cheque #, bank ref, mobile ref)
- Attach proof (photo/scanned slip)
- Print receipts

### 5.2 Payment Approval Workflow
- Cashier 1 creates and submits payment
- Status: Pending → Approved/Rejected
- Manager approval for exceptions
- Complete approval audit trail

### 5.3 Cash Movement (Cashier 2)
- Record cash transfers: Till → Safe → Bank
- Movement slips with denominations (optional)
- Reason for movement
- Manager confirmation required
- Deposit slip attachments

### 5.4 Financial Controls
- No deletion of payments (only reversal with reason)
- Outstanding balance tracking per booking
- Deposit vs. full payment tracking

---

## Phase 6: Rentals Module

### 6.1 Asset Register
- Asset types: Cars, Equipment, Tents, Chairs, etc.
- Unique ID / Plate number for vehicles
- Availability status
- Rental rates (hourly/daily)
- Assigned drivers
- Maintenance schedule notes

### 6.2 Rental Bookings
- Standalone or linked to hall booking
- Customer assignment
- Date/time scheduling
- Automatic charge calculation
- Payment tracking (same as hall payments)

### 6.3 Car Utilization Tracking
- Start/End mileage
- Fuel issued
- Driver assignment
- Trip purpose
- Customer billed amount
- Profit/expense summary

### 6.4 Return Process
- Return checklist
- Condition notes
- Final mileage and fuel level

---

## Phase 7: Documents & Outputs

### 7.1 Generated Documents (PDF)
- **Quotation** - Itemized pricing for customer review
- **Invoice** - Official billing document
- **Payment Receipt** - Proof of payment
- **Booking Confirmation** - Customer confirmation letter
- **Event Work Order** - Operations team setup sheet
- **Cash Movement Slip** - Cashier 2 transfers

### 7.2 Document Management
- All documents stored with booking
- Version history maintained
- Easy reprint/download

---

## Phase 8: Reports Dashboard

### 8.1 Booking Reports
- Bookings by date range
- Bookings by hall
- Status summary (pending, confirmed, completed)
- Cancelled/rescheduled analysis

### 8.2 Financial Reports
- Payments received by method
- Outstanding balances list
- Deposit vs. full payment tracking
- Cashier 1 daily receipt report
- Cashier 2 cash movement report

### 8.3 Rental Reports
- Car utilization summary
- Rental income by asset
- Asset availability schedule

### 8.4 Audit Reports
- Changes log (who, what, when)
- Approval history (bookings, discounts, cancellations)
- User activity summary

---

## Phase 9: Web Booking Portal (Public)

### 9.1 Inquiry Form
- Hall selection (dropdown)
- Event type selection
- Preferred date/time
- Guest count estimate
- Optional service preferences

### 9.2 Customer Details
- Name, phone, email
- Organization (optional)
- Special requests/notes
- Terms & conditions acceptance

### 9.3 Submission Flow
- Form validation
- Booking request created (Status: PENDING)
- Confirmation message displayed
- Internal notification to staff

---

## Phase 10: Staff Management

### 10.1 User Administration (Manager Only)
- Create staff accounts
- Assign roles
- Activate/deactivate users
- Reset passwords

### 10.2 Permission Enforcement
- **Hall Manager:** Full access, approvals, pricing control
- **Assistant Hall Manager:** Booking tracking, customer follow-ups, quotations/invoices
- **Cashier 1:** Payment entry, receipts, submit for approval
- **Cashier 2:** Cash movement records, deposit slips, end-of-day reports

---

## Security & Audit (Throughout)

- Every action tied to user ID + timestamp
- No hard deletions (soft delete with reason)
- Approval required for: discounts, cancellations after deposit, cash movements
- Exportable audit trail
- Role-based access strictly enforced

---

## Summary

This MVP delivers a complete hall management system with:
- ✅ Online booking inquiries
- ✅ Internal booking & calendar management
- ✅ Customer relationship tracking
- ✅ Flexible pricing & services
- ✅ Two-cashier payment controls
- ✅ Car & asset rentals with utilization tracking
- ✅ Professional document generation
- ✅ Comprehensive reports
- ✅ Full audit trail

**Backend:** Powered by Supabase (database, authentication, row-level security)  
**Design:** Clean, professional interface in Kuringe's red, black & white branding

