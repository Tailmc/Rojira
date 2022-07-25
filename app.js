require('dotenv').config()
const http = require('http')
const { Client, Intents, MessageActionRow, MessageEmbed, MessageButton } = require('discord.js');
const { default: axios } = require('axios')
const fs = require('fs')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const webmonitoring = require('web-monitoring')
const options =
{
    whileControl: (oldPage, newPage) => oldPage === newPage,
    lapse: 5000
}

webmonitoring.monitor('https://bugs.mojang.com/rest/api/latest/search?jql=project=MC&issuetype=Bug&maxResults=1', options)
    .start()
    .on('alert', async function () {
        const channel = client.channels.cache.find(channel => channel.name === "logs");
        const res = await axios.get('https://bugs.mojang.com/rest/api/latest/search?jql=project=MC&issuetype=Bug&maxResults=1')
        const sch = await axios.get('https://bugs.mojang.com/rest/api/latest/search?jql=text~"' + encodeURI(res.data.issues[0].fields.summary) + '"&issuetype=Bug&maxResults=2')
        const mod = /optifine|forge|fabric|mod/.test(res.data.issues[0].fields.description.toLowerCase())
        const translation = /chinese|spanish|hindi|arabic|portuguese|russian|japanese|french|german|italian|translation/.test(res.data.issues[0].fields.description.toLowerCase())
        const embedarray = []
        const link_main = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setURL('https://bugs.mojang.com/browse/' + res.data.issues[0].key)
                    .setLabel('Main')
                    .setStyle('LINK')
            )
        const componentarray = [link_main]
        if (fs.readFileSync('id.txt', 'utf-8') === res.data.issues[0].key) return
        if (mod) {
            const embed_mod = new MessageEmbed()
                .setColor('RED')
                .setTitle('Mod usage: Includes mod-related word(s)')
            embedarray.push(embed_mod)
        }
        if (translation) {
            const embed_translation = new MessageEmbed()
                .setColor('RED')
                .setTitle('Translation issue: Includes translation-related word(s)')
            embedarray.push(embed_translation)
        }
        if (sch.data.issues[1] !== undefined) {
            const embed_duplication = new MessageEmbed()
                .setColor('RED')
                .setTitle('Duplication: ' + sch.data.issues[1].key)
                .setDescription(sch.data.issues[1].fields.summary)
            embedarray.push(embed_duplication)
            const link_dupe = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setURL('https://bugs.mojang.com/browse/' + sch.data.issues[1].key)
                        .setLabel('Duplication')
                        .setStyle('LINK')
                )
            componentarray.push(link_dupe)
        }
        await channel.send({ content: res.data.issues[0].key + ": " + res.data.issues[0].fields.summary, embeds: embedarray, components: componentarray })
        fs.writeFileSync('id.txt', res.data.issues[0].key)
    })

client.on('ready', () => {
    console.log('reloaded');
    client.user.setActivity('Mojira', {
        type: 'WATCHING',
    });
});

if (process.env.TOKEN == undefined) {
    console.log("undefined token");
    process.exit(0);
}
client.login(process.env.TOKEN)
