# What-If Scenario Analysis Module

Complete implementation of the What-If Scenario Analysis module with FastAPI backend and Next.js frontend.

## 📁 File Structure

```
backend/
├── scenario_service.py      # FastAPI backend service
└── requirements.txt         # Python dependencies

app/
└── api/
    └── scenario/
        └── run/
            └── route.ts     # Next.js API route handler

components/
└── analysis/
    ├── what-if-analysis.tsx              # Original component
    └── what-if-analysis-enhanced.tsx     # Enhanced component with charts
```

## 🚀 Setup Instructions

### 1. FastAPI Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn scenario_service:app --reload --port 8000
```

The FastAPI server will be available at `http://localhost:8000`

### 2. Next.js Configuration

Add to your `.env.local` file:

```env
# Optional: Set to 'true' to use FastAPI backend, 'false' to use local implementation
USE_FASTAPI_BACKEND=false

# FastAPI URL (if using FastAPI backend)
FASTAPI_URL=http://localhost:8000
```

### 3. Using the Component

Import and use the enhanced component in your pages:

```tsx
import { WhatIfAnalysisEnhanced } from '@/components/analysis/what-if-analysis-enhanced'

// In your component
<WhatIfAnalysisEnhanced
  projectId={projectId}
  tasks={tasks}
  resources={resources}
  project={project}
  baseScenario={baseScenario}
  onScenarioSave={(scenario) => {
    // Handle scenario save
  }}
/>
```

## 📊 API Endpoints

### POST /api/scenario/run (Next.js API Route)

**Request Body:**
```json
{
  "scenario_type": "project_delay" | "resource_reduction" | "material_shortage",
  "parameters": {
    // Scenario-specific parameters (see below)
  },
  "project_id": "uuid",
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "start_date": "ISO date string",
      "end_date": "ISO date string",
      "duration_days": number,
      "dependencies": ["task_id1", "task_id2"],
      "priority": "low" | "medium" | "high",
      "estimated_cost": number,
      "assigned_to": "string"
    }
  ],
  "base_end_date": "ISO date string (optional)",
  "daily_project_cost": number
}
```

**Response:**
```json
{
  "schedule_impact": {
    "project_delay_days": number,
    "new_end_date": "ISO date string",
    "critical_path": ["task_id1", "task_id2", ...]
  },
  "cost_impact": {
    "material_cost_change": number,
    "resource_cost_change": number,
    "total_cost_impact": number
  },
  "risk_assessment": {
    "risk_score": 0-100,
    "severity": "low" | "medium" | "high"
  },
  "updated_tasks": [...]
}
```

### POST /scenario/run (FastAPI Backend - Optional)

Same request/response format as above. Use this if you prefer to run the analysis on a separate Python service.

## 🎯 Scenario Types

### 1. Project Delay

**Parameters:**
- `delayDays`: Number of days to delay (default: 7)
- `affectedTasks`: "all" | "critical" | "specific"
- `delayReason`: "weather" | "permit" | "supply" | "labor"

**Logic:**
- Recalculates task start/end dates based on delay
- Applies delay multipliers based on reason
- Recomputes CPM to find new critical path
- Calculates cost impact = delay_days × daily_project_cost

### 2. Resource Reduction

**Parameters:**
- `reductionPercent`: Percentage reduction (0-100, default: 20)
- `resourceType`: "labor" | "equipment" | "material" | "all"
- `duration`: Duration of reduction in days (default: 30)

**Logic:**
- Modifies task durations: `new_duration = old_duration × (1/(1 - reduction_percentage))`
- Recomputes CPM to find delay impact
- Calculates cost impact: resource savings - delay costs

### 3. Material Shortage

**Parameters:**
- `shortagePercent`: Percentage shortage (0-100, default: 50)
- `priceIncrease`: Price increase percentage (default: 25)
- `materials`: Array of material names (e.g., ["cement", "steel"])

**Logic:**
- Applies: `effective_material = (1 - shortage_percentage)`
- Modifies durations: `new_duration = old_duration × (1 / effective_material)`
- Updates costs: `new_cost = base_cost × (1 + price_increase)`
- Recomputes CPM and cost variance

## 🔧 CPM (Critical Path Method) Calculation

The module implements a complete CPM algorithm that:

1. **Calculates Early Start (ES) and Early Finish (EF)**
   - Forward pass through task dependencies
   - ES = max(EF of all dependencies)
   - EF = ES + duration

2. **Calculates Late Start (LS) and Late Finish (LF)**
   - Backward pass from project end
   - LF = min(LS of all dependent tasks)
   - LS = LF - duration

3. **Calculates Slack (Float)**
   - Slack = LS - ES
   - Critical path = tasks with zero slack

4. **Identifies Critical Path**
   - Tasks with zero or minimal slack
   - These tasks directly impact project completion

## 📈 Visualizations

The enhanced component includes:

1. **Impact Summary Cards**
   - Schedule impact in days
   - Cost impact in Rupees (₹)
   - Risk assessment score

2. **Cost Breakdown Chart**
   - Bar chart showing material cost, resource cost, and total impact
   - Color-coded for positive/negative impacts

3. **Risk Score Meter**
   - Progress bar showing risk score (0-100)
   - Severity indicators (Low/Medium/High)

4. **Gantt Chart**
   - Visual timeline of updated tasks
   - Shows new schedule after scenario application

5. **Critical Path Display**
   - List of tasks on the critical path
   - Highlighted with badges

## 🎨 UI Features

- **Scenario Type Selection**: Dropdown to select scenario type
- **Dynamic Parameters**: Form fields change based on selected scenario type
- **Real-time Analysis**: Run analysis button with loading state
- **Results Display**: Comprehensive results with charts and visualizations
- **Save Scenarios**: Save analysis results for future reference (coming soon)

## 🔐 Error Handling

- Validates required fields before processing
- Handles missing task dependencies gracefully
- Provides user-friendly error messages
- Falls back to local implementation if FastAPI is unavailable

## 📝 Example Usage

```typescript
// Example: Project Delay Scenario
const delayScenario = {
  scenario_type: "project_delay",
  parameters: {
    delayDays: 14,
    affectedTasks: "critical",
    delayReason: "weather"
  },
  project_id: "project-uuid",
  tasks: [...],
  daily_project_cost: 50000
}

// Example: Resource Reduction Scenario
const resourceScenario = {
  scenario_type: "resource_reduction",
  parameters: {
    reductionPercent: 30,
    resourceType: "labor",
    duration: 45
  },
  project_id: "project-uuid",
  tasks: [...],
  daily_project_cost: 50000
}

// Example: Material Shortage Scenario
const materialScenario = {
  scenario_type: "material_shortage",
  parameters: {
    shortagePercent: 60,
    priceIncrease: 30,
    materials: ["cement", "steel", "concrete"]
  },
  project_id: "project-uuid",
  tasks: [...],
  daily_project_cost: 50000
}
```

## 🧪 Testing

### Test FastAPI Backend

```bash
# Health check
curl http://localhost:8000/health

# Run scenario
curl -X POST http://localhost:8000/scenario/run \
  -H "Content-Type: application/json" \
  -d @test_scenario.json
```

### Test Next.js API Route

```bash
# Run scenario via Next.js API
curl -X POST http://localhost:3000/api/scenario/run \
  -H "Content-Type: application/json" \
  -d @test_scenario.json
```

## 🚧 Future Enhancements

- [ ] Save/load scenarios from database
- [ ] Compare multiple scenarios side-by-side
- [ ] Export scenario results to PDF/Excel
- [ ] Historical scenario tracking
- [ ] AI-powered scenario recommendations
- [ ] Real-time collaboration on scenarios

## 📚 Dependencies

### Backend (Python)
- FastAPI 0.109.0
- Uvicorn 0.27.0
- Pydantic 2.5.3

### Frontend (TypeScript/React)
- Next.js 15.2.4
- Recharts (for charts)
- React Hook Form (for forms)
- Sonner (for toast notifications)

## 🐛 Troubleshooting

### FastAPI not starting
- Check if port 8000 is available
- Verify Python version (3.8+)
- Ensure all dependencies are installed

### API route not working
- Check Next.js server is running
- Verify environment variables
- Check browser console for errors

### CPM calculation issues
- Ensure tasks have valid dependencies
- Check for circular dependencies
- Verify task dates are valid

## 📞 Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.

