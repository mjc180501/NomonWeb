import { config } from './free_config.js';
import { ClockUtil } from './free_clock_util.js';

export class KernelDensityEstimation {
    constructor(time_rotate) {
        this.dens_li = [];
        this.Z = 0;
        this.ksigma0 = 0;
        this.time_rotate = time_rotate;

        this.index_li = [];
        for (let i = 0; i < config.num_divs_click; i++) {
            this.index_li.push(i);
        }

        this.x_li = [];
        for (let i in this.index_li) {
            const index = this.index_li[i];
            this.x_li.push(index * this.time_rotate / config.num_divs_click - this.time_rotate / 2.0);
        }
        this.initialize_dens();
    }

    initialize_dens() {
        this.Z = 0;
        this.dens_li = [];
        const n_ksigma = 5;

        for (let i in this.x_li) {
            const x = this.x_li[i];
            const diff = x - config.mu0;
            let dens = Math.exp(-1 / (2 * config.sigma0_sq) * diff * diff);
            dens /= Math.sqrt(2 * Math.PI * config.sigma0_sq);
            dens *= n_ksigma;
            this.dens_li.push(dens);
            this.Z += dens;
        }
        this.ksigma0 = 1.06 * config.sigma0 / (n_ksigma ** 0.2);
    }
}

export class Entropy {
    constructor(clock_inf) {
        this.clock_inf = clock_inf;
        this.num_bits = 0;
        this.bits_per_select = Math.log(this.clock_inf.clocks_on.length) / Math.log(2);
    }

    update_bits() {
        const K = this.clock_inf.clocks_on.length;
        this.bits_per_select = Math.log(K) / Math.log(2);
        this.num_bits += this.bits_per_select;
        return this.num_bits;
    }
}

export class ClockInference {
    constructor(parent, bc) {
        this.parent = parent;
        this.bc = bc;
        this.clock_util = new ClockUtil(this.parent, this.bc, this);

        this.clocks_li = [];
        for (let i = 0; i < this.parent.num_clocks; i++) {
            this.clocks_li.push(i);
        }

        this.clocks_on = this.parent.clocks_on;
        this.cscores = [];
        for (let i = 0; i < this.parent.num_clocks; i++) {
            this.cscores.push(0);
        }
        this.clock_locs = [];
        this.sorted_inds = this.clocks_on.slice();
        this.win_diffs = this.parent.win_diffs;
        this.time_rotate = this.parent.time_rotate;
        this.entropy = new Entropy(this);

        this.kde = new KernelDensityEstimation(this.time_rotate);
    }

    get_score_inc(yin) {
        const index = Math.floor(config.num_divs_click * (yin / this.time_rotate + 0.5)) % config.num_divs_click;
        if (this.kde.Z != 0) {
            return Math.log(this.kde.dens_li[index] / this.kde.Z);
        }
        return 1;
    }

    update_scores(time_diff_in) {
        const clock_locs = [];
        for (let i = 0; i < this.cscores.length; i++) {
            clock_locs.push(0);
        }
        for (let clock of this.clocks_on) {
            const time_in = this.clock_util.cur_hours[clock] * this.time_rotate /
                this.clock_util.num_divs_time + time_diff_in - this.time_rotate * config.frac_period;

            this.cscores[clock] += this.get_score_inc(time_in);
            clock_locs[clock] = time_in;
        }
        this.clock_locs.push(clock_locs);
        this.update_sorted_inds();
    }

    update_sorted_inds() {
        this.sorted_inds = [];
        for (let clock_index of this.clocks_on) {
            this.sorted_inds.push([-this.cscores[clock_index], clock_index]);
        }
        this.sorted_inds.sort((a, b) => a[0] - b[0]);
        for (let index in this.sorted_inds) {
            this.sorted_inds[index] = this.sorted_inds[index][1];
        }
    }

    is_winner() {
        const loc_win_diff = this.win_diffs[this.sorted_inds[0]];
        if (this.clocks_on.length <= 1) {
            return true;
        } else if (this.cscores[this.sorted_inds[0]] - this.cscores[this.sorted_inds[1]] > loc_win_diff) {
            return true;
        }
        return false;
    }

    handicap_cscores() {
        if (this.sorted_inds.length > 1 &&
            this.cscores[this.sorted_inds[0]] - this.cscores[this.sorted_inds[1]] > config.max_init_diff) {
            this.cscores[this.sorted_inds[0]] = this.cscores[this.sorted_inds[1]] + config.max_init_diff;
        }
    }
}