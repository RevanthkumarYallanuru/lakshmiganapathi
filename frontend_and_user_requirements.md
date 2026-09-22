# Lakshmi Ganapathi Enterprises — Initial User Requirements

Below is a clean, ordered version of the **frontend and user-experience requirements you have mentioned during the project's planning/initialization**. This is written so you can give it directly to Claude Cowork as a project requirement document.

````md
# Lakshmi Ganapathi Enterprises — User & Frontend Requirements

## 1. Frontend Technology

Build the frontend using:

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React Icons

Follow a clean component-based architecture with reusable UI components.

Do not introduce unnecessary frontend libraries.

---

## 2. Overall UI Philosophy

The application is for a real wholesale/supermarket-style business and will be used for daily operations.

The UI must therefore be:

- Simple
- Clean
- Fast
- Easy to understand
- User-friendly
- Mobile responsive
- Desktop responsive
- Low-jargon
- Business-focused
- Comfortable for users with limited technical experience

Avoid making the application look unnecessarily complicated or like an enterprise banking/ERP system.

Prioritize usability over visual complexity.

---

## 3. Simple Navigation

Navigation should be immediately understandable.

Main sections should include:

- Dashboard
- Customers
- Items
- Categories
- Billing
- Payments
- Ledger
- Delivery
- Reports
- Settings

Use clear labels and Lucide icons.

Avoid unnecessary nested navigation.

---

## 4. English + Telugu Language Support

The application must support both:

- English
- Telugu

Provide a clearly visible language toggle/switch.

Example:

```text
[ English | తెలుగు ]
````

The selected language should affect:

* Navigation
* Buttons
* Labels
* Form fields
* Messages
* Statuses
* Dashboard
* Tables
* Reports
* Customer-facing printable bill content where applicable

The language system should be designed centrally so translations are not hardcoded separately throughout every component.

---

## 5. Telugu Display Names

Business data should support both English and Telugu names.

For example:

```text
English Name: Ramesh
Telugu Name: రమేష్
```

For items:

```text
English: Ragi
Telugu: రాగులు
```

Store approved English and Telugu values where business data requires them.

Do not dynamically translate stored business names every time the UI renders.

---

## 6. Customer Name Entry

Customer creation should be flexible.

Example:

```text
Customer Name
[ Ramesh                         ]

Telugu Name
[ రమేష్                          ]
```

The user should be able to enter the English name normally.

If the user enters:

```text
Ramesh
```

the system may provide a Telugu suggestion:

```text
Suggested Telugu:
రమేష్
```

The user must be able to choose whether to:

* Keep the English name
* Accept/edit the Telugu suggestion
* Enter Telugu manually

Do not automatically overwrite the user's original input.

---

## 7. English-to-Telugu Transliteration

For appropriate text fields, provide optional English-to-Telugu transliteration assistance.

Example:

```text
User types:

Ramesh

Suggestion:

రమేష్
```

The user can accept or reject the suggestion.

Important:

This should be treated as **transliteration/suggestion**, not guaranteed translation.

The system should never silently change user-entered business data.

---

## 8. Business Data Language

For master data, support:

```text
English Name
Telugu Name
```

This applies where appropriate to:

* Customers
* Items
* Categories

The UI should display the appropriate value based on the selected application language.

Example:

### English mode

```text
Ragi
Jowar
Coconut Cake
```

### Telugu mode

```text
రాగులు
జొన్నలు
కొబ్బరి చెక్క
```

If a Telugu value is unavailable, gracefully fall back to the English value.

---

## 9. Customer Management

Customer management should be simple.

Support:

* Customer creation
* Customer editing
* Customer search
* Customer details
* Customer phone number
* Alternate phone
* Address
* Organization
* Notes
* Active/inactive status
* Customer transaction history
* Customer outstanding balance

Customer list should provide fast search.

Search should support useful fields such as:

* Name
* Customer code
* Phone number

---

## 10. Customer Profile

A customer profile should provide a clear summary.

Example:

```text
Customer
Ramesh

Phone
9876543210

Outstanding
₹12,500

Total Sales
₹75,000

Total Payments
₹62,500
```

Then show:

```text
Transaction History
--------------------------------
Date | Type | Amount | Balance
```

The user should be able to quickly understand the customer's financial status.

---

## 11. Item Management

Item management should support:

* Item name
* Telugu name
* Item code
* Category
* Unit
* Standard price
* Default unit
* Active/inactive status

The UI should make adding and editing items quick.

---

## 12. Categories

Categories should be simple CRUD functionality.

Support:

* Add category
* Edit category
* Activate/deactivate category
* English name
* Telugu name

Do not overcomplicate category management.

---

## 13. Billing UX

Billing is one of the most important screens.

It should be designed for speed.

Basic flow:

```text
Select Customer
        ↓
Add Items
        ↓
Enter Quantity
        ↓
Review Rates
        ↓
Apply Discount
        ↓
Review Total
        ↓
Enter Payment
        ↓
Complete Bill
        ↓
Print / Preview
```

Also provide:

```text
Walk-in Bill
```

without requiring a customer account.

---

## 14. Billing — Customer vs Walk-in

Clearly distinguish:

### Customer Bill

```text
Customer selected
Previous balance shown
Current bill added
Payment recorded
Outstanding updated
Ledger updated
```

### Walk-in Bill

```text
No customer required
Bill generated normally
No customer ledger
```

The UI should make the two options obvious.

---

## 15. Billing Price Override

The master item price must be visible.

If the user changes the rate for a particular bill:

```text
Standard Rate: ₹50
Actual Rate:   ₹47
```

The custom rate applies only to that bill.

Do not modify the master item price.

The user should clearly understand when a custom rate is being used.

---

## 16. Billing Balance Display

The billing screen should clearly show:

```text
Previous Balance
₹10,000

Current Bill
₹5,000

Paid Now
₹3,000

Current Bill Balance
₹2,000

Overall Balance
₹12,000
```

Avoid confusing financial terminology.

Use clear labels.

---

## 17. Payments

Payment entry should support:

* Cash
* UPI
* Bank Transfer
* Cheque
* Other

Support:

* Full payment
* Partial payment
* Payment-only transaction
* Payment allocation to bills

The user should clearly see:

```text
Payment Amount
Allocated Amount
Unallocated Amount
Remaining Outstanding
```

---

## 18. Ledger UI

The ledger should be easy to understand.

Example:

```text
Date        Description       Debit    Credit    Balance
---------------------------------------------------------
20 Sep      Sale              ₹5,000            ₹12,000
21 Sep      Payment                     ₹3,000   ₹9,000
```

Avoid overly technical accounting terminology.

---

## 19. Delivery Tracking

Delivery is internal business tracking.

The UI should support:

```text
Generated
   ↓
Sent
   ↓
Reached
   ↓
Balance
   ↓
Cleared
```

Provide simple status controls.

Delivery information does not need to appear unnecessarily on customer bills.

---

## 20. Dashboard

Dashboard should show useful business information immediately.

Example:

```text
Today's Sales
₹25,500

Today's Payments
₹18,000

Outstanding
₹1,25,000

Bills Today
42
```

Also provide:

* Recent bills
* Recent payments
* Outstanding customers
* Sales summary
* Payment summary

Avoid excessive charts.

Only show visualizations that help the business user.

---

## 21. Reports

Reports should support:

```text
Today
This Week
This Month
Custom Date Range
```

Reports should include:

* Sales
* Payments
* Outstanding
* Customer history
* Item sales
* Daily sales
* Monthly sales

Provide XLSX export where applicable.

---

## 22. Bill Printing

Provide:

* Bill preview
* Print
* Browser printing
* Appropriate print layout
* A4 support
* Thermal printer support if required

The printed bill must use the original transaction date/time.

Example:

```text
Transaction:
10 September 2026, 3:15 PM

Printed:
12 September 2026
```

The bill must still show:

```text
10 September 2026, 3:15 PM
```

Printing later must never change the original transaction time.

---

## 23. Responsive Design

The application must work properly on:

### Desktop

```text
Full sidebar
Tables
Dashboard
Billing workspace
Reports
```

### Tablet

Use adaptive layouts.

### Mobile

Use:

* Compact navigation
* Responsive cards
* Scrollable tables where necessary
* Large touch targets
* Simple forms
* Bottom navigation/drawer where appropriate

Do not simply shrink the desktop UI.

Design responsive layouts intentionally.

---

## 24. Accessibility & Usability

Use:

* Clear labels
* Proper form controls
* Keyboard-friendly navigation
* Visible focus states
* Sufficient contrast
* Readable font sizes
* Clear validation messages
* Confirmation for destructive actions

Avoid icon-only controls when the action may not be obvious.

Use tooltips where appropriate.

---

## 25. Loading / Error / Empty States

Every major screen should handle:

### Loading

```text
Loading customers...
```

### Empty

```text
No customers found.
```

### Error

```text
Unable to load customers.
Please try again.
```

Do not leave blank screens.

---

## 26. Forms

Forms should be:

* Simple
* Short
* Clearly grouped
* Properly validated
* Easy to edit

Show validation close to the relevant field.

Do not make users fill unnecessary fields.

Clearly distinguish:

```text
Required
Optional
```

---

## 27. Confirmation & Destructive Actions

Actions such as:

* Cancel bill
* Deactivate customer
* Deactivate item
* Reverse payment

should require appropriate confirmation.

Example:

```text
Cancel this bill?

This action will affect the customer's financial history.

[Cancel] [Confirm]
```

Never silently perform destructive financial actions.

---

## 28. Animation

Use **Framer Motion selectively**.

Animations should improve:

* Page transitions
* Dialog appearance
* Feedback
* Small UI interactions

Avoid:

* excessive animations
* slow transitions
* distracting effects
* animations on every element

Business operations must remain fast.

---

## 29. Icons

Use **Lucide React Icons** consistently.

Icons should:

* Match the action
* Have accessible labels where needed
* Not replace important text unnecessarily
* Use a consistent visual style

Do not mix many different icon libraries.

---

## 30. Performance

Prioritize:

* Fast initial load
* Lazy loading where useful
* Optimized images
* Minimal unnecessary re-renders
* Efficient API calls
* Pagination for growing lists
* Debounced search where appropriate
* No unnecessary animations

The application should feel fast on ordinary business hardware and mobile devices.

---

## 31. Data Safety

Frontend must never be the final authority for:

* Bill totals
* Payment totals
* Outstanding balances
* Ledger balances
* Ownership
* Customer/business relationships

The backend and database remain authoritative.

---

## 32. General UX Principle

When designing any screen, ask:

> "Can a non-technical business user understand what to do without needing an explanation?"

If not, simplify the screen.

Prefer:

```text
Clear label
Clear action
Clear result
```

over:

```text
Technical terminology
Complex controls
Unnecessary configuration
```

---

## 33. Visual Design Direction

Create a professional but practical business application.

Use:

* Clean spacing
* Clear hierarchy
* Consistent cards
* Consistent buttons
* Consistent forms
* Consistent tables
* Subtle borders/shadows
* Responsive layouts
* Clear status indicators

Avoid excessive:

* gradients
* glassmorphism
* 3D effects
* decorative animations
* unnecessary illustrations

The application should feel like a **modern, trustworthy business tool**, not a showcase website.

---

## 34. Core Principle

The application should be:

SIMPLE FOR THE USER

while being:

ROBUST FOR THE BUSINESS

Frontend simplicity must not compromise backend correctness, financial integrity, security or data safety.

````

### One important addition

I would specifically tell Claude that **language preference and business-data language are two different things**:

```text
Application Language:
English ↔ Telugu

Business Data:
English Name + Telugu Name

Example:
Application language = Telugu
Customer English Name = Ramesh
Customer Telugu Name = రమేష్

Display:
రమేష్

But the stored English value remains:
Ramesh
````

That prevents a common architectural mistake where the agent tries to translate or mutate the actual customer/item data whenever the user changes the UI language.
