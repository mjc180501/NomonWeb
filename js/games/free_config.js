export const config = {
    period_li: [],
    default_rotate_ind: 5,
    num_divs_click: 80,
    ideal_wait_s: 0.04,
    frac_period: 4.0 / 8.0,
    win_diff_base: Math.log(99),
    win_diff_high: Math.log(999),
    max_init_diff: Math.log(99) - Math.log(4),
    is_learning: true,
    mu0: 0.05,
    sigma0: 0.12,
    sigma0_sq: 0.12 * 0.12,
};

for (let i = 0; i < 21; i++) {
    config.period_li.push(6 * Math.exp((-i) / 10));
}
config.theta0 = config.frac_period * 2.0 * Math.PI;