const puppeteer = require("puppeteer");
const fs = require("fs");
const stripJsonComments = require("strip-json-comments").default || require("strip-json-comments");
require("dotenv").config();

// Helper function to load JSON with comments
function loadMapJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    // Strip comments safely (respects strings and quoted content)
    const cleanedContent = stripJsonComments(content);
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error(`Error loading map from ${filePath}:`, error.message);
    throw new Error(`Failed to parse map file ${filePath}: ${error.message}`);
  }
}

// Load maps
const maps = {
  classic: loadMapJSON("./maps/1v1.json"),
  big: loadMapJSON("./maps/4v4.json"),
  small: loadMapJSON("./maps/3v3.json")
};

const TOKEN = process.env.HAXBALL_TOKEN;
if (!TOKEN) {
  console.error("Missing HAXBALL_TOKEN in environment variables.");
  process.exit(1);
}

const ROOM_NAME = process.env.ROOM_NAME || "My Haxball Room";

async function launchHeadlessHost() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    headless: "new"
  });
  const page = await browser.newPage();

  await page.goto("https://www.haxball.com/headless", { waitUntil: "networkidle2" });

  // Wait for HBInit to be available
  await page.waitForFunction("typeof HBInit !== 'undefined'", { timeout: 30000 });

  await page.evaluate(
    ({ token, roomName, maps }) => {
      // This code runs inside the headless Haxball page
      const selectedMap = maps.classic;  // change map as desired
      const room = HBInit({
        token: token,
        stadium: selectedMap,
        name: roomName,
        maxPlayers: 8,
        public: true
      });

      room.onPlayerJoin = (player) => {
        console.log("Player joined:", player.name);
      };
      room.onPlayerLeave = (player) => {
        console.log("Player left:", player.name);
      };
      room.onTeamGoal = (team) => {
        console.log("Goal for team:", team);
      };

      console.log("Room created successfully!");
    },
    { token: TOKEN, roomName: ROOM_NAME, maps }
  );

  console.log("Headless host launched.");
}

launchHeadlessHost().catch((err) => {
  console.error("Error launching headless host:", err);
  process.exit(1);
});
