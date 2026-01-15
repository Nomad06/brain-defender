# Smart Challenge System

## Overview

The Smart Challenge System ensures the 3-step verification challenge only appears when users try to **weaken their protection**, not when they strengthen it. This creates a smoother UX while maintaining security against impulsive decisions.

## Core Principle

**A site with NO schedule and NO rules is ALWAYS BLOCKED (maximum strictness).**

When a user adds a schedule or rules, they're actually making the blocking **less strict** by defining specific times or conditions when the site is accessible.

## How It Works

### Strictness Scoring

Each configuration (schedule or rules) receives a numeric "strictness score":
- **Higher score = More strict** (more blocking)
- **Lower score = Less strict** (more access)

### Challenge Decision

Before saving changes, the system:
1. Calculates old strictness score
2. Calculates new strictness score
3. Compares them:
   - **New ≥ Old**: Same or stricter → **Save immediately** (no challenge)
   - **New < Old**: Less strict → **Show 3-step challenge** with warning

## Schedule Strictness Scoring

### Scoring Formula

| Schedule Mode | Score Calculation | Example Score |
|---------------|-------------------|---------------|
| `null` (no schedule) | 10,080 (always blocked) | 10,080 |
| `always` | 10,080 (24/7 blocking) | 10,080 |
| `vacation` | 0 (not blocked) | 0 |
| `workHours` | hours × 5 days × 60 | 2,700 (9h × 5d × 60) |
| `weekends` | 48 hours × 60 | 2,880 |
| `custom` | hours × num_days × 60 | 1,440 (8h × 3d × 60) |
| `perDay` | sum of all enabled day hours × 60 | varies |

**Maximum score**: 10,080 points (168 hours/week × 60 = 24/7 blocking)

### Examples

#### ✅ No Challenge (Strengthening or Same)

1. **null → ALWAYS**
   - Old: 10,080 | New: 10,080 | Change: 0
   - Result: Same strictness, no challenge

2. **VACATION → Work Hours**
   - Old: 0 | New: 2,700 | Change: +2,700
   - Result: Adding protection, no challenge

3. **Work Hours (9-5) → Work Hours (8-7)**
   - Old: 2,700 | New: 3,300 | Change: +600
   - Result: Longer blocking hours, no challenge

4. **Work Hours → null**
   - Old: 2,700 | New: 10,080 | Change: +7,380
   - Result: Removing schedule = always blocked, no challenge

#### ⚠️ Challenge Required (Weakening)

1. **null → VACATION**
   - Old: 10,080 | New: 0 | Change: -10,080
   - Result: Going from always blocked to not blocked, **CHALLENGE**

2. **ALWAYS → Work Hours**
   - Old: 10,080 | New: 2,700 | Change: -7,380
   - Result: Adding exemption times, **CHALLENGE**

3. **Work Hours → VACATION**
   - Old: 2,700 | New: 0 | Change: -2,700
   - Result: Removing all blocking, **CHALLENGE**

4. **Custom 5 days → Custom 2 days (same hours)**
   - Old: 2,400 | New: 960 | Change: -1,440
   - Result: Fewer blocking days, **CHALLENGE**

## Conditional Rules Strictness Scoring

### Scoring Formula

| Rule Type | Enabled | Score Calculation | Example Score |
|-----------|---------|-------------------|---------------|
| None | - | 0 | 0 |
| `visitsPerDay` | ✅ | max(0, 1000 - visits × 100) | 500 (5 visits) |
| `visitsPerDay` | ❌ | 0 | 0 |
| `timeLimit` | ✅ | max(0, 2000 - minutes × 10) | 1,400 (60 min) |
| `timeLimit` | ❌ | 0 | 0 |

**Total score**: Sum of all enabled rule scores

### Rule Strictness Levels

#### Visits Per Day
- **1 visit**: 900 points (very strict)
- **3 visits**: 700 points
- **5 visits**: 500 points
- **10+ visits**: 0 points (lenient)

#### Time Limit
- **10 minutes**: 1,900 points (very strict)
- **30 minutes**: 1,700 points
- **60 minutes**: 1,400 points
- **120 minutes**: 800 points
- **200+ minutes**: 0 points (lenient)

### Examples

#### ✅ No Challenge (Strengthening or Same)

1. **Empty → Add visit limit (5)**
   - Old: 0 | New: 500 | Change: +500
   - Result: Adding restriction, no challenge

2. **5 visits → 1 visit**
   - Old: 500 | New: 900 | Change: +400
   - Result: Making stricter, no challenge

3. **Disabled rule → Enabled rule**
   - Old: 0 | New: 500 | Change: +500
   - Result: Activating restriction, no challenge

#### ⚠️ Challenge Required (Weakening)

1. **5 visits → 10 visits**
   - Old: 500 | New: 0 | Change: -500
   - Result: Allowing more visits, **CHALLENGE**

2. **Enabled rule → Disabled rule**
   - Old: 500 | New: 0 | Change: -500
   - Result: Removing restriction, **CHALLENGE**

3. **30 min limit → 120 min limit**
   - Old: 1,700 | New: 800 | Change: -900
   - Result: Allowing more time, **CHALLENGE**

4. **Two rules → One rule**
   - Old: 2,200 | New: 500 | Change: -1,700
   - Result: Removing a restriction, **CHALLENGE**

## Tolerance

The system includes a **5% tolerance** to avoid triggering challenges on negligible changes:

```typescript
tolerance = oldScore × 0.05

if (newScore >= oldScore - tolerance) {
  // Considered "same" or "stricter"
  return 'same'
}
```

This prevents challenges when the difference is tiny (e.g., 2399 → 2400 points).

## User Experience

### When Strengthening Protection
```
User: Changes work hours from 9-5 to 8-7
System: ✅ Saves immediately (no challenge)
Message: (optional) "Protection updated (strengthened)"
```

### When Weakening Protection
```
User: Changes work hours to vacation mode
System: ⚠️ Shows 3-step challenge
Message: "⚠️ You are weakening your protection.
         Trying to cheat yourself?
         Complete 3 steps to confirm."
```

## Implementation Files

### Core Logic
- **[strictness.ts](fleet-file://eoicnbksap8ca9srek2l/Users/user/coding/brain%20defender/src/shared/domain/strictness.ts?type=file&root=%252F)** - Strictness calculation functions
  - `calculateScheduleStrictness()`
  - `calculateRulesStrictness()`
  - `shouldShowChallengeForSchedule()`
  - `shouldShowChallengeForRules()`
  - `compareStrictness()`

### Integration
- **[App.tsx:232-261](fleet-file://eoicnbksap8ca9srek2l/Users/user/coding/brain%20defender/src/options/App.tsx?type=file&root=%252F)** - `handleSaveSchedule()` with smart challenge
- **[App.tsx:275-304](fleet-file://eoicnbksap8ca9srek2l/Users/user/coding/brain%20defender/src/options/App.tsx?type=file&root=%252F)** - `handleSaveConditionalRules()` with smart challenge

### UI
- **[ChallengeModal.tsx](fleet-file://eoicnbksap8ca9srek2l/Users/user/coding/brain%20defender/src/options/ChallengeModal.tsx?type=file&root=%252F)** - 3-step challenge component (unchanged)

### Translations
- **[translations.ts:104](fleet-file://eoicnbksap8ca9srek2l/Users/user/coding/brain%20defender/src/shared/i18n/translations.ts?type=file&root=%252F)** - Russian: `weakeningProtectionWarning`
- **[translations.ts:378](fleet-file://eoicnbksap8ca9srek2l/Users/user/coding/brain%20defender/src/shared/i18n/translations.ts?type=file&root=%252F)** - English: `weakeningProtectionWarning`

## Testing

See [test-strictness.js](fleet-file://eoicnbksap8ca9srek2l/Users/user/coding/brain%20defender/test-strictness.js?type=file&root=%252F) for comprehensive test cases.

### Manual Testing Checklist

1. **Schedule Changes**
   - [ ] null → VACATION (should show challenge)
   - [ ] null → ALWAYS (should NOT show challenge)
   - [ ] ALWAYS → VACATION (should show challenge)
   - [ ] VACATION → Work Hours (should NOT show challenge)
   - [ ] Work Hours → Remove schedule (should NOT show challenge)

2. **Rules Changes**
   - [ ] Add first rule (should NOT show challenge)
   - [ ] Remove only rule (should show challenge)
   - [ ] Increase visit limit (should show challenge)
   - [ ] Decrease visit limit (should NOT show challenge)
   - [ ] Disable enabled rule (should show challenge)
   - [ ] Enable disabled rule (should NOT show challenge)

3. **Edge Cases**
   - [ ] Same schedule → Same schedule (should NOT show challenge)
   - [ ] Empty rules → Empty rules (should NOT show challenge)
   - [ ] Multiple simultaneous changes

## Debugging

Enable debug logging in [strictness.ts](fleet-file://eoicnbksap8ca9srek2l/Users/user/coding/brain%20defender/src/shared/domain/strictness.ts?type=file&root=%252F):

```typescript
console.log(explainStrictnessChange(oldScore, newScore, 'schedule'))
```

This outputs:
```
Schedule strictness change:
  Old: 2700 points
  New: 0 points
  Change: -2700 (-100.0%)
  Result: less-strict
```

## Future Enhancements

1. **Weighted Combination**: Currently schedule dominates. Could combine:
   ```typescript
   totalStrictness = scheduleScore + (rulesScore × 0.1)
   ```

2. **Smart Messages**: Context-specific challenge messages:
   - "Going from 40 hours/week to 0 hours/week of protection"
   - "Removing 3 out of 4 restrictions"

3. **Undo Feature**: Quick undo for recent weakenings

4. **History Tracking**: Log all strictness changes with timestamps

## Philosophy

The Smart Challenge System embodies Brain Defender's core philosophy:

> **Make it easy to protect yourself, hard to unprotect yourself.**

By only showing challenges when users weaken protection, we:
- ✅ Reduce friction for good decisions
- ✅ Add friction for impulsive decisions
- ✅ Make the tool feel intelligent and respectful
- ✅ Maintain security without being annoying
