import Bot from 'keybase-bot'
import {log, trimMessage, timeout, sendLogEphemeral} from './utils'
import {MsgSummary, ChatChannel} from 'keybase-bot/lib/types/chat1'
import AtqManager from './atq-manager'
import config from './config'

type Stats = {
  whenStarted: number
  messagesReceived: number
}
class Runner {
  public bot: Bot
  private stats: Stats
  private atqManager: AtqManager
  private shuttingDown: boolean
  private channel: ChatChannel
  public constructor() {
    this.shuttingDown = false
    this.channel = {name: ''}
    this.stats = {
      whenStarted: Date.now(),
      messagesReceived: 0,
    }
    this.bot = new Bot({debugLogging: true})
    this.atqManager = new AtqManager(this.bot, this.channel, config.maxQueueSize)
  }

  public async init() {
    const username: string = process.env.KB_USERNAME || ''
    const paperkey: string = process.env.KB_PAPERKEY || ''
    const usePaperkey: boolean = username !== '' && paperkey !== ''
    if (usePaperkey) {
      log.info(`Initializing with paperkey for user ${username} ...`)
      await this.bot.init(username, paperkey)
    } else {
      log.info('Initializing from running service ...')
      log.info('WARNING: Avoid running service init, better use a paperkey!')
      await this.bot.initFromRunningService()
    }
    const botInfo = this.bot.myInfo()
    if (botInfo == null) {
      throw new Error('Problem in initalization of bot')
    }
    this.channel = {name: botInfo.username, public: false}
    this.atqManager = new AtqManager(this.bot, this.channel, config.maxQueueSize)
    this.announceCommandsIUnderstand()
    this.listenForEverything()
  }

  private async announceCommandsIUnderstand() {
    log.info('Advertising commands')
    await this.bot.chat.advertiseCommands({
      advertisements: [
        {
          type: 'public',
          commands: [
            {
              name: 'at',
              description: 'Send a message later.',
              usage: '',
            },
            {
              name: 'atrm',
              description: 'Remove message from queue.',
              usage: '',
            },
            {
              name: 'atq',
              description: 'Show scheduled pending messages.',
              usage: '',
            },
            {
              name: 'atstats',
              description: 'Show statistics.',
              usage: '',
            },
            {
              name: 'atshutdown',
              description: 'Shutdown.',
              usage: '',
            },
            {
              name: 'atsourcecode',
              description: 'Information abuot source code.',
              usage: '',
            },
          ],
        },
      ],
    })
  }

  private async handleMessage(message: MsgSummary) {
    // Sometimes users forget the exclamation point, so I'll
    // strip out all that and lowercase/trim the message
    const text = trimMessage(message)
    const sender = message.sender?.username
    const c = message.channel
    const b = this.bot
    if (sender) {
      this.stats.messagesReceived++
      switch (text) {
        case '!atstats':
          sendLogEphemeral(b, c, this.getStatsString())
          break
        case '!atshutdown':
          this.startShutdown()
          break
        case '!atsourcecode':
          sendLogEphemeral(b, c, `atbot: source code: https://github.com/philaris/kb-atbot`)
          break
        default:
          if (text.startsWith('!at ')) {
            this.atqManager.handleAtRequest(text)
          } else if (text.startsWith('!atrm ')) {
            this.atqManager.handleAtRemoval(text)
          } else if (text.startsWith('!atq')) {
            this.atqManager.handleAtDisplay()
          } else {
            // do nothing
          }
          break
      }
    }
  }

  private async startShutdown() {
    log.info('Shutdown request.')
    if (!this.shuttingDown) {
      sendLogEphemeral(this.bot, this.channel, 'atbot: shutting down in 10 seconds')
      const hasScheduledMessages = this.atqManager.remainingSize() > 0
      if (hasScheduledMessages) {
        sendLogEphemeral(this.bot, this.channel, 'atbot: WARNING! Scheduled messages will be forgoten!')
      }
      this.shuttingDown = true
      await timeout(10 * 1000)
      await this.deinitAndQuit(0)
    }
  }

  private getStatsString() {
    const dt = (Date.now() - this.stats.whenStarted).toLocaleString()
    const messages = this.stats.messagesReceived
    return `atbot: alive for ${dt} milliseconds and read ${messages} messages.`
  }

  private async checkScheduled() {
    while (!this.shuttingDown) {
      this.atqManager.checkSend()
      await timeout(1 * 1000)
    }
  }

  private listenForEverything() {
    const onMessage = async (message: MsgSummary) => {
      this.handleMessage(message)
    }
    const listenOpts = {hideExploding: false, showLocal: true, ignoreSourceLocal: true}
    this.bot.chat.watchChannelForNewMessages(this.channel, onMessage, undefined, listenOpts)
    log.info('Listening')
    this.checkScheduled()
  }

  public async deinitAndQuit(exitCode: number) {
    log.info('Deinitializing ...')
    log.info('Clearing command advertisements ...')
    await this.bot.chat.clearCommands()
    await this.bot.deinit()
    log.info('Shutting down ...')
    process.exit(exitCode)
  }
}

async function main() {
  const runner = new Runner()
  log.info(`Initializing ...`)
  await runner.init()
  log.info('... initialized!')
}

// --------------------------------------------------------------------------------------------------

main()
