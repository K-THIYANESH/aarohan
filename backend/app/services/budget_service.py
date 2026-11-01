import logging
from typing import List
from app.models.strategic_models import (
    BudgetOptimizationInputSchema,
    BudgetOptimizationOutputSchema,
    BudgetAllocationItem
)

logger = logging.getLogger(__name__)

class ConstrainedBudgetOptimizerService:
    """
    Module 6: Constrained State Budget Allocation Optimizer
    Uses greedy knapsack (value-density sort) to maximize:
        max Sum(x_i * Population_i * RiskScore_i)
    Subject to:
        Sum(x_i * Cost_i) <= Total_Budget B
        x_i in {0, 1}
    Pure-Python implementation — no scipy/numpy dependency.
    """

    def optimize_allocation(self, payload: BudgetOptimizationInputSchema) -> BudgetOptimizationOutputSchema:
        N = len(payload.candidates)
        if N == 0:
            return BudgetOptimizationOutputSchema(
                total_budget=payload.total_budget,
                budget_utilized=0.0,
                lives_protected=0,
                allocations=[]
            )

        # Sort candidates by value-density: (population * risk_score) / cost — greedy knapsack
        indexed = list(enumerate(payload.candidates))
        indexed.sort(
            key=lambda pair: (pair[1].population * pair[1].risk_score) / max(pair[1].cost, 0.01),
            reverse=True
        )

        selected = set()
        remaining_budget = payload.total_budget
        total_spent = 0.0
        total_lives_protected = 0

        for orig_idx, cand in indexed:
            if cand.cost <= remaining_budget:
                selected.add(orig_idx)
                remaining_budget -= cand.cost
                total_spent += cand.cost
                total_lives_protected += int(cand.population * cand.risk_score)

        allocations: List[BudgetAllocationItem] = []
        for idx, cand in enumerate(payload.candidates):
            is_selected = idx in selected
            if is_selected:
                status = "FULLY_FUNDED"
            elif remaining_budget >= (cand.cost * 0.3):
                status = "LAND_ACQUISITION_ONLY"
            else:
                status = "DEFERRED"

            allocations.append(BudgetAllocationItem(
                id=cand.id,
                name=cand.name,
                allocated_funding=cand.cost if is_selected else 0.0,
                status=status
            ))

        return BudgetOptimizationOutputSchema(
            total_budget=payload.total_budget,
            budget_utilized=round(total_spent, 2),
            lives_protected=total_lives_protected,
            allocations=allocations
        )

budget_service = ConstrainedBudgetOptimizerService()
