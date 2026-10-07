# ModuCraft ERP

Yes. Since you want **real-time production software**, I would go one level beyond the earlier invoice calculator. The system should be designed as a **Modular Furniture ERP + Estimation + BOQ + Quotation + Work Order + Invoice + Inventory + GST system**.

I checked the current GST/e-invoice requirements as well. Your software should not hard-code tax assumptions; it should have a configurable compliance layer. GST's e-invoice system itself validates item-level taxable value, CGST/SGST/IGST and invoice totals, so your calculation engine should mirror those validations before anything is submitted. ([eInvoice 6][1])

# 1. THE COMPLETE SOFTWARE FLOW

I recommend this architecture:

**Lead / Customer**

↓

**Project**

↓

**Site Measurement**

↓

**Design / Furniture Items**

↓

**BOQ**

↓

**Material Calculation**

↓

**Costing**

↓

**Quotation**

↓

**Client Approval**

↓

**Sales Order**

↓

**Work Order**

↓

**Purchase / Inventory**

↓

**Production**

↓

**Dispatch**

↓

**Installation**

↓

**Invoice**

↓

**Payment**

↓

**Profit / GST / Reports**

This is much better than:

> Product → Quantity → Invoice

because modular furniture is normally **project-based and measurement-based**.

---

# 2. FIRST IMPORTANT DECISION — STORE MM INTERNALLY

Don't store furniture dimensions internally as feet or inches.

Use:

> **MM as the master dimension**

The user can enter:

* mm

* cm

* inch

* feet

* feet + inch

But the software converts everything to **mm**.

### Conversion engine

```text

1 inch = 25.4 mm

1 cm = 10 mm

1 ft = 304.8 mm

1 m = 1000 mm

```

### Area

```text

Area Sq.Ft =

Length(mm) × Width(mm)

÷ 92,903.04

```

### RFT

```text

RFT = Length(mm) ÷ 304.8

```

### Sq.M

```text

Sq.M =

Length(mm) × Width(mm)

÷ 1,000,000

```

This gives you a single reliable calculation engine.

---

# 3. DON'T USE ONLY "QTY × RATE"

Your product master should have a **calculation method**.

### Calculation methods

```text

NOS

SQFT

SQM

RFT

RMT

SHEET

KG

SET

PAIR

DAY

HOUR

LUMP_SUM

CUSTOM_FORMULA

```

Then every product tells the system how it should calculate.

---

# 4. PRODUCT MASTER

Each product needs these fields.

### Basic

* Product ID

* SKU

* Product name

* Category

* Subcategory

* Description

* Image

* Drawing

* Active/inactive

### Measurement

* Length

* Width

* Height

* Depth

* Thickness

* Unit

* Minimum size

* Maximum size

### Billing

* Billing basis

* Selling rate

* Minimum rate

* Discount allowed

* GST rate

* HSN/SAC

* UOM

### Manufacturing

* BOM

* Material

* Hardware

* Labour

* Wastage

* Installation

* Packaging

* Transportation

### Commercial

* Purchase cost

* Manufacturing cost

* Overhead

* Target margin

* Minimum margin

---

# 5. PRODUCT CATEGORIES

Your initial database should include:

### Workstations

* 2-seater

* 4-seater

* 6-seater

* 8-seater

* Linear workstation

* Back-to-back workstation

* L-shaped workstation

* Manager workstation

* Executive workstation

### Benching

* 2-seater

* 4-seater

* 6-seater

* 8-seater

* Back-to-back benching

* Open benching

### Partitions

* MDF

* Glass

* Fabric

* Acoustic

* Aluminium

* Wooden

* PET/acoustic panel

### Storage

* Mobile pedestal

* Fixed pedestal

* Low storage

* Full-height cabinet

* Overhead cabinet

* Locker

* Credenza

### Tables

* Conference

* Meeting

* Training

* Executive

* Discussion

* Cafeteria

* Side table

### Reception

* Reception counter

* Back storage

* Display counter

### Accessories

* Cable tray

* Grommet

* CPU holder

* Keyboard tray

* Electrical module

* Data module

* Monitor arm

### Services

* Installation

* Transportation

* Dismantling

* Relocation

* Site work

---

# 6. BOM — VERY IMPORTANT

This is one of the biggest things missing from a simple invoice system.

**BOM = Bill of Materials**

For example:

### Product

**4-Seater Workstation**

BOM:

| Component         |        Qty | Unit |

| ----------------- | ---------: | ---- |

| Worktop           |          4 | Nos  |

| Modesty Panel     |          4 | Nos  |

| Side Panel        |          8 | Nos  |

| Partition         |          4 | Nos  |

| Cable Tray        |          4 | Nos  |

| Grommet           |          4 | Nos  |

| Hardware          |          1 | Set  |

| Edge Band         | calculated | RFT  |

| Electrical Module |          4 | Nos  |

Now if the customer orders:

**20 × 4-seater workstations**

the system automatically calculates the components.

---

# 7. MATERIAL CALCULATION

For each BOM item:

```text

Required Qty

×

Wastage

=

Procurement Qty

```

Example:

Board requirement:

**500 sq.ft**

Wastage:

**8%**

```text

500 × 8% = 40

```

Required:

**540 sq.ft**

---

# 8. SHEET CALCULATION

Suppose board sheet:

**8 ft × 4 ft**

Area:

```text

8 × 4 = 32 sq.ft

```

Requirement:

**540 sq.ft**

```text

540 ÷ 32 = 16.875 sheets

```

If procurement rounding is enabled:

**17 sheets**

This should be automatic.

---

# 9. EDGE BAND CALCULATION

For a rectangular panel:

```text

Perimeter =

2 × (Length + Width)

```

But don't stop there.

Your software should allow:

**Edge 1: Yes/No**

**Edge 2: Yes/No**

**Edge 3: Yes/No**

**Edge 4: Yes/No**

Because sometimes only visible edges are banded.

Then:

```text

Total Edge Length

×

Rate/RFT

=

Edge Band Cost

```

---

# 10. COSTING ENGINE

Every project should have two separate values:

### Cost

What the company spends.

### Selling price

What the customer pays.

Cost should include:

```text

Material

+ Hardware

+ Labour

+ Machine

+ Packaging

+ Transport

+ Installation

+ Overhead

```

Then:

```text

Total Cost

+

Profit

=

Selling Price

```

---

# 11. MARKUP VS MARGIN

This needs to be correctly programmed.

### 25% markup

```text

Selling Price =

Cost × 1.25

```

### 25% margin

```text

Selling Price =

Cost ÷ 0.75

```

These are **not the same**.

Your software should have a setting:

> Pricing Method: Markup / Margin

---

# 12. SITE MEASUREMENT MODULE

This should be a separate module.

Sales/site team can enter:

* Room number

* Wall length

* Wall height

* Column

* Window

* Door

* Electrical point

* AC point

* Beam

* Floor

* Ceiling height

* Existing furniture

* Notes

* Photos

* Drawing

Measurements can be entered in:

**mm / cm / inch / feet**

and converted automatically.

---

# 13. BOQ MODULE

The BOQ should be the heart of the system.

Columns:

| Item | Specification |  L |  W |  H | Qty | Unit | Rate | Amount |

| ---- | ------------- | -: | -: | -: | --: | ---- | ---: | -----: |

But also include:

* Product code

* Material

* Finish

* Colour

* Thickness

* Drawing reference

* Area

* RFT

* Wastage

* Cost

* Margin

* Selling price

---

# 14. QUOTATION MODULE

Quotation should automatically pull from BOQ.

It should show:

**Company**

**Client**

**Project**

**Site**

**Quotation No.**

**Date**

**Validity**

**Payment terms**

**Delivery period**

**Warranty**

**BOQ**

**Taxes**

**Grand total**

No one should manually retype the BOQ.

---

# 15. APPROVAL SYSTEM

Quotation status:

```text

Draft

↓

Internal Review

↓

Sent

↓

Negotiation

↓

Approved

↓

Rejected

↓

Expired

```

Once approved:

**Quotation → Sales Order**

---

# 16. SALES ORDER

Sales Order should lock the commercial terms.

Store:

* Approved price

* Approved quantity

* Client PO

* Payment terms

* Delivery date

* Approved drawing

* Approved finish

* Approved material

This is important because the price shouldn't silently change later.

---

# 17. CHANGE ORDER

This is **essential for real projects**.

Example:

Client originally ordered:

**50 workstations**

Later:

**+10 workstations**

Don't edit the original order.

Create:

> **Change Order #001**

Then:

```text

Original Order

+

Change Order

=

Current Project Value

```

This gives you proper audit history.

---

# 18. WORK ORDER

Production receives:

**Work Order**

Example:

> WO-2026-00125

Contains:

* Product

* Quantity

* Dimensions

* Material

* Finish

* Drawing

* BOM

* Production deadline

* Assigned department

* Assigned person

* QC requirements

---

# 19. PRODUCTION

Status:

```text

Pending

↓

Cutting

↓

Edge Banding

↓

CNC

↓

Assembly

↓

Finishing

↓

QC

↓

Ready

```

For each stage track:

* Start date

* End date

* Worker

* Quantity

* Rejected quantity

* Wastage

* Remarks

---

# 20. INVENTORY

You need **two different inventories**.

### Raw material

* MDF

* Plywood

* Particle board

* Laminate

* Glass

* Aluminium

* Fabric

* Hardware

### Finished goods

* Workstations

* Cabinets

* Tables

* Benches

Track:

```text

Opening Stock

+

Purchase

+

Production

-

Consumption

-

Damage

-

Dispatch

=

Closing Stock

```

---

# 21. MATERIAL RESERVATION

When a sales order is approved:

System should calculate:

> Material Required

Then:

> Material Available

Then:

> Material Shortage

Example:

Required MDF = 800 sq.ft

Available = 620 sq.ft

**Shortage = 180 sq.ft**

This should automatically create a **Purchase Requirement**.

---

# 22. PURCHASE MODULE

Purchase workflow:

```text

Material Requirement

↓

Purchase Request

↓

RFQ

↓

Vendor Quotes

↓

Purchase Order

↓

GRN

↓

Quality Check

↓

Inventory

```

---

# 23. VENDOR MASTER

Store:

* Vendor

* GSTIN

* PAN

* Address

* Contact

* Bank details

* Material supplied

* Purchase rate

* Credit period

* Rating

* Lead time

---

# 24. DISPATCH

When production is complete:

```text

Ready

↓

Packing

↓

Dispatch

↓

Delivery

↓

Installation

```

Track:

* Vehicle

* Driver

* Dispatch date

* Delivery challan

* Quantity

* Destination

* POD

---

# 25. INSTALLATION

Track:

* Installation team

* Site

* Planned date

* Actual date

* Quantity installed

* Pending quantity

* Issues

* Photos

* Client sign-off

---

# 26. INVOICE ENGINE

Invoice should support:

### Line-level

```text

Gross Amount

-

Item Discount

=

Taxable Value

```

Then tax.

GST's e-invoice validation uses taxable value after item-level discount and calculates CGST/SGST/IGST from taxable value. ([eInvoice 6][1])

### Invoice-level

Support:

* Invoice discount

* Other charges

* Freight

* Installation

* Round-off

* Advance adjustment

Don't mix these calculations together.

---

# 27. GST ENGINE

Do **not** hard-code GST into product code.

Create a:

### Tax Master

Fields:

* Tax code

* GST rate

* Effective from

* Effective to

* HSN/SAC

* CGST

* SGST

* IGST

* Cess

* Active

Then your tax engine determines applicable tax based on the transaction.

For e-invoicing, invoice systems need fields such as supplier/recipient details, HSN/SAC, description, quantity/UOM, taxable value and tax amounts. ([eInvoice 6][2])

Also build the system so HSN/SAC is configurable. CBIC has separate HSN requirements depending on taxpayer turnover and transaction type. ([CBIC][3])

---

# 28. E-INVOICE

For businesses covered by the mandate, don't just generate a PDF.

Build:

```text

Invoice

↓

Validate

↓

Generate e-Invoice JSON

↓

IRP API

↓

IRN

↓

Signed QR

↓

Invoice PDF

```

The IRP returns the IRN and QR information, which the billing/ERP system can place on the invoice. ([eInvoice 6][2])

Build this as an **integration layer**, not directly inside the calculation engine.

That way future GST/e-invoice changes don't break your entire application.

---

# 29. CREDIT NOTE / DEBIT NOTE

Must be separate documents.

### Credit Note

For:

* Return

* Price reduction

* Cancellation

* Excess billing

### Debit Note

For:

* Additional billing

* Underbilling

* Additional charges

E-invoicing systems also cover supplier-issued invoices, credit notes and debit notes where applicable. ([eInvoice 6][4])

---

# 30. PAYMENT MODULE

Invoice:

₹10,00,000

Advance:

₹2,00,000

Payment 2:

₹3,00,000

Balance:

**₹5,00,000**

Track:

* Payment date

* Amount

* Mode

* Bank

* Transaction reference

* TDS

* Adjustment

* Invoice allocation

---

# 31. REAL-TIME DASHBOARD

Management should see:

### Sales

* Today's sales

* Monthly sales

* Yearly sales

* Quotation value

* Order value

* Invoice value

### Projects

* Active projects

* Delayed projects

* Completed projects

* Pending installation

### Finance

* Receivables

* Overdue

* Collections

* Profit

* Margin

### Production

* Pending

* In production

* QC

* Ready

* Dispatch

### Inventory

* Low stock

* Material shortage

* Purchase pending

---

# 32. PROJECT PROFITABILITY

For every project:

```text

Project Revenue

-

Material Cost

-

Hardware Cost

-

Labour Cost

-

Machine Cost

-

Transport

-

Installation

-

Other Expenses

=

Gross Profit

```

Then:

```text

Gross Profit ÷ Revenue × 100

=

Gross Margin %

```

This is one of the most valuable management reports.

---

# 33. AUDIT LOG

Because you want **real-time professional software**, every important change should be recorded.

Example:

> Rahul changed workstation rate from ₹12,000 → ₹12,500

Store:

* User

* Date/time

* Old value

* New value

* Record

* Reason

Same for:

* Invoice

* Quotation

* Customer

* Rate

* Product

* BOM

* Payment

* GST

* Purchase order

---

# 34. USER ROLES

I'd create:

### Super Admin

Everything.

### Management

Dashboard, reports, approvals.

### Sales

Customer, project, BOQ, quotation.

### Estimator

Measurement, BOQ, costing.

### Purchase

Vendors, RFQ, PO, GRN.

### Production

Work orders, production.

### Inventory

Stock and material.

### Accounts

Invoice, GST, payments.

### Installation

Installation status.

### Viewer

Read-only.

---

# 35. DATABASE DESIGN

At minimum, your backend needs entities/tables for:

```text

users

roles

permissions

companies

branches

customers

customer_contacts

projects

project_sites

site_measurements

categories

products

product_variants

materials

material_rates

hardware

bom_headers

bom_items

units

unit_conversions

formula_templates

price_lists

price_list_items

quotations

quotation_items

quotation_versions

sales_orders

sales_order_items

change_orders

work_orders

production_jobs

production_stages

qc_records

vendors

purchase_requests

purchase_orders

purchase_order_items

goods_receipts

inventory

inventory_transactions

stock_adjustments

dispatches

deliveries

installations

invoices

invoice_items

payments

payment_allocations

credit_notes

debit_notes

tax_rates

hsn_sac

einvoices

irn_records

expenses

project_costs

notifications

audit_logs

```

---

# 36. FORMULA ENGINE

This is the part I would **not compromise on**.

Don't hard-code formulas into every product.

Create:

### Formula Master

Example:

**Formula 001**

```text

SQFT_AREA

=

(LENGTH_MM × WIDTH_MM)

÷ 92903.04

```

**Formula 002**

```text

RFT

=

LENGTH_MM ÷ 304.8

```

**Formula 003**

```text

AMOUNT

=

CALCULATED_QTY × RATE

```

**Formula 004**

```text

WASTAGE

=

BASE_QTY × WASTAGE_PERCENT / 100

```

**Formula 005**

```text

PROCUREMENT_QTY

=

BASE_QTY + WASTAGE

```

Then Product Master says:

> Calculation Formula = SQFT_AREA

This allows you to add new furniture products without changing your application code.

---

# 37. ROUNDING ENGINE

Also make rounding configurable.

For example:

### Measurement

2 decimal places

### Quantity

3 decimal places

### Rate

2 decimal places

### Invoice

2 decimal places

### Procurement

Round Up

This avoids weird situations like:

> 16.875 sheets

when you actually need to purchase **17 sheets**.

---

# 38. REAL-TIME EVENTS

If you really mean **real-time software**, use event-based updates.

Example:

Sales approves order:

**Event → SALES_ORDER_APPROVED**

This can trigger:

* Material requirement

* Inventory reservation

* Production planning

* Purchase requirement

* Dashboard update

When production completes:

**Event → PRODUCTION_COMPLETED**

Triggers:

* Finished stock update

* Dispatch eligibility

* Project progress update

When payment arrives:

**Event → PAYMENT_RECEIVED**

Triggers:

* Outstanding update

* Customer ledger

* Project financial update

* Dashboard update

---

# 39. NOTIFICATIONS

Automatic alerts:

### Sales

> Quotation expires in 2 days.

### Purchase

> MDF stock below minimum level.

### Production

> Work Order delayed.

### Project Manager

> Installation pending.

### Accounts

> Invoice overdue.

### Management

> Project margin below 15%.

---

# 40. MOBILE + DESKTOP

I would make it responsive.

### Desktop

For:

* Admin

* Accounts

* Estimation

* Purchase

* Production

### Mobile

For:

* Sales

* Site measurement

* Installation

* Delivery

* Approval

Site person should be able to take a photo and enter:

> Wall = 4850 mm

directly from mobile.

---

# 41. OFFLINE MODE

This is another important requirement for site work.

If internet isn't available:

**Site Measurement → Offline**

Then when internet comes back:

**Sync → Server**

You need conflict handling so the same measurement isn't overwritten accidentally.

---

# 42. DOCUMENT NUMBERING

Don't use simple:

> 001

Especially if you eventually integrate e-invoicing.

Use structured numbering such as:

```text

QT-26-27-00001

SO-26-27-00001

WO-26-27-00001

INV-26-27-00001

CN-26-27-00001

DN-26-27-00001

PO-26-27-00001

```

E-invoice documentation also specifies invoice serial numbering constraints, so the numbering engine should be designed around compliant, unique series rather than arbitrary short numbers. ([eInvoice 6][2])

---

# 43. WHAT I WOULD MAKE THE FINAL PRODUCT

### **ModuFlow / Furniture ERP**

**Dashboard**

**CRM**

* Leads

* Customers

* Contacts

**Projects**

* Sites

* Measurements

* Drawings

* Photos

**Estimation**

* Products

* Materials

* BOM

* Formulas

* BOQ

* Costing

**Sales**

* Quotation

* Negotiation

* Approval

* Sales Order

* Change Order

**Procurement**

* Vendors

* RFQ

* Purchase Order

* GRN

**Inventory**

* Raw Material

* Hardware

* Finished Goods

* Stock Movement

**Production**

* Work Orders

* Cutting

* Edge Banding

* Assembly

* QC

**Dispatch**

* Delivery Challan

* Dispatch

* POD

**Installation**

* Site Team

* Installation

* Completion

**Accounts**

* Invoice

* GST

* E-Invoice

* Credit Note

* Debit Note

* Payments

* Outstanding

**Reports**

* Sales

* Project

* Profit

* Inventory

* Purchase

* Production

* GST

* Receivables

**Admin**

* Users

* Roles

* Permissions

* Units

* Formulas

* Tax

* HSN/SAC

* Numbering

* Audit Log

---

## The most important thing

Don't start development by telling your developer:

> **"Make me an invoice software."**

Give them this requirement:

> **"Build a measurement-driven modular furniture ERP where site dimensions generate BOQ, BOQ generates BOM/material requirements and costing, approved quotation generates sales order and work order, production consumes inventory, completed work generates dispatch/installation, and the final approved transaction generates GST-compliant invoices and payment tracking."**

That architecture will let you handle **workstations, benching, modular furniture, partitions, cabinets, tables, reception furniture, custom furniture and installation work** without rebuilding the software every time.

Also, because GST/e-invoice rules and schemas can change, keep **tax rates, HSN/SAC, UOM, invoice schema, validation rules and IRP integration configurable/versioned**, rather than embedding them permanently in business logic. The official e-invoice schema itself contains mandatory and optional fields, so this separation is important for a production system. ([eInvoice 6][5])

[1]: https://einvoice6.gst.gov.in/content/validation-rules-for-e-invoicing-that-you-must-take-care-to-avoid-errors/?utm_source=chatgpt.com "Validation rules for e-invoicing that you must take care to avoid errors"

[2]: https://einvoice6.gst.gov.in/content/e-invoice-printing-process-mandatory-fields-modes-of-irn-generation/?utm_source=chatgpt.com "E-invoice Printing: Process, Mandatory Fields, Modes of IRN generation"

[3]: https://cbic-gst.gov.in/pdf/press-release/Press-release-HSN-code-SAC-issue.pdf?utm_source=chatgpt.com "Press Release"

[4]: https://einvoice6.gst.gov.in/content/e-invoice-mandate-e-invoicing-changes-exemptions-documents-covered-transactions-and-more/?utm_source=chatgpt.com "E-invoice Mandate: E-invoicing Changes, Exemptions, Documents, Transactions Covered"

[5]: https://einvoice6.gst.gov.in/content/wp-content/uploads/2022/07/notification-60-central-tax-english-2020.pdf?x79810=&utm_source=chatgpt.com "[To be published in the Gazette of India, Extraordinary, Part II, Section 3, Sub-section"

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://modulaflow-erp.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9aa95724-13fb-42d2-9ba9-2920aec2ad91).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
