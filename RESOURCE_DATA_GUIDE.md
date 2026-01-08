# Resource Data Display Guide

## How Resource Allocation Chart Works

The Resource Allocation chart on the dashboard displays data from your **Resources Catalog**. Here's how to populate and display resource data:

## Data Flow

1. **Resources Catalog** (`resources` table) → Contains all available resources
2. **Resource Allocation Chart** → Reads from Resources Catalog and displays:
   - Bar Chart: Shows individual resources with their quantities
   - Pie Chart: Shows resource distribution by type (materials, equipment, labor)

## Steps to Display Resource Data

### Step 1: Add Resources to Catalog

1. Navigate to **Resources** page (from sidebar or dashboard)
2. Click **"Add Resource"** button
3. Fill in the resource form:
   - **Name**: e.g., "Bricks", "Cement", "Steel", "Electrical Wires"
   - **Type**: Select from:
     - `material` or `materials` - For construction materials
     - `equipment` - For machinery and tools
     - `labor` or `labour` - For human resources
   - **Quantity**: ⚠️ **IMPORTANT** - This is what displays in the charts!
     - Enter a number (e.g., 100, 500, 1000)
     - If quantity is 0, the resource won't show in pie chart
   - **Unit**: e.g., "kg", "pieces", "hours", "tons"
   - **Base Cost**: Optional - cost per unit
   - **Description**: Optional

4. Click **"Save"**

### Step 2: Verify Data Display

After adding resources with quantities:

1. Go back to **Dashboard**
2. The Resource Allocation chart should automatically show:
   - **Bar Chart**: All resources with their quantities as bars
   - **Pie Chart**: Resource distribution by type (only shows resources with quantity > 0)
   - **Statistics Cards**: 
     - Total Resources count
     - Total Quantity sum
     - Equipment count
     - Labor count

### Step 3: Update Existing Resources

If you have resources but they show 0 in charts:

1. Go to **Resources** page
2. Click on any resource to edit
3. Update the **Quantity** field
4. Save changes
5. Refresh the dashboard to see updated charts

## Example Resource Data

Here are some example resources you can add:

### Materials:
- **Bricks**: Quantity: 5000, Unit: "pieces", Type: "material"
- **Cement**: Quantity: 100, Unit: "bags", Type: "material"
- **Steel**: Quantity: 50, Unit: "tons", Type: "material"
- **Electrical Wires**: Quantity: 200, Unit: "meters", Type: "material"

### Equipment:
- **Excavator**: Quantity: 2, Unit: "units", Type: "equipment"
- **Crane**: Quantity: 1, Unit: "units", Type: "equipment"

### Labor:
- **Skilled Workers**: Quantity: 20, Unit: "persons", Type: "labor"
- **Engineers**: Quantity: 5, Unit: "persons", Type: "labor"

## Troubleshooting

### Chart shows "No Resource Data Available"
- **Solution**: Add resources to the catalog via Resources page

### Chart shows resources but all bars are at 0
- **Solution**: Edit each resource and set the Quantity field to a value greater than 0

### Pie chart shows "No Quantity Data Available"
- **Solution**: At least one resource needs quantity > 0. Update resource quantities.

### Statistics cards show 0
- **Solution**: Ensure resources have:
  - Proper `type` field (material, equipment, labor)
  - `quantity` field set to a number > 0

## Database Schema

The chart reads from the `resources` table with these key fields:

```sql
- id: UUID (primary key)
- name: TEXT (resource name)
- type: TEXT (material/equipment/labor)
- quantity: NUMERIC (displayed in charts - must be > 0)
- unit: TEXT (unit of measurement)
- base_cost: NUMERIC (cost per unit)
- user_id: UUID (owner)
```

## Chart Features

- **Bar Chart**: Shows top 10 resources sorted by quantity
- **Pie Chart**: Groups resources by type, only includes resources with quantity > 0
- **Statistics**: Real-time counts and totals
- **Interactive**: Hover over bars/slices to see detailed tooltips
- **Responsive**: Adapts to screen size

## Quick Start

1. Click **"Go to Resources Page"** button in the empty state
2. Add at least 3-4 resources with quantities
3. Return to Dashboard
4. See your data visualized in the charts!
