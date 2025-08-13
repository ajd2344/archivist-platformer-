/*
Archivist Platformer - Phaser 3 Starter
File includes: project overview, index.html, and src/main.js
How to use:
1) Create a folder, place an index.html and src/main.js using the sections below.
2) Open index.html in a local server (e.g., `npx http-server` or VSCode Live Server). Phaser requires being served via http.
3) Play! This starter uses generated graphics so no external art is required. Replace TODO sprites with your own.

Game concept:
- Player: an archivist/librarian in robes with blonde hair (placeholder rectangle sprite for now).
- Hub: Grand Central Library (HubScene) with doors to Worlds (castle, pyramids, roman ruins, cityscape, jungle, outer space).
- Worlds: multiple LevelScene instances. Collect overdue books in each level.
- Core mechanics inspired by Celeste / Ori / Shovel Knight: precise platforming, jump, double-jump, dash.

Controls:
- Left/Right: A/D or ←/→
- Jump: W or Space
- Dash: Shift (short horizontal dash)
- Interact: E (enter doors)

--- index.html ---
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Archivist Platformer - Starter</title>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
  <style> body { margin:0; background:#1b1b2f; } canvas { display:block; margin:0 auto; }</style>
</head>
<body>
  <script src="src/main.js"></script>
</body>
</html>

--- src/main.js ---
// Phaser 3 starter implementing a hub and a generic level scene
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  preload() {
    // no external assets required for the starter; generate textures in create
  }
  create() {
    // Generate simple textures to stand in for sprites
    // Player texture (robes + blonde hair simulated)
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Robe body
    g.fillStyle(0x4b2e83, 1);
    g.fillRoundedRect(0, 8, 24, 24, 4);
    // Head (hair)
    g.fillStyle(0xead07b, 1);
    g.fillCircle(12, 6, 6);
    g.generateTexture('player', 24, 32);
    g.clear();

    // Book pickup
    g.fillStyle(0xd95f02, 1);
    g.fillRect(0,0,16,12);
    g.generateTexture('book', 16, 12);
    g.clear();

    // Simple tile (platform)
    g.fillStyle(0x6b705c, 1);
    g.fillRect(0,0,64,16);
    g.generateTexture('platform', 64, 16);

    this.scene.start('HubScene');
  }
}

class HubScene extends Phaser.Scene {
  constructor() { super('HubScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#111218');
    const w = this.scale.width; const h = this.scale.height;

    // Ground
    this.add.tileSprite(0, h-40, w*2, 80, 'platform').setOrigin(0,0).setScale(2,2);

    // Title text
    this.add.text(w/2, 40, 'Grand Central Library', { font: '28px Georgia', fill:'#fff' }).setOrigin(0.5);
    this.add.text(w/2, 80, 'Collect overdue books across the worlds. Press E to enter a portal.', { font: '16px Arial', fill:'#ddd' }).setOrigin(0.5);

    // Doors / world portals
    const worlds = [
      { id: 'castle', name: 'Castle' },
      { id: 'pyramids', name: 'Pyramids' },
      { id: 'roman', name: 'Roman Ruins' },
      { id: 'city', name: 'Cityscape' },
      { id: 'jungle', name: 'Jungle' },
      { id: 'space', name: 'Outer Space' },
    ];

    this.worlds = worlds;
    this.portals = this.add.group();

    const spacing = 120;
    const startX = w/2 - (worlds.length-1)/2 * spacing;
    worlds.forEach((world, idx) => {
      const x = startX + idx*spacing; const y = h/2;
      const portal = this.add.rectangle(x, y, 48, 80, 0x2b6f77).setStrokeStyle(2, 0xffffff);
      this.add.text(x, y+60, world.name, { font: '14px Arial', fill:'#fff' }).setOrigin(0.5);
      portal.worldId = world.id;
      this.portals.add(portal);
    });

    // Player
    this.player = this.physics.add.sprite(w/2, h-150, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.05);

    // Simple platform for player in hub
    const ground = this.physics.add.staticGroup();
    ground.create(w/2, h-20, 'platform').setScale(4,1).refreshBody();
    this.physics.add.collider(this.player, ground);

    // Controls
    this.cursors = this.input.keyboard.addKeys({ left:Phaser.Input.Keyboard.KeyCodes.A, right:Phaser.Input.Keyboard.KeyCodes.D, up:Phaser.Input.Keyboard.KeyCodes.W, space:Phaser.Input.Keyboard.KeyCodes.SPACE, interact:Phaser.Input.Keyboard.KeyCodes.E });

    // HUD: show current instructions
    this.interactText = this.add.text(10, 10, 'Move: A/D   Jump: W/Space   Dash: Shift   Interact: E', { font: '14px monospace', fill:'#fff' });

    // Simple overlap check for portals
    this.physics.world.enable(this.portals);
    Phaser.Actions.Call(this.portals.getChildren(), (p) => {
      p.body.setAllowGravity(false);
      p.body.setImmovable(true);
    });

    this.physics.add.overlap(this.player, this.portals, (player, portal) => {
      this.nearPortal = portal;
      // Small visual
      portal.setFillStyle(0x4cc9f0);
    }, null, this);

    this.physics.add.collider(this.player, this.portals, null, null, this);

    this.nearPortal = null;

    this.input.keyboard.on('keydown-E', () => {
      if (this.nearPortal) {
        const target = this.nearPortal.worldId;
        this.scene.start('LevelScene', { worldId: target, fromHub: true });
      }
    });
  }

  update() {
    const speed = 200;
    if (this.cursors.left.isDown) { this.player.setVelocityX(-speed); }
    else if (this.cursors.right.isDown) { this.player.setVelocityX(speed); }
    else { this.player.setVelocityX(0); }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      if (this.player.body.blocked.down) this.player.setVelocityY(-350);
    }

    // reset portal visuals if not overlapping
    Phaser.Actions.Call(this.portals.getChildren(), (p) => { if (!this.physics.overlap(this.player, p)) p.setFillStyle(0x2b6f77); });
  }
}

class LevelScene extends Phaser.Scene {
  constructor() { super('LevelScene'); }
  init(data) {
    this.worldId = data.worldId || 'castle';
  }
  create() {
    this.cameras.main.setBackgroundColor('#0d1220');
    const w = this.scale.width; const h = this.scale.height;

    this.add.text(16,16, `World: ${this.worldId}`, { font: '18px Arial', fill:'#fff' });
    this.add.text(16,40, 'Collect overdue books. Press Q to return to Hub.', { font:'14px Arial', fill:'#ddd' });

    // simple level layout with platforms
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(200, h-80, 'platform');
    this.platforms.create(450, h-150, 'platform');
    this.platforms.create(700, h-230, 'platform');
    this.platforms.create(950, h-300, 'platform');

    // Player
    this.player = this.physics.add.sprite(100, h-200, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.05);
    this.physics.add.collider(this.player, this.platforms);

    // Books (collectibles)
    this.books = this.physics.add.group();
    const positions = [ {x:220,y:h-120}, {x:460,y:h-200}, {x:720,y:h-280}, {x:980,y:h-360} ];
    positions.forEach((p) => { const b = this.books.create(p.x,p.y,'book'); b.body.setAllowGravity(false); });

    this.physics.add.overlap(this.player, this.books, (player, book) => {
      book.destroy();
      this.score = (this.score||0) + 1;
      this.scoreText.setText('Books: '+this.score);
    }, null, this);

    this.score = 0;
    this.scoreText = this.add.text(16,64, 'Books: 0', { font:'16px Arial', fill:'#fff' });

    // Controls and advanced movement: double jump + dash
    this.cursors = this.input.keyboard.addKeys({ left:Phaser.Input.Keyboard.KeyCodes.A, right:Phaser.Input.Keyboard.KeyCodes.D, up:Phaser.Input.Keyboard.KeyCodes.W, space:Phaser.Input.Keyboard.KeyCodes.SPACE, dash:Phaser.Input.Keyboard.KeyCodes.SHIFT, back:Phaser.Input.Keyboard.KeyCodes.Q });

    this.canDoubleJump = true;
    this.dashCooldown = false;

    this.input.keyboard.on('keydown-Q', () => { this.scene.start('HubScene'); });
  }

  update() {
    const maxSpeed = 220;
    const acceleration = 600;
    const body = this.player.body;

    // Horizontal movement
    if (this.cursors.left.isDown) { this.player.setVelocityX(-maxSpeed); this.player.flipX = true; }
    else if (this.cursors.right.isDown) { this.player.setVelocityX(maxSpeed); this.player.flipX = false; }
    else { this.player.setVelocityX(0); }

    // Jump & double jump
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      if (body.blocked.down) {
        this.player.setVelocityY(-370);
        this.canDoubleJump = true;
      } else if (this.canDoubleJump) {
        this.player.setVelocityY(-340);
        this.canDoubleJump = false;
      }
    }

    if (body.blocked.down) this.canDoubleJump = true;

    // Dash (short burst)
    if (Phaser.Input.Keyboard.JustDown(this.cursors.dash) && !this.dashCooldown) {
      this.dashCooldown = true;
      const dir = this.player.flipX ? -1 : 1;
      this.player.setVelocityX(600*dir);
      this.time.delayedCall(120, () => { // end dash quickly
        // small slow down
        this.player.setVelocityX(0);
        this.time.delayedCall(300, () => { this.dashCooldown = false; }, [], this);
      }, [], this);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 900 }, debug: false }
  },
  scene: [ BootScene, HubScene, LevelScene ]
};

const game = new Phaser.Game(config);

/*
Next steps & customization suggestions:
- Art: replace generated textures with hand-drawn sprites. Create player animations (idle, run, jump, dash). Consider 24x32 or 48x64 frames.
- Tilemap levels: use Tiled or a JSON tilemap loader for building richer levels (parallax backgrounds, hazards, spikes).
- Advanced mechanics: wall-slide & wall-jump (Celeste), grappling, momentum-based movement (Ori), and weapon attack (Shovel Knight).
- Audio: add footstep SFX, jump, dash, and themed music per world.
- Level progression & collectibles: track which books found, quests from NPCs in the hub, unlockable shortcuts.
- Polish: particle effects for book pickup, screen shake on heavy landings, visual dash afterimage.

File Structure suggestion:
/archivist-game/
  index.html
  /src
    main.js
  /assets
    player.png
    player.json (atlas)
    tilemap.json
    tileset.png

If you want, I can:
- Implement wall-jump and coyote time.
- Replace placeholders with a spritesheet and give full animations.
- Create a Tiled example JSON level for one of the worlds.
- Add save data (which books collected) and level select UI.

Tell me which piece you want next and I'll implement it.
*/
