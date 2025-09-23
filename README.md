# Spend Log - Personal Expense Tracker

A React Native mobile app built with Expo for tracking personal expenses and managing budgets.

## � Features

### Phase 1 (MVP) - ✅ Completed
- **Expense Logging**: Manually input expenses with amount, date, category, payment method, and description
- **Dashboard Overview**: View spending summaries for today, this week, and this month
- **Categories & Budgeting**: Pre-defined categories (Food, Transport, Entertainment, etc.) with customizable options
- **Basic Analytics**: Simple visualization of spending by category with bar charts
- **Search & Filters**: Search expenses by amount, category, or date range
- **SQLite Database**: Local data storage using Expo SQLite

### Upcoming Features (Phase 2)
- Recurring expenses tracking
- Expense suggestions based on past behavior
- Receipt scanning with OCR
- Bill tracking and reminders
- Data export (CSV, Excel, PDF)
- Multi-account support

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm
- Expo CLI
- Expo Go app on your mobile device

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd spend-log
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the development server:
```bash
npm start
# or
pnpm start
```

4. Open the Expo Go app on your mobile device and scan the QR code

## 📂 Project Structure

```
app/
├── _layout.tsx          # Root navigation layout
├── index.tsx            # Dashboard screen
├── add-expense.tsx      # Add new expense screen
├── expenses.tsx         # View all expenses screen
├── analytics.tsx        # Analytics and charts screen
└── database.js          # SQLite database setup
```

## 🎯 Usage

### Adding an Expense
1. Tap "Add Expense" on the dashboard
2. Enter the amount, select date, category, and payment method
3. Optionally add a description
4. Tap "Save Expense"

### Viewing Expenses
1. Tap "View All Expenses" on the dashboard
2. Use the search bar to filter expenses
3. View detailed information for each expense

### Analytics
1. Tap "View Analytics" on the dashboard
2. See spending breakdown by category
3. View current month totals and percentages

## 🛠 Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router
- **Database**: Expo SQLite
- **Charts**: Custom bar charts (React Native components)
- **State Management**: React Hooks
- **Styling**: StyleSheet API

## 📈 Development Phases

### Phase 1: Core Functionality (Current)
- ✅ Basic expense logging
- ✅ Dashboard with spending summaries
- ✅ Categories and payment methods
- ✅ Simple analytics with bar charts
- ✅ Search and filter functionality

### Phase 2: Enhancements (Planned)
- Recurring expenses
- Smart expense suggestions
- Receipt scanning (OCR)
- Bill tracking and reminders
- Data export capabilities
- Multi-account support

### Phase 3: UI/UX Improvements (Planned)
- Customizable themes
- Light/dark mode
- Progress tracking and milestones
- Micro-interactions and animations
- Enhanced navigation

### Phase 4: Advanced Features (Planned)
- Cross-platform syncing
- Social sharing
- Bank API integration
- Collaborative expense tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, please open an issue in the GitHub repository.

---

**Happy expense tracking! 💰📊**