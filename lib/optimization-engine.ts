// Optimization Engine for Smart Resource Optimization
// Implements Genetic Algorithm for scheduling and ML models for predictions

import { Task, Resource, OptimizationResult } from './data-service'

// Genetic Algorithm Configuration
interface GAConfig {
  populationSize: number
  generations: number
  mutationRate: number
  crossoverRate: number
  elitismRate: number
}

// Task scheduling chromosome representation
interface ScheduleChromosome {
  taskOrder: number[]
  resourceAllocations: Record<string, string>
  startTimes: Record<string, number>
  fitness: number
}

// Resource leveling chromosome
interface ResourceChromosome {
  resourceAssignments: Record<string, number[]>
  levelingStrategy: string
  fitness: number
}

// ML Prediction Models
interface MLPredictionInput {
  projectType: string
  area: number
  floors: number
  structureType: string
  constraints: Record<string, any>
  historicalData?: any[]
}

interface MLPredictionOutput {
  estimatedDuration: number
  laborRequirement: number
  materialCost: number
  equipmentNeeds: string[]
  riskFactors: string[]
  confidence: number
}

// Default GA Configuration
const DEFAULT_GA_CONFIG: GAConfig = {
  populationSize: 50,
  generations: 100,
  mutationRate: 0.1,
  crossoverRate: 0.8,
  elitismRate: 0.1
}

// Optimization Engine Class
export class OptimizationEngine {
  private config: GAConfig

  constructor(config: Partial<GAConfig> = {}) {
    this.config = { ...DEFAULT_GA_CONFIG, ...config }
  }

  // Genetic Algorithm for Task Scheduling
  async optimizeTaskScheduling(
    tasks: Task[],
    resources: Resource[],
    constraints: Record<string, any> = {},
    additionalData?: {
      expenses?: any[]
      budgetCategories?: any[]
      projectBudget?: number
    }
  ): Promise<OptimizationResult> {
    console.log('Starting Genetic Algorithm for task scheduling...')
    
    // Initialize population
    let population = this.initializeSchedulePopulation(tasks, resources)
    
    // Evolution loop
    for (let generation = 0; generation < this.config.generations; generation++) {
      // Evaluate fitness
      population = await this.evaluateScheduleFitness(population, tasks, resources, constraints, additionalData)
      
      // Sort by fitness (higher is better)
      population.sort((a, b) => b.fitness - a.fitness)
      
      // Create next generation
      const nextGeneration: ScheduleChromosome[] = []
      
      // Elitism - keep best individuals
      const eliteCount = Math.floor(this.config.populationSize * this.config.elitismRate)
      nextGeneration.push(...population.slice(0, eliteCount))
      
      // Generate offspring
      while (nextGeneration.length < this.config.populationSize) {
        const parent1 = this.tournamentSelection(population)
        const parent2 = this.tournamentSelection(population)
        
        if (Math.random() < this.config.crossoverRate) {
          const [child1, child2] = this.scheduleCrossover(parent1, parent2)
          nextGeneration.push(child1, child2)
        } else {
          nextGeneration.push(parent1, parent2)
        }
      }
      
      // Mutation
      nextGeneration.forEach(chromosome => {
        if (Math.random() < this.config.mutationRate) {
          this.scheduleMutation(chromosome, tasks, resources)
        }
      })
      
      population = nextGeneration.slice(0, this.config.populationSize)
      
      // Log progress
      if (generation % 10 === 0) {
        console.log(`Generation ${generation}: Best fitness = ${population[0].fitness.toFixed(2)}`)
      }
    }
    
    // Return best solution
    const bestSolution = population[0]
    return {
      optimization_type: 'scheduling',
      algorithm_used: 'genetic_algorithm',
      input_parameters: { tasks, resources, constraints, config: this.config },
      results: {
        optimalSchedule: bestSolution,
        makespan: this.calculateMakespan(bestSolution, tasks),
        resourceUtilization: this.calculateResourceUtilization(bestSolution, resources, tasks, additionalData),
        totalCost: this.calculateTotalCost(bestSolution, tasks, resources, additionalData)
      },
      performance_metrics: {
        generations: this.config.generations,
        finalFitness: bestSolution.fitness,
        convergenceRate: this.calculateConvergenceRate(population)
      }
    }
  }

  // Genetic Algorithm for Resource Leveling
  async optimizeResourceLeveling(
    tasks: Task[],
    resources: Resource[],
    levelingObjective: 'minimize_peaks' | 'minimize_variance' | 'balance_workload' = 'minimize_peaks',
    additionalData?: {
      expenses?: any[]
      budgetCategories?: any[]
      projectBudget?: number
    }
  ): Promise<OptimizationResult> {
    console.log('Starting Genetic Algorithm for resource leveling...')
    
    // Initialize population
    let population = this.initializeResourcePopulation(tasks, resources)
    
    // Evolution loop
    for (let generation = 0; generation < this.config.generations; generation++) {
      // Evaluate fitness
      population = await this.evaluateResourceFitness(population, tasks, resources, levelingObjective)
      
      // Sort by fitness
      population.sort((a, b) => b.fitness - a.fitness)
      
      // Create next generation
      const nextGeneration: ResourceChromosome[] = []
      
      // Elitism
      const eliteCount = Math.floor(this.config.populationSize * this.config.elitismRate)
      nextGeneration.push(...population.slice(0, eliteCount))
      
      // Generate offspring
      while (nextGeneration.length < this.config.populationSize) {
        const parent1 = this.tournamentSelection(population)
        const parent2 = this.tournamentSelection(population)
        
        if (Math.random() < this.config.crossoverRate) {
          const [child1, child2] = this.resourceCrossover(parent1, parent2)
          nextGeneration.push(child1, child2)
        } else {
          nextGeneration.push(parent1, parent2)
        }
      }
      
      // Mutation
      nextGeneration.forEach(chromosome => {
        if (Math.random() < this.config.mutationRate) {
          this.resourceMutation(chromosome, resources)
        }
      })
      
      population = nextGeneration.slice(0, this.config.populationSize)
    }
    
    // Return best solution
    const bestSolution = population[0]
    return {
      optimization_type: 'resource_leveling',
      algorithm_used: 'genetic_algorithm',
      input_parameters: { tasks, resources, levelingObjective, config: this.config },
      results: {
        optimalLeveling: bestSolution,
        resourceProfile: this.calculateResourceProfile(bestSolution, resources),
        levelingMetrics: this.calculateLevelingMetrics(bestSolution, resources)
      },
      performance_metrics: {
        generations: this.config.generations,
        finalFitness: bestSolution.fitness
      }
    }
  }

  // ML Model for Labor and Material Prediction
  async predictLaborAndMaterial(input: MLPredictionInput): Promise<MLPredictionOutput> {
    console.log('Running ML prediction for labor and material requirements...')
    
    // Simulate ML model prediction (in real implementation, this would call actual ML models)
    const predictions = await this.simulateMLPrediction(input)
    
    return predictions
  }

  // What-If Analysis Engine
  async runWhatIfAnalysis(
    baseScenario: OptimizationResult,
    scenarioType: 'delay' | 'resource_reduction' | 'material_shortage',
    parameters: Record<string, any>
  ): Promise<OptimizationResult> {
    console.log(`Running what-if analysis: ${scenarioType}`)
    
    // Validate input parameters exist
    if (!baseScenario.input_parameters) {
      throw new Error('Base scenario missing input parameters. Please run optimization first or ensure the scenario includes tasks and resources.')
    }
    
    // Safely extract tasks and resources with defaults
    const baseTasks = baseScenario.input_parameters.tasks || []
    const baseResources = baseScenario.input_parameters.resources || []
    
    if (!Array.isArray(baseTasks) || baseTasks.length === 0) {
      throw new Error('Invalid or empty tasks data in base scenario. Please ensure tasks are available.')
    }
    if (!Array.isArray(baseResources) || baseResources.length === 0) {
      throw new Error('Invalid or empty resources data in base scenario. Please ensure resources are available.')
    }
    
    let modifiedTasks = [...(baseTasks as Task[])]
    let modifiedResources = [...(baseResources as Resource[])]
    
    // Apply scenario modifications
    switch (scenarioType) {
      case 'delay':
        modifiedTasks = this.applyDelayScenario(modifiedTasks, parameters)
        break
      case 'resource_reduction':
        modifiedResources = this.applyResourceReductionScenario(modifiedResources, parameters)
        break
      case 'material_shortage':
        modifiedResources = this.applyMaterialShortageScenario(modifiedResources, parameters)
        break
    }
    
    // Re-run optimization with modified parameters
    const newResult = await this.optimizeTaskScheduling(modifiedTasks, modifiedResources)
    
    // Calculate impact analysis with scenario context
    const impactAnalysis = this.calculateImpactAnalysis(baseScenario, newResult, scenarioType, parameters)
    
    return {
      ...newResult,
      results: {
        ...newResult.results,
        impactAnalysis,
        scenarioType,
        scenarioParameters: parameters
      }
    }
  }

  // Private helper methods for Genetic Algorithm

  private initializeSchedulePopulation(tasks: Task[], resources: Resource[]): ScheduleChromosome[] {
    const population: ScheduleChromosome[] = []
    
    for (let i = 0; i < this.config.populationSize; i++) {
      const taskOrder = this.generateRandomTaskOrder(tasks)
      const resourceAllocations = this.generateRandomResourceAllocations(tasks, resources)
      const startTimes = this.generateRandomStartTimes(tasks)
      
      population.push({
        taskOrder,
        resourceAllocations,
        startTimes,
        fitness: 0
      })
    }
    
    return population
  }

  private initializeResourcePopulation(tasks: Task[], resources: Resource[]): ResourceChromosome[] {
    const population: ResourceChromosome[] = []
    
    for (let i = 0; i < this.config.populationSize; i++) {
      const resourceAssignments = this.generateRandomResourceAssignments(tasks, resources)
      const levelingStrategy = this.generateRandomLevelingStrategy()
      
      population.push({
        resourceAssignments,
        levelingStrategy,
        fitness: 0
      })
    }
    
    return population
  }

  private async evaluateScheduleFitness(
    population: ScheduleChromosome[],
    tasks: Task[],
    resources: Resource[],
    constraints: Record<string, any>,
    additionalData?: {
      expenses?: any[]
      budgetCategories?: any[]
      projectBudget?: number
    }
  ): Promise<ScheduleChromosome[]> {
    return population.map(chromosome => {
      const fitness = this.calculateScheduleFitness(chromosome, tasks, resources, constraints, additionalData)
      return { ...chromosome, fitness }
    })
  }

  private async evaluateResourceFitness(
    population: ResourceChromosome[],
    tasks: Task[],
    resources: Resource[],
    objective: string
  ): Promise<ResourceChromosome[]> {
    return population.map(chromosome => {
      const fitness = this.calculateResourceFitness(chromosome, resources, objective)
      return { ...chromosome, fitness }
    })
  }

  private calculateScheduleFitness(
    chromosome: ScheduleChromosome,
    tasks: Task[],
    resources: Resource[],
    constraints: Record<string, any>,
    additionalData?: {
      expenses?: any[]
      budgetCategories?: any[]
      projectBudget?: number
    }
  ): number {
    // Multi-objective fitness function
    const makespan = this.calculateMakespan(chromosome, tasks)
    const cost = this.calculateTotalCost(chromosome, tasks, resources, additionalData)
    const resourceUtilization = this.calculateResourceUtilization(chromosome, resources, tasks, additionalData)
    const constraintViolations = this.calculateConstraintViolations(chromosome, tasks, constraints)
    
    // Normalize makespan (assume max 365 days)
    const normalizedMakespan = Math.min(makespan / 365, 1)
    
    // Normalize cost (use project budget if available, otherwise use cost itself)
    const budget = additionalData?.projectBudget || cost || 1
    const normalizedCost = Math.min(cost / budget, 1)
    
    // Weighted fitness (higher is better)
    // Invert makespan and cost (lower is better), keep utilization (higher is better)
    const fitness = (
      (1 - normalizedMakespan) * 0.4 +
      (1 - normalizedCost) * 0.3 +
      resourceUtilization * 0.2 +
      (1 / (constraintViolations + 1)) * 0.1
    )
    
    // Ensure fitness is between 0 and 1
    return Math.max(0, Math.min(1, fitness))
  }

  private calculateResourceFitness(
    chromosome: ResourceChromosome,
    resources: Resource[],
    objective: string
  ): number {
    const profile = this.calculateResourceProfile(chromosome, resources)
    
    switch (objective) {
      case 'minimize_peaks':
        return 1 / (Math.max(...profile) + 1)
      case 'minimize_variance':
        const mean = profile.reduce((a, b) => a + b, 0) / profile.length
        const variance = profile.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / profile.length
        return 1 / (variance + 1)
      case 'balance_workload':
        const max = Math.max(...profile)
        const min = Math.min(...profile)
        return 1 / ((max - min) + 1)
      default:
        return 1 / (Math.max(...profile) + 1)
    }
  }

  private tournamentSelection(population: any[]): any {
    const tournamentSize = 3
    const tournament = []
    
    for (let i = 0; i < tournamentSize; i++) {
      tournament.push(population[Math.floor(Math.random() * population.length)])
    }
    
    return tournament.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    )
  }

  private scheduleCrossover(parent1: ScheduleChromosome, parent2: ScheduleChromosome): [ScheduleChromosome, ScheduleChromosome] {
    // Order crossover for task order
    const crossoverPoint = Math.floor(Math.random() * parent1.taskOrder.length)
    
    const child1TaskOrder = [
      ...parent1.taskOrder.slice(0, crossoverPoint),
      ...parent2.taskOrder.filter(task => !parent1.taskOrder.slice(0, crossoverPoint).includes(task))
    ]
    
    const child2TaskOrder = [
      ...parent2.taskOrder.slice(0, crossoverPoint),
      ...parent1.taskOrder.filter(task => !parent2.taskOrder.slice(0, crossoverPoint).includes(task))
    ]
    
    // Uniform crossover for resource allocations
    const child1ResourceAllocations = { ...parent1.resourceAllocations }
    const child2ResourceAllocations = { ...parent2.resourceAllocations }
    
    Object.keys(parent1.resourceAllocations).forEach(key => {
      if (Math.random() < 0.5) {
        child1ResourceAllocations[key] = parent2.resourceAllocations[key]
        child2ResourceAllocations[key] = parent1.resourceAllocations[key]
      }
    })
    
    return [
      {
        taskOrder: child1TaskOrder,
        resourceAllocations: child1ResourceAllocations,
        startTimes: { ...parent1.startTimes },
        fitness: 0
      },
      {
        taskOrder: child2TaskOrder,
        resourceAllocations: child2ResourceAllocations,
        startTimes: { ...parent2.startTimes },
        fitness: 0
      }
    ]
  }

  private resourceCrossover(parent1: ResourceChromosome, parent2: ResourceChromosome): [ResourceChromosome, ResourceChromosome] {
    // Uniform crossover for resource assignments
    const child1Assignments = { ...parent1.resourceAssignments }
    const child2Assignments = { ...parent2.resourceAssignments }
    
    Object.keys(parent1.resourceAssignments).forEach(key => {
      if (Math.random() < 0.5) {
        child1Assignments[key] = parent2.resourceAssignments[key]
        child2Assignments[key] = parent1.resourceAssignments[key]
      }
    })
    
    return [
      {
        resourceAssignments: child1Assignments,
        levelingStrategy: Math.random() < 0.5 ? parent1.levelingStrategy : parent2.levelingStrategy,
        fitness: 0
      },
      {
        resourceAssignments: child2Assignments,
        levelingStrategy: Math.random() < 0.5 ? parent1.levelingStrategy : parent2.levelingStrategy,
        fitness: 0
      }
    ]
  }

  private scheduleMutation(chromosome: ScheduleChromosome, tasks: Task[], resources: Resource[]): void {
    // Swap mutation for task order
    if (Math.random() < 0.5) {
      const i = Math.floor(Math.random() * chromosome.taskOrder.length)
      const j = Math.floor(Math.random() * chromosome.taskOrder.length)
      ;[chromosome.taskOrder[i], chromosome.taskOrder[j]] = [chromosome.taskOrder[j], chromosome.taskOrder[i]]
    }
    
    // Random mutation for resource allocations
    Object.keys(chromosome.resourceAllocations).forEach(key => {
      if (Math.random() < 0.1) {
        const availableResources = resources.filter(r => r.type === 'labor').map(r => r.id)
        chromosome.resourceAllocations[key] = availableResources[Math.floor(Math.random() * availableResources.length)]
      }
    })
  }

  private resourceMutation(chromosome: ResourceChromosome, resources: Resource[]): void {
    // Random mutation for resource assignments
    Object.keys(chromosome.resourceAssignments).forEach(key => {
      if (Math.random() < 0.1) {
        const assignment = chromosome.resourceAssignments[key]
        const randomIndex = Math.floor(Math.random() * assignment.length)
        assignment[randomIndex] = Math.max(0, assignment[randomIndex] + (Math.random() - 0.5) * 2)
      }
    })
  }

  // Helper methods for calculations
  private calculateMakespan(chromosome: ScheduleChromosome, tasks: Task[]): number {
    // Simplified makespan calculation
    return Math.max(...Object.values(chromosome.startTimes)) + 
           Math.max(...tasks.map(t => t.duration_days || 0))
  }

  private calculateTotalCost(
    chromosome: ScheduleChromosome, 
    tasks: Task[], 
    resources: Resource[],
    additionalData?: {
      expenses?: any[]
      budgetCategories?: any[]
      projectBudget?: number
    }
  ): number {
    // Calculate task costs
    let totalCost = tasks.reduce((total, task) => {
      const taskCost = Number(task.estimated_cost) || 0
      return total + taskCost
    }, 0)

    // Add actual expenses from database
    if (additionalData?.expenses && additionalData.expenses.length > 0) {
      const expenseTotal = additionalData.expenses.reduce((sum, exp) => {
        return sum + (Number(exp.amount) || 0)
      }, 0)
      totalCost += expenseTotal
    }

    // Add resource costs
    resources.forEach(resource => {
      const quantity = (resource as any).quantity || 1
      const unitCost = Number(resource.base_cost) || Number((resource as any).cost) || 0
      totalCost += quantity * unitCost
    })

    // If we have budget categories, use planned amounts
    if (additionalData?.budgetCategories && additionalData.budgetCategories.length > 0) {
      const categoryTotal = additionalData.budgetCategories.reduce((sum, cat) => {
        return sum + (Number(cat.planned_amount) || 0)
      }, 0)
      // Use the higher of task costs or category planned amounts
      totalCost = Math.max(totalCost, categoryTotal)
    }

    return totalCost
  }

  private calculateResourceUtilization(
    chromosome: ScheduleChromosome, 
    resources: Resource[],
    tasks: Task[],
    additionalData?: {
      expenses?: any[]
      budgetCategories?: any[]
      projectBudget?: number
    }
  ): number {
    if (!resources || resources.length === 0) return 0

    // Calculate actual resource utilization based on assigned resources
    let totalAllocated = 0
    let totalAvailable = 0

    resources.forEach(resource => {
      const quantity = (resource as any).quantity || 0
      const available = Number(resource.quantity) || Number((resource as any).available_quantity) || quantity
      
      totalAllocated += quantity
      totalAvailable += available
    })

    // Calculate utilization percentage
    if (totalAvailable === 0) return 0
    const utilization = totalAllocated / totalAvailable

    // Normalize to 0-1 range and ensure it's realistic
    return Math.min(Math.max(utilization, 0), 1)
  }

  private calculateConstraintViolations(chromosome: ScheduleChromosome, tasks: Task[], constraints: Record<string, any>): number {
    // Simplified constraint violation calculation
    return 0 // Placeholder
  }

  private calculateResourceProfile(chromosome: ResourceChromosome, resources: Resource[]): number[] {
    if (!resources || resources.length === 0) return [0, 0, 0, 0, 0, 0, 0]

    // Calculate actual resource profile based on assigned resources
    const profile: number[] = []
    
    // Generate 7-day profile (one week)
    for (let day = 0; day < 7; day++) {
      let dayTotal = 0
      
      resources.forEach(resource => {
        const quantity = (resource as any).quantity || 0
        // Distribute resources across days (simplified)
        const dailyAllocation = quantity / 7
        dayTotal += dailyAllocation
      })
      
      profile.push(Math.round(dayTotal))
    }

    // If all zeros, return a default profile based on total resources
    if (profile.every(v => v === 0)) {
      const totalResources = resources.reduce((sum, r) => sum + ((r as any).quantity || 0), 0)
      const avgDaily = Math.round(totalResources / 7)
      return Array(7).fill(avgDaily)
    }

    return profile
  }

  private calculateLevelingMetrics(chromosome: ResourceChromosome, resources: Resource[]): Record<string, number> {
    const profile = this.calculateResourceProfile(chromosome, resources)
    const max = Math.max(...profile)
    const min = Math.min(...profile)
    const mean = profile.reduce((a, b) => a + b, 0) / profile.length
    const variance = profile.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / profile.length
    
    return {
      peak: max,
      valley: min,
      range: max - min,
      variance,
      standardDeviation: Math.sqrt(variance)
    }
  }

  private calculateConvergenceRate(population: any[]): number {
    // Simplified convergence rate calculation
    return 0.85 // Placeholder
  }

  // ML Prediction Simulation
  private async simulateMLPrediction(input: MLPredictionInput): Promise<MLPredictionOutput> {
    // Simulate ML model processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate predictions based on input parameters
    const baseDuration = input.area / 1000 // Base duration calculation
    const complexityMultiplier = input.floors > 10 ? 1.5 : 1.0
    const structureMultiplier = input.structureType === 'steel-frame' ? 0.8 : 1.2
    
    return {
      estimatedDuration: Math.round(baseDuration * complexityMultiplier * structureMultiplier),
      laborRequirement: Math.round(input.area * 0.1 * complexityMultiplier),
      materialCost: Math.round(input.area * 500 * structureMultiplier),
      equipmentNeeds: this.generateEquipmentNeeds(input),
      riskFactors: this.identifyRiskFactors(input),
      confidence: 0.85
    }
  }

  private generateEquipmentNeeds(input: MLPredictionInput): string[] {
    const needs = ['Excavator', 'Crane', 'Concrete Mixer']
    if (input.floors > 5) needs.push('Tower Crane')
    if (input.structureType === 'steel-frame') needs.push('Welding Equipment')
    return needs
  }

  private identifyRiskFactors(input: MLPredictionInput): string[] {
    const risks = []
    if (input.floors > 15) risks.push('High-rise construction risks')
    if (input.constraints.environmentalRestrictions) risks.push('Environmental compliance')
    if (input.constraints.timeConstraint) risks.push('Schedule pressure')
    return risks
  }

  // What-If Analysis Helper Methods
  private applyDelayScenario(tasks: Task[], parameters: Record<string, any>): Task[] {
    const delayDays = parameters.delayDays || 7
    const affectedTasks = parameters.affectedTasks || 'all'
    const delayReason = parameters.delayReason || 'weather'
    
    // Calculate delay multiplier based on reason
    // Some reasons cause cascading delays (e.g., permit issues affect all subsequent tasks)
    const delayMultiplier = this.getDelayMultiplier(delayReason)
    
    return tasks.map((task, index) => {
      let shouldDelay = false
      
      // Determine which tasks are affected
      if (affectedTasks === 'all') {
        shouldDelay = true
      } else if (affectedTasks === 'critical') {
        // Assume tasks with high priority or dependencies are critical
        shouldDelay = task.priority === 'high' || (task as any).dependencies?.length > 0
      } else if (affectedTasks === 'specific') {
        // Delay specific tasks (could be enhanced with task selection)
        shouldDelay = index < Math.ceil(tasks.length * 0.3) // Delay first 30% of tasks
      }
      
      if (shouldDelay) {
        const actualDelay = Math.ceil(delayDays * delayMultiplier)
        const newStartDate = task.start_date ? 
          new Date(new Date(task.start_date).getTime() + actualDelay * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
          undefined
        
        // Also extend end date if it exists
        const newEndDate = task.end_date ? 
          new Date(new Date(task.end_date).getTime() + actualDelay * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
          undefined
        
        return {
          ...task,
          start_date: newStartDate,
          end_date: newEndDate,
          duration_days: task.duration_days ? task.duration_days + actualDelay : undefined
        }
      }
      
      return task
    })
  }
  
  private getDelayMultiplier(delayReason: string): number {
    // Different delay reasons have different impact multipliers
    switch (delayReason) {
      case 'weather':
        return 1.0 // Direct delay, no cascading
      case 'permit':
        return 1.5 // Permits affect all subsequent tasks
      case 'supply':
        return 1.3 // Supply chain delays cascade moderately
      case 'labor':
        return 1.2 // Labor shortages cascade slightly
      default:
        return 1.0
    }
  }

  private applyResourceReductionScenario(resources: Resource[], parameters: Record<string, any>): Resource[] {
    const reductionPercent = parameters.reductionPercent || 20
    const resourceType = parameters.resourceType || 'all'
    const duration = parameters.duration || 30 // Duration in days
    
    return resources.map(resource => {
      // Check if this resource type should be reduced
      let shouldReduce = false
      
      if (resourceType === 'all') {
        shouldReduce = true
      } else if (resourceType === 'labor' && resource.type === 'labour') {
        shouldReduce = true
      } else if (resourceType === 'equipment' && resource.type === 'equipment') {
        shouldReduce = true
      } else if (resourceType === 'material' && resource.type === 'material') {
        shouldReduce = true
      }
      
      if (shouldReduce) {
        // Store reduction metadata for impact calculation
        // Resources don't have quantity in base interface, so we'll track reduction percentage
        return {
          ...resource,
          // Store reduction parameters for impact calculation
          reductionPercent,
          reductionDuration: duration,
          isReduced: true,
          // For cost calculation, we'll use base_cost with reduction applied
          effectiveCost: resource.base_cost * (1 + (reductionPercent / 100) * 0.1) // Slight cost increase due to efficiency loss
        }
      }
      
      return resource
    })
  }
  
  private calculateResourceReductionImpact(
    baseResources: Resource[],
    newResources: Resource[],
    reductionPercent: number,
    resourceType: string,
    duration: number,
    baseMakespan: number
  ): { scheduleImpact: number; costImpact: number } {
    // Calculate how resource reduction affects schedule
    // Fewer resources = tasks take longer to complete
    
    // Resource efficiency impact multiplier
    // Higher reduction = more schedule impact
    const efficiencyLoss = reductionPercent / 100 // 0.2 for 20% reduction
    
    // Different resource types have different impact on schedule
    const scheduleImpactMultiplier = this.getResourceScheduleImpactMultiplier(resourceType)
    
    // Calculate schedule impact based on reduction percentage and duration
    // Formula: base makespan * efficiency loss * resource type multiplier * (duration / base makespan ratio)
    // If duration is less than makespan, impact is proportional
    const durationRatio = Math.min(1, duration / Math.max(baseMakespan, 1))
    
    // Base schedule impact from resource reduction
    let scheduleImpact = baseMakespan * efficiencyLoss * scheduleImpactMultiplier
    
    // Adjust based on duration - if reduction is temporary, impact is proportional
    if (durationRatio < 1) {
      scheduleImpact = scheduleImpact * durationRatio
    }
    
    // Minimum impact even for short durations (setup/coordination overhead)
    const minimumImpact = Math.ceil(baseMakespan * 0.05 * efficiencyLoss) // At least 5% of reduction impact
    scheduleImpact = Math.max(minimumImpact, scheduleImpact)
    
    // Calculate cost impact
    // Cost savings from reduced resource usage vs. additional costs from delays
    
    // Estimate resource usage cost (assuming average daily usage)
    // For resources, we estimate based on base_cost and typical project usage
    let estimatedDailyResourceCost = 0
    let reducedResourceCost = 0
    
    baseResources.forEach((baseRes, index) => {
      const newRes = newResources[index]
      const isReduced = (newRes as any)?.isReduced || false
      
      if (isReduced) {
        // Estimate typical daily usage (assume 1 unit per day per resource type)
        // In real scenario, this would come from project resource assignments
        const typicalDailyUsage = this.getTypicalDailyUsage(baseRes.type)
        const unitCost = baseRes.base_cost || 0
        
        // Base daily cost
        const baseDailyCost = typicalDailyUsage * unitCost
        
        // Reduced daily cost (after reduction)
        const reducedDailyCost = baseDailyCost * (1 - efficiencyLoss)
        
        estimatedDailyResourceCost += baseDailyCost
        reducedResourceCost += reducedDailyCost
      } else {
        // Non-reduced resources still cost the same
        const typicalDailyUsage = this.getTypicalDailyUsage(baseRes.type)
        const unitCost = baseRes.base_cost || 0
        estimatedDailyResourceCost += typicalDailyUsage * unitCost
        reducedResourceCost += typicalDailyUsage * unitCost
      }
    })
    
    // Calculate savings over duration
    const resourceCostSavings = (estimatedDailyResourceCost - reducedResourceCost) * duration
    
    // Calculate additional costs due to schedule delays
    // Daily overhead cost increases with delays
    const dailyOverheadRate = 0.001 // 0.1% of base cost per day
    const estimatedBaseCost = estimatedDailyResourceCost * baseMakespan
    const delayCost = scheduleImpact * estimatedBaseCost * dailyOverheadRate
    
    // Additional efficiency loss cost (reduced resources may need overtime/premium rates)
    const efficiencyLossCost = estimatedDailyResourceCost * duration * efficiencyLoss * 0.2 // 20% premium
    
    // Net cost impact = savings - delay costs - efficiency loss costs
    const costImpact = resourceCostSavings - delayCost - efficiencyLossCost
    
    return {
      scheduleImpact: Math.ceil(scheduleImpact),
      costImpact
    }
  }
  
  private getTypicalDailyUsage(resourceType: string): number {
    // Estimate typical daily usage per resource type
    // This is a heuristic - in production, this would come from actual project data
    switch (resourceType) {
      case 'labour':
        return 8 // 8 hours per day per labor resource
      case 'equipment':
        return 1 // 1 unit per day per equipment
      case 'material':
        return 10 // 10 units per day per material (varies widely)
      default:
        return 1
    }
  }
  
  private getResourceScheduleImpactMultiplier(resourceType: string): number {
    // Different resource types have different impacts on schedule
    switch (resourceType) {
      case 'labor':
      case 'labour':
        return 1.5 // Labor reduction has highest schedule impact
      case 'equipment':
        return 1.2 // Equipment reduction has moderate impact
      case 'material':
        return 0.8 // Material reduction has lower schedule impact (can stockpile)
      case 'all':
        return 1.3 // Combined reduction has significant impact
      default:
        return 1.0
    }
  }

  private applyMaterialShortageScenario(resources: Resource[], parameters: Record<string, any>): Resource[] {
    const shortageMaterials = parameters.materials || []
    return resources.map(resource => {
      if (shortageMaterials.includes(resource.name)) {
        return {
          ...resource,
          quantity: Math.max(1, Math.floor(resource.quantity * 0.5)),
          cost_per_unit: (resource.cost_per_unit || 0) * 1.5 // Price increase due to shortage
        }
      }
      return resource
    })
  }

  private calculateImpactAnalysis(
    baseScenario: OptimizationResult, 
    newScenario: OptimizationResult,
    scenarioType?: string,
    parameters?: Record<string, any>
  ): Record<string, any> {
    // Safely extract makespan and totalCost from base scenario
    let baseMakespan: number = 0
    let baseCost: number = 0
    
    if (baseScenario.results) {
      baseMakespan = (baseScenario.results.makespan as number) || 0
      baseCost = (baseScenario.results.totalCost as number) || 0
      
      // Calculate from optimalSchedule if available
      if (baseMakespan === 0 && baseScenario.results.optimalSchedule) {
        const tasks = baseScenario.input_parameters?.tasks || []
        baseMakespan = this.calculateMakespan(baseScenario.results.optimalSchedule as ScheduleChromosome, tasks)
      }
      
      // Calculate from tasks if still not found
      if (baseMakespan === 0 && baseScenario.input_parameters?.tasks) {
        baseMakespan = this.calculateMakespanFromTasks(baseScenario.input_parameters.tasks as Task[])
      }
      
      // Calculate cost from tasks
      if (baseCost === 0 && baseScenario.input_parameters?.tasks) {
        const tasks = baseScenario.input_parameters.tasks as Task[]
        baseCost = tasks.reduce((total, task) => total + (task.estimated_cost || 0), 0)
      }
      
      // Also include resource costs if available
      if (baseScenario.input_parameters?.resources) {
        const resources = baseScenario.input_parameters.resources as Resource[]
        const resourceCost = resources.reduce((total, res) => {
          const quantity = (res as any).quantity || 1
          const cost = res.base_cost || 0
          return total + (quantity * cost)
        }, 0)
        baseCost += resourceCost
      }
    }
    
    // Safely extract makespan and totalCost from new scenario
    let newMakespan = (newScenario.results?.makespan as number) || 0
    let newCost = (newScenario.results?.totalCost as number) || 0
    
    // Calculate from optimalSchedule if available
    if (newMakespan === 0 && newScenario.results?.optimalSchedule) {
      const tasks = newScenario.input_parameters?.tasks || []
      newMakespan = this.calculateMakespan(newScenario.results.optimalSchedule as ScheduleChromosome, tasks)
    }
    
    // Calculate from tasks if still not found
    if (newMakespan === 0 && newScenario.input_parameters?.tasks) {
      newMakespan = this.calculateMakespanFromTasks(newScenario.input_parameters.tasks as Task[])
    }
    
    // Calculate cost from tasks
    if (newCost === 0 && newScenario.input_parameters?.tasks) {
      const tasks = newScenario.input_parameters.tasks as Task[]
      newCost = tasks.reduce((total, task) => total + (task.estimated_cost || 0), 0)
    }
    
    // Include resource costs
    if (newScenario.input_parameters?.resources) {
      const resources = newScenario.input_parameters.resources as Resource[]
      const resourceCost = resources.reduce((total, res) => {
        const quantity = (res as any).quantity || 1
        const cost = res.base_cost || 0
        return total + (quantity * cost)
      }, 0)
      newCost += resourceCost
    }
    
    // For delay scenarios, calculate more accurate impact based on parameters
    if (scenarioType === 'delay' && parameters) {
      const delayDays = parameters.delayDays || 0
      const affectedTasks = parameters.affectedTasks || 'all'
      const delayReason = parameters.delayReason || 'weather'
      
      // Calculate actual schedule impact based on delay parameters
      const delayMultiplier = this.getDelayMultiplier(delayReason)
      let actualScheduleImpact = delayDays
      
      if (affectedTasks === 'critical') {
        // Critical path delays affect entire project timeline
        actualScheduleImpact = Math.ceil(delayDays * delayMultiplier * 1.2)
      } else if (affectedTasks === 'all') {
        // All tasks delayed - direct impact
        actualScheduleImpact = Math.ceil(delayDays * delayMultiplier)
      } else {
        // Specific tasks - partial impact
        actualScheduleImpact = Math.ceil(delayDays * delayMultiplier * 0.7)
      }
      
      // Override makespan impact with calculated value if it's more accurate
      if (actualScheduleImpact > Math.abs(newMakespan - baseMakespan)) {
        newMakespan = baseMakespan + actualScheduleImpact
      }
      
      // Calculate cost impact based on delay reason
      const dailyOverheadCost = baseCost * 0.001 // 0.1% of base cost per day
      const delayCostMultiplier = this.getDelayCostMultiplier(delayReason)
      const additionalCost = actualScheduleImpact * dailyOverheadCost * delayCostMultiplier
      newCost = baseCost + additionalCost
    }
    
    // For resource reduction scenarios, calculate more accurate impact based on parameters
    if (scenarioType === 'resource_reduction' && parameters) {
      const reductionPercent = parameters.reductionPercent || 0
      const resourceType = parameters.resourceType || 'all'
      const duration = parameters.duration || 30
      
      // Get base and new resources
      const baseResources = (baseScenario.input_parameters?.resources || []) as Resource[]
      const newResources = (newScenario.input_parameters?.resources || []) as Resource[]
      
      if (baseResources.length > 0 && newResources.length > 0) {
        // Calculate resource reduction impact
        const reductionImpact = this.calculateResourceReductionImpact(
          baseResources,
          newResources,
          reductionPercent,
          resourceType,
          duration,
          baseMakespan
        )
        
        // Update schedule impact
        const calculatedScheduleImpact = reductionImpact.scheduleImpact
        if (calculatedScheduleImpact > 0) {
          newMakespan = baseMakespan + calculatedScheduleImpact
        }
        
        // Update cost impact (can be negative if savings exceed delay costs)
        const calculatedCostImpact = reductionImpact.costImpact
        newCost = baseCost + calculatedCostImpact
      }
    }
    
    // Calculate impacts
    const makespanImpact = newMakespan - baseMakespan
    const costImpact = newCost - baseCost
    const makespanImpactPercent = baseMakespan > 0 ? ((makespanImpact / baseMakespan) * 100) : 0
    const costImpactPercent = baseCost > 0 ? ((costImpact / baseCost) * 100) : 0
    
    // Calculate separate risk assessments
    const scheduleRisk = this.assessScheduleRisk(makespanImpact, makespanImpactPercent)
    const costRisk = this.assessCostRisk(costImpact, costImpactPercent)
    const overallRisk = this.assessOverallRisk(scheduleRisk, costRisk)
    
    return {
      makespanImpact,
      costImpact,
      makespanImpactPercent,
      costImpactPercent,
      baseMakespan,
      newMakespan,
      baseCost,
      newCost,
      scheduleRisk,
      costRisk,
      riskLevel: overallRisk
    }
  }
  
  private calculateMakespanFromTasks(tasks: Task[]): number {
    if (!tasks || tasks.length === 0) return 0
    
    const dates = tasks.map(t => {
      const endDate = t.end_date ? new Date(t.end_date).getTime() : 0
      const startDate = t.start_date ? new Date(t.start_date).getTime() : 0
      const duration = t.duration_days || 0
      return endDate || (startDate + duration * 24 * 60 * 60 * 1000) || 0
    }).filter(d => d > 0)
    
    if (dates.length === 0) return 0
    
    const maxEndDate = Math.max(...dates)
    const now = Date.now()
    return maxEndDate > now ? Math.ceil((maxEndDate - now) / (1000 * 60 * 60 * 24)) : 0
  }
  
  private getDelayCostMultiplier(delayReason: string): number {
    // Different delay reasons have different cost impacts
    switch (delayReason) {
      case 'weather':
        return 1.0 // Minimal additional cost (just overhead)
      case 'permit':
        return 1.5 // Permit delays often involve penalties and rework
      case 'supply':
        return 2.0 // Supply chain delays cause rush orders and premium pricing
      case 'labor':
        return 1.8 // Labor shortages require overtime and premium rates
      default:
        return 1.0
    }
  }
  
  private assessScheduleRisk(makespanImpact: number, makespanImpactPercent: number): 'low' | 'medium' | 'high' {
    // Assess risk based on both absolute days and percentage
    const absDays = Math.abs(makespanImpact)
    const absPercent = Math.abs(makespanImpactPercent)
    
    if (absDays > 30 || absPercent > 25) return 'high'
    if (absDays > 15 || absPercent > 12) return 'medium'
    return 'low'
  }
  
  private assessCostRisk(costImpact: number, costImpactPercent: number): 'low' | 'medium' | 'high' {
    // Assess risk based on both absolute cost and percentage
    const absCost = Math.abs(costImpact)
    const absPercent = Math.abs(costImpactPercent)
    
    if (absCost > 500000 || absPercent > 20) return 'high'
    if (absCost > 200000 || absPercent > 10) return 'medium'
    return 'low'
  }
  
  private assessOverallRisk(scheduleRisk: 'low' | 'medium' | 'high', costRisk: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    // Overall risk is the higher of the two, or medium if one is high and other is low
    if (scheduleRisk === 'high' || costRisk === 'high') return 'high'
    if (scheduleRisk === 'medium' || costRisk === 'medium') return 'medium'
    return 'low'
  }

  // Legacy method - kept for backward compatibility
  private assessRiskLevel(makespanImpact: number, costImpact: number): 'low' | 'medium' | 'high' {
    const scheduleRisk = this.assessScheduleRisk(makespanImpact, 0)
    const costRisk = this.assessCostRisk(costImpact, 0)
    return this.assessOverallRisk(scheduleRisk, costRisk)
  }

  // Utility methods for random generation
  private generateRandomTaskOrder(tasks: Task[]): number[] {
    const order = tasks.map((_, index) => index)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    return order
  }

  private generateRandomResourceAllocations(tasks: Task[], resources: Resource[]): Record<string, string> {
    const allocations: Record<string, string> = {}
    const laborResources = resources.filter(r => r.type === 'labor')
    
    tasks.forEach(task => {
      if (laborResources.length > 0) {
        allocations[task.id || ''] = laborResources[Math.floor(Math.random() * laborResources.length)].id || ''
      }
    })
    
    return allocations
  }

  private generateRandomStartTimes(tasks: Task[]): Record<string, number> {
    const startTimes: Record<string, number> = {}
    tasks.forEach(task => {
      startTimes[task.id || ''] = Math.floor(Math.random() * 30) // Random start day within first month
    })
    return startTimes
  }

  private generateRandomResourceAssignments(tasks: Task[], resources: Resource[]): Record<string, number[]> {
    const assignments: Record<string, number[]> = {}
    resources.forEach(resource => {
      assignments[resource.id || ''] = tasks.map(() => Math.floor(Math.random() * 10) + 1)
    })
    return assignments
  }

  private generateRandomLevelingStrategy(): string {
    const strategies = ['minimize_peaks', 'minimize_variance', 'balance_workload']
    return strategies[Math.floor(Math.random() * strategies.length)]
  }
}

// Export singleton instance
export const optimizationEngine = new OptimizationEngine()
