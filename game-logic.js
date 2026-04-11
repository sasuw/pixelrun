(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
        return;
    }
    root.GameLogic = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const defaultEnemySize = { w: 10, h: 10 };
    const defaultEnemyInset = 5;
    const defaultStarterPlatform = {
        width: 128,
        height: 10,
        topY: 132,
        leftInset: 36
    };

    function createStarterPlatform(playerSpawn, options) {
        const config = {
            ...defaultStarterPlatform,
            ...(options || {})
        };

        return {
            x: Math.max(0, playerSpawn.x - config.leftInset),
            y: config.topY,
            w: config.width,
            h: config.height
        };
    }

    function getEnemyPatrolBounds(platform, enemyWidth) {
        const minX = platform.x;
        const maxX = Math.max(platform.x, platform.x + platform.w - enemyWidth);
        return { minX, maxX };
    }

    function createEnemyForPlatform(platform, direction, options) {
        const enemySize = options && options.enemySize ? options.enemySize : defaultEnemySize;
        const inset = options && options.inset !== undefined ? options.inset : defaultEnemyInset;
        const bounds = getEnemyPatrolBounds(platform, enemySize.w);
        const clampedStartX = Math.min(bounds.maxX, Math.max(bounds.minX, platform.x + inset));

        return {
            x: clampedStartX,
            y: platform.y - enemySize.h,
            w: enemySize.w,
            h: enemySize.h,
            dir: direction,
            patrolMinX: bounds.minX,
            patrolMaxX: bounds.maxX,
            groundY: platform.y - enemySize.h
        };
    }

    function updateEnemyPatrol(enemy, turnRoll) {
        const nextEnemy = { ...enemy };

        nextEnemy.x += nextEnemy.dir;
        if (nextEnemy.x <= nextEnemy.patrolMinX) {
            nextEnemy.x = nextEnemy.patrolMinX;
            nextEnemy.dir = 1;
        } else if (nextEnemy.x >= nextEnemy.patrolMaxX) {
            nextEnemy.x = nextEnemy.patrolMaxX;
            nextEnemy.dir = -1;
        } else if (turnRoll < 0.01) {
            nextEnemy.dir *= -1;
        }

        if (nextEnemy.groundY !== undefined) {
            nextEnemy.y = nextEnemy.groundY;
        }

        return nextEnemy;
    }

    return {
        createStarterPlatform,
        createEnemyForPlatform,
        getEnemyPatrolBounds,
        updateEnemyPatrol
    };
}));
