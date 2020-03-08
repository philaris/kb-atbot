import Bot from 'keybase-bot'
import {ChatChannel} from 'keybase-bot/lib/types/chat1'
import AtqManager from '../src/atq-manager'

describe('atqManager', (): void => {
  const bot = new Bot({debugLogging: false})
  const channel: ChatChannel = {name: 'philaris_bot_a'}
  const am = new AtqManager(bot, channel, 9)
  test('remaining messages are zero', () => {
    expect(am.remainingSize()).toBe(0)
  })
})
