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
    constraints: Record<string, any> = {}
  ): Promise<OptimizationResult> {
    console.log('Starting Genetic Algorithm for task scheduling...')
    
    // Initialize population
    let population = this.initializeSchedulePopulation(tasks, resources)
    
    // Evolution loop
    for (let generation = 0; generation < this.config.generations; generation++) {
      // Evaluate fitness
      population = await this.evaluateScheduleFitness(population, tasks, resources, constraints)
      
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
        resourceUtilization: this.calculateResourceUtilization(bestSolution, resources),
        totalCost: this.calculateTotalCost(bestSolution, tasks, resources)
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
    levelingObjective: 'minimize_peaks' | 'minimize_variance' | 'balance_workload' = 'minimize_peaks'
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
    
    let modifiedTasks = [...(baseScenario.input_parameters.tasks as Task[])]
    let modifiedResources = [...(baseScenario.input_parameters.resources as Resource[])]
    
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
    
    // Calculate impact analysis
    const impactAnalysis = this.calculateImpactAnalysis(baseScenario, newResult)
    
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
    constraints: Record<string, any>
  ): Promise<ScheduleChromosome[]> {
    return population.map(chromosome => {
      const fitness = this.calculateScheduleFitness(chromosome, tasks, resources, constraints)
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
    constraints: Record<string, any>
  ): number {
    // Multi-objective fitness function
    const makespan = this.calculateMakespan(chromosome, tasks)
    const cost = this.calculateTotalCost(chromosome, tasks, resources)
    const resourceUtilization = this.calculateResourceUtilization(chromosome, resources)
    const constraintViolations = this.calculateConstraintViolations(chromosome, tasks, constraints)
    
    // Weighted fitness (higher is better)
    const fitness = (
      (1 / (makespan + 1)) * 0.4 +
      (1 / (cost + 1)) * 0.3 +
      resourceUtilization * 0.2 +
      (1 / (constraintViolations + 1)) * 0.1
    )
    
    return fitness
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

  private calculateTotalCost(chromosome: ScheduleChromosome, tasks: Task[], resources: Resource[]): number {
    // Simplified cost calculation
    return tasks.reduce((total, task) => total + (task.estimated_cost || 0), 0)
  }

  private calculateResourceUtilization(chromosome: ScheduleChromosome, resources: Resource[]): number {
    // Simplified utilization calculation
    return 0.75 // Placeholder
  }

  private calculateConstraintViolations(chromosome: ScheduleChromosome, tasks: Task[], constraints: Record<string, any>): number {
    // Simplified constraint violation calculation
    return 0 // Placeholder
  }

  private calculateResourceProfile(chromosome: ResourceChromosome, resources: Resource[]): number[] {
    // Simplified resource profile calculation
    return [10, 15, 12, 18, 14, 16, 13] // Placeholder
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
    return tasks.map(task => ({
      ...task,
      start_date: task.start_date ? 
        new Date(new Date(task.start_date).getTime() + delayDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
        undefined
    }))
  }

  private applyResourceReductionScenario(resources: Resource[], parameters: Record<string, any>): Resource[] {
    const reductionPercent = parameters.reductionPercent || 20
    return resources.map(resource => ({
      ...resource,
      quantity: Math.max(1, Math.floor(resource.quantity * (1 - reductionPercent / 100)))
    }))
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

  private calculateImpactAnalysis(baseScenario: OptimizationResult, newScenario: OptimizationResult): Record<string, any> {
    const baseMakespan = baseScenario.results.makespan as number
    const newMakespan = newScenario.results.makespan as number
    const baseCost = baseScenario.results.totalCost as number
    const newCost = newScenario.results.totalCost as number
    
    return {
      makespanImpact: newMakespan - baseMakespan,
      costImpact: newCost - baseCost,
      makespanImpactPercent: ((newMakespan - baseMakespan) / baseMakespan) * 100,
      costImpactPercent: ((newCost - baseCost) / baseCost) * 100,
      riskLevel: this.assessRiskLevel(newMakespan - baseMakespan, newCost - baseCost)
    }
  }

  private assessRiskLevel(makespanImpact: number, costImpact: number): 'low' | 'medium' | 'high' {
    if (makespanImpact > 30 || costImpact > 500000) return 'high'
    if (makespanImpact > 15 || costImpact > 200000) return 'medium'
    return 'low'
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
