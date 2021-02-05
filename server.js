const Discord = require('discord.io');
const token = process.env.TOKEN
const MVP = require('./mvp.json');
// Initialize Discord Bot
const bot = new Discord.Client({
  token: token,
  autorun: true,
  messageCacheLimit: 0
});

const timeoffset = '-4';

bot.on('ready', function (evt) {
  setInterval(minuteCallback.bind(this), 60000)
});

bot.on('message', function (user, userID, channelID, message, evt) {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (message.substring(0, 1) == '!') {
    let args = message.substring(1).split(' ');
    let time, timestring, death;
    let del = false;
    let msg = '';


    if (user == 'MVP') return

    if (args[0].toLowerCase() == 'list') {
      let sortedList = Object.entries(MVP).filter((key, value) => {
        return key[1]['death']
      })
        .sort((a, b) => {
          let aDeadForMin = Math.floor((new Date() - new Date(a[1]['death'])) / 60000);
          let aMinRespawnInMin = a[1]['min'] - aDeadForMin;
          let bDeadForMin = Math.floor((new Date() - new Date(b[1]['death'])) / 60000);
          let bMinRespawnInMin = b[1]['min'] - bDeadForMin;
          if (aMinRespawnInMin > bMinRespawnInMin) {
            return 1;
          }
          if (aMinRespawnInMin < bMinRespawnInMin) {
            return -1;
          }
          return 0;
        })
      let msg = sortedList.map(mvp => (mvp[1]['min'] - Math.floor((new Date() - new Date(mvp[1]['death'])) / 60000)) + ' min ' + fancyName(mvp[0]) + ' (' + mvp[1]['map'] + ')\n').join('')
      if (sortedList.length == 0) msg = 'Tienes que indicar la hora de la muerte. "hh:mm" '
      bot.sendMessage({
        to: channelID,
        message: msg
      })
      return
    }

    if (args[0].toLowerCase() == 'help') {
      bot.sendMessage({
        to: channelID,
        message: `
        **!mvp_name <+-minutes/timestring XX:XX>** will track the named mvp\n**!mvp_name del** will delete the given record\n**!mvp_name** will return respawn information (last message will be updated every minute)\n**!list** will display a list sorted by earliest respawn\n**!help** will display this help message\n`
      })
      return
    }

    if (args[0].toLowerCase() == 'hallo') {
      bot.sendMessage({
        to: channelID,
        message: (user == 'Noil') ? 'Hallo DADDDY ** <3' : `Hallo ${user} <3!`
      })
      return
    }

    // !phreeoni -1
    if (!isNaN(args[args.length - 1])) {
      time = args.pop();
    }

    // !phreeoni 10:15
    if (/^\d{2}:\d{2}$/.test(args[args.length - 1])) {
      timestring = args.pop()
    }

    if (args[args.length - 1] == 'del') {
      del = true;
      args.pop()
    }

    if (time || timestring) {
      death = Date.now();
      if (time) {
        death += (time * 60000)
      } else {
        let now = new Date();
        // adding 3 minutes offset to server time
        //comentando la linea siguiente cuenta la hora de la muerte justo al horario España
        //death = Date.parse(`${now.toDateString()} ${timestring} GMT`) - ((timeoffset * 60 * 60 * 1000) + (3 * 60 * 1000))
      }
    }

    let mvp = args.join('_').toUpperCase();

    if (typeof MVP[mvp] === 'string') {
      let alias = mvp
      mvp = resolveAlias(MVP[mvp])
      bot.sendMessage({
        to: channelID,
        message: `*${fancyName(alias)}* alias *${fancyName(mvp)}*\n @Beware alguien ha usado el bot.`
      })
    }

    let candidates = Object.keys(MVP).filter(key => {
      return key.startsWith(mvp)
    })

    if (candidates[0] !== mvp) {
      msg += (candidates.length == 0) ? `Primo, no hay ningun MVP con el nombre de *${fancyName(mvp)}*` : 'Baka, did you mean?\n'
      candidates.forEach(name => {
        let resolved = resolveAlias(name)
        msg += `${fancyName(name)}${(resolved != name) ? ' (Alias for ' + fancyName(resolved) + ')' : ''} (${MVP[resolved]['map']})\n`
      })
    } else {
      // could identify
      if (del) {
        delete MVP[mvp]['death']
        bot.sendMessage({
          to: channelID,
          message: `${fancyName(mvp)} record deleted\n`
        });
      } else
        if (death) {
          MVP[mvp]['death'] = death
          MVP[mvp]['channelID'] = channelID
          let deadForMin = Math.floor((new Date() - new Date(MVP[mvp]['death'])) / 60000);
          let minRespawnInMin = MVP[mvp]['min'] - deadForMin;
          // adding 3 minutes offset to server time
          //comentada la linea para que salga la hora del servidor España
          //let servertime = new Date(death + (timeoffset * 60 * 60 * 1000) + (3 * 60 * 1000))
          let servertime = new Date(death+3600000)
          servertime = servertime.toTimeString('UTC').split(':').slice(0,2).join(':')
          bot.sendMessage({
            to: channelID,
            message: `${fancyName(mvp)} ha muerto a las ${servertime} (hora España) y respawneara en ${minRespawnInMin - 10} minutos.\n`
          });
        }
      if (MVP[mvp]['death']) {
        let deadForMin = Math.floor((new Date() - new Date(MVP[mvp]['death'])) / 60000);
        let prueba = time;
        let minMPVReal =  new Date(death + (timeoffset * 60 * 60 * 1000) + (3 * 60 * 1000));
        let minRespawnInMin = MVP[mvp]['min'] - deadForMin;
        let maxRespawnInMin = MVP[mvp]['max'] - deadForMin;
        if (minRespawnInMin == maxRespawnInMin) {
          bot.sendMessage({
            to: channelID,
            message: `${fancyName(mvp)} will respawn in ${minRespawnInMin}!`
          }, (error, result) => {
            MVP[mvp]['msgID'] = result.id,
              MVP[mvp]['channelID'] = channelID
          });
        }
        bot.sendMessage({
          to: channelID,
          message: `${fancyName(mvp)} tiene un tiempo de respawn entre ${minRespawnInMin} y ${maxRespawnInMin} minutos!`
        }, (error, result) => {
          MVP[mvp]['msgID'] = result.id,
            MVP[mvp]['channelID'] = channelID
        });
      } else {
        msg += 'Tienes que indicar la hora de la muerte. "HH:MM"\n'
      }

    }

    if (msg) {
      bot.sendMessage({
        to: channelID,
        message: msg
      });
    }
  }
});

function fancyName(name) {
  return name.split('_').map(name => {
    return name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }).join(' ')
}

function resolveAlias(mvp) {
  if (typeof MVP[mvp] === 'string') {
    return resolveAlias(MVP[mvp])
  } else {
    return mvp
  }
}

function minuteCallback() {
    for (let key in MVP) {
      if (MVP[key]['death']) {
        let deadForMin = Math.floor((new Date() - new Date(MVP[key]['death'])) / 60000);
        let minRespawnInMin = MVP[key]['min'] - deadForMin;
        let maxRespawnInMin = MVP[key]['max'] - deadForMin;

        // 5 minutes timer
        if (minRespawnInMin == 5) {
          bot.sendMessage({
            to: MVP[key]['channelID'],
            message: `${fancyName(key)} could respawn in 5 minutes!`
          })
        }

        // could have been respawned
        if (maxRespawnInMin != 0 && minRespawnInMin == 0) {
          bot.sendMessage({
            to: MVP[key]['channelID'],
            message: `${fancyName(key)} could be respawned!`
          })
        }

        if (maxRespawnInMin == 0) {
          bot.sendMessage({
            to: MVP[key]['channelID'],
            message: `${fancyName(key)} has been respawned!`
          })
          delete MVP[key]['death']
        }

        if (MVP[key]['msgID']) {
          let msg = (minRespawnInMin == maxRespawnInMin) ? `${fancyName(key)} will respawn in ${minRespawnInMin}!` : `${fancyName(key)} respawneara en ${minRespawnInMin} o ${maxRespawnInMin} minutos!`
          bot.editMessage({
            channelID: MVP[key]['channelID'],
            messageID: MVP[key]['msgID'],
            message: msg
          })
        }

      } else {
        continue
      }
    }
  }
require("http").createServer(async (req,res) => { res.statusCode = 200; res.write("ok"); res.end(); }).listen(3000, () => console.log("Now listening on port 3000"));
