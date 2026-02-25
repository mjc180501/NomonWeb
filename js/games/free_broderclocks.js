import { config } from './free_config.js';
import { ClockInference } from './free_clock_inference_engine.js';

export class BroderClocks {
    constructor(parent) {
        this.parent = parent;
        this.clock_inf = new ClockInference(this.parent, this);
        this.latest_time = Date.now() / 1000;
        this.time_rotate = this.parent.time_rotate;
    }

    select(time_in) {
        this.clock_inf.update_scores(time_in - this.latest_time);

        const top_score_clock = this.clock_inf.sorted_inds[0];

        this.update_highlighting();

        if (this.clock_inf.is_winner()) {
            this.clock_inf.entropy.update_bits();
            this.parent.make_choice(this.clock_inf.sorted_inds[0]);
        } else {
            this.clock_inf.sorted_inds.slice(0, 3).map(i =>
                `Clock ${i}: ${this.clock_inf.cscores[i].toFixed(2)}`
            ).join(", ");
        }
    }

    update_highlighting() {
        const top_score = this.clock_inf.cscores[this.clock_inf.sorted_inds[0]];
        const bound_score = top_score - config.max_init_diff;

        for (let clock_ind of this.clock_inf.clocks_on) {
            const clock = this.parent.clocks[clock_ind];
            if (clock.visible) {
                if (this.clock_inf.cscores[clock_ind] > bound_score) {
                    clock.highlighted = true;
                } else {
                    clock.highlighted = false;
                }
                clock.draw_face();
            }
        }
    }

    init_round() {
        this.clock_inf.clock_util.init_round(this.clock_inf.clocks_li);
        this.clock_inf.clock_util.init_round(this.clock_inf.clocks_on);

        this.clock_inf.update_sorted_inds();
        this.clock_inf.clock_util.update_curhours(this.clock_inf.sorted_inds);
        this.clock_inf.handicap_cscores();

        this.update_highlighting();
    }

    reset_for_new_selection() {
        for (let clock of this.clock_inf.clocks_on) {
            this.clock_inf.cscores[clock] = 0;
        }
        this.init_round();
    }
}