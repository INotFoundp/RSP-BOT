import {CallBackQuery} from "../core/CallBackQuery";
import TelegramBot from "node-telegram-bot-api";
import NewGameHandler from "../query/NewGameHandler";
import {JoinUserToGameHandler} from "../query/JoinUserToGameHandler";

export class CallBackQueryHandler {
  private queries: Map<string, CallBackQuery> = new Map();

  constructor(private bot: TelegramBot) {
    this.registerAllCommand(); // 👈 اینجا فقط یکبار
  }

  register(query: CallBackQuery) {
    this.queries.set(query.query, query);
  }

  registerAllCommand() {
    this.register(new NewGameHandler(this.bot));
    this.register(new JoinUserToGameHandler(this.bot));
    // بقیه handler ها هم
  }

  async handler(query: TelegramBot.CallbackQuery) {
    const {data} = query;
    const keys = this.queries.keys();
    const mainKey = Array.from(keys).find(o => data.includes(o));
    const mainHandler = this.queries.get(mainKey);
    if (!mainHandler) return;
    await mainHandler.handler(query);
  }
}
