const puppeteer = require("puppeteer");
require("dotenv").config();

// Load maps
const maps = {
  classic: require("./maps/classic.json"),
  big: require("./maps/big.json"),
  small: require("./maps/small.json"),
  easy: require("./maps/easy.json"),
  hardcourt: require("./maps/hardcourt.json")
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

  await page.goto("https://www.haxball.com/headless");

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

      console.log("Room created:", room.getRoomData());
    },
    { token: TOKEN, roomName: ROOM_NAME, maps }
  );

  console.log("Headless host launched.");
}

launchHeadlessHost().catch((err) => {
  console.error("Error launching headless host:", err);
  process.exit(1);
});
