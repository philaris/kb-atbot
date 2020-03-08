import Bot from 'keybase-bot'
import {ChatChannel} from 'keybase-bot/lib/types/chat1'
import {sendAndLog, sendLogEphemeral} from './utils'

//
// This class manages at requests.
//

type AtRequest = {
  when: Date
  recipient: string
  body: string
}

class AtqManager {
  private bot: Bot
  private maxMessages: number
  private queue: Set<AtRequest>
  private channel: ChatChannel
  public constructor(bot: Bot, channel: ChatChannel, maxMessages: number) {
    this.bot = bot
    this.maxMessages = maxMessages
    this.queue = new Set<AtRequest>()
    this.channel = channel
  }

  public remainingSize() {
    return this.queue.size
  }

  public async handleAtRequest(text: string) {
    const queueSize = this.queue.size
    if (queueSize >= this.maxMessages) {
      sendLogEphemeral(this.bot, this.channel, 'atbot: message ignored; maximum number of messages reached')
    } else {
      const rexp = /!at[ ]+([^t]+)[ ]+to[ ]+([a-z0-9_]+)[ ]+(.*)/
      const matchArray = rexp.exec(text)
      if (matchArray === null || matchArray.length !== 4) {
        sendLogEphemeral(this.bot, this.channel, 'atbot: bad scheduled message specification')
      } else {
        const possibleDate = new Date(matchArray[1])
        const sendAt = !isNaN(possibleDate.getTime()) ? possibleDate : this.nonDateAtParse(matchArray[1])
        const badDate = isNaN(sendAt.getTime())
        if (badDate) {
          sendLogEphemeral(this.bot, this.channel, `atbot: bad date specification`)
        } else {
          sendLogEphemeral(this.bot, this.channel, `atbot: scheduling message at ${sendAt} to ${matchArray[2]}`)
          this.queue.add({
            when: sendAt,
            recipient: matchArray[2],
            body: matchArray[3],
          })
        }
      }
    }
  }

  public nonDateAtParse(text: string): Date {
    const invalidDate: Date = new Date('INVALID DATE')
    const startsWithPlus: boolean = /^\+/.test(text)
    if (startsWithPlus) {
      const hasMinutes: boolean = /min/.test(text)
      const hasHours: boolean = /h(?:ou)?r/.test(text)
      if (hasMinutes === hasHours) return invalidDate
      const multiplier = hasMinutes ? 60000 : 60 * 60000
      const num = parseFloat(text.replace(/\s+/g, ''))
      return new Date(new Date().getTime() + num * multiplier)
    } else {
      const now = new Date()
      const todayString = now.toISOString().substr(0, 10)
      const todayWithTime = todayString + ' ' + text
      const todayDate: Date = new Date(todayWithTime)
      if (todayDate >= now) {
        return todayDate
      } else {
        const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000)
        return tomorrowDate
      }
    }
  }

  public async handleAtRemoval(text: string) {
    const msgId = parseInt(text.substring(6).trim())
    sendLogEphemeral(this.bot, this.channel, `atbot: deleting message ${msgId}.`)
    let i = 0
    for (const atReq of this.queue.values()) {
      i = i + 1
      if (i === msgId) {
        this.queue.delete(atReq)
        break
      }
    }
  }

  public async handleAtDisplay() {
    let queueInfo = `atbot: # scheduled messages: ${this.queue.size}.`
    let i = 0
    for (const atReq of this.queue.values()) {
      ++i
      queueInfo += `\n${i} at ${atReq.when} to ${atReq.recipient} : ${atReq.body}`
    }
    await sendLogEphemeral(this.bot, this.channel, queueInfo)
  }

  private async sendAtReq(atReq: AtRequest) {
    const sendChannel: ChatChannel = {name: atReq.recipient}
    sendAndLog(this.bot, this.channel, `atbot: sending to ${atReq.recipient} message: ${atReq.body}`)
    sendAndLog(this.bot, sendChannel, atReq.body)
  }

  public async checkSend() {
    const now = new Date()
    for (const atReq of this.queue.values()) {
      if (now >= atReq.when) {
        this.sendAtReq(atReq)
        this.queue.delete(atReq)
        break
      }
    }
  }
}

export default AtqManager
