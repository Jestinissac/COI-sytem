# Fuzzy Matching Algorithm - How Scores Are Calculated

## Overview
Fuzzy matching uses the **Levenshtein Distance** algorithm to calculate similarity between two strings. The score represents how similar two client names are, helping detect potential duplicates.

---

## How It Works

### Step 1: Calculate Levenshtein Distance

**Levenshtein Distance** = Minimum number of single-character edits (insertions, deletions, substitutions) needed to transform one string into another.

**Example**:
```
String 1: "ABC Corporation"
String 2: "ABC Corp"

Transformations needed:
1. Delete "oration" from "Corporation" → "Corp"
   OR
2. Add "oration" to "Corp" → "Corporation"

Distance = 7 (7 characters different)
```

### Step 2: Calculate Similarity Score

**Formula**:
```
Similarity Score = ((Longer String Length - Distance) / Longer String Length) × 100
```

**Example Calculation**:
```
String 1: "ABC Corporation" (length = 16)
String 2: "ABC Corp" (length = 8)
Longer string: "ABC Corporation" (16 characters)
Distance: 7

Similarity = ((16 - 7) / 16) × 100
           = (9 / 16) × 100
           = 56.25%

But wait - this doesn't account for the fact that "ABC Corp" is a substring.
```

### Step 3: Improved Algorithm (Normalized)

**Better Approach**: Use normalized Levenshtein distance

```typescript
function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings (lowercase, trim)
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Get longer and shorter strings
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  // If longer string is empty, return 100% (both empty)
  if (longer.length === 0) return 100;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(longer, shorter);
  
  // Calculate similarity percentage
  const similarity = ((longer.length - distance) / longer.length) * 100;
  
  return Math.round(similarity * 100) / 100; // Round to 2 decimal places
}
```

---

## Detailed Examples

### Example 1: "ABC Corporation" vs "ABC Corp"

**Step-by-Step Calculation**:

1. **Normalize**:
   - "ABC Corporation" → "abc corporation"
   - "ABC Corp" → "abc corp"

2. **Identify Longer String**:
   - Longer: "abc corporation" (16 characters)
   - Shorter: "abc corp" (8 characters)

3. **Calculate Distance**:
   ```
   "abc corporation" → "abc corp"
   
   Need to remove: "oration" (7 characters)
   OR
   Need to add: "oration" to "abc corp"
   
   Distance = 7
   ```

4. **Calculate Similarity**:
   ```
   Similarity = ((16 - 7) / 16) × 100
              = (9 / 16) × 100
              = 56.25%
   ```

**But this seems low!** The issue is that "ABC Corp" is essentially a substring/abbreviation.

### Improved Algorithm: Handle Abbreviations

**Better Approach**: Check for common abbreviations first

```typescript
function calculateSimilarityWithAbbreviations(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Check for exact match
  if (s1 === s2) return 100;
  
  // Check for abbreviation matches
  const abbreviations = {
    'corporation': ['corp', 'corp.', 'corpn'],
    'limited': ['ltd', 'ltd.', 'ltd company'],
    'incorporated': ['inc', 'inc.', 'incorp'],
    'limited liability company': ['llc', 'l.l.c.'],
    'company': ['co', 'co.', 'comp']
  };
  
  // Normalize abbreviations
  let normalized1 = normalizeAbbreviations(s1);
  let normalized2 = normalizeAbbreviations(s2);
  
  // Calculate base similarity
  const baseSimilarity = calculateSimilarity(normalized1, normalized2);
  
  // Boost score if core name matches (before abbreviation)
  const core1 = extractCoreName(normalized1);
  const core2 = extractCoreName(normalized2);
  
  if (core1 === core2) {
    // Core names match, boost score
    return Math.min(100, baseSimilarity + 20);
  }
  
  return baseSimilarity;
}

function normalizeAbbreviations(str: string): string {
  return str
    .replace(/\bcorp\b/gi, 'corporation')
    .replace(/\bltd\b/gi, 'limited')
    .replace(/\binc\b/gi, 'incorporated')
    .replace(/\bllc\b/gi, 'limited liability company')
    .replace(/\bco\b/gi, 'company');
}

function extractCoreName(str: string): string {
  // Remove common suffixes
  return str
    .replace(/\b(corporation|corp|limited|ltd|incorporated|inc|llc|company|co)\b/gi, '')
    .trim();
}
```

**Recalculated Example 1**:
```
"ABC Corporation" → normalized → "abc corporation"
"ABC Corp" → normalized → "abc corporation"

After normalization: Both are "abc corporation"
Similarity = 100%

But we want to show it's an abbreviation match, so:
Similarity = 85% (high confidence, but not exact)
```

---

## Complete Algorithm Implementation

```typescript
interface MatchResult {
  matchScore: number;
  matchType: 'exact' | 'abbreviation' | 'similar' | 'parent' | 'none';
  reason: string;
  existingEngagement: Engagement;
}

function checkDuplication(
  newClientName: string,
  existingEngagements: Engagement[]
): MatchResult[] {
  const matches: MatchResult[] = [];
  
  for (const engagement of existingEngagements) {
    const existingName = engagement.client.client_name;
    
    // Step 1: Check exact match
    if (newClientName.toLowerCase().trim() === existingName.toLowerCase().trim()) {
      matches.push({
        matchScore: 100,
        matchType: 'exact',
        reason: 'Exact name match',
        existingEngagement: engagement
      });
      continue;
    }
    
    // Step 2: Normalize abbreviations
    const normalizedNew = normalizeAbbreviations(newClientName);
    const normalizedExisting = normalizeAbbreviations(existingName);
    
    // Step 3: Check normalized match
    if (normalizedNew.toLowerCase().trim() === normalizedExisting.toLowerCase().trim()) {
      matches.push({
        matchScore: 90,
        matchType: 'abbreviation',
        reason: 'Abbreviation match (e.g., Corp = Corporation)',
        existingEngagement: engagement
      });
      continue;
    }
    
    // Step 4: Extract core names (remove suffixes)
    const coreNew = extractCoreName(normalizedNew);
    const coreExisting = extractCoreName(normalizedExisting);
    
    // Step 5: Check core name match
    if (coreNew.toLowerCase().trim() === coreExisting.toLowerCase().trim()) {
      matches.push({
        matchScore: 85,
        matchType: 'abbreviation',
        reason: 'Core name matches, different suffix',
        existingEngagement: engagement
      });
      continue;
    }
    
    // Step 6: Calculate Levenshtein similarity
    const similarity = calculateLevenshteinSimilarity(
      normalizedNew,
      normalizedExisting
    );
    
    if (similarity >= 90) {
      matches.push({
        matchScore: similarity,
        matchType: 'similar',
        reason: 'Very similar name',
        existingEngagement: engagement
      });
    } else if (similarity >= 75) {
      matches.push({
        matchScore: similarity,
        matchType: 'similar',
        reason: 'Similar name detected',
        existingEngagement: engagement
      });
    }
    
    // Step 7: Check parent/subsidiary relationship
    if (engagement.client.parent_company_id) {
      const parentName = getParentCompanyName(engagement.client.parent_company_id);
      const parentSimilarity = calculateLevenshteinSimilarity(
        normalizedNew,
        normalizeAbbreviations(parentName)
      );
      
      if (parentSimilarity >= 70) {
        matches.push({
          matchScore: parentSimilarity,
          matchType: 'parent',
          reason: 'Similar to parent company',
          existingEngagement: engagement
        });
      }
    }
  }
  
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 100;
  
  const distance = levenshteinDistance(longer, shorter);
  const similarity = ((longer.length - distance) / longer.length) * 100;
  
  return Math.round(similarity * 100) / 100;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Initialize matrix
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,  // substitution
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j] + 1        // deletion
        );
      }
    }
  }
  
  return matrix[len2][len1];
}
```

---

## Score Breakdown by Example

### Example 1: "ABC Corporation" vs "ABC Corp"
**Calculation**:
1. Normalize: Both → "abc corporation"
2. Core name: "abc" = "abc" ✓
3. **Score: 85%** (abbreviation match)

**Why 85%?**
- Core name matches perfectly
- Only suffix differs (Corporation vs Corp)
- High confidence it's the same entity
- Not 100% because abbreviation could theoretically be different entity

---

### Example 2: "ABC Corp" vs "ABC Corporation"
**Calculation**:
1. Normalize: Both → "abc corporation"
2. Core name: "abc" = "abc" ✓
3. **Score: 85%** (abbreviation match)

**Same as Example 1** - Algorithm is symmetric

---

### Example 3: "XYZ Industries LLC" vs "XYZ Industries Limited Liability Company"
**Calculation**:
1. Normalize:
   - "xyz industries llc" → "xyz industries limited liability company"
   - "xyz industries limited liability company" → "xyz industries limited liability company"
2. After normalization: Both are identical
3. **Score: 90%** (abbreviation match, full expansion)

**Why 90%?**
- Full normalization makes them identical
- Slightly lower than exact match because it required normalization
- Very high confidence

---

### Example 4: "ABC Subsidiary Inc" vs "ABC Corporation" (Parent)
**Calculation**:
1. Normalize:
   - "abc subsidiary inc" → "abc subsidiary incorporated"
   - "abc corporation" → "abc corporation"
2. Core name:
   - "abc subsidiary" vs "abc"
   - Similar but not identical
3. Levenshtein similarity: ~70%
4. **Plus parent relationship flag**
5. **Score: 70% + relationship boost**

**Why 70%?**
- Core names are similar ("ABC" matches)
- "Subsidiary" indicates relationship
- Parent relationship detected
- Medium confidence (could be related entity)

---

### Example 5: "New ABC Ltd" vs "ABC Ltd"
**Calculation**:
1. Normalize:
   - "new abc ltd" → "new abc limited"
   - "abc ltd" → "abc limited"
2. Core name:
   - "new abc" vs "abc"
   - Different (one has "New" prefix)
3. Levenshtein similarity:
   - Distance: 4 (need to add/remove "New ")
   - Longer: "new abc limited" (15 chars)
   - Similarity: ((15 - 4) / 15) × 100 = 73%
4. **Score: 75%** (similar, but different entities)

**Why 75%?**
- Similar names
- But "New" prefix suggests different entity
- Medium confidence
- Should be flagged but allow manual override

---

## Match Score Thresholds

### 90-100%: High Confidence (Block)
- Exact match or very close
- Likely same entity
- **Action**: Block submission, require strong justification

### 75-89%: Medium Confidence (Flag)
- Similar names, possible match
- Could be same or different entity
- **Action**: Flag for review, show details

### 50-74%: Low Confidence (Optional Flag)
- Some similarity, but likely different
- **Action**: Optional flag, low priority

### <50%: No Match
- Different names
- **Action**: No action needed

---

## Special Cases

### 1. Abbreviation Normalization
```
"Corp" = "Corporation" → 100% after normalization
"Ltd" = "Limited" → 100% after normalization
"Inc" = "Incorporated" → 100% after normalization
"LLC" = "Limited Liability Company" → 100% after normalization
```

### 2. Common Words Removal
```
"The ABC Company" vs "ABC Company"
After removing "The": Both are "ABC Company" → 100%
```

### 3. Case Insensitivity
```
"ABC Corp" vs "abc corp" → 100% (case normalized)
```

### 4. Whitespace Normalization
```
"ABC Corp" vs "ABC  Corp" → 100% (whitespace normalized)
```

### 5. Punctuation Removal
```
"ABC Corp." vs "ABC Corp" → 100% (punctuation removed)
```

---

## Implementation for Prototype

### Simple Version (For Prototype)

```typescript
// Simple fuzzy matching for prototype
function simpleFuzzyMatch(newName: string, existingName: string): number {
  // Normalize
  const n1 = newName.toLowerCase().trim().replace(/[.,]/g, '');
  const n2 = existingName.toLowerCase().trim().replace(/[.,]/g, '');
  
  // Normalize abbreviations
  const norm1 = normalizeAbbreviations(n1);
  const norm2 = normalizeAbbreviations(n2);
  
  // Exact match after normalization
  if (norm1 === norm2) return 90;
  
  // Extract core names
  const core1 = extractCoreName(norm1);
  const core2 = extractCoreName(norm2);
  
  if (core1 === core2) return 85;
  
  // Levenshtein distance
  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  
  if (longer.length === 0) return 100;
  
  const distance = levenshteinDistance(longer, shorter);
  const similarity = ((longer.length - distance) / longer.length) * 100;
  
  return Math.round(similarity);
}
```

### Production Version (Enhanced)

For production, consider:
- **Token-based matching**: Compare word by word
- **Phonetic matching**: Soundex, Metaphone (for typos)
- **N-gram matching**: Compare character sequences
- **Machine learning**: Train model on historical data

---

## Testing the Algorithm

### Test Cases

```typescript
const testCases = [
  {
    new: "ABC Corporation",
    existing: "ABC Corporation",
    expected: 100,
    type: "exact"
  },
  {
    new: "ABC Corp",
    existing: "ABC Corporation",
    expected: 85,
    type: "abbreviation"
  },
  {
    new: "XYZ Industries LLC",
    existing: "XYZ Industries Limited Liability Company",
    expected: 90,
    type: "abbreviation"
  },
  {
    new: "ABC Subsidiary Inc",
    existing: "ABC Corporation",
    expected: 70,
    type: "parent"
  },
  {
    new: "New ABC Ltd",
    existing: "ABC Ltd",
    expected: 75,
    type: "similar"
  },
  {
    new: "Different Entity Corp",
    existing: "ABC Corporation",
    expected: 0,
    type: "none"
  }
];
```

---

## Summary

**Fuzzy Matching Score Calculation**:

1. **Normalize** strings (lowercase, trim, remove punctuation)
2. **Normalize abbreviations** (Corp → Corporation, Ltd → Limited, etc.)
3. **Check exact match** → 100%
4. **Check core name match** → 85%
5. **Calculate Levenshtein distance** → Similarity percentage
6. **Apply thresholds** → Block (90%+), Flag (75-89%), Allow (<75%)

**Key Factors**:
- Abbreviation normalization boosts scores
- Core name matching handles suffix differences
- Levenshtein distance handles typos and variations
- Parent/subsidiary relationships add context

---

## Related Documents

- Prototype Plan: `Prototype_Plan.md`
- Data Seeding Plan: `Data_Seeding_and_Stakeholder_Views_Plan.md`


