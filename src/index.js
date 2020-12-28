const { CommandoClient } = require('discord.js-commando');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const client = new CommandoClient({
    commandPrefix: '~',
    owner: '142907937084407808'
});

client.registry
	.registerDefaultTypes()
	.registerGroups([
		['rooms', 'Room distribution related commands.']
	])
	.registerDefaultGroups()
	.registerDefaultCommands()
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}. (ID: ${client.user.id})`);
	client.user.setActivity("mkwii");
});

client.on('error', console.error);

client.login(process.env.TOKEN);