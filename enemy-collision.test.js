const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createSolidMask, masksOverlap } = require("./game-logic.js");

test("enemy collision follows painted pixels in both appearances", () => {
    const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
    const start = html.indexOf("const enemySpriteScale =");
    const end = html.indexOf("const keys =", start);
    assert.ok(start >= 0 && end > start);
    const { enemyCollisionMask, winterEnemyCollisionMask } = vm.runInNewContext(
        `${html.slice(start, end)}; ({ enemyCollisionMask, winterEnemyCollisionMask })`
    );
    const probe = createSolidMask(0.2, 0.2);
    const enemy = { x: 0, y: 0 };
    const touches = (x, y, mask) => masksOverlap({ x, y }, probe, enemy, mask);

    assert.equal(touches(0, 0, enemyCollisionMask), false);
    assert.equal(touches(4, 0, enemyCollisionMask), true);
    assert.equal(touches(5, 15, enemyCollisionMask), false);
    assert.equal(touches(2, 0, winterEnemyCollisionMask), true);
    assert.equal(touches(0, 0, winterEnemyCollisionMask), false);
    assert.equal(touches(17, 10, winterEnemyCollisionMask), true);
});

test("winter collision includes the ninja's visible hat pixels", () => {
    const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
    const start = html.indexOf("const winterHatLayers =");
    const end = html.indexOf("const coinCollisionMask =", start);
    assert.ok(start >= 0 && end > start);
    const { winterPlayerCollisionMasks } = vm.runInNewContext(
        `${html.slice(start, end)}; ({ winterPlayerCollisionMasks })`,
        { playerCollisionMasks: { idle: createSolidMask(12, 12) } }
    );
    const probe = createSolidMask(0.2, 0.2);
    const player = { x: 0, y: 0 };

    assert.equal(masksOverlap(player, winterPlayerCollisionMasks.idle, { x: 11.5, y: -7 }, probe), true);
    assert.equal(masksOverlap(player, winterPlayerCollisionMasks.idle, { x: 0, y: -7 }, probe), false);
});
