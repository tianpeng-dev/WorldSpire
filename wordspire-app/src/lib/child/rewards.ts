export function spendStars(balance: number, cost: number): number {
  if (!Number.isFinite(balance) || !Number.isFinite(cost) || cost < 0 || balance < cost) {
    throw new Error("INSUFFICIENT_STARS");
  }
  return balance - cost;
}
