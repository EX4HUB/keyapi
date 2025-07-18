require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;

const API_BASE = 'https://keyapi.onrender.com';

// ----- Register Slash Commands -----
const commands = [
  new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('สร้าง Key สำหรับ Roblox ID')
    .addStringOption(opt =>
      opt.setName('robloxid').setDescription('ใส่ Roblox UserId').setRequired(true)),

  new SlashCommandBuilder()
    .setName('checkkey')
    .setDescription('ตรวจสอบ Key ว่าถูกต้องไหม')
    .addStringOption(opt =>
      opt.setName('key').setDescription('Key ที่ต้องการตรวจสอบ').setRequired(true))
    .addStringOption(opt =>
      opt.setName('robloxid').setDescription('Roblox UserId').setRequired(true)),

  new SlashCommandBuilder()
    .setName('listkeys')
    .setDescription('แสดงรายการ Keys ทั้งหมด'),

  new SlashCommandBuilder()
    .setName('removekey')
    .setDescription('ลบ Key ที่ต้องการ')
    .addStringOption(opt =>
      opt.setName('key').setDescription('Key ที่ต้องการลบ').setRequired(true))
    .addStringOption(opt =>
      opt.setName('robloxid').setDescription('Roblox UserId').setRequired(true))
]
  .map(command => command.toJSON());

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('📤 Registering slash commands...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
});

// ----- Slash Command Logic -----
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, user } = interaction;

  switch (commandName) {
    case 'genkey': {
      const robloxId = options.getString('robloxid');
      const newKey = generateRandomKey();

      try {
        const res = await axios.post(`${API_BASE}/addkey`, {
          key: newKey,
          userId: robloxId
        });

        await interaction.reply(res.data.success
          ? `✅ Key created: \`${newKey}\` for Roblox ID ${robloxId}`
          : `❌ Failed: ${res.data.message}`);
      } catch (err) {
        await interaction.reply('❌ Error adding key.');
      }
      break;
    }

    case 'checkkey': {
      if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
        return interaction.reply('❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้');
    }

      const keyToCheck = options.getString('key');
      const robloxId = options.getString('robloxid');

      try {
        const res = await axios.get(`${API_BASE}/check/${keyToCheck}/${robloxId}`);
        await interaction.reply(res.data.valid
          ? `✅ Key is valid and belongs to Roblox ID ${robloxId}`
          : `❌ Invalid: ${res.data.message}`);
      } catch (err) {
        await interaction.reply('❌ Error checking key.');
      }
      break;
    }

    case 'listkeys': {
    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
        return interaction.reply('❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้');
    }

      try {
        const res = await axios.get(`${API_BASE}/keys`);
        const allKeys = res.data.keys;

        if (allKeys.length === 0)
          return interaction.reply('🔍 No keys found.');

        const formattedKeys = allKeys
          .map(k => `• Key: \`${k.key}\` — Owner: \`${k.owner}\``)
          .join('\n');

        await interaction.reply({ content: `🔑 รายการ Keys ทั้งหมด:\n${formattedKeys}`, ephemeral: true });
      } catch (err) {
        await interaction.reply('❌ Error loading keys.');
      }
      break;
    }

    case 'removekey': {
      const keyToRemove = options.getString('key');
      const robloxId = options.getString('robloxid');
        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
            return interaction.reply('❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้');
        }

      try {
        const res = await axios.delete(`${API_BASE}/removekey/${keyToRemove}/${robloxId}`);
        await interaction.reply(res.data.success
          ? `✅ Removed key: \`${keyToRemove}\` from Roblox ID ${robloxId}`
          : `❌ Failed: ${res.data.message}`);
      } catch (err) {
        await interaction.reply('❌ Error removing key.');
      }
      break;
    }

    default:
      await interaction.reply('❌ Unknown command.');
  }
});

function generateRandomKey() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

client.login(process.env.DISCORD_TOKEN);
