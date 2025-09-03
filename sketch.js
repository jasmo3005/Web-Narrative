const orbMessages = [
  "An unexpected lantern glows, wages war against the blanketing dark...",
  "Touched by the voice of a young star, the lantern hums softly.",
  "A whisper...",
  "ᚽᛁᛚᛚᚭ ᛐᚱᛆᚢᛁᛚᛚᛁᚱ. ᛁᚭᚢ ᛙᚢᛌᛐ ᛓᛁ ᛚᚭᛌᛐ. ᛚᛁᛐ ᛙᛁ ᚴᚢᛁᛐᛁ ᛁᚭᚢ.",
  "The Orb pulses with wonder, awaiting your command."
];
let orbMessageIndex = 0;

let bg;
let lakeImg; // Add this line
let achievementsImg; // <-- Add this line
let sound;
let showText = true; // Start with text visible
let particles = [];
let showRaindrops = true;
let orbPickedUp = false;
let isMagic = true; // Controls darkening
let circleSize = 60;
let orbColor = "yellow"; // Allow orb color toggle
let orbIdle = false;
let currentScene = 1;    // 1 or 2

let amplitude; // For sound level in scene 2
let font;      // For custom font in scene 2
let medievalFont; // Add this at the top with your other global variables

let achievements = [];
let showAchievements = false;

let orb1Img; // Add at the top with other global variables

function preload() {
  bg = loadImage('assets/forest-field.jpg');
  lakeImg = loadImage('assets/forest-lake.jpg');
  achievementsImg = loadImage('assets/achievements2.jpg');
  sound = loadSound('assets/fade.mp3',
    () => console.log('sound loaded'),
    (e) => console.error('sound load error', e)
  );
  medievalFont = loadFont('assets/medieval.ttf');
  orb1Img = loadImage('assets/orb1.png'); // Preload orb1 image
}

class Particle {
  constructor(speedMin = 4, speedMax = 8) {
    this.x = random(0, 600);
    this.y = 0;
    this.vy = random(speedMin, speedMax);
    this.alpha = 220;
    this.thickness = random(2, 3);
    this.length = random(10, 14);
  }
  update() { this.y += this.vy; this.alpha -= 5; }
  show() {
    noStroke();
    fill(0, 170, 255, this.alpha);
    ellipse(this.x, this.y, this.thickness, this.length);
  }
  isFinished() { return this.alpha <= 0; }
}

function setup() {
  const side = min(windowWidth, windowHeight) * 0.8; // 90% of available space
  const c = createCanvas(side, side); // Square canvas
  c.parent('sketch');
  textAlign(CENTER, CENTER);
  textSize(12);

  amplitude = new p5.Amplitude();

  // --- Hook up controls ---
  const toggleBtn = document.getElementById('toggle-sound');
  const vol = document.getElementById('vol');
  const volVal = document.getElementById('volVal');
  const pickupBtn = document.getElementById('pickup-orb');
  const textBtn = document.getElementById('toggle-text');
  const colorBtn = document.getElementById('toggle-orb-color'); // Optional: add this button in HTML
  const darkBtn = document.getElementById('toggle-dark'); // Optional: add this button in HTML
  const resetBtn = document.getElementById('reset-game');
  const idleBtn = document.getElementById('let-orb-idle');
  const rainMasterBtn = document.getElementById('rain-master');
  const achievementsBtn = document.getElementById('toggle-achievements');
  // Next scene
  const forwBtn = document.getElementById('next-scene').addEventListener('click', () => {
    currentScene = 2;
  });
  // (Optional) back button
  const prevBtn = document.getElementById('prev-scene');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentScene = 1;
    });
  }

  // Initialize volume display and sound volume
  const initV = parseFloat(vol.value || '0.5');
  volVal.textContent = initV.toFixed(2);
  if (sound) sound.setVolume(initV);

  // Button: start/stop (with autoplay-safe resume)
  toggleBtn.addEventListener('click', async () => {
    try {
      const ctx = getAudioContext?.();
      if (ctx && ctx.state !== 'running') {
        await ctx.resume();
      }
      if (!sound) return;

      if (sound.isPlaying()) {
        sound.pause();
        toggleBtn.textContent = 'Play Music';
      } else {
        sound.loop();
        toggleBtn.textContent = 'Stop Music';
      }
    } catch (e) {
      console.warn('Audio start blocked or error:', e);
    }
  });

  // Slider: live volume update
  vol.addEventListener('input', () => {
    const v = parseFloat(vol.value);
    volVal.textContent = v.toFixed(2);
    if (sound) sound.setVolume(v);
  });

  // Pick up orb button logic
  if (pickupBtn) {
    pickupBtn.addEventListener('click', () => {
      orbPickedUp = true;
      orbIdle = false;
      showText = false; // Hide bottom text after picking up orb
      isMagic = false;
      if (rainMasterBtn) rainMasterBtn.style.display = "block";
      // Unlock Rain Master achievement
      if (!achievements.includes("Rain Master")) {
        achievements.push("Rain Master");
      }
    });
  }

  // Toggle text button logic (works anytime)
  if (textBtn) {
    textBtn.addEventListener('click', () => {
      showText = !showText;
    });
  }

  // Toggle orb color button logic (optional)
  if (colorBtn) {
    colorBtn.addEventListener('click', () => {
      orbColor = (orbColor === "yellow") ? "cyan" : "yellow";
    });
  }

  // Toggle darkening button logic (optional)
  if (darkBtn) {
    darkBtn.addEventListener('click', () => {
      isMagic = !isMagic;
    });
  }

  // Reset button logic
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Reset all interactive state variables
      orbPickedUp = false;
      showText = true;
      isMagic = true;
      orbColor = "yellow";
      circleSize = 60;
      showRaindrops = true;
      particles = [];
      rainMasterActive = false; // Reset rain master state
      if (rainMasterBtn) {
        rainMasterBtn.style.display = "none"; // Hide Rain Master button
        rainMasterBtn.textContent = "Rain Master"; // Reset button text
      }
      // Optionally, stop sound
      if (sound && sound.isPlaying()) {
        sound.stop();
      }
    });
  }

  // Let orb idle button logic
  if (idleBtn) {
    idleBtn.addEventListener('click', () => {
      orbIdle = true;
      orbPickedUp = false;
      isMagic = false; // Optionally lighten the canvas
      showText = true; // Optionally show text
    });
  }

  const talkBtn = document.getElementById('talk-orb');
  if (talkBtn) {
    talkBtn.addEventListener('click', () => {
      orbMessageIndex = (orbMessageIndex + 1) % orbMessages.length;
    });
  }

  if (rainMasterBtn) {
    rainMasterBtn.addEventListener('click', () => {
      rainMasterActive = !rainMasterActive;
      rainMasterBtn.textContent = rainMasterActive ? "Rain Master: ON" : "Rain Master";
    });
  }

  if (achievementsBtn) {
    achievementsBtn.addEventListener('click', () => {
      showAchievements = !showAchievements;
    });
  }
}

let rainMasterActive = false;

// --- Scene 1: your original draw code ---
function drawScene1() {
  background(220);
  if (bg) image(bg, 0, 0, width, height);

  if (isMagic) {
    fill(0, 150);
    rect(0, 0, width, height);
  }

  // Draw orb using orb1 image
  let orbX, orbY;
  if (orbIdle) {
    orbX = width - 80 + sin(frameCount * 0.03) * 15;
    orbY = 80 + cos(frameCount * 0.025) * 10;
  } else if (!orbPickedUp) {
    orbX = width / 2 + sin(frameCount * 0.03) * 15;
    orbY = height / 2 + cos(frameCount * 0.025) * 10;
  } else {
    orbX = mouseX;
    orbY = mouseY;
  }

  if (orb1Img) {
    imageMode(CENTER);
    image(orb1Img, orbX, orbY, circleSize, circleSize);
    imageMode(CORNER);
  } else {
    fill(orbColor);
    circle(orbX, orbY, circleSize);
  }

  if (showText) {
    fill("yellow");
    text(orbMessages[orbMessageIndex], width/2, height - 50); // Use dynamic height
  }

  // Show Rain Master phrase when active
  if (rainMasterActive && orbPickedUp) {
    fill("cyan");
    textSize(16);
    textStyle(ITALIC);
    text("Caught in the drought of time, the rain is so sweet.", width/2, 60);
    textStyle(NORMAL);
    textSize(12);
  }

  if (showRaindrops) {
    // Control rain intensity if Rain Master is active and orb is picked up
    let rainCount = 1;
    let rainSpeedMin = 4, rainSpeedMax = 8;
    if (rainMasterActive && orbPickedUp) {
      // More rain and faster if orb is lower on canvas
      let orbY = mouseY;
      rainCount = int(map(orbY, 0, height, 1, 10)); // 1 at top, 10 at bottom
      rainSpeedMin = map(orbY, 0, height, 4, 16);
      rainSpeedMax = map(orbY, 0, height, 8, 24);
    }
    for (let j = 0; j < rainCount; j++) {
      particles.push(new Particle(rainSpeedMin, rainSpeedMax));
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].show();
      if (particles[i].isFinished()) particles.splice(i, 1);
    }
  }
}

// --- Scene 2: just show the forest-lake image ---
function drawScene2() {
  background(0);
  if (lakeImg) {
    image(lakeImg, 0, 0, width, height); // Use dynamic width/height
  }
}

// --- Achievements overlay ---
function drawAchievementsOverlay() {
  if (achievementsImg) {
    image(achievementsImg, 0, 0, width, height); // Use dynamic width/height
  } else {
    background(30, 180);
  }
  if (medievalFont) {
    textFont(medievalFont);
  }
  fill(255);
  textStyle(BOLD);
  textSize(32);
  text("Achievements", width/2, 0.27 * height); // Scaled for responsiveness
  textSize(20);
  if (achievements.length === 0) {
    text("No achievements unlocked yet.", width/2, 0.37 * height);
  } else {
    for (let i = 0; i < achievements.length; i++) {
      text(`${i+1}. ${achievements[i]}`, width/2, 0.37 * height + i*0.06*height);
    }
  }
  textSize(14);
  text("Click Achievements again to close.", width/2, 0.83 * height);
  textStyle(NORMAL);
}

// --- Main draw function ---
function draw() {
  if (showAchievements) {
    drawAchievementsOverlay();
    return;
  }
  if (currentScene === 1) {
    drawScene1();
  } else if (currentScene === 2) {
    drawScene2();
  }
}

// Add this function at the end of your file:
function windowResized() {
  const side = min(windowWidth, windowHeight) * 0.8; // 80% of available space
  resizeCanvas(side, side); // Keep canvas square
}

// Example: toggle orb color with key 'c'
function keyPressed() {
  if (key === "p") {
    showRaindrops = !showRaindrops;
    return false;
  }
  if (key === "c") {
    orbColor = (orbColor === "yellow") ? "cyan" : "yellow";
    return false;
  }
}
