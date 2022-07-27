require('dotenv').config()
const http = require('http')
const { Client, Intents, MessageActionRow, MessageEmbed, MessageButton } = require('discord.js');
const { default: axios } = require('axios')
const fs = require('fs')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const languagedetect = require('languagedetect')
const detector = new languagedetect()
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
        const mod = /optifine|forge|fabric|mods|paper|spigot|bukkit/.test(res.data.issues[0].fields.description.toLowerCase())
        const translation = /chinese|spanish|hindi|arabic|portuguese|russian|japanese|french|german|italian|translation/.test(res.data.issues[0].fields.description.toLowerCase())
        const old = /1.8.9|1.12.2|1.13.2|1.14.4|1.15.2|1.16.5|1.17.1|1.18.2/.test(res.data.issues[0].fields.description.toLowerCase())
        const language = detector.detect(res.data.issues[0].fields.summary)
        const embedarray = []
        const links = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setURL('https://bugs.mojang.com/browse/' + res.data.issues[0].key)
                    .setLabel('Main')
                    .setStyle('LINK')
            )
        if (fs.readFileSync('id.txt', 'utf-8') === res.data.issues[0].key) return
        if (language.length && language[0][0] !== "english") {
            const embed_language = new MessageEmbed()
                .setColor('RED')
                .setTitle('Other languages: detected ' + language[0][0])
            embedarray.push(embed_language)
        }
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
        if (old) {
            const embed_old = new MessageEmbed()
                .setColor('RED')
                .setTitle('Old version: Includes old version number')
            embedarray.push(embed_old)
        }
        if (sch.data.issues[1] !== undefined) {
            const embed_duplication = new MessageEmbed()
                .setColor('RED')
                .setTitle('Duplication: ' + sch.data.issues[1].key)
                .setDescription(sch.data.issues[1].fields.summary)
            embedarray.push(embed_duplication)
            links.addComponents(
                new MessageButton()
                    .setURL('https://bugs.mojang.com/browse/' + sch.data.issues[1].key)
                    .setLabel('Duplication')
                    .setStyle('LINK')
            )
        }
        await channel.send({ content: res.data.issues[0].key + ": " + res.data.issues[0].fields.summary, embeds: embedarray, components: [links] })
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
