import logging
import math
from typing import List
from scipy.optimize import linprog
from app.models.strategic_models import (
    BudgetOptimizationInputSchema,
    BudgetOptimizationOutputSchema,
    BudgetAllocationItem
)

logger = logging.getLogger(__name__)

class ConstrainedBudgetOptimizerService:
    """
    Module 6: Constrained State Budget Allocation Optimizer
    Uses Mixed-Integer Linear Programming (MILP / Knapsack via Scipy) to maximize:
        max Sum(x_i * Population_i * RiskScore_i)
    Subject to:
        Sum(x_i * Cost_i) <= Total_Budget B
        x_i in {0, 1}
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

        # Objective function coefficients (negated for minimization solver)
        c = [- (cand.population * cand.risk_score) for cand in payload.candidates]
        A = [[cand.cost for cand in payload.candidates]]
        b = [payload.total_budget]
        integrality = [1] * N  # Integer variables (0 or 1)
        bounds = [(0, 1)] * N

        res = linprog(c, A_ub=A, b_ub=b, integrality=integrality, bounds=bounds, method='highs')

        allocations: List[BudgetAllocationItem] = []
        total_spent = 0.0
        total_lives_protected = 0

        if res.success:
            x_opt = [int(round(val)) for val in res.x]
            for idx, cand in enumerate(payload.candidates):
                is_selected = x_opt[idx] == 1
                if is_selected:
                    status = "FULLY_FUNDED"
                    total_spent += cand.cost
                    total_lives_protected += int(cand.population * cand.risk_score)
                else:
                    # Check if partial land-acquisition can be funded with remaining money
                    remaining = payload.total_budget - total_spent
                    if remaining >= (cand.cost * 0.3):
                        status = "LAND_ACQUISITION_ONLY"
                    else:
                        status = "DEFERRED"

                allocations.append(BudgetAllocationItem(
                    id=cand.id,
                    name=cand.name,
                    allocated_funding=cand.cost if is_selected else 0.0,
                    status=status
                ))
        else:
            logger.error(f"MILP Budget Solver failed: {res.message}")
            for cand in payload.candidates:
                allocations.append(BudgetAllocationItem(
                    id=cand.id,
                    name=cand.name,
                    allocated_funding=0.0,
                    status="DEFERRED"
                ))

        return BudgetOptimizationOutputSchema(
            total_budget=payload.total_budget,
            budget_utilized=round(total_spent, 2),
            lives_protected=total_lives_protected,
            allocations=allocations
        )

budget_service = ConstrainedBudgetOptimizerService()
