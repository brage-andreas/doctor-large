import "dotenv/config";
import setCommandsScript from "../src/helpers/scripts/setCommandsScript.js";

const { GUILD_ID, CLIENT_ID } = process.env;

setCommandsScript({ GUILD_ID, CLIENT_ID, CLEAR_COMMANDS: true });
