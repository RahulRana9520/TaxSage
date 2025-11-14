# Google Sheets Integration Setup

This guide helps you set up Google Sheets as a data source for the TaxSage AI chatbot.

## 🎯 Benefits of Google Sheets Integration

- **Real-time data access** - AI chatbot reads live data from your sheets
- **Easy data management** - Update user financial data directly in Google Sheets  
- **Reliable and scalable** - Google Sheets provides better reliability than local JSON files
- **Collaborative** - Multiple team members can update user data
- **Backup & sync** - Automatic backup and synchronization

## 📋 Setup Instructions

### Step 1: Create Google Sheets
Create a new Google Sheet with these tabs:

#### UserProfiles Tab
| Column A | Column B | Column C | Column D | Column E | Column F | Column G | Column H |
|----------|----------|----------|----------|----------|----------|----------|----------|
| UserId   | FullName | Age      | Location | Dependents | FilingStatus | CreditScore | CreditBand |

#### Income Tab  
| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| UserId   | Source   | Amount   | Frequency |

#### Expenses Tab
| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| UserId   | Category | Amount   | Date     | Description |

#### Budget Tab
| Column A | Column B | Column C |
|----------|----------|----------|
| UserId   | Category | MonthlyAmount |

#### Goals Tab
| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| UserId   | Name     | TargetAmount | TargetDate |

### Step 2: Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "Service Account"
5. Download the JSON key file
6. Share your Google Sheet with the service account email (found in the JSON)

### Step 3: Set Environment Variables

Add these to your `.env.local` file:

```env
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id",...}'
GOOGLE_SHEETS_ID="your-spreadsheet-id-from-url"
```

### Step 4: Copy Data from data.json (Optional)

Run this command to migrate existing user data to Google Sheets:

```bash
npm run migrate-to-sheets
```

## 🧪 Testing

1. Add sample data to your Google Sheets
2. Test the chat API: "Do you know about me?"
3. Check Vercel logs for Google Sheets connection status

## 🔧 Fallback System

The system works with a fallback approach:
1. **Primary**: Try Google Sheets first
2. **Fallback**: Use local data.json if Sheets unavailable  
3. **Graceful**: Continue with general advice if no data found

## 📊 Example Data

### UserProfiles
```
336a12f8-1a12-498f-a21d-d3140c18d3c0 | Rahul Rana | 25 | Mumbai | 2 | single | 750 | Excellent
```

### Income  
```
336a12f8-1a12-498f-a21d-d3140c18d3c0 | Salary | 100000 | monthly
336a12f8-1a12-498f-a21d-d3140c18d3c0 | Freelance | 50000 | monthly
```

### Expenses
```
336a12f8-1a12-498f-a21d-d3140c18d3c0 | Food | 15000 | 2025-11-14 | Groceries
336a12f8-1a12-498f-a21d-d3140c18d3c0 | Transport | 5000 | 2025-11-14 | Metro card
```

## 🚀 Benefits After Setup

Once configured, the AI chatbot will:

✅ **Know your complete financial profile**
✅ **Provide personalized tax advice**  
✅ **Suggest specific investment amounts**
✅ **Reference your actual income and expenses**
✅ **Help with goal-based planning**
✅ **Give precise loan eligibility advice**

The AI will respond like: *"I see you're 25, earning ₹1,50,000/month from salary and freelance. Based on your ₹15,000 monthly food expenses and your goal to buy a car for ₹15L, here's my recommendation..."*