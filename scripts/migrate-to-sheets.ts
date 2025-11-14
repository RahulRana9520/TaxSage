// Script to copy data from data.json to Google Sheets format
// Run this after setting up Google Sheets integration

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DataJson {
  users: Record<string, any>;
  profiles: Record<string, any>;
  income: Record<string, any[]>;
  expenses: Record<string, any[]>;
  budgets: Record<string, any[]>;
  goals: Record<string, any[]>;
}

function generateSheetsData() {
  const dataPath = path.join(__dirname, '../data.json');
  const data: DataJson = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log('=== GOOGLE SHEETS DATA MIGRATION ===');
  console.log('Copy this data to your Google Sheets:');
  
  // Generate UserProfiles sheet data
  console.log('\n📋 UserProfiles Sheet:');
  console.log('UserId\tFullName\tAge\tLocation\tDependents\tFilingStatus\tCreditScore\tCreditBand');
  
  Object.entries(data.profiles).forEach(([userId, profile]: [string, any]) => {
    console.log(`${userId}\t${profile.fullName || ''}\t${profile.age || ''}\t${profile.location || ''}\t${profile.dependents || ''}\t${profile.filingStatus || ''}\t${profile.creditScore || ''}\t${profile.creditBand || ''}`);
  });
  
  // Generate Income sheet data
  console.log('\n💰 Income Sheet:');
  console.log('UserId\tSource\tAmount\tFrequency');
  
  Object.entries(data.income).forEach(([userId, incomeList]: [string, any[]]) => {
    incomeList.forEach(income => {
      if (income.amount > 0) { // Only include non-zero income
        console.log(`${userId}\t${income.source}\t${income.amount}\t${income.frequency}`);
      }
    });
  });
  
  // Generate Expenses sheet data
  console.log('\n💸 Expenses Sheet:');
  console.log('UserId\tCategory\tAmount\tDate\tDescription');
  
  Object.entries(data.expenses).forEach(([userId, expenseList]: [string, any[]]) => {
    expenseList.forEach(expense => {
      console.log(`${userId}\t${expense.category}\t${expense.amount}\t${expense.date}\t${expense.description || ''}`);
    });
  });
  
  // Generate Budget sheet data
  console.log('\n📊 Budget Sheet:');
  console.log('UserId\tCategory\tMonthlyAmount');
  
  Object.entries(data.budgets).forEach(([userId, budgetList]: [string, any[]]) => {
    budgetList.forEach(budget => {
      if (budget.monthlyAmount > 0) { // Only include non-zero budget
        console.log(`${userId}\t${budget.category}\t${budget.monthlyAmount}`);
      }
    });
  });
  
  // Generate Goals sheet data
  console.log('\n🎯 Goals Sheet:');
  console.log('UserId\tName\tTargetAmount\tTargetDate');
  
  Object.entries(data.goals).forEach(([userId, goalsList]: [string, any[]]) => {
    goalsList.forEach(goal => {
      console.log(`${userId}\t${goal.name}\t${goal.targetAmount}\t${goal.targetDate}`);
    });
  });
  
  console.log('\n✅ Copy the data above to your Google Sheets tabs');
  console.log('📖 See GOOGLE_SHEETS_SETUP.md for detailed instructions');
}

// Run the function
generateSheetsData();