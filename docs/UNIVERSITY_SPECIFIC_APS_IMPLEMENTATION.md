# University-Specific APS Scoring System Implementation

## Overview

This implementation addresses the critical requirement for South African universities to use their specific APS (Admission Point Score) calculation methods rather than a universal system. Each university has its own methodology for calculating admission scores, and this system accurately implements and displays these different scoring methods.

## Core Implementation

### 1. University-Specific APS Service (`src/services/universitySpecificAPSService.ts`)

The main service implementing custom scoring algorithms for each university:

- **UCT (University of Cape Town)**: Faculty Points Score (FPS) system using 9-point scale for top 6 subjects
- **Wits (University of the Witwatersrand)**: Composite score with program-specific weightings
- **Stellenbosch University**: TPT admission score with weighted key subjects
- **Rhodes University**: Simple percentage average across all subjects
- **UNISA**: Custom ranking based on subject minimums and space availability
- **Other Universities**: Standard South African APS system (42-point scale)

### 2. Enhanced Types (`src/types/university.ts`)

Extended university and APS calculation types to support:

- University-specific scoring systems
- Multiple scoring results per calculation
- Detailed scoring explanations and methodologies

### 3. Display Component (`src/components/university-info/UniversitySpecificAPSDisplay.tsx`)

Comprehensive UI component that:

- Shows university-specific scores with clear explanations
- Differentiates between custom and standard scoring systems
- Provides detailed calculation methodologies
- Includes progress indicators and score comparisons
- Displays warnings about score compatibility

### 4. Utility Functions (`src/utils/universityScoringUtils.ts`)

Helper functions for:

- Score comparisons and analysis
- University recommendations based on performance
- Formatting and display utilities
- Performance insights and actionable advice

## Key Features

### 1. Accurate University-Specific Calculations

Each university's scoring method is implemented according to their official requirements:

```typescript
// UCT Example: 9-point scale for top 6 subjects
const convertToUCTPoints = (percentage: number): number => {
  if (percentage >= 90) return 9;
  if (percentage >= 80) return 8;
  // ... continues according to UCT's scale
};

// Wits Example: Weighted composite scoring
const getSubjectWeight = (subjectName: string, programType: string): number => {
  // Different weights based on program requirements
  // Engineering: Math and Science heavily weighted
  // Commerce: Math and English heavily weighted
};
```

### 2. Clear Explanations and Methodology Display

Each score comes with:

- Clear explanation of the calculation method
- University-specific methodology description
- Warnings about score incompatibility
- Detailed breakdowns in modal dialogs

### 3. Comprehensive UI Integration

The system integrates seamlessly with the existing APS calculator:

- Displays alongside standard APS calculations
- Provides comparative analysis
- Shows university-specific recommendations
- Maintains existing functionality while adding new features

## Usage

### Basic Integration

```typescript
import { calculateUniversitySpecificAPS } from "@/services/universitySpecificAPSService";

const apsCalculation = calculateUniversitySpecificAPS(subjects);
// Returns standard APS + university-specific scores
```

### Component Usage

```tsx
<UniversitySpecificAPSDisplay
  universityScores={apsCalculation.universitySpecificScores}
  standardAPS={apsCalculation.standardAPS}
  className="lg:col-span-3"
/>
```

### Testing and Demo

Visit `/aps-demo` to see the system in action with different student profiles:

- Excellent student (high marks across subjects)
- Good student (solid performance)
- Moderate student (average marks)
- Struggling student (below-average performance)

## Implementation Details

### UCT Faculty Points Score (FPS)

- Uses 9-point scale: 90-100% = 9 points, 80-89% = 8 points, etc.
- Takes top 6 subjects excluding Life Orientation
- Maximum score: 54 points
- May include Weighted Points Score (WPS) for disadvantaged students

### Wits Composite Score

- Uses actual percentage marks with program-specific weights
- Engineering: Mathematics (2.5x), Physical Science (2.0x), English (1.5x)
- Commerce: Mathematics (2.0x), English (2.0x), Accounting (1.5x)
- Health Sciences: Mathematics (2.0x), Life/Physical Science (2.0x), English (1.5x)
- No fixed maximum - used for ranking

### Stellenbosch TPT (Admission Score)

- Language of Learning: 25% weight
- Mathematics: 25% weight
- Best 4 other subjects: 50% weight combined
- Maximum score: 100%

### Rhodes Percentage Average

- Simple average of all subject percentages
- Excludes Life Orientation
- Typically requires 50% minimum average
- Specific subject requirements for different programs

### UNISA Custom Ranking

- Based on meeting subject-specific minimums
- Space availability considerations
- Some programs have open access, others competitive selection
- Uses percentage average for ranking when needed

### Standard APS Universities

- Traditional 42-point system
- 7 points for 80-100%, 6 points for 70-79%, etc.
- Used by: UP, UJ, NWU, TUT, DUT, MUT, UKZN, UFS, UWC, etc.

## Benefits

1. **Accuracy**: Students see exactly how each university calculates their admission score
2. **Transparency**: Clear explanations help students understand different methodologies
3. **Better Decisions**: Students can identify universities where their profile is strongest
4. **Realistic Expectations**: Proper scoring prevents false hopes or missed opportunities
5. **Strategic Planning**: Students can focus on subjects that matter most for target universities

## Technical Architecture

### Service Layer

- `universitySpecificAPSService.ts`: Core calculation logic
- `universityScoringUtils.ts`: Utility functions for analysis and display

### Component Layer

- `UniversitySpecificAPSDisplay.tsx`: Main display component
- `EnhancedAPSCalculator.tsx`: Integrated with existing calculator

### Data Layer

- Extended `University` type with `scoringSystem` property
- Enhanced `APSCalculation` type with university-specific scores
- Updated university constants with scoring system information

### Demo and Testing

- `APSDemo.tsx`: Comprehensive demonstration page
- Multiple student profiles for testing
- Real-time score calculations and comparisons

## Future Enhancements

1. **Program-Specific Scoring**: Different weightings for different programs within the same university
2. **Historical Data**: Track score requirements over time
3. **Predictive Analysis**: Suggest score improvements for target universities
4. **Mobile Optimization**: Enhanced mobile experience for score comparisons
5. **API Integration**: Real-time university requirement updates

## Important Notes

- University-specific scores cannot be directly compared with each other
- Each university's methodology is based on their official requirements
- Students should always verify current requirements with universities
- The system provides guidance but admission decisions involve multiple factors
- Some universities may have additional selection criteria beyond APS/scoring

## Compliance and Accuracy

The implementation follows official university guidelines and admission requirements as published by each institution. Regular updates ensure accuracy with changing admission policies.
