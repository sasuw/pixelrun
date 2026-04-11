const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const repoRoot = __dirname;
const chromeBin = process.env.CHROME_BIN || "google-chrome";

function chromeAvailable() {
    const result = spawnSync(chromeBin, ["--version"], { encoding: "utf8" });
    return result.status === 0;
}

test("index.html still boots when the external game-logic script is unavailable", { skip: !chromeAvailable() }, () => {
    const originalHtml = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
    const htmlWithoutExternalLogic = originalHtml.replace(
        '<script src="game-logic.js"></script>\n',
        ""
    );

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pixelrun-smoke-"));
    const tempHtmlPath = path.join(tempDir, "index.html");
    fs.writeFileSync(tempHtmlPath, htmlWithoutExternalLogic);

    const dumpedDom = execFileSync(
        chromeBin,
        [
            "--headless",
            "--disable-gpu",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=1500",
            "--dump-dom",
            `file://${tempHtmlPath}`
        ],
        {
            cwd: repoRoot,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"]
        }
    );

    assert.match(dumpedDom, /data-game-ready="1"/);
    assert.match(dumpedDom, /<canvas id="game"/);
});
