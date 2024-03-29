import Bot from 'keybase-bot'
import {ChatChannel, MsgSummary} from 'keybase-bot/lib/types/chat1'
import {ChatSendOptions} from 'keybase-bot/lib/chat-client'

export function timeout(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

export const log = {
  info: function (s: string): void {
    console.log(new Date(), `[I] ${s}`)
  },
  error: function (s: string): void {
    console.log(new Date(), `[E] ${s}`)
  },
}

function leftPad(s: string, n: number): string {
  let res = s
  while (res.length < n) {
    res = res + ' '
  }
  return res
}

export function channelToString(channel: ChatChannel): string {
  return channel.name
}

export function logOutgoingMessage(channel: ChatChannel, body: string): void {
  const col1 = leftPad(`[${channelToString(channel)}]`, 30)
  const col2 = leftPad('atbot', 16)
  const col3 = body
    .replace(/[\n\r]/g, ' ')
    .trim()
    .substr(0, 120)
  log.info(`${col1} ${col2} ${col3}`)
}

export function logMessage(message: MsgSummary, redact?: boolean): void {
  const msgTrimmed = message.content.text
    ? message.content.text.body
        .replace(/[\n\r]/g, ' ')
        .trim()
        .substr(0, 120)
    : ''
  const col1 = leftPad(`[${channelToString(message.channel)}`, 30).slice(0, 30) + '...]'
  const col2 = leftPad(message.sender.username || '', 16)
  const col3 = redact ? msgTrimmed.replace(/[^.?\-,!\s]/g, '*') : msgTrimmed
  log.info(`${col1} ${col2} ${col3}`)
}

export function trimMessage(message: MsgSummary): string {
  // trim whitespace and lowercases it
  return (message.content.text || {body: ''}).body.trim()
}

export async function sendAndLog(bot: Bot, channel: ChatChannel, body: string, options?: ChatSendOptions): Promise<void> {
  bot.chat.send(channel, {body}, options)
  logOutgoingMessage(channel, body)
}

export async function sendLogEphemeral(bot: Bot, channel: ChatChannel, body: string): Promise<void> {
  sendAndLog(bot, channel, body, {explodingLifetime: 37000})
}
