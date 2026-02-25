import { config } from './free_config.js';

export class SpacedArray {
    constructor(nels) {
        this.rev_arr = [];
        let insert_pt = 0;
        let level = 0;
        for (let index = 0; index < nels; index++) {
            this.rev_arr.splice(insert_pt, 0, index + 1);
            insert_pt += 2;
            if (insert_pt > 2 * (2 ** level - 1)) {
                insert_pt = 0;
                level += 1;
            }
        }
        this.rev_arr.splice(0, 0, 0);

        this.arr = [];
        for (let index = 0; index < nels + 1; index++) {
            this.arr.push(0);
        }
        for (let index = 0; index < nels + 1; index++) {
            this.arr[this.rev_arr[index]] = index;
        }
    }
}

export class HourLocs {
    constructor(num_divs_time) {
        this.num_divs_time = num_divs_time;
        this.hour_locs = [];
        this.hl_base = [];
        for (let index = 0; index < num_divs_time; index++) {
            const base = -Math.PI / 2.0 + (2.0 * Math.PI * index) / num_divs_time;
            const theta = -config.theta0 + base;
            this.hour_locs.push([theta]);
            this.hl_base.push(base);
        }
    }
}

export class ClockUtil {
    constructor(parent, bc, clock_inf) {
        this.parent = parent;
        this.bc = bc;
        this.clock_inf = clock_inf;

        this.cur_hours = [];
        this.clock_angles = [];
        for (let i = 0; i < this.parent.num_clocks; i++) {
            this.cur_hours.push(0.0);
            this.clock_angles.push(0.0);
        }

        this.time_rotate = this.parent.time_rotate;
        this.num_divs_time = Math.ceil(this.parent.time_rotate / config.ideal_wait_s);
        this.spaced = new SpacedArray(this.num_divs_time);
        this.hl = new HourLocs(this.num_divs_time);
    }

    update_curhours(update_clocks_list) {
        let count = 0;
        for (let sind of update_clocks_list) {
            this.cur_hours[sind] = this.spaced.arr[count % this.num_divs_time];
            count++;
        }
    }

    init_round(clock_index_list) {
        this.update_curhours(clock_index_list);
    }

    increment(clock_index_list) {
        this.bc.latest_time = Date.now() / 1000;
        for (let clock of clock_index_list) {
            this.cur_hours[clock] = (this.cur_hours[clock] + 1) % this.num_divs_time;
            this.clock_angles[clock] = this.hl.hour_locs[this.cur_hours[clock]];
        }

        const clocks = this.bc.parent.clocks;
        for (let clock_index of clock_index_list) {
            const clock = clocks[clock_index];
            if (clock.visible) {
                const angle = this.hl.hour_locs[this.cur_hours[clock_index]];
                clock.angle = angle[0];
                clock.draw_hand();
            }
        }
    }
}