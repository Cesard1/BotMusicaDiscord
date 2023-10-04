const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('./config.json');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.MESSAGE],
});

const prefix = '!'; // Cambia el prefijo según tus preferencias

client.setMaxListeners(0);

const queue = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      return message.reply('¡Debes estar en un canal de voz para usar este comando!');
    }

    message.reply('Por favor, proporciona el nombre de la canción que deseas reproducir.');

    const filter = (response) => response.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ filter, time: 30000 }); // 30 segundos para responder

    collector.on('collect', async (response) => {
      const query = response.content;

      try {
        const videos = await ytsr(query, { limit: 1 });

        if (videos && videos.items && videos.items.length > 0) {
          const video = videos.items[0];
          const connection = await voiceChannel.join();

          const stream = ytdl(video.url, { filter: 'audioonly' });
          const dispatcher = connection.play(stream);

          dispatcher.on('start', () => {
            console.log('Comenzando a reproducir...'); // Registro de inicio de reproducción
          });

          dispatcher.on('finish', () => {
            console.log('Reproducción finalizada.'); // Registro de finalización de reproducción
            voiceChannel.leave();
          });

          dispatcher.on('error', (error) => {
            console.error(error);
            voiceChannel.leave();
          });

          message.reply(`Reproduciendo: ${video.title}`);
        } else {
          message.reply('No se encontraron videos en YouTube con esa consulta.');
        }
      } catch (error) {
        console.error(error);
        message.reply('Ocurrió un error al buscar o reproducir la canción.');
      }

      collector.stop();
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        message.reply('Se agotó el tiempo para proporcionar el nombre de la canción.');
      }
    });
  } else if (command === 'hola') { // Agregamos esta parte para responder a !hola
    message.reply('¡Hola!');
  }
});

// Manejo de la señal SIGINT para apagar el bot
process.on('SIGINT', () => {
  console.log('Bot desconectado.');
  client.destroy();
  process.exit();
});

client.login(config.token).then(() => {
  console.log(`${client.user.username} está en línea.`);
}).catch((err) => {
  console.error(err);
});

