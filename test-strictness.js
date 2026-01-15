/**
 * Manual Test Script for Strictness Calculations
 * Run in browser console or Node.js to verify strictness logic
 */

// Import types (for documentation)
// Schedule modes: 'always', 'vacation', 'workHours', 'weekends', 'custom', 'perDay'
// ConditionalRule types: 'visitsPerDay', 'timeLimit'

// Test cases for schedules
const scheduleTests = [
  {
    name: 'null (always blocked) to ALWAYS',
    oldSchedule: null,
    newSchedule: { mode: 'always' },
    expectedChallenge: false, // Same strictness
    reason: 'Both are maximum strictness'
  },
  {
    name: 'null (always blocked) to VACATION',
    oldSchedule: null,
    newSchedule: { mode: 'vacation' },
    expectedChallenge: true, // Weakening
    reason: 'Going from always blocked (10080) to not blocked (0)'
  },
  {
    name: 'null (always blocked) to work hours',
    oldSchedule: null,
    newSchedule: {
      mode: 'workHours',
      workHours: { start: '09:00', end: '18:00' }
    },
    expectedChallenge: true, // Weakening
    reason: 'Going from 10080 to 2700 (9 hours × 5 days × 60)'
  },
  {
    name: 'ALWAYS to VACATION',
    oldSchedule: { mode: 'always' },
    newSchedule: { mode: 'vacation' },
    expectedChallenge: true, // Maximum weakening
    reason: 'Going from 10080 to 0'
  },
  {
    name: 'VACATION to ALWAYS',
    oldSchedule: { mode: 'vacation' },
    newSchedule: { mode: 'always' },
    expectedChallenge: false, // Strengthening
    reason: 'Going from 0 to 10080'
  },
  {
    name: 'Work hours to weekends',
    oldSchedule: {
      mode: 'workHours',
      workHours: { start: '09:00', end: '18:00' }
    },
    newSchedule: { mode: 'weekends' },
    expectedChallenge: false, // Strengthening
    reason: 'Going from 2700 to 2880 (48 hours × 60)'
  },
  {
    name: 'Weekends to work hours',
    oldSchedule: { mode: 'weekends' },
    newSchedule: {
      mode: 'workHours',
      workHours: { start: '09:00', end: '18:00' }
    },
    expectedChallenge: true, // Weakening
    reason: 'Going from 2880 to 2700'
  },
  {
    name: 'Custom 3 days to 2 days (same hours)',
    oldSchedule: {
      mode: 'custom',
      customDays: [1, 2, 3], // Mon, Tue, Wed
      customTime: { start: '09:00', end: '17:00' }
    },
    newSchedule: {
      mode: 'custom',
      customDays: [1, 2], // Mon, Tue
      customTime: { start: '09:00', end: '17:00' }
    },
    expectedChallenge: true, // Weakening
    reason: 'Going from 1440 (8h × 3d × 60) to 960 (8h × 2d × 60)'
  },
  {
    name: 'Custom shorter hours to longer hours (same days)',
    oldSchedule: {
      mode: 'custom',
      customDays: [1, 2, 3, 4, 5],
      customTime: { start: '09:00', end: '17:00' } // 8 hours
    },
    newSchedule: {
      mode: 'custom',
      customDays: [1, 2, 3, 4, 5],
      customTime: { start: '08:00', end: '19:00' } // 11 hours
    },
    expectedChallenge: false, // Strengthening
    reason: 'Going from 2400 to 3300'
  },
  {
    name: 'Work hours to null (remove schedule)',
    oldSchedule: {
      mode: 'workHours',
      workHours: { start: '09:00', end: '18:00' }
    },
    newSchedule: null,
    expectedChallenge: false, // Strengthening
    reason: 'Going from 2700 to 10080 (always blocked)'
  }
]

// Test cases for conditional rules
const rulesTests = [
  {
    name: 'Empty to empty',
    oldRules: [],
    newRules: [],
    expectedChallenge: false,
    reason: 'No change (0 to 0)'
  },
  {
    name: 'No rules to visit limit',
    oldRules: [],
    newRules: [
      { type: 'visitsPerDay', enabled: true, maxVisits: 5 }
    ],
    expectedChallenge: false, // Adding rules is strengthening
    reason: 'Going from 0 to 500'
  },
  {
    name: 'Visit limit to no rules',
    oldRules: [
      { type: 'visitsPerDay', enabled: true, maxVisits: 5 }
    ],
    newRules: [],
    expectedChallenge: true, // Removing rules is weakening
    reason: 'Going from 500 to 0'
  },
  {
    name: 'Lower visit limit (1) to higher (5)',
    oldRules: [
      { type: 'visitsPerDay', enabled: true, maxVisits: 1 }
    ],
    newRules: [
      { type: 'visitsPerDay', enabled: true, maxVisits: 5 }
    ],
    expectedChallenge: true, // Weakening
    reason: 'Going from 900 to 500'
  },
  {
    name: 'Higher visit limit (5) to lower (1)',
    oldRules: [
      { type: 'visitsPerDay', enabled: true, maxVisits: 5 }
    ],
    newRules: [
      { type: 'visitsPerDay', enabled: true, maxVisits: 1 }
    ],
    expectedChallenge: false, // Strengthening
    reason: 'Going from 500 to 900'
  },
  {
    name: 'Disable visit limit rule',
    oldRules: [
      { type: 'visitsPerDay', enabled: true, maxVisits: 5 }
    ],
    newRules: [
      { type: 'visitsPerDay', enabled: false, maxVisits: 5 }
    ],
    expectedChallenge: true, // Weakening
    reason: 'Going from 500 to 0'
  },
  {
    name: 'Enable disabled visit limit rule',
    oldRules: [
      { type: 'visitsPerDay', enabled: false, maxVisits: 5 }
    ],
    newRules: [
      { type: 'visitsPerDay', enabled: true, maxVisits: 5 }
    ],
    expectedChallenge: false, // Strengthening
    reason: 'Going from 0 to 500'
  },
  {
    name: 'Lower time limit (10 min) to higher (60 min)',
    oldRules: [
      { type: 'timeLimit', enabled: true, maxTimeMinutes: 10 }
    ],
    newRules: [
      { type: 'timeLimit', enabled: true, maxTimeMinutes: 60 }
    ],
    expectedChallenge: true, // Weakening
    reason: 'Going from 1900 to 1400'
  },
  {
    name: 'Two rules to one rule',
    oldRules: [
      { type: 'visitsPerDay', enabled: true, maxVisits: 5 },
      { type: 'timeLimit', enabled: true, maxTimeMinutes: 30 }
    ],
    newRules: [
      { type: 'visitsPerDay', enabled: true, maxVisits: 5 }
    ],
    expectedChallenge: true, // Weakening
    reason: 'Going from 2200 (500 + 1700) to 500'
  }
]

console.log('='.repeat(80))
console.log('STRICTNESS CALCULATION TEST SUITE')
console.log('='.repeat(80))

console.log('\n📅 SCHEDULE TESTS\n')
scheduleTests.forEach((test, i) => {
  console.log(`${i + 1}. ${test.name}`)
  console.log(`   Expected challenge: ${test.expectedChallenge}`)
  console.log(`   Reason: ${test.reason}`)
  console.log()
})

console.log('\n⚙️  CONDITIONAL RULES TESTS\n')
rulesTests.forEach((test, i) => {
  console.log(`${i + 1}. ${test.name}`)
  console.log(`   Expected challenge: ${test.expectedChallenge}`)
  console.log(`   Reason: ${test.reason}`)
  console.log()
})

console.log('='.repeat(80))
console.log('To test in the actual extension:')
console.log('1. Build the extension: npm run build (or yarn build)')
console.log('2. Load it in Chrome')
console.log('3. Add a blocked site')
console.log('4. Try modifying its schedule/rules with the test cases above')
console.log('5. Verify challenge only appears for "expectedChallenge: true" cases')
console.log('='.repeat(80))
