"""
FastAPI Backend Service for What-If Scenario Analysis
Run with: uvicorn scenario_service:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Literal
from datetime import datetime, timedelta
from enum import Enum
import json

app = FastAPI(title="What-If Scenario Analysis API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class ScenarioType(str, Enum):
    PROJECT_DELAY = "project_delay"
    RESOURCE_REDUCTION = "resource_reduction"
    MATERIAL_SHORTAGE = "material_shortage"

class Task(BaseModel):
    id: str
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration_days: Optional[int] = None
    dependencies: List[str] = []
    priority: Optional[str] = "medium"
    estimated_cost: Optional[float] = 0.0
    assigned_to: Optional[str] = None

class ScenarioRequest(BaseModel):
    scenario_type: ScenarioType
    parameters: Dict
    project_id: str
    tasks: List[Task]
    base_end_date: Optional[str] = None
    daily_project_cost: Optional[float] = 0.0

class ScheduleImpact(BaseModel):
    project_delay_days: float
    new_end_date: str
    critical_path: List[str]

class CostImpact(BaseModel):
    material_cost_change: float
    resource_cost_change: float
    total_cost_impact: float

class RiskAssessment(BaseModel):
    risk_score: int  # 0-100
    severity: Literal["low", "medium", "high"]

class ScenarioResponse(BaseModel):
    schedule_impact: ScheduleImpact
    cost_impact: CostImpact
    risk_assessment: RiskAssessment
    updated_tasks: List[Dict]

# CPM Calculation Functions
def calculate_cpm(tasks: List[Task]) -> Dict:
    """
    Calculate Critical Path Method (CPM) for tasks
    Returns: {
        'critical_path': [task_ids],
        'project_duration': days,
        'early_start': {task_id: date},
        'late_start': {task_id: date},
        'slack': {task_id: days}
    }
    """
    # Build task dictionary
    task_dict = {task.id: task for task in tasks}
    
    # Calculate Early Start (ES) and Early Finish (EF)
    early_start = {}
    early_finish = {}
    visited = set()
    
    def get_duration(task: Task) -> int:
        if task.duration_days:
            return task.duration_days
        elif task.start_date and task.end_date:
            start = datetime.fromisoformat(task.start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(task.end_date.replace('Z', '+00:00'))
            return (end - start).days
        return 1  # Default 1 day
    
    def calculate_early_times(task_id: str):
        if task_id in visited:
            return early_start.get(task_id, 0)
        
        visited.add(task_id)
        task = task_dict[task_id]
        
        # Find max early finish of dependencies
        max_ef = 0
        for dep_id in task.dependencies:
            if dep_id in task_dict:
                calculate_early_times(dep_id)
                max_ef = max(max_ef, early_finish.get(dep_id, 0))
        
        early_start[task_id] = max_ef
        duration = get_duration(task)
        early_finish[task_id] = max_ef + duration
        
        return early_start[task_id]
    
    # Calculate early times for all tasks
    for task in tasks:
        if task.id not in visited:
            calculate_early_times(task.id)
    
    # Project duration is max early finish
    project_duration = max(early_finish.values()) if early_finish else 0
    
    # Calculate Late Start (LS) and Late Finish (LF)
    late_start = {}
    late_finish = {}
    
    # Initialize late finish for all tasks
    for task_id in task_dict:
        late_finish[task_id] = project_duration
    
    # Build reverse dependency graph
    reverse_deps = {task_id: [] for task_id in task_dict}
    for task in tasks:
        for dep_id in task.dependencies:
            if dep_id in task_dict:
                reverse_deps[dep_id].append(task.id)
    
    def calculate_late_times(task_id: str):
        task = task_dict[task_id]
        duration = get_duration(task)
        
        # Find min late start of dependent tasks
        if reverse_deps[task_id]:
            min_ls = min([late_start.get(dep_id, project_duration) for dep_id in reverse_deps[task_id]])
            late_finish[task_id] = min_ls
        else:
            late_finish[task_id] = project_duration
        
        late_start[task_id] = late_finish[task_id] - duration
    
    # Calculate late times in reverse order
    sorted_tasks = sorted(tasks, key=lambda t: early_finish.get(t.id, 0), reverse=True)
    for task in sorted_tasks:
        calculate_late_times(task.id)
    
    # Calculate slack (float)
    slack = {}
    for task_id in task_dict:
        slack[task_id] = late_start[task_id] - early_start[task_id]
    
    # Critical path: tasks with zero slack
    critical_path = [task_id for task_id, s in slack.items() if abs(s) < 0.01]
    
    return {
        'critical_path': critical_path,
        'project_duration': project_duration,
        'early_start': early_start,
        'late_start': late_start,
        'slack': slack
    }

# Scenario Processing Functions
def process_project_delay(tasks: List[Task], parameters: Dict, base_end_date: Optional[str]) -> Dict:
    """
    Process project delay scenario with exact formulas:
    A) ALL tasks: Everything shifts by delay_days
    B) Critical Path Only: Delay CP tasks, propagate to successors
    C) Specific Task: Check float, calculate project delay
    """
    delay_days = parameters.get('delayDays', 0)
    affected_tasks = parameters.get('affectedTasks', 'all')
    delay_reason = parameters.get('delayReason', 'weather')
    
    # Calculate initial CPM to get critical path and float
    cpm_result = calculate_cpm(tasks)
    critical_path = set(cpm_result['critical_path'])
    slack = cpm_result['slack']
    planned_duration = cpm_result['project_duration']
    
    updated_tasks = []
    project_delay = 0
    
    # A) If Affected Tasks = ALL tasks
    if affected_tasks == 'all':
        # Everything shifts by delay_days
        for task in tasks:
            task_dict = task.dict()
            if task.start_date:
                old_start = datetime.fromisoformat(task.start_date.replace('Z', '+00:00'))
                new_start = old_start + timedelta(days=delay_days)
                task_dict['start_date'] = new_start.isoformat()
            
            if task.end_date:
                old_end = datetime.fromisoformat(task.end_date.replace('Z', '+00:00'))
                new_end = old_end + timedelta(days=delay_days)
                task_dict['end_date'] = new_end.isoformat()
            
            updated_tasks.append(task_dict)
        
        project_delay = delay_days
    
    # B) If Affected Tasks = Critical Path Only
    elif affected_tasks == 'critical':
        # Delay critical path tasks and propagate to successors
        task_dict_map = {task.id: task.dict() for task in tasks}
        
        # Build dependency graph for propagation
        successors = {task.id: [] for task in tasks}
        for task in tasks:
            for dep_id in task.dependencies:
                if dep_id in successors:
                    successors[dep_id].append(task.id)
        
        # Delay critical path tasks
        delayed_tasks = set()
        for task in tasks:
            if task.id in critical_path:
                task_dict = task_dict_map[task.id]
                if task.end_date:
                    old_end = datetime.fromisoformat(task.end_date.replace('Z', '+00:00'))
                    new_end = old_end + timedelta(days=delay_days)
                    task_dict['end_date'] = new_end.isoformat()
                    delayed_tasks.add(task.id)
        
        # Propagate delay to all successors
        def propagate_delay(task_id: str, delay: int):
            for successor_id in successors.get(task_id, []):
                if successor_id not in delayed_tasks:
                    successor_dict = task_dict_map[successor_id]
                    if successor_dict.get('end_date'):
                        old_end = datetime.fromisoformat(successor_dict['end_date'].replace('Z', '+00:00'))
                        new_end = old_end + timedelta(days=delay)
                        successor_dict['end_date'] = new_end.isoformat()
                    delayed_tasks.add(successor_id)
                    propagate_delay(successor_id, delay)
        
        # Propagate from all critical path tasks
        for cp_task_id in critical_path:
            propagate_delay(cp_task_id, delay_days)
        
        updated_tasks = list(task_dict_map.values())
        project_delay = delay_days
    
    # C) If Affected Tasks = Specific Task
    elif affected_tasks == 'specific':
        specific_task_ids = parameters.get('specificTaskIds', [])
        if not specific_task_ids:
            # Default: use first task if none specified
            specific_task_ids = [tasks[0].id] if tasks else []
        
        task_dict_map = {task.id: task.dict() for task in tasks}
        
        for task_id in specific_task_ids:
            if task_id not in task_dict_map:
                continue
            
            task_dict = task_dict_map[task_id]
            task_float = slack.get(task_id, 0)
            
            # Case 1: Task is on critical path
            if task_id in critical_path:
                # Delay the task
                if task_dict.get('end_date'):
                    old_end = datetime.fromisoformat(task_dict['end_date'].replace('Z', '+00:00'))
                    new_end = old_end + timedelta(days=delay_days)
                    task_dict['end_date'] = new_end.isoformat()
                
                # Propagate to successors
                successors = []
                for task in tasks:
                    if task_id in task.dependencies:
                        successors.append(task.id)
                
                for successor_id in successors:
                    if successor_id in task_dict_map:
                        succ_dict = task_dict_map[successor_id]
                        if succ_dict.get('end_date'):
                            old_end = datetime.fromisoformat(succ_dict['end_date'].replace('Z', '+00:00'))
                            new_end = old_end + timedelta(days=delay_days)
                            succ_dict['end_date'] = new_end.isoformat()
                
                project_delay = max(project_delay, delay_days)
            
            # Case 2: Task is NOT on critical path (float exists)
            else:
                if delay_days <= task_float:
                    # Delay absorbed by float
                    if task_dict.get('end_date'):
                        old_end = datetime.fromisoformat(task_dict['end_date'].replace('Z', '+00:00'))
                        new_end = old_end + timedelta(days=delay_days)
                        task_dict['end_date'] = new_end.isoformat()
                    project_delay = max(project_delay, 0)  # No project delay
                else:
                    # Float exceeded, project delayed
                    if task_dict.get('end_date'):
                        old_end = datetime.fromisoformat(task_dict['end_date'].replace('Z', '+00:00'))
                        new_end = old_end + timedelta(days=delay_days)
                        task_dict['end_date'] = new_end.isoformat()
                    
                    # Propagate excess delay
                    excess_delay = delay_days - task_float
                    successors = []
                    for task in tasks:
                        if task_id in task.dependencies:
                            successors.append(task.id)
                    
                    for successor_id in successors:
                        if successor_id in task_dict_map:
                            succ_dict = task_dict_map[successor_id]
                            if succ_dict.get('end_date'):
                                old_end = datetime.fromisoformat(succ_dict['end_date'].replace('Z', '+00:00'))
                                new_end = old_end + timedelta(days=excess_delay)
                                succ_dict['end_date'] = new_end.isoformat()
                    
                    project_delay = max(project_delay, excess_delay)
        
        updated_tasks = list(task_dict_map.values())
    
    # Recalculate CPM with updated tasks
    updated_task_objects = [Task(**t) for t in updated_tasks]
    new_cpm = calculate_cpm(updated_task_objects)
    
    # Calculate new end date
    if base_end_date:
        base_end = datetime.fromisoformat(base_end_date.replace('Z', '+00:00'))
        new_end_date = (base_end + timedelta(days=project_delay)).isoformat()
    else:
        # Use CPM project duration
        project_duration = new_cpm['project_duration']
        new_end_date = (datetime.now() + timedelta(days=project_duration)).isoformat()
    
    return {
        'updated_tasks': updated_tasks,
        'delay_days': project_delay,
        'new_end_date': new_end_date,
        'critical_path': new_cpm['critical_path'],
        'planned_duration': planned_duration
    }

def process_resource_reduction(tasks: List[Task], parameters: Dict) -> Dict:
    """
    Process resource reduction scenario with exact formula:
    New_Duration = Old_Duration × (1 / (1 - reduction_percentage))
    """
    reduction_percent = parameters.get('reductionPercent', 0) / 100.0
    resource_type = parameters.get('resourceType', 'all')
    extra_delay_days = parameters.get('delayDays', 0)  # Optional extra buffer
    
    # Cap reduction at 99% to avoid division by zero
    if reduction_percent >= 1.0:
        reduction_percent = 0.99
    
    # Calculate base CPM
    base_cpm = calculate_cpm(tasks)
    base_duration = base_cpm['project_duration']
    
    # Resource type weights for risk calculation
    resource_weights = {
        'labor': 1.0,
        'equipment': 1.3,
        'material': 1.0,
        'all': 1.5
    }
    resource_weight = resource_weights.get(resource_type.lower(), 1.0)
    
    # Calculate duration multiplier: New_Duration = Old_Duration × (1 / (1 - reduction_percentage))
    duration_multiplier = 1.0 / (1.0 - reduction_percent)
    
    # Apply to tasks using the specified resource type
    # For now, apply to all tasks (can be enhanced to filter by resource assignment)
    updated_tasks = []
    for task in tasks:
        task_dict = task.dict()
        if task.duration_days:
            # Apply formula: New_Duration = Old_Duration × (1 / (1 - reduction_percentage))
            new_duration = int(task.duration_days * duration_multiplier)
            task_dict['duration_days'] = new_duration
            
            # Update end date if start date exists
            if task.start_date:
                start = datetime.fromisoformat(task.start_date.replace('Z', '+00:00'))
                task_dict['end_date'] = (start + timedelta(days=new_duration)).isoformat()
        
        updated_tasks.append(task_dict)
    
    # Recalculate CPM with adjusted durations
    updated_task_objects = [Task(**t) for t in updated_tasks]
    new_cpm = calculate_cpm(updated_task_objects)
    
    # Calculate delay from CPM
    cpm_delay = new_cpm['project_duration'] - base_duration
    
    # Add extra delay_days if given: Final_Delay = CPM_Delay + delay_days
    final_delay = cpm_delay + extra_delay_days
    
    # Calculate new end date
    new_end_date = (datetime.now() + timedelta(days=new_cpm['project_duration'])).isoformat()
    
    return {
        'updated_tasks': updated_tasks,
        'delay_days': final_delay,
        'cpm_delay': cpm_delay,
        'new_end_date': new_end_date,
        'critical_path': new_cpm['critical_path'],
        'resource_weight': resource_weight,
        'reduction_percent': reduction_percent
    }

def process_material_shortage(tasks: List[Task], parameters: Dict) -> Dict:
    """
    Process material shortage scenario with exact formulas:
    Effective_Material = (1 - shortage_percentage)
    New_Task_Duration = Old_Duration × (1 / Effective_Material)
    New_Material_Cost = Base_Material_Cost × (1 + PI)
    """
    shortage_percent = parameters.get('shortagePercent', 0) / 100.0
    price_increase = parameters.get('priceIncrease', 0) / 100.0
    materials = parameters.get('materials', [])
    
    # Calculate base CPM
    base_cpm = calculate_cpm(tasks)
    base_duration = base_cpm['project_duration']
    planned_end_date = base_cpm.get('project_end_date')
    
    # Calculate effective material: Effective_Material = (1 - shortage_percentage)
    effective_material = 1.0 - shortage_percent
    if effective_material <= 0:
        effective_material = 0.01  # Minimum 1% to avoid division by zero
    
    # Duration multiplier: New_Task_Duration = Old_Duration × (1 / Effective_Material)
    duration_multiplier = 1.0 / effective_material
    
    updated_tasks = []
    base_material_cost = 0.0
    new_material_cost = 0.0
    
    for task in tasks:
        task_dict = task.dict()
        
        # Apply duration formula
        if task.duration_days:
            new_duration = int(task.duration_days * duration_multiplier)
            task_dict['duration_days'] = new_duration
            
            # Update end date if start date exists
            if task.start_date:
                start = datetime.fromisoformat(task.start_date.replace('Z', '+00:00'))
                task_dict['end_date'] = (start + timedelta(days=new_duration)).isoformat()
        
        # Calculate material cost change
        # New_Material_Cost = Base_Material_Cost × (1 + PI)
        if task.estimated_cost:
            base_cost = task.estimated_cost
            base_material_cost += base_cost
            new_cost = base_cost * (1 + price_increase)
            new_material_cost += new_cost
            task_dict['estimated_cost'] = new_cost
        
        updated_tasks.append(task_dict)
    
    # Recalculate CPM with adjusted durations
    updated_task_objects = [Task(**t) for t in updated_tasks]
    new_cpm = calculate_cpm(updated_task_objects)
    
    # Calculate schedule delay: Schedule_Delay = New_End_Date - Planned_End_Date
    schedule_delay = new_cpm['project_duration'] - base_duration
    
    # Calculate new end date
    new_end_date = (datetime.now() + timedelta(days=new_cpm['project_duration'])).isoformat()
    
    # Cost impact: Cost_Impact = New_Material_Cost - Base_Material_Cost
    material_cost_change = new_material_cost - base_material_cost
    
    return {
        'updated_tasks': updated_tasks,
        'delay_days': schedule_delay,
        'new_end_date': new_end_date,
        'critical_path': new_cpm['critical_path'],
        'material_cost_change': material_cost_change,
        'base_material_cost': base_material_cost,
        'new_material_cost': new_material_cost,
        'shortage_percent': shortage_percent,
        'price_increase': price_increase
    }

def calculate_risk_assessment(
    schedule_impact: float, 
    cost_impact: float, 
    daily_cost: float,
    planned_duration: float = 0,
    scenario_type: str = '',
    scenario_params: Dict = {}
) -> Dict:
    """
    Calculate risk assessment with exact formulas:
    Schedule_Risk = Project_Delay / Planned_Duration
    Resource_Risk = reduction_percentage × weight(resource_type)
    Material_Risk = shortage_percentage + (PI × 0.5)
    """
    # Schedule Risk: Schedule_Risk = Project_Delay / Planned_Duration
    schedule_risk = 0.0
    if planned_duration > 0:
        schedule_risk = abs(schedule_impact) / planned_duration
    else:
        schedule_risk = min(1.0, abs(schedule_impact) / 100.0)  # Fallback: assume 100 days baseline
    
    # Cost Risk (normalized)
    cost_risk = 0.0
    if daily_cost > 0:
        cost_risk = min(1.0, abs(cost_impact) / (daily_cost * planned_duration)) if planned_duration > 0 else min(1.0, abs(cost_impact) / (daily_cost * 100))
    else:
        cost_risk = min(1.0, abs(cost_impact) / 1000000)  # Fallback
    
    # Scenario-specific risk
    scenario_risk = 0.0
    
    if scenario_type == 'resource_reduction':
        # Resource_Risk = reduction_percentage × weight(resource_type)
        reduction_percent = scenario_params.get('reduction_percent', 0)
        resource_weight = scenario_params.get('resource_weight', 1.0)
        scenario_risk = (reduction_percent * 100) * resource_weight / 100.0  # Normalize to 0-1
    
    elif scenario_type == 'material_shortage':
        # Material_Risk = shortage_percentage + (PI × 0.5)
        shortage_percent = scenario_params.get('shortage_percent', 0)
        price_increase = scenario_params.get('price_increase', 0)
        scenario_risk = shortage_percent + (price_increase * 0.5)
        scenario_risk = min(1.0, scenario_risk)  # Cap at 1.0
    
    # Combined risk score (weighted average)
    # Schedule risk (40%) + Cost risk (30%) + Scenario-specific risk (30%)
    combined_risk = (schedule_risk * 0.4 + cost_risk * 0.3 + scenario_risk * 0.3)
    risk_score = int(combined_risk * 100)  # Scale to 0-100
    
    # Determine severity
    if risk_score >= 70:
        severity = "high"
    elif risk_score >= 40:
        severity = "medium"
    else:
        severity = "low"
    
    return {
        'risk_score': risk_score,
        'severity': severity,
        'schedule_risk': schedule_risk,
        'cost_risk': cost_risk,
        'scenario_risk': scenario_risk
    }

@app.post("/scenario/run", response_model=ScenarioResponse)
async def run_scenario(request: ScenarioRequest):
    """Run what-if scenario analysis"""
    try:
        tasks = request.tasks
        parameters = request.parameters
        scenario_type = request.scenario_type
        daily_cost = request.daily_project_cost or 0.0
        
        # Calculate base CPM for planned duration
        base_cpm = calculate_cpm(tasks)
        planned_duration = base_cpm['project_duration']
        
        # Process scenario based on type
        if scenario_type == ScenarioType.PROJECT_DELAY:
            result = process_project_delay(tasks, parameters, request.base_end_date)
            delay_days = result['delay_days']
            planned_duration = result.get('planned_duration', planned_duration)
            
            # Cost Impact Formula: CI = Project_Delay × CD
            cost_impact = delay_days * daily_cost
            
            scenario_params = {}
            
        elif scenario_type == ScenarioType.RESOURCE_REDUCTION:
            result = process_resource_reduction(tasks, parameters)
            delay_days = result['delay_days']
            cpm_delay = result.get('cpm_delay', delay_days)
            
            # Cost Impact Formula: CI = Final_Delay × CR
            # CR = daily resource rental cost (using daily_project_cost as proxy)
            cost_impact = delay_days * daily_cost
            
            scenario_params = {
                'reduction_percent': result.get('reduction_percent', 0),
                'resource_weight': result.get('resource_weight', 1.0)
            }
            
        elif scenario_type == ScenarioType.MATERIAL_SHORTAGE:
            result = process_material_shortage(tasks, parameters)
            delay_days = result['delay_days']
            material_cost_change = result.get('material_cost_change', 0.0)
            
            # Cost Impact = Delay_Impact + Material Cost Variance
            delay_cost = delay_days * daily_cost
            cost_impact = delay_cost + material_cost_change
            
            scenario_params = {
                'shortage_percent': result.get('shortage_percent', 0),
                'price_increase': result.get('price_increase', 0)
            }
            
        else:
            raise HTTPException(status_code=400, detail="Invalid scenario type")
        
        # Calculate risk assessment with exact formulas
        risk_assessment = calculate_risk_assessment(
            delay_days, 
            cost_impact, 
            daily_cost,
            planned_duration,
            scenario_type.value,
            scenario_params
        )
        
        # Build response
        response = ScenarioResponse(
            schedule_impact=ScheduleImpact(
                project_delay_days=delay_days,
                new_end_date=result['new_end_date'],
                critical_path=result['critical_path']
            ),
            cost_impact=CostImpact(
                material_cost_change=result.get('material_cost_change', 0.0) if scenario_type == ScenarioType.MATERIAL_SHORTAGE else 0.0,
                resource_cost_change=cost_impact - result.get('material_cost_change', 0.0) if scenario_type == ScenarioType.MATERIAL_SHORTAGE else cost_impact,
                total_cost_impact=cost_impact
            ),
            risk_assessment=RiskAssessment(
                risk_score=risk_assessment['risk_score'],
                severity=risk_assessment['severity']
            ),
            updated_tasks=result['updated_tasks']
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing scenario: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "scenario-analysis"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

