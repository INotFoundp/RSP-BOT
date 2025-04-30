import TelegramBot from "node-telegram-bot-api";
import {BOT_TOKEN} from "../config";


const bot = new TelegramBot(BOT_TOKEN, {polling: true})


export default bot

