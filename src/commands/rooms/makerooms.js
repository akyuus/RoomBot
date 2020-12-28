const { Permissions, Message } = require('discord.js');
const { Command } = require('discord.js-commando');
const axios = require('axios').default;
const fs = require('fs');

module.exports = class MakeRoomsCommand extends Command {
    constructor(client) {
        super(client, {
            name: "makerooms",
            aliases: ["mr"],
            group: "rooms",
            memberName: "makerooms",
            description: "Randomly divides the given list of players into rooms. The bot will attempt to automatically detect the format. Can also accept a text file if the input is too large.",
            examples: [`~makerooms TAG1 A (xxxx-xxxx-xxxx) [nameA] (c host) | TAG1 B (xxxx-xxxx-xxxx) [nameB] | TAG1 C (xxxx-xxxx-xxxx) [nameC] (c host),
            TAG2 D (xxxx-xxxx-xxxx) [nameD] (c host) | TAG2 E (xxxx-xxxx-xxxx) [nameE] | TAG2 F (xxxx-xxxx-xxxx) [nameF] (c host)`],
            args: [{
                key: 'teamData',
                prompt: 'You need to input room data, or put "file" and upload your text file.',
                type: 'string',
                wait: 10
            }],
            userPermissions: ["MANAGE_MESSAGES"]
        });
    }

    /**
     * 
     * @param {Message} message 
     * @param {Object.<string, string>} param1
     */
    async run(message, { teamData }) {
        if(teamData === "file") {
            let url = message.attachments.first().url;
            if(!url.includes(".txt")) {
                return message.say("That's not a text file.");
            }

            else {
                teamData = await this.getTxtFileFromUrl(url);
            }
        }

        let playerCount, roomCount, hostTeams, rooms, nonhostTeams, format, output;
        teamData = teamData.replace(/\n/g, '');
        let teamsArray = teamData.split(',');
        format = teamsArray[0].split('|').length;
        playerCount = format*teamsArray.length;
        roomCount = ((playerCount / 12) >> 0) + 1;
        hostTeams = [];
        rooms = [];
        nonhostTeams = [];

        teamsArray.forEach(team => {
            let arr = team.includes("c host") ? hostTeams : nonhostTeams;
            let teamPlayers = team.split('|');
            let hasHost = false;
            let toAdd = [];
            
            teamPlayers.forEach(player => {
                player = player.trim();
                if(player.includes("c host") && !hasHost) {
                    toAdd.unshift(`${this.getPlayerName(player)} (${this.getCode(player)})`);
                    hasHost = true;
                }

                else {
                    toAdd.push(`${this.getPlayerName(player)}`);
                }

            }); 

            arr.push(toAdd);
        });

        if(hostTeams.length < roomCount)
        {
            return message.say("There aren't enough hosts!");
        }

        this.shuffleArray(hostTeams);
        this.shuffleArray(nonhostTeams);

        for(let i = 0; i < roomCount; i++) {
            rooms.push(hostTeams[i]);
        }

        let remainingTeams = nonhostTeams.concat(hostTeams.slice(roomCount));

        for(let i = 0; i < remainingTeams.length; i++) {
            rooms[i % rooms.length] = rooms[i % rooms.length].concat(remainingTeams[i]);
        }

        if(format < 2) {
            message.say(`Format detected as FFA.`);            
        }
        else {
            message.say(`Format detected as ${format}v${format}.`);
        }

        output = this.constructMessage(rooms);
        if(output.length <= 2000) {
            return message.say(output);
        }
        else {
            message.say("Output is more than 2000 characters. Sending a text file as a substitute...");
            fs.writeFileSync('rooms.txt', output,);
            message.say('', { files: ['rooms.txt']});
        }
    }
    /**
     * 
     * @param {string} player 
     */
    getCode(player) {
        const regex = /\d{4}\-\d{4}\-\d{4}/g;

        return player.match(regex);
    }

    /**
     * 
     * @param {string} player 
     */
    getPlayerName(player) {
        const regex = /\[\w+\]/g;

        let playerName = player.match(regex)[0];
        playerName = playerName.substring(1, playerName.length-1);

        return playerName;
    }

    /**
     * 
     * @param {Array} array 
     */
    shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    /**
     * 
     * @param {string} url 
     * @returns {string} The text file contents.
     */
    async getTxtFileFromUrl(url) {
        let response = await axios.get(url);
        return response.data;
    }

    /**
     * 
     * @param {Array.<Array.<string>>} rooms 
     */
    constructMessage(rooms) {
        let returnString = "";
        for(let i = 0; i < rooms.length; i++) {
            returnString += `**ROOM ${i+1}**\n`;
            for(let j = 0; j < rooms[i].length; j++) {
                returnString += `${j+1}. ${rooms[i][j]}\n`;
            }
            returnString += '\n';
        }

        return returnString.trim();
    }
}