export type PlanType = 'month' | 'year'

export function normalizePlanType(raw: string | undefined): PlanType {
  return raw === 'year' ? 'year' : 'month'
}

export function planAmount(planType: PlanType): string {
  return planType === 'year' ? '268.00' : '29.00'
}

export function planDays(planType: PlanType): number {
  return planType === 'year' ? 365 : 30
}

export function planTitle(planType: PlanType): string {
  return planType === 'year' ? 'YoHomie 年度会员' : 'YoHomie 月度会员'
}
