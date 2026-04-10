const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createEnemyForPlatform,
    getEnemyPatrolBounds,
    updateEnemyPatrol
} = require("./game-logic.js");

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
