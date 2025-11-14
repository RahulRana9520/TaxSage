import { GoogleAuth } from 'google-auth-library';
import { sheets_v4, google } from 'googleapis';

interface UserFinancialData {
  userId: string;
  profile: {
    fullName: string;
    age: number;
    location: string;
    dependents: number;
    filingStatus: string;
    creditScore?: number;
    creditBand?: string;
  };
  income: Array<{
    source: string;
    amount: number;
    frequency: string;
  }>;
  expenses: Array<{
    category: string;
    amount: number;
    date: string;
    description?: string;
  }>;
  budget: Array<{
    category: string;
    monthlyAmount: number;
  }>;
  goals: Array<{
    name: string;
    targetAmount: number;
    targetDate: string;
  }>;
}

class GoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
  }

  private async getAuth() {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('Google Service Account key not found in environment variables');
    }

    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    
    const auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return auth;
  }

  private async initializeSheets() {
    if (!this.sheets) {
      const auth = await this.getAuth();
      this.sheets = google.sheets({ version: 'v4', auth });
    }
    return this.sheets;
  }

  async getUserFinancialData(userId: string): Promise<UserFinancialData | null> {
    try {
      const sheets = await this.initializeSheets();

      // Read user profile data
      const profileResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'UserProfiles!A:H', // Assuming columns: UserId, FullName, Age, Location, Dependents, FilingStatus, CreditScore, CreditBand
      });

      const profileRows = profileResponse.data.values || [];
      const profileData = profileRows.find(row => row[0] === userId);
      
      if (!profileData) {
        console.log(`No profile found for user: ${userId}`);
        return null;
      }

      // Read income data
      const incomeResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Income!A:D', // Assuming columns: UserId, Source, Amount, Frequency
      });

      const incomeRows = incomeResponse.data.values || [];
      const income = incomeRows
        .filter(row => row[0] === userId)
        .map(row => ({
          source: row[1] || '',
          amount: parseFloat(row[2]) || 0,
          frequency: row[3] || 'monthly'
        }));

      // Read expenses data
      const expensesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Expenses!A:E', // Assuming columns: UserId, Category, Amount, Date, Description
      });

      const expenseRows = expensesResponse.data.values || [];
      const expenses = expenseRows
        .filter(row => row[0] === userId)
        .map(row => ({
          category: row[1] || '',
          amount: parseFloat(row[2]) || 0,
          date: row[3] || '',
          description: row[4] || ''
        }));

      // Read budget data
      const budgetResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Budget!A:C', // Assuming columns: UserId, Category, MonthlyAmount
      });

      const budgetRows = budgetResponse.data.values || [];
      const budget = budgetRows
        .filter(row => row[0] === userId)
        .map(row => ({
          category: row[1] || '',
          monthlyAmount: parseFloat(row[2]) || 0
        }));

      // Read goals data
      const goalsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Goals!A:D', // Assuming columns: UserId, Name, TargetAmount, TargetDate
      });

      const goalRows = goalsResponse.data.values || [];
      const goals = goalRows
        .filter(row => row[0] === userId)
        .map(row => ({
          name: row[1] || '',
          targetAmount: parseFloat(row[2]) || 0,
          targetDate: row[3] || ''
        }));

      return {
        userId,
        profile: {
          fullName: profileData[1] || '',
          age: parseInt(profileData[2]) || 0,
          location: profileData[3] || '',
          dependents: parseInt(profileData[4]) || 0,
          filingStatus: profileData[5] || '',
          creditScore: profileData[6] ? parseInt(profileData[6]) : undefined,
          creditBand: profileData[7] || undefined
        },
        income,
        expenses,
        budget,
        goals
      };

    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, profileData: Partial<UserFinancialData['profile']>) {
    try {
      const sheets = await this.initializeSheets();

      // Find or create user row in UserProfiles sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'UserProfiles!A:A',
      });

      const userRows = response.data.values || [];
      let rowIndex = userRows.findIndex(row => row[0] === userId);
      
      if (rowIndex === -1) {
        // User not found, add new row
        rowIndex = userRows.length;
      }

      const updateData = [
        userId,
        profileData.fullName || '',
        profileData.age || '',
        profileData.location || '',
        profileData.dependents || '',
        profileData.filingStatus || '',
        profileData.creditScore || '',
        profileData.creditBand || ''
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `UserProfiles!A${rowIndex + 1}:H${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [updateData]
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating Google Sheets:', error);
      return false;
    }
  }

  async addIncomeEntry(userId: string, incomeEntry: { source: string; amount: number; frequency: string }) {
    try {
      const sheets = await this.initializeSheets();

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Income!A:D',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[userId, incomeEntry.source, incomeEntry.amount, incomeEntry.frequency]]
        }
      });

      return true;
    } catch (error) {
      console.error('Error adding income to Google Sheets:', error);
      return false;
    }
  }

  async addExpenseEntry(userId: string, expenseEntry: { category: string; amount: number; date: string; description?: string }) {
    try {
      const sheets = await this.initializeSheets();

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Expenses!A:E',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[userId, expenseEntry.category, expenseEntry.amount, expenseEntry.date, expenseEntry.description || '']]
        }
      });

      return true;
    } catch (error) {
      console.error('Error adding expense to Google Sheets:', error);
      return false;
    }
  }

  async addBudgetEntry(userId: string, budgetEntry: { category: string; monthlyAmount: number }) {
    try {
      const sheets = await this.initializeSheets();

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Budget!A:C',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[userId, budgetEntry.category, budgetEntry.monthlyAmount]]
        }
      });

      return true;
    } catch (error) {
      console.error('Error adding budget to Google Sheets:', error);
      return false;
    }
  }

  async addGoalEntry(userId: string, goalEntry: { name: string; targetAmount: number; targetDate: string }) {
    try {
      const sheets = await this.initializeSheets();

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Goals!A:D',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[userId, goalEntry.name, goalEntry.targetAmount, goalEntry.targetDate]]
        }
      });

      return true;
    } catch (error) {
      console.error('Error adding goal to Google Sheets:', error);
      return false;
    }
  }

  async addMultipleIncomeEntries(userId: string, incomeEntries: { source: string; amount: number; frequency: string }[]) {
    try {
      const sheets = await this.initializeSheets();
      
      const rows = incomeEntries.map(entry => [userId, entry.source, entry.amount, entry.frequency]);

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Income!A:D',
        valueInputOption: 'RAW',
        requestBody: {
          values: rows
        }
      });

      return true;
    } catch (error) {
      console.error('Error adding multiple income entries to Google Sheets:', error);
      return false;
    }
  }

  async addMultipleBudgetEntries(userId: string, budgetEntries: { category: string; monthlyAmount: number }[]) {
    try {
      const sheets = await this.initializeSheets();
      
      const rows = budgetEntries.map(entry => [userId, entry.category, entry.monthlyAmount]);

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Budget!A:C',
        valueInputOption: 'RAW',
        requestBody: {
          values: rows
        }
      });

      return true;
    } catch (error) {
      console.error('Error adding multiple budget entries to Google Sheets:', error);
      return false;
    }
  }

  async addMultipleGoalEntries(userId: string, goalEntries: { name: string; targetAmount: number; targetDate: string }[]) {
    try {
      const sheets = await this.initializeSheets();
      
      const rows = goalEntries.map(entry => [userId, entry.name, entry.targetAmount, entry.targetDate]);

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Goals!A:D',
        valueInputOption: 'RAW',
        requestBody: {
          values: rows
        }
      });

      return true;
    } catch (error) {
      console.error('Error adding multiple goal entries to Google Sheets:', error);
      return false;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();