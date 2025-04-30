import TelegramBot from "node-telegram-bot-api";

export abstract class CallBackQuery {

  constructor(protected bot: TelegramBot) {
  }

  abstract query: string;

  abstract handler(query: TelegramBot.CallbackQuery): Promise<void>;

}