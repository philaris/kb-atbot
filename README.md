# keybase at bot

This is a bot that receives requests to send a message later.
It has to run as the user who is to send the message and it only
listens to messages of that user.
It is based on [debatebot](https://github.com/keybase/debatebot).

### To run it, or your edits of it:

1. Clone this repo to your own computer.
2. Run `yarn` or `npm install` to install requirements.
3. Run `yarn go` or `npm run go` to start it up. It is suggested
that you run the bot with a paperkey, e.g., as follows (in unix):
```
 KB_USERNAME=myuser KB_PAPERKEY="foo ..." yarn go
```
(Set up `ignorespaces` in your shell and enter the above command with an
initial space in your command line,
so that the paperkey is not saved in your history file.)
When using a paperkey, you do not have to rely on a special version of
[keybase-bot](https://github.com/philaris/keybase-bot).

Then, the bot is ready to receive your messages.

### Docker image

If you have docker you can start the image at https://hub.docker.com/r/philaris/kb-atbot as follows:
```
 docker run -i -t -e KB_USERNAME="myuser" -e KB_PAPERKEY="foo ..." --name atbot philaris/kb-atbot
```


### Examples

Schedule a message after 20 minutes to user `kbusername`:
```
!at +20 min to kbusername Hello from X. This is a scheduled message.
```

Schedule a message after 2.5 hours:
```
!at +2.5hr to kbusername Hello X.
```
(You can use either minutes or hours, not both.)

Schedule a message at 13:45:
```
!at 13:45 to kbusername Please, remember Y.
```

Schedule a message at 13:45 UTC:
```
!at 13:45 UTC to kbusername Please, remember Y.
```

Schedule messages with full date specifications:
```
!at 2020-03-08 13:45 to kbusername Please, remember Y.
!at 2020-03-08 13:45 UTC to kbusername Please, remember Y.
!at 2020-03-08T15:13:00Z to kbusername Please, remember Y.
```
