import Bot from 'keybase-bot'
import {ChatChannel} from 'keybase-bot/lib/types/chat1'
import AtqManager from '../src/atq-manager'

describe('nonDateAtParse', (): void => {
  const bot = new Bot({debugLogging: false})
  const channel: ChatChannel = {name: 'philaris_bot_a'}
  const am = new AtqManager(bot, channel, 9)
  test('hours and minutes not allowed', () => {
    expect(isNaN(am.nonDateAtParse('+ 1 hour 30 minutes').getTime())).toBe(true)
  })
  test('days not allowed', () => {
    expect(isNaN(am.nonDateAtParse('+ 1 day').getTime())).toBe(true)
  })
  test('only time allowed', () => {
    expect(isNaN(am.nonDateAtParse('13:45').getTime())).toBe(false)
  })
  test('only time UTC allowed', () => {
    expect(isNaN(am.nonDateAtParse('13:45 UTC').getTime())).toBe(false)
  })
})
