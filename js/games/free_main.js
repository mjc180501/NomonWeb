import { config } from './free_config.js';
import { Clock } from './free_widgets.js';
import { BroderClocks } from './free_broderclocks.js';

export class ClockApp {
    constructor(canvasConfig) {
        this.face_canvas = document.getElementById(canvasConfig.faceCanvasId).getContext('2d');
        this.hand_canvas = document.getElementById(canvasConfig.handCanvasId).getContext('2d');
        this.output = canvasConfig.outputElement || null;
        
        this.time_rotate = config.period_li[config.default_rotate_ind];
        this.prev_data = null;
        
        this.num_clocks = 0;
        this.clocks_on = [];
        this.win_diffs = [];
        this.clocks = [];
        
        this.bc_init = false;
        this.bc = null;
        
        this.animationInterval = null;
    }

    addClocks(clockConfigs) {
        this.num_clocks = clockConfigs.length;
        this.clocks_on = [];
        this.win_diffs = [];
        this.clocks = [];
        
        clockConfigs.forEach((config, index) => {
            const clock = new Clock(
                this.face_canvas,
                this.hand_canvas,
                config.x,
                config.y,
                config.radius,
                config.text || ""
            );
            
            this.clocks.push(clock);
            this.clocks_on.push(index);
            this.win_diffs.push(config.win_diff || config.win_diff_base);
            
            clock.draw_face();
            clock.draw_hand();
        });
        
        this.bc = new BroderClocks(this);
        this.bc.init_round(false, false, []);
    }

    start() {
        if (this.animationInterval) return;
        window.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.animationInterval = setInterval(() => this.animate(), config.ideal_wait_s * 1000);
    }

    stop() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    animate() {
        if (this.bc && this.bc.clock_inf) {
            this.bc.clock_inf.clock_util.increment(this.clocks_on);
        }
    }

    handleKeyPress(e) {
        if (e.key === ' ') {
            e.preventDefault();
            this.onPress();
        }
    }

    onPress() {
        const time_in = Date.now() / 1000;
        if (this.bc) this.bc.select(time_in);
    }

    make_choice(clock_index) {
        const clock = this.clocks[clock_index];
        clock.winner = true;
        clock.draw_face();
        
        if (this.output) this.output.textContent = clock.text;
        console.log("Selected:", clock.text, "at position", clock.x_pos, clock.y_pos);
        
        setTimeout(() => {
            clock.winner = false;
            clock.draw_face();
            if (this.output) this.output.textContent = "";
            this.bc.init_round(true, false, []);
        }, 1000);
    }

    getClockPositions() {
        return this.clocks.map((clock, i) => ({
            index: i,
            x: clock.x_pos,
            y: clock.y_pos,
            radius: clock.radius,
            text: clock.text,
            angle: clock.angle
        }));
    }

    setSpeed(speedIndex) {
        if (speedIndex >= 0 && speedIndex < config.period_li.length) {
            this.time_rotate = config.period_li[speedIndex];
            if (this.bc && this.bc.clock_inf) {
                this.bc.clock_inf.clock_util.change_period(this.time_rotate);
            }
        }
    }
}