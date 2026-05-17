"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAlert = sendAlert;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function sendAlert(message) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
        console.warn('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados no .env do scraper.');
        return false;
    }
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });
        if (!response.ok) {
            console.error('Erro ao enviar alerta pelo Telegram no scraper:', await response.text());
            return false;
        }
        return true;
    }
    catch (error) {
        console.error('Erro de rede ao enviar alerta pelo Telegram no scraper:', error);
        return false;
    }
}
