const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createStarterPlatform,
    createEnemyForPlatform,
    createSolidMask,
    createSpriteMask,
    getEnemyPatrolBounds,
    masksOverlap,
    rectsOverlap,
    updateEnemyPatrol
} = require("./game-logic.js");

const ninjaJumpSprite = [
    ["", "#000", "#000", ""],
    ["#000", "#000", "#000", "#000"],
    ["#000", "#ff0000", "#ff0000", "#000"],
    ["#000", "#000", "", "#000"]
];

test("createStarterPlatform always covers the player spawn point", () => {
    const playerSpawn = { x: 50, y: 50, w: 10, h: 10 };
    const platform = createStarterPlatform(playerSpawn);

    assert.ok(playerSpawn.x >= platform.x);
    assert.ok(playerSpawn.x + playerSpawn.w <= platform.x + platform.w);
    assert.ok(platform.y > playerSpawn.y + playerSpawn.h);
});

test("createEnemyForPlatform keeps the enemy on top of the platform", () => {
    const platform = { x: 120, y: 220, w: 60, h: 10 };
    const enemy = createEnemyForPlatform(platform, 1);

    assert.equal(enemy.y, 210);
    assert.equal(enemy.groundY, 210);
    assert.equal(enemy.patrolMinX, 120);
    assert.equal(enemy.patrolMaxX, 170);
    assert.ok(enemy.x >= enemy.patrolMinX);
    assert.ok(enemy.x <= enemy.patrolMaxX);
});

test("updateEnemyPatrol reverses direction at the right edge", () => {
    const enemy = {
        x: 169,
        y: 210,
        w: 10,
        h: 10,
        dir: 1,
        patrolMinX: 120,
        patrolMaxX: 170,
        groundY: 210
    };

    const updated = updateEnemyPatrol(enemy, 0.5);

    assert.equal(updated.x, 170);
    assert.equal(updated.dir, -1);
    assert.equal(updated.y, 210);
});

test("updateEnemyPatrol reverses direction at the left edge", () => {
    const enemy = {
        x: 120,
        y: 210,
        w: 10,
        h: 10,
        dir: -1,
        patrolMinX: 120,
        patrolMaxX: 170,
        groundY: 210
    };

    const updated = updateEnemyPatrol(enemy, 0.5);

    assert.equal(updated.x, 120);
    assert.equal(updated.dir, 1);
    assert.equal(updated.y, 210);
});

test("updateEnemyPatrol never lets enemies drift beyond their platform over time", () => {
    const platform = { x: 40, y: 180, w: 48, h: 10 };
    const bounds = getEnemyPatrolBounds(platform, 10);
    let enemy = createEnemyForPlatform(platform, 1);

    for (let i = 0; i < 200; i++) {
        enemy = updateEnemyPatrol(enemy, 0.5);
        assert.ok(enemy.x >= bounds.minX);
        assert.ok(enemy.x <= bounds.maxX);
        assert.equal(enemy.y, 170);
    }
});

test("createEnemyForPlatform clamps narrow platforms safely", () => {
    const platform = { x: 10, y: 90, w: 6, h: 10 };
    const enemy = createEnemyForPlatform(platform, 1);

    assert.equal(enemy.patrolMinX, 10);
    assert.equal(enemy.patrolMaxX, 10);
    assert.equal(enemy.x, 10);
    assert.equal(enemy.y, 80);
});

test("createSpriteMask compacts contiguous sprite pixels into row segments", () => {
    const mask = createSpriteMask([
        ["#", "#", "", "#"],
        ["", "", "", ""],
        ["", "#", "#", "#"]
    ], 2);

    assert.deepEqual(mask, [
        { x: 0, y: 0, w: 4, h: 2 },
        { x: 6, y: 0, w: 2, h: 2 },
        { x: 2, y: 4, w: 6, h: 2 }
    ]);
});

test("masksOverlap ignores transparent gaps inside a sprite bounding box", () => {
    const diagonalMask = createSpriteMask([
        ["#", ""],
        ["", "#"]
    ], 3);
    const probeMask = createSolidMask(2, 2);

    assert.equal(
        masksOverlap({ x: 0, y: 0 }, diagonalMask, { x: 3, y: 0 }, probeMask),
        false
    );
    assert.equal(
        masksOverlap({ x: 0, y: 0 }, diagonalMask, { x: 4, y: 4 }, probeMask),
        true
    );
});

test("sprite-mask collision matches visible ninja pixels more closely than the old player box", () => {
    const player = { x: 50, y: 49, w: 10, h: 10 };
    const enemy = { x: 51, y: 60, w: 10, h: 10 };
    const playerMask = createSpriteMask(ninjaJumpSprite, 3);
    const enemyMask = createSolidMask(10, 10);

    assert.equal(rectsOverlap(player, enemy), false);
    assert.equal(masksOverlap(player, playerMask, enemy, enemyMask), true);
});
