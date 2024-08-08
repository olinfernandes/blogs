import ravenPng from "./enemies/enemy5.png";
import explosionPng from "./effects/boom.png";
import explosionSfx from "./effects/boom.wav";
import gameMusicSfx from "./sounds/game_music.mp3";
import marsMusicSfx from "./sounds/Mars.wav";
import mercuryMusicSfx from "./sounds/Mercury.wav";
import venusMusicSfx from "./sounds/Venus.wav";

let music_playlist = [
  gameMusicSfx,
  marsMusicSfx,
  mercuryMusicSfx,
  venusMusicSfx,
];

class Particles {}

class Explosion {
  x: number;
  y: number;
  sprite_width: number;
  sprite_height: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  audio: HTMLAudioElement;
  last_frame_played_at: number;
  frame_interval: number;
  frame: number;
  frames: number;
  angle: number;
  marked_for_deletion: boolean;
  constructor(x: number, y: number, size: number) {
    this.x = x;
    this.y = y;
    this.width = size;
    this.height = size;
    this.sprite_width = 200;
    this.sprite_height = 179;
    this.last_frame_played_at = 0;
    this.frame_interval = 200;
    this.frame = 0;
    this.frames = 5;
    this.angle = Math.random() * 6.2;
    this.marked_for_deletion = false;
    this.image = new Image();
    this.image.src = explosionPng.src;
    this.audio = new Audio();
    this.audio.src = explosionSfx;
  }

  update(dTime: number) {
    if (this.frame === 0) this.audio.play();
    this.last_frame_played_at += dTime;
    if (this.last_frame_played_at > this.frame_interval) {
      if (this.frame > this.frames) this.marked_for_deletion = true;
      else this.frame++;
      this.last_frame_played_at = 0;
    }
  }

  draw({ ctx }: { ctx: CanvasRenderingContext2D }) {
    // ctx.save();
    // ctx.translate(this.x, this.y);
    // ctx.rotate(this.angle);
    ctx.drawImage(
      this.image,
      this.frame * this.sprite_width,
      0,
      this.sprite_width,
      this.sprite_height,
      this.x,
      this.y,
      this.width,
      this.height
    );
    // ctx.restore();
  }

  start({ ctx }: { ctx: CanvasRenderingContext2D }, dTime: number) {
    this.update(dTime);
    this.draw({ ctx });
  }
}

class Raven {
  image: HTMLImageElement;
  width: number;
  height: number;
  sprite_width: number;
  sprite_height: number;
  size: number;
  canvas: { width: number; height: number };
  frame: number;
  frames: number;
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  marked_for_deletion: boolean;
  last_flap: number;
  flap_interval: number;
  random_colors: number[];
  color: string;
  constructor(canvas: { width: number; height: number }) {
    this.image = new Image();
    this.image.src = ravenPng.src;
    this.sprite_width = 271;
    this.sprite_height = 194;
    this.size = Math.random() * 0.6 + 0.4;
    this.width = this.sprite_width * this.size;
    this.height = this.sprite_height * this.size;
    this.canvas = { width: canvas.width, height: canvas.height };
    this.frame = 0;
    this.frames = 4;
    this.x = this.canvas.width;
    this.y = Math.random() * (this.canvas.height - this.height);
    this.directionX = Math.random() * 5 + 3;
    this.directionY = Math.random() * 5 - 2.5;
    this.marked_for_deletion = false;
    this.last_flap = 0;
    this.flap_interval = 100 * this.size;
    this.random_colors = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.color = `rgb(${this.random_colors.join(", ")})`;
  }
  update(dTime: number, game_over: { value: boolean }) {
    if (this.y < 0 || this.y > this.canvas.height - this.height) {
      this.directionY *= -1;
    }

    this.x -= this.directionX;
    this.y += this.directionY;
    if (this.x < -this.width) {
      this.marked_for_deletion = true;
      game_over.value = true;
    }

    this.last_flap += dTime;
    if (this.last_flap > this.flap_interval) {
      if (this.frame > this.frames) this.frame = 0;
      else this.frame++;
      this.last_flap = 0;
    }
  }

  draw({
    ctx,
    col_ctx,
  }: {
    ctx: CanvasRenderingContext2D;
    col_ctx: CanvasRenderingContext2D;
  }) {
    col_ctx.fillStyle = this.color;
    col_ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.frame * this.sprite_width,
      0,
      this.sprite_width,
      this.sprite_height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
  start(
    {
      ctx,
      col_ctx,
    }: { ctx: CanvasRenderingContext2D; col_ctx: CanvasRenderingContext2D },
    dTime: number,
    game_over: { value: boolean }
  ) {
    this.update(dTime, game_over);
    this.draw({ ctx, col_ctx });
  }
}

class SignalElement extends HTMLElement {
  subscriber: Function | null = null;

  signal(value?: any) {
    const subscriptions = new Set<Function>();
    let instance = this;
    return {
      get value() {
        if (instance.subscriber) {
          subscriptions.add(instance.subscriber);
        }
        return value;
      },
      set value(updated) {
        value = updated;
        subscriptions.forEach(fn => fn());
      },
    };
  }

  effect(fn: Function) {
    this.subscriber = fn;
    fn();
    this.subscriber = null;
  }

  derived(fn: Function) {
    const derived = this.signal();
    this.effect(() => {
      derived.value = fn();
    });
    return derived;
  }
}

class ShooterCanvasTemplate extends SignalElement {
  get template() {
    let t = document.createElement("template");
    t.innerHTML = `
    <div class="wrapper">
      <canvas id="collision-canvas"></canvas>
      <canvas id="shooter-canvas"></canvas>
    </div>
    `;
    return t;
  }
  get styles() {
    let s = new CSSStyleSheet();
    s.replaceSync(
      `
      .wrapper {
        position: relative;
        background: linear-gradient(120deg, blue, green, yellow);
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
      canvas {
        position: absolute;
        top:0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      #collision-canvas {
        opacity: 0;
      }
      `
    );
    return s;
  }
}

type ShooterCanvasProps = {
  ctx: CanvasRenderingContext2D;
  col_ctx: CanvasRenderingContext2D;
  position: DOMRect;
  width: number;
  height: number;
  enemy_objects: { value: Raven[] };
  explosion_objects: { value: Explosion[] };
  enemy_number: { value: number };
  game_speed: { value: number };
  game_frame: { value: number };
  stagger_frame: number;
  time_to_spawn: { value: number };
  spawn_interval: { value: number };
  prev_timestamp: { value: number };
  player_score: { value: number };
  game_over: { value: boolean };
  game_music: HTMLAudioElement;
};

class ShooterCanvas extends ShooterCanvasTemplate {
  private getCanvasContext(c: HTMLCanvasElement) {
    const contextOption = { willReadFrequently: true };
    const context = c.getContext(
      "2d",
      contextOption
    ) as CanvasRenderingContext2D;
    return context;
  }

  canvas: ShooterCanvasProps;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.adoptedStyleSheets.push(this.styles);
    this.shadowRoot?.appendChild(this.template.content.cloneNode(true));

    const canvas = this.shadowRoot?.querySelector(
      "#shooter-canvas"
    ) as HTMLCanvasElement;
    const collision_canvas = this.shadowRoot?.querySelector(
      "#collision-canvas"
    ) as HTMLCanvasElement;

    this.canvas = {
      ctx: this.getCanvasContext(canvas),
      col_ctx: this.getCanvasContext(collision_canvas),
      position: canvas.getBoundingClientRect(),
      width: 500,
      height: 700,
      enemy_objects: super.signal([]),
      explosion_objects: super.signal([]),
      enemy_number: super.signal(1),
      game_speed: super.signal(5),
      game_frame: super.signal(0),
      stagger_frame: 5,
      time_to_spawn: super.signal(0),
      spawn_interval: super.signal(2e3),
      prev_timestamp: super.signal(0),
      player_score: super.signal(0),
      game_over: super.signal(false),
      game_music: new Audio(),
    };

    this.canvas.width =
      canvas.width =
      collision_canvas.width =
        window.innerWidth;
    this.canvas.height =
      canvas.height =
      collision_canvas.height =
        window.innerHeight - 16 * 8;
    this.canvas.ctx.font = "50px Impact";
  }

  connectedCallback() {
    super.effect(() => {
      this.gameDifficulty();
    });

    this.addEventListener("click", this.handleClick);

    this.drawGameStart();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClick);
  }

  loop(timestamp: number, instance: ShooterCanvas = this) {
    const {
      canvas: {
        ctx,
        col_ctx,
        width,
        height,
        prev_timestamp,
        time_to_spawn,
        spawn_interval,
        enemy_objects,
        explosion_objects,
        game_over,
        game_speed,
        game_frame,
      },
    } = instance;

    {
      ctx.clearRect(0, 0, width, height);
      col_ctx.clearRect(0, 0, width, height);
      this.drawPlayerScore();
    }

    {
      enemy_objects.value = enemy_objects.value.filter(
        ({ marked_for_deletion }) => !marked_for_deletion
      );
      explosion_objects.value = explosion_objects.value.filter(
        ({ marked_for_deletion }) => !marked_for_deletion
      );
    }

    {
      let dTime = timestamp - prev_timestamp.value;
      prev_timestamp.value = timestamp;
      time_to_spawn.value += dTime;

      if (time_to_spawn.value > spawn_interval.value) {
        enemy_objects.value.push(new Raven({ width, height }));
        time_to_spawn.value = 0;
      }

      enemy_objects.value.sort((a, b) => a.size - b.size);

      [...enemy_objects.value, ...explosion_objects.value].forEach(object => {
        object.start({ ctx, col_ctx }, dTime, game_over);
      });
    }

    {
      if (!game_over.value) {
        game_frame.value += game_speed.value;
        requestAnimationFrame(t => instance.loop(t));
      } else {
        instance.drawGameOver();
      }
    }
  }

  drawPlayerScore() {
    const {
      canvas: { ctx, player_score, game_speed },
    } = this;
    ctx.fillStyle = "#333";
    ctx.fillText("Score: " + player_score.value, 50, 75);
    ctx.fillText("Game Speed: " + game_speed.value, 50, 139);
    ctx.fillStyle = "#fff";
    ctx.fillText("Score: " + player_score.value, 55, 80);
    ctx.fillText("Game Speed: " + game_speed.value, 55, 144);
  }

  drawGameStart() {
    const {
      canvas: { ctx, width, height },
    } = this;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#333";
    ctx.fillText("Click to Start!!", width * 0.5 + 6, height * 0.5 + 6);
    ctx.fillStyle = "#fff";
    ctx.fillText("Click to Start!!", width * 0.5, height * 0.5);
    ctx.restore();
  }

  drawGameOver() {
    const {
      canvas: { ctx, width, height, player_score },
    } = this;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#333";
    ctx.fillText(
      "GAME OVER!! Your Score is: " + player_score.value,
      width * 0.3 + 6,
      height * 0.5 + 6
    );
    ctx.fillStyle = "#fff";
    ctx.fillText(
      "GAME OVER!! Your Score is: " + player_score.value,
      width * 0.3,
      height * 0.5
    );
  }

  playMusic() {
    let currentTrack = 0;
    const {
      canvas: { game_music, game_over },
    } = this;

    game_music.addEventListener("ended", () => {
      if (currentTrack === music_playlist.length) {
        game_music.src = music_playlist[0];
        game_music.play();
        return;
      }
      game_music.src = music_playlist[currentTrack];
      game_music.play();
      currentTrack++;
    });

    game_music.volume = 0.15;
    game_music.src = music_playlist[0];
    game_music.play();

    super.effect(() => {
      if (game_over.value) {
        game_music.pause();
        game_music.load();
      }
    });
  }

  resetGame() {
    const {
      canvas: {
        game_frame,
        game_over,
        game_speed,
        player_score,
        enemy_objects,
        explosion_objects,
        prev_timestamp,
        enemy_number,
      },
    } = this;

    game_over.value = false;
    game_frame.value = 0;
    game_speed.value = 5;
    player_score.value = 0;
    enemy_objects.value = [];
    explosion_objects.value = [];
    prev_timestamp.value = 0;
    enemy_number.value = 1;
    this.playMusic();
    this.loop(game_frame.value);
  }

  gameDifficulty() {
    const {
      canvas: {
        player_score,
        game_speed,
        enemy_number,
        enemy_objects,
        width,
        height,
      },
    } = this;
    switch (player_score.value) {
      case 10:
        game_speed.value = 10;
        for (let i = 0; i < enemy_number.value; i++) {
          enemy_objects.value.push(new Raven({ width, height }));
        }
        break;
      case 25:
        game_speed.value = 20;
        enemy_number.value = 3;
        for (let i = 0; i < enemy_number.value; i++) {
          enemy_objects.value.push(new Raven({ width, height }));
        }
        break;
      case 50:
        game_speed.value = 40;
        for (let i = 0; i < enemy_number.value; i++) {
          enemy_objects.value.push(new Raven({ width, height }));
        }
        break;
      case 80:
        game_speed.value = 80;
        for (let i = 0; i < enemy_number.value; i++) {
          enemy_objects.value.push(new Raven({ width, height }));
        }
      case 100:
        game_speed.value = 160;
        enemy_number.value = 6;
        for (let i = 0; i < enemy_number.value; i++) {
          enemy_objects.value.push(new Raven({ width, height }));
        }
        break;
      default:
        break;
    }
  }

  handleClick(e: MouseEvent) {
    const {
      canvas: {
        game_frame,
        game_over,
        col_ctx,
        enemy_objects,
        player_score,
        explosion_objects,
        enemy_number,
        width,
        height,
      },
    } = this;
    if (!game_frame.value) {
      this.playMusic();
      this.loop(game_frame.value);
      return;
    }

    if (game_over.value) {
      this.resetGame();
      return;
    }

    const detectPixelColor = col_ctx.getImageData(
      e.offsetX,
      e.offsetY,
      1,
      1
    ).data;
    enemy_objects.value.forEach(object => {
      let isMatch = detectPixelColor.reduce((result, current, i) => {
        if (result === false) return false;
        if (i === 3) return result;
        return current === object.random_colors[i];
      }, true);

      if (isMatch) {
        player_score.value++;
        object.marked_for_deletion = true;
        explosion_objects.value.push(
          new Explosion(object.x, object.y, object.width)
        );
        if (game_frame.value % 1e3 === 0) {
          enemy_number.value++;
          for (let i = 0; i < enemy_number.value; i++) {
            enemy_objects.value.push(new Raven({ width, height }));
          }
        }
      }
    });
  }
}

window.customElements.define("shooter-canvas", ShooterCanvas);
