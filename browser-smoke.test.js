const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const repoRoot = __dirname;
const chromeBin = process.env.CHROME_BIN || "google-chrome";
const noChrome = !chromeAvailable();

function chromeAvailable() {
    const result = spawnSync(chromeBin, ["--version"], { encoding: "utf8" });
    return result.status === 0;
}

function dumpDom(htmlPath, budgetMs) {
    return execFileSync(
        chromeBin,
        [
            "--headless",
            "--disable-gpu",
            "--run-all-compositor-stages-before-draw",
            `--virtual-time-budget=${budgetMs}`,
            "--dump-dom",
            `file://${htmlPath}`
        ],
        {
            cwd: repoRoot,
            encoding: "utf8",
            maxBuffer: 16 * 1024 * 1024,
            stdio: ["ignore", "pipe", "ignore"]
        }
    );
}

// Serves index.html from a temporary directory and removes exactly the files
// it wrote. Without game-logic.js next to the page the fallback copy runs.
function withGamePage(html, withExternalLogic, callback) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pixelrun-smoke-"));
    const htmlPath = path.join(tempDir, "index.html");
    const logicPath = path.join(tempDir, "game-logic.js");
    try {
        fs.writeFileSync(htmlPath, html);
        if (withExternalLogic) {
            fs.copyFileSync(path.join(repoRoot, "game-logic.js"), logicPath);
        }
        return callback(htmlPath);
    } finally {
        fs.rmSync(htmlPath, { force: true });
        fs.rmSync(logicPath, { force: true });
        fs.rmdirSync(tempDir);
    }
}

// Runs inside the page against the real game functions and the real canvas.
// `draw` paints the whole frame, so a layer's pixels are the difference between
// a frame with that layer and a frame without it.
async function pixelProbe() {
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    await platformTexture.decode();

    const fixedNow = 1000;
    Date.now = () => fixedNow;
    const realRandom = Math.random;
    Math.random = () => 0.99;

    const realDrawPlayer = drawPlayer;
    const realDrawEnemy = drawEnemy;
    const frame = () => {
        draw();
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const changedPixels = (a, b) => {
        const pixels = [];
        for (let i = 0; i < a.length; i += 4) {
            if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) {
                pixels.push([(i / 4) % canvas.width, Math.floor(i / 4 / canvas.width)]);
            }
        }
        return pixels;
    };
    const platform = () => ({ x: 100, y: 200, w: 200, h: 10 });
    const startScene = (winter, playerX, playerY) => {
        startGame();
        winterMode = winter;
        coins = [];
        enemies = [];
        randomEvents = [];
        platforms = [platform()];
        lastPlatformX = 1e9;
        player.x = playerX;
        player.y = playerY;
    };

    // Paints one frame in layers and compares player, platform and mask.
    const measure = () => {
        const all = frame();
        drawPlayer = () => {};
        const withoutPlayer = frame();
        drawPlayer = realDrawPlayer;
        const savedPlatforms = platforms;
        platforms = [];
        drawPlayer = () => {};
        const withoutPlatform = frame();
        drawPlayer = realDrawPlayer;
        platforms = savedPlatforms;

        const playerPixels = changedPixels(all, withoutPlayer);
        const platformPixels = changedPixels(withoutPlayer, withoutPlatform);
        const platformSet = new Set(platformPixels.map(([x, y]) => `${x},${y}`));
        const bottomRow = Math.max(...playerPixels.map(([, y]) => y));
        const surfaceByColumn = {};
        for (const [x, y] of platformPixels) {
            surfaceByColumn[x] = Math.min(surfaceByColumn[x] ?? Infinity, y);
        }

        const maskPixels = new Set();
        const originX = Math.round(player.x) - cameraX;
        const originY = Math.round(player.y);
        const masks = winterMode ? winterPlayerCollisionMasks : playerCollisionMasks;
        for (const segment of masks[getNinjaFrame()]) {
            for (let y = 0; y < segment.h; y++) {
                for (let x = 0; x < segment.w; x++) {
                    maskPixels.add(`${originX + segment.x + x},${originY + segment.y + y}`);
                }
            }
        }
        const paintedSet = new Set(playerPixels.map(([x, y]) => `${x},${y}`));

        return {
            frame: getNinjaFrame(),
            surfaceRows: [...new Set(playerPixels
                .filter(([, y]) => y === bottomRow)
                .map(([x]) => surfaceByColumn[x]))],
            bottomRow,
            playerY: player.y,
            onGround: player.dy === 0 && player.jumps === 0,
            overlappingPixels: playerPixels.filter(([x, y]) => platformSet.has(`${x},${y}`)).length,
            paintedOutsideMask: [...paintedSet].filter((pixel) => !maskPixels.has(pixel)).length,
            maskNotPainted: [...maskPixels].filter((pixel) => !paintedSet.has(pixel)).length
        };
    };

    const result = { resting: {}, speedLanding: {}, edges: {}, subPixel: {} };
    const appearances = {
        normal: () => {},
        winter: () => {},
        noTexture: () => Object.defineProperty(platformTexture, "naturalWidth", { value: 0, configurable: true })
    };

    for (const [name, prepare] of Object.entries(appearances)) {
        prepare();
        startScene(name === "winter", 180, 150);
        for (let i = 0; i < 40; i++) tick();
        result.resting[name] = { idle: measure() };
        keys.ArrowRight = true;
        for (const counter of [0, 3]) {
            ninjaFrameCounter = counter;
            result.resting[name][getNinjaFrame()] = measure();
        }
        keys.ArrowRight = false;
    }
    delete platformTexture.naturalWidth;

    // A fast fall must not pass through or stop inside the platform.
    startScene(false, 180, 150);
    player.dy = 200;
    tick();
    result.speedLanding = measure();

    // A jump from below passes through; only falling feet land.
    startScene(false, 180, 195);
    player.dy = -12;
    tick();
    result.jumpFromBelow = { landed: player.jumps === 0 && player.dy === 0, y: player.y };

    // One painted foot pixel over a platform edge carries the player.
    const dropFrom = (x) => {
        startScene(false, x, 150);
        for (let i = 0; i < 40; i++) tick();
        return player.y === 200 - player.h;
    };
    result.edges = {
        leftOnePixel: dropFrom(89),
        leftNoPixel: dropFrom(88),
        rightOnePixel: dropFrom(299),
        rightNoPixel: dropFrom(300),
        // These are drawn at x 88 and x 300, so no painted foot is over the platform.
        leftRoundsAway: dropFrom(88.4),
        rightRoundsAway: dropFrom(299.6)
    };

    // The rear foot is painted in run1 but not in run2, so run2 walks off.
    startScene(false, 297, 188);
    player.dy = 0;
    keys.ArrowRight = true;
    ninjaFrameCounter = 2;
    tick();
    result.edges.run2RearFootGap = { frame: getNinjaFrame(), onGround: player.y === 188 };
    keys.ArrowRight = false;

    // Fractional positions are drawn and collided on the same pixel grid.
    for (const x of [180.4, 180.6]) {
        startScene(false, x, 188);
        tick();
        result.subPixel[x] = measure();
    }

    // Enemies from the real world generator stand on the surface in both appearances.
    result.enemyRest = {};
    for (const winter of [false, true]) {
        Math.random = () => 0;
        startGame();
        Math.random = () => 0.99;
        winterMode = winter;
        const enemy = enemies[0];
        coins = [];
        randomEvents = [];
        enemies = [enemy];
        platforms = platforms.filter((p) => enemy.x >= p.x && enemy.x < p.x + p.w);
        const withEnemy = frame();
        drawEnemy = () => {};
        const withoutEnemy = frame();
        drawEnemy = realDrawEnemy;
        const savedPlatforms = platforms;
        platforms = [];
        drawEnemy = () => {};
        const withoutPlatform = frame();
        drawEnemy = realDrawEnemy;
        platforms = savedPlatforms;
        const enemyRows = changedPixels(withEnemy, withoutEnemy).map(([, y]) => y);
        const platformRows = changedPixels(withoutEnemy, withoutPlatform).map(([, y]) => y);
        result.enemyRest[winter ? "winter" : "normal"] = {
            enemyBottomRow: Math.max(...enemyRows),
            surfaceRow: Math.min(...platformRows)
        };
    }

    // Touching painted pixels ends the run; one pixel of air does not.
    const leftEdgeOfEnemy = enemySpriteLayers
        .flatMap((layer) => layer.rects)
        .reduce((min, [x]) => Math.min(min, x * enemySpriteScale), Infinity);
    const gameOverWith = (playerX, enemyX) => {
        startScene(false, playerX, 188);
        player.dy = 0;
        enemies = [{
            ...createEnemyForPlatform(platforms[0], 1, { enemySize: { w: 16, h: enemySpriteHeight } }),
            x: enemyX,
            patrolMinX: enemyX,
            patrolMaxX: enemyX
        }];
        tick();
        return gameState === "gameover";
    };
    const touchingX = 200 + 12 - leftEdgeOfEnemy;
    result.enemyContact = {
        justApart: gameOverWith(200, touchingX),
        overlapping: gameOverWith(200, touchingX - 1),
        subPixelRoundsApart: gameOverWith(200.4, touchingX),
        subPixelRoundsInto: gameOverWith(200.6, touchingX)
    };

    // The real world generator keeps everything on whole pixels.
    Math.random = realRandom;
    startGame();
    cameraX = 12000;
    generateWorld();
    result.generated = {
        count: platforms.length,
        fractionalPlatforms: platforms.filter((p) => ![p.x, p.y, p.w].every(Number.isInteger)).length
    };
    result.cameraIsWholePixel = (() => {
        startScene(false, 500.37, 150);
        tick();
        return Number.isInteger(cameraX);
    })();

    gameState = "menu";
    document.documentElement.setAttribute("data-probe", btoa(JSON.stringify(result)));
}

function runPixelProbe(withExternalLogic) {
    const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
    const probe = `<script>(${pixelProbe.toString()})();</script></body>`;
    const page = withExternalLogic
        ? html
        : html.replace('<script src="game-logic.js"></script>\n', "");
    const dom = withGamePage(page.replace("</body>", () => probe), withExternalLogic, (htmlPath) => dumpDom(htmlPath, 3000));
    const match = dom.match(/data-probe="([^"]+)"/);
    assert.ok(match, "the page probe did not finish");
    return JSON.parse(Buffer.from(match[1], "base64").toString("utf8"));
}

function assertFeetOnSurface(measurement, label) {
    assert.deepEqual(measurement.surfaceRows, [measurement.bottomRow + 1], `${label}: feet touch the painted surface`);
    assert.equal(measurement.overlappingPixels, 0, `${label}: no player pixel over a platform pixel`);
    assert.equal(measurement.paintedOutsideMask, 0, `${label}: nothing painted outside the collision mask`);
    assert.equal(measurement.maskNotPainted, 0, `${label}: the collision mask has no unpainted pixel`);
}

test("index.html still boots when the external game-logic script is unavailable", { skip: noChrome }, () => {
    const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8")
        .replace('<script src="game-logic.js"></script>\n', "");
    const dumpedDom = withGamePage(html, false, (htmlPath) => dumpDom(htmlPath, 1500));

    assert.match(dumpedDom, /data-game-ready="1"/);
    assert.match(dumpedDom, /<canvas id="game"/);
});

for (const [logicName, withExternalLogic] of [["game-logic.js", true], ["the fallback logic", false]]) {
    test(`player and platform pixels meet exactly with ${logicName}`, { skip: noChrome }, () => {
        const result = runPixelProbe(withExternalLogic);

        for (const [appearance, frames] of Object.entries(result.resting)) {
            assert.deepEqual(Object.keys(frames).sort(), ["idle", "run1", "run2"], appearance);
            for (const [frameName, measurement] of Object.entries(frames)) {
                assertFeetOnSurface(measurement, `${appearance}/${frameName}`);
            }
        }

        assertFeetOnSurface(result.speedLanding, "fast fall");
        assert.equal(result.speedLanding.playerY, 188);
        assert.equal(result.jumpFromBelow.landed, false, "a rising player does not land");

        assert.deepEqual(
            {
                leftOnePixel: result.edges.leftOnePixel,
                leftNoPixel: result.edges.leftNoPixel,
                rightOnePixel: result.edges.rightOnePixel,
                rightNoPixel: result.edges.rightNoPixel,
                leftRoundsAway: result.edges.leftRoundsAway,
                rightRoundsAway: result.edges.rightRoundsAway
            },
            {
                leftOnePixel: true,
                leftNoPixel: false,
                rightOnePixel: true,
                rightNoPixel: false,
                leftRoundsAway: false,
                rightRoundsAway: false
            }
        );
        assert.deepEqual(result.edges.run2RearFootGap, { frame: "run2", onGround: false });

        assertFeetOnSurface(result.subPixel["180.4"], "x=180.4");
        assertFeetOnSurface(result.subPixel["180.6"], "x=180.6");

        for (const [appearance, rest] of Object.entries(result.enemyRest)) {
            assert.equal(rest.surfaceRow, rest.enemyBottomRow + 1, `${appearance} enemy stands on the surface`);
        }

        assert.deepEqual(result.enemyContact, {
            justApart: false,
            overlapping: true,
            subPixelRoundsApart: false,
            subPixelRoundsInto: true
        });

        assert.ok(result.generated.count > 1);
        assert.equal(result.generated.fractionalPlatforms, 0);
        assert.equal(result.cameraIsWholePixel, true);
    });
}
