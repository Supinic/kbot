#!/usr/bin/env node

'use strict';

const fs = require('fs');
const api = require('./config.js');

// parse the channel list 
// check for empty items in an array
const channelOptions = fs.readFileSync('./db/channels.js').toString().split('"').filter(
	function(i) {
		return i != null;
	}).join('').split(' ')
const options = {
	options: {
		debug: false,
	},
	connection: {
		cluster: 'aws',
	},
	identity: {
		username: 'kunszgbot',
		password: api.oauth,
	},
	channels: channelOptions,
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
const repeatedMessages = {
	supinic: null
};

kb.connect();
kb.on('connected', (adress, port) => {

	kb.say('kunszg', 'reconnected KKona')
	const randomApod = require('random-apod'); //apod command - for random astro pic of the day
	const search = require("youtube-search"); // rt and yt commands - random video using random words api
	const si = require('systeminformation'); //ping command - ram usage
	const os = require('os'); //uptime command - system uptime
	const rndSong = require('rnd-song'); //rt command - random track using youtube search api
	const rf = require('random-facts'); //rf command - random fact
	const count = require('mathjs');
	const rUni = require('random-unicodes');
	const SpacexApiWrapper = require("spacex-api-wrapper");
	const fetch = require("node-fetch");
	const mysql = require('mysql2');
	const con = mysql.createConnection({
		host: "localhost",
		user: "root",
		password: "",
		database: "kbot"
	});
	con.connect(function(err) {
		if (err) {
			kb.say('supinic', '@kunszg, database connection error monkaS')
			console.log(err)
		} else {
			console.log("Connected!");
		}
	});

	const allowFastramid = [{
			ID: '178087241'
		}, //kunszg
		{
			ID: '229225576'
		}, //kunszgbot
	];
	const allowEval = [{
			ID: '178087241'
		}, //kunszg
		{
			ID: '229225576'
		}, //kunszgbot
		{
			ID: '458101504'
		}, //notkunszg
		{
			ID: '31400525'
		} //supinic
	];
	const allowModule = [{
			ID: '178087241'
		}, //kunszg
		{
			ID: '229225576'
		}, //kunszgbot
		{
			ID: '40379362'
		}, //sinris
		{
			ID: '103973901'
		} //alazymeme
	]
	const doQuery = (query) => new Promise((resolve, reject) => {
	    con.query(query, (err, results, fields) => {
	        if (err) {
	        	const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
				const insert = [JSON.stringify(err), new Date()];
				con.query(mysql.format(sql, insert),
					function(error, results, fields) {
						if (error) {
							console.log(error)
							reject(error)
						} else {
							resolve(results)
						}
					})
	            reject(err);
	        }
	        else {
	            resolve(results);
	        }      
	    });
	});
	async function errorLog(err) {
		console.log(err)
		const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
		const insert = [JSON.stringify(err), new Date()];
		await doQuery(mysql.format(sql, insert));
	}

	const prefix = "kb ";
	const commandsExecuted = [];
	const talkedRecently = new Set();
	const commands = [{
			name: prefix + "uptime",
			aliases: null,
			description: 'displays informations about current runtime of the bot, lines, memory usage,' +
				' host uptime and commands used in the current session - cooldown 8s',
			invocation: async (channel, user, message, args) => {
				try {
					function format(seconds) {
						function pad(s) {
							return (s < 10 ? '0' : '') + s;
						}
						var hours = Math.floor(seconds / (60 * 60));
						var minutes = Math.floor(seconds % (60 * 60) / 60);
						var seconds = Math.floor(seconds % 60);
						if (hours === 0 && minutes != 0) {
							return minutes + 'm ' + seconds + "s";
						} else {
							if (minutes === 0 && hours === 0) {
								return seconds + "s"
							} else if (seconds === 5 || hours === 0 && minutes === 0) {
								return 'few seconds'
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}
					const fs = require("fs");
					const stats = fs.statSync("./bot.js");
					const fileSizeInBytes = stats['size'];
					const size = fileSizeInBytes / 1000
					const used = process.memoryUsage().heapUsed / 1024 / 1024;
					const uptime = process.uptime();
					const os = require('os');
					const up = os.uptime() / 3600; //system uptime in hours
					const up2 = os.uptime() / 86400; //system uptime in days
					const linecount = require('linecount')
					const lines = await new Promise((resolve, reject) => { //line count	
						linecount('./bot.js', (err, count) => {
							if (err) {
								reject(err);
							} else {
								resolve(count);
							}
						});
					});
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 8000);
					}
					if (up > 72 && uptime < 172800) {
						return user['username'] + ", code is running for " + format(uptime) + ", has " + lines +
							" lines,  memory usage: " + used.toFixed(2) + " MB, host is up for " + up2.toFixed(2) +
							" days, commands used in this session " + commandsExecuted.length + " FeelsDankMan";
					} else {
						if (uptime > 172800 && up > 72) {
							return user['username'] + ", code is running for " + (uptime / 86400).toFixed(1) + " days, has " + lines +
								" lines,  memory usage: " + used.toFixed(2) + " MB, host is up for " + up.toFixed(1) +
								"h (" + up2.toFixed(2) + " days), commands used in this session " +
								commandsExecuted.length + " FeelsDankMan";
						} else if (uptime > 172800 && up < 72) {
							return user['username'] + ", code is running for " + (uptime / 86400).toFixed(1) + " days, has " + lines +
								" lines,  memory usage: " + used.toFixed(2) + " MB, host is up for " + up.toFixed(1) +
								"h, commands used in this session " + commandsExecuted.length + " FeelsDankMan";
						} else {
							return user['username'] + ", code is running for " + format(uptime) + ", has " + lines +
								" lines,  memory usage: " + (used).toFixed(2) + " MB, host is up for " + up.toFixed(1) +
								"h (" + up2.toFixed(2) + " days), commands used in this session " +
								commandsExecuted.length + " FeelsDankMan";
						}
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "ping",
			aliases: null,
			description: "syntax: kb ping [service] | no parameter - data about latest github activity |" +
				" service - checks if server/domain is alive - cooldown 5s",
			invocation: async (channel, user, message, args, err) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);

					function format(seconds) {
						function pad(s) {
							return (s < 10 ? '0' : '') + s;
						}
						var hours = Math.floor(seconds / (60 * 60));
						var minutes = Math.floor(seconds % (60 * 60) / 60);
						var seconds = Math.floor(seconds % 60);
						if (hours === 0 && minutes != 0) {
							return minutes + 'm ' + seconds + "s";
						} else {
							if (minutes === 0 && hours === 0) {
								return seconds + "s"
							} else if (seconds === 5 || hours === 0 && minutes === 0) {
								return '0s'
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}
					if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 5000);
					}
					if (!msg[0]) {
						
						const apiCommits = "https://api.github.com/repos/KUNszg/kbot/commits?per_page=100";
						const urls = [apiCommits, apiCommits + '&page=2', apiCommits + '&page=3', apiCommits + '&page=4', apiCommits + '&page=5']
						async function getAllUrls(urls) {
						    try {
						        var data = await Promise.all(
						            urls.map(
						                url =>
						                    fetch(url).then(
						                        (response) => response.json()
						                    )));

						        return data

						    } catch (error) {
						        console.log(error)
						        throw (error)
						    }
						}

						const commitsCount = await getAllUrls(urls);
						const countCommits = ((commitsCount.length * 100) - (100 - commitsCount[commitsCount.length-1].length));
						const commitDate = new Date(commitsCount[0][0].commit.committer.date);
						const serverDate = new Date();
						const diff = Math.abs(commitDate - serverDate)
						const latestCommit = (diff / 1000).toFixed(2);
						const ping = await kb.ping();
						if (latestCommit > 259200) {
							return user['username'] + ", pong FeelsDankMan 🏓 ppHop 🏓💻 latest commit: " +
								(latestCommit / 86400).toFixed(0) + " ago (master, " + commits[0].sha.slice(0, 7) +
								", commit " + countCommits + ")";
						} else {
							return user['username'] + ", pong FeelsDankMan 🏓 ppHop 🏓💻 latest commit: " +
								format(latestCommit) + " ago (master, " + commitsCount[0][0].sha.slice(0, 7) + ", commit " +
								countCommits + ")";
						}
					} else {
						const ping = require('ping');
						const hosts = [msg[0]];
						hosts.forEach(function(host) {
							ping.sys.probe(host, function(isAlive) {
								const mesg = isAlive ? 'host ' + host + ' is alive FeelsGoodMan' : 'host ' + host +
									' is dead FeelsBadMan';
								kb.say(channel, user['username'] + ', ' + mesg)
							});
						});
					}
					return '';
				} catch (err) {
					errorLog(err)
					if (err.message.includes("undefined")) {
						return user['username'] + ", N OMEGALUL"
					} else {
						return user['username'] + ", " + err + " FeelsDankMan !!!";
					}
				}
			}
		},

		{
			name: prefix + "spacex",
			aliases: null,
			description: "data from SpaceX about next launch rocket launch date, " +
				" mission and launch site - cooldown 15s",
			invocation: async (channel, user, message, args) => {
				try {
					const space = await SpacexApiWrapper.getNextLaunch();
					const date = await space.launch_date_utc;
					const apiDate = new Date(date);
					const serverDate = new Date();
					const diff = Math.abs(serverDate - apiDate)
					const DifftoSeconds = (diff / 1000).toFixed(0);
					const toHours = (DifftoSeconds / 3600).toFixed(0);

					function format(seconds) {
						function pad(s) {
							return (s < 10 ? '0' : '') + s;
						}
						var hours = Math.floor(seconds / (60 * 60));
						var minutes = Math.floor(seconds % (60 * 60) / 60);
						var seconds = Math.floor(seconds % 60);
						if (hours === 0 && minutes != 0) {
							return minutes + 'm ' + seconds + "s";
						} else {
							if (minutes === 0 && hours === 0) {
								return seconds + "s"
							} else if (seconds === 0 || hours === 0 && minutes === 0) {
								return 'few seconds'
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 15000);
					}
					if (toHours > 72) {
						return "Next rocket launch by SpaceX in " + (toHours / 24).toFixed(0) + " days, rocket " +
							space.rocket.rocket_name + ", mission " + space.mission_name + ", " +
							space.launch_site.site_name_long + ', reddit campaign: ' + space.links.reddit_campaign;
					} else {
						return "Next rocket launch by SpaceX in " + format(DifftoSeconds) + ", rocket " +
							space.rocket.rocket_name + ", mission " + space.mission_name + ", " +
							space.launch_site.site_name_long + ', reddit campaign: ' + space.links.reddit_campaign;
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "apod",
			aliases: null,
			description: "syntax: kb apod [random] | no parameter - astronomical picture for today | " +
				"random - APOD from a random day, data gathered from NASA's API reaching year 1997 - cooldown 6s",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.split(' ').splice(2);
					const apodRandom = await randomApod();

					if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 6000);
					}
					if (msg[0] === 'random') {
						return user['username'] + ", here is your random 🌌 picture of the day | " +
							apodRandom.title + ": " + apodRandom.image;
					} else {
						const apodToday = await fetch('https://api.nasa.gov/planetary/apod' +
								api.nasa2.replace('&', '?'))
							.then(response => response.json());
						return user['username'] + ', APOD for today SeemsGood ' + apodToday.title + ' | ' +
							apodToday.hdurl + ' | by ' + apodToday.copyright
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "yt",
			aliases: null,
			description: "syntax: kb yt [query] |" +
				" query - search for a YouTube video with provided query - cooldown 7s",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.split(" ").splice(2);
					const random1 = await search(msg.join(" "), {
						totalResults: 3,
						maxResults: 2,
						type: "video",
						safeSearch: "strict",
						key: api.youtube
					});

					if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 7000);
					}
					if (msg[0].length > 0) {
						return user['username'] + ", results with searched phrase '" + msg.join(" ") +
							"' => " + random1.results[0].link
					} else if (!msg[0]) {
						return user['username'] + ", please provide a phrase to search with :)";
					}
				} catch (err) {
					errorLog(err)
					if (err.message.includes("'link' of undefined")) {
						return (user['username'] + ", no youtube link was found with provided phrase :(")
					}
					if (err.message.includes("status code 403")) {
						return user['username'] + ", " + "[error 403] seems like we ran out of daily requests" +
							" (that means the loop bug is still not fixed PepeLaugh )";
					} else {
						return user['username'] + ", " + err + " FeelsDankMan ❗";
					}
				}
			}
		},

		{
			name: prefix + "rt",
			aliases: null,
			description: "syntax: kb rt [ID] | no parameter - returns a link to the list of genres |" +
				" ID - search for the song in the specified genre (numeric ID) - cooldown 5s",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(" ").splice(2);
					const options = {
						api_key: api.randomTrack,
						genre: msg[0], //21, 1134, 1147
						snippet: false,
						language: 'en'
					};
					const songData = await new Promise((resolve, reject) => {
						rndSong(options, (err, res) => {
							if (err) {
								reject(err);
							} else {
								resolve(res);
							}
						});
					});
					const random = await search(songData.track.track_name + " by " + songData.track.artist_name, {
						maxResults: 1,
						key: api.youtube
					});
					if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 5000);
					}
					if (msg.join(" ") === "") {
						return user['username'] + ", list of genres " +
							"(type in the genre identifier like eg.: kbot rt 15) https://pastebin.com/p5XvHkzn";
					} else {
						if (channel != '#supinic') {
							console.log(random.results[0])
							return user['username'] + ', ' + songData.track.track_name + " by " +
								songData.track.artist_name + ', ' + random.results[0].link;
						} else if (channel === '#supinic') {
							return '$sr ' + random.results[0].link;
						} else {
							return user['username'] + ", something fucked up 4HEad , " +
								"list of genres: https://pastebin.com/p5XvHkzn";
						}
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan ❗";
				}
			}
		},

		{
			name: prefix + "rf",
			aliases: null,
			description: "random fact. Provides facts about random stuff - cooldown 5s",
			invocation: async (channel, user, message, args) => {
				try {
					const json = await fetch(api.randomFact)
						.then(response => response.json());

					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 5000);
					}
					return user['username'] + ", " + json.text.toLowerCase() + " 🤔";
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "channels",
			aliases: prefix + "chn",
			description: "displays all the channels the bot is currently in. | " +
				"Permitted users syntax: kb chn [join-save/part-session/join-session] [channel] - cooldown 5s",
			invocation: async (channel, user, message, args) => {
				try {
					const length = kb.getChannels().length;
					const joinedChannels = kb.getChannels().toString().split("").toString().replace(/,/g, "\u{E0000}").replace(/#/g, ", ").replace(",", " ");
					const msg = message.replace("\u{E0000}", "").split(" ").splice(2);
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 5000);
					}
					console.log(msg)
					// Non-administrator people
					if (user['user-id'] != "178087241") {
						return "I'm active in " + length + " channels => " + joinedChannels + " 4Head";
					}

					// administrator
					else {
						if (msg[0] && !msg[1]) {
							return user['username'] + ", invalid parameter or no channel provided";
						} else if (msg[0] == "join-session") {
							kb.join(msg[1]);
							return "successfully joined :) 👍";
						} else if (msg[0] == "join-save") {
							fs.appendFileSync('./db/channels.js', ' "' + msg[1] + '"');
							kb.join(msg[1]);
							return "successfully joined :) 👍";
						} else if (msg[0] == "part-session") {
							kb.part(msg[1]);
							return "parted the channel for this session";
						} else if (!msg[0] && !msg[1]) {
							return "I'm active in " + length + " channels => " + joinedChannels + " 4Head";
						} else {
							return "I'm active in " + length + " channels => " + joinedChannels + " 4Head";
						}
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "decode",
			aliases: null,
			description: "syntax: kb decode [binary] | " +
				"binary - decode given full octet binary code into unicode characters - cooldown 5s",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.split(" ").splice(2);
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 5000);
					}
					if (!msg.join("")) {
						return user['username'] + ", please provide binary code to convert :)"
					} else {
						if (msg.join(' ').split(" ").map(i => String.fromCharCode(parseInt(i, 2))).join("") === "") {
							return user['username'] +
								', an error occured monkaS check if you are using correct octets (eg.:01010001)'
						}
						if (!msg.join(' ').includes(/\d/)) {
							return user['username'] +
								', you can decode only full octet binary code';
						} else {
							return user['username'] + ", " +
								msg.join(' ').split(" ").map(i => String.fromCharCode(parseInt(i, 2))).join("");
						}
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "encode",
			aliases: null,
			description: "syntax: kb encode [character] | " +
				"character - encode any character into binary code - cooldown 5s",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.split(" ").splice(2);
					if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 5000);
					}
					const response = msg.join(" ").replace(/[\u{E0000}|\u{206d}]/gu, '').split("").map(i => i.charCodeAt(0).toString(2)).join(" ");
					if (!msg.join(" ")) {
						return user['username'] + ", please provide text to convert B)"
					} else {
						if (response.length > 500) {
							return user['username'] +
								', returned message is too long to be displayed in chat (>500 characters)';
						} else {
							return user['username'] + ', ' + response;
						}
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "chat",
			aliases: prefix + "ct",
			description: "syntax: kb chat [message] | " +
				"message - provide a message to chat with the AI bot, no parameter will return error",
			permission: 'restricted',
			invocation: async (channel, user, message, args) => {
				try {
					if (user['user-id'] != '178087241') {
						return '';
					} else {
						const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(" ").splice(2);
						const json = await fetch("https://some-random-api.ml/chatbot/beta?message=" +
								msg.join("+").normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
							.then(response => response.json());

						function capitalizeFirstLetter(string) {
							return string.charAt(0).toUpperCase() + string.slice(1);
						}

						if (!msg.join(" ")) {
							return user['username'] + ", please provide a text for me to respond to :)"
						} else {
							if (msg.includes("homeless")) {
								return user['username'] + ", just get a house 4House"
							} else if (msg.includes("forsen")) {
								return user['username'] + ", maldsen LULW"
							} else if (((json.response.charAt(0).toLowerCase() + json.response.slice(1)).replace(".", " 4Head ").replace("?", "? :) ").replace("ń", "n").replace("!", "! :o ")) === '') {
								return user['username'] + ', [err CT1] - bad response monkaS'
							} else {
								return user['username'] + ", " + (json.response.charAt(0).toLowerCase() +
									json.response.slice(1)).replace(".", " 4Head ").replace("?", "? :) ").replace("ń", "n").replace("!", "! :o ");
							}
						}
					}
				} catch (err) {
					errorLog(err)
					if (err.message) {
						console.log(err.message);
						return user['username'] + ", an error occured while fetching data monkaS";
					} else {
						return user['username'] + ", " + err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') +
							" FeelsDankMan !!!";
					}
				}
			}
		},

		{
			name: prefix + "eval",
			aliases: null,
			permission: 'restricted',
			description: "debugging command, permitted users only - no cooldown",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.split(" ").splice(2);
					const ping = await kb.ping();
					const women = {};
					const rU = eval('"' + rUni({
						min: 0,
						max: 1114109
					}).replace('u', 'u{') + '}"');
					const perms = allowEval.filter(
						i => i.ID === user['user-id']
					);
					const shell = require('child_process');

					if (!perms[0]) {
						return "";
					} else {
						if (msg.join(" ").toLowerCase() === "return typeof supinic") {
							return "hackerman"
						} else if (msg.join(" ").toLowerCase().includes("api")) {
							return user['username'] + ', api key :/'
						} else {
							function reverse(s) {
								return s.split('').reverse().join('');
							}

							function hasNumber(myString) {
								return /\d/.test(myString);
							}

							function sleep(milliseconds) {
								var start = new Date().getTime();
								for (var i = 0; i < 1e7; i++) {
									if ((new Date().getTime() - start) > milliseconds) {
										break;
									}
								}
							}

							function escapeUnicode(str) {
								return str.replace(/[^\0-~]/g, function(ch) {
									return "\\u{" + ("000" + ch.charCodeAt().toString(16)).slice(-4) + '}';
								});
							}
							const ev = await eval('(async () => {' +
								msg.join(" ").replace(/[\u{E0000}|\u{206d}]/gu, '') + '})()');
							console.log(ev)
							return String(ev);
						}
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "pattern",
			aliases: null,
			permission: 'restricted',
			description: "permitted users syntax: kb pattern [fast/slow] [pyramid/triangle] [height] [message] | " +
				"Invalid or missing parameter will return an error - no cooldown",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(2);
					const emote = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(5);
					const msgP = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(4);
					const emoteP = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(5);
					const patterns = [{
							pattern: 'pyramid'
						},
						{
							pattern: 'square'
						},
						{
							pattern: 'circle'
						},
						{
							pattern: 'triangle'
						}
					];
					const cases = [{
							case: 'slow'
						},
						{
							case: 'fast'
						}
					];
					const caseChosen = cases.filter(
						i => i.case === msg[0]
					);
					const patternChosen = patterns.filter(
						i => i.pattern === msg[1]
					);
					const perms = allowFastramid.filter(
						i => i.ID === user['user-id']
					);

					function hasNumber(myString) {
						return /\d/.test(myString);
					}

					function sleep(milliseconds) {
						var start = new Date().getTime();
						for (var i = 0; i < 1e7; i++) {
							if ((new Date().getTime() - start) > milliseconds) {
								break;
							}
						}
					}
					if (!perms[0]) {
						return "";
					} else {
						if (!msg[0]) {
							return user['username'] + ', no parameters provided (fast, slow) [err#1]';
						} else if (!caseChosen[0] || msg[0] != caseChosen[0].case) {
							return user['username'] + ', invalid first parameter (fast, slow) [err#2]';
						} else if (!patternChosen[0] || msg[1] != patternChosen[0].pattern) {
							return user['username'] + ', invalid second parameter (' +
								patterns.map(i => i.pattern).join(', ') + ') [err#3]';
						} else if (!msg[2] || !hasNumber(msg[2])) {
							return user['username'] + ', invalid third parameter (number) [err#4]';
						} else if (!emote[0] || !emote.join(' ').match(/[a-z]/i)) {
							return user['username'] + ', invalid fourth parameter (word) [err#5]';
						} else if (user['user-id'] === '40379362' && msg[2] > 50) { //sinris user id
							return user['username'] + ", i can't allow pyramids higher than 50 FeelsBadMan";
						} else {
							if (caseChosen[0].case === 'fast' && patternChosen[0].pattern === 'pyramid') {
								function createPyramid(height) {
									for (var i = 1; i <= height; i++) {
										var row = '';

										for (var j = 1; j <= i; j++)
											row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
										kb.say(channel, row);
									}
									for (var i = height - 1; i > 0; i--) {
										var row = '';

										for (var j = i; j > 0; j--)
											row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
										kb.say(channel, row);
									}
								}
								createPyramid(msgP[0]);
								return "";
							} else if (caseChosen[0].case === 'slow' && patternChosen[0].pattern === 'pyramid') {
								function createPyramid(height) {
									for (var i = 1; i <= height; i++) {
										var row = '';

										for (var j = 1; j <= i; j++)
											row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
										kb.say(channel, row);
										sleep(1500);
									}
									for (var i = height - 1; i > 0; i--) {
										var row = '';

										for (var j = i; j > 0; j--)
											row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
										kb.say(channel, row);
										sleep(1500);
									}
								}
								createPyramid(msgP[0]);
								return "";
							} else if (caseChosen[0].case === 'fast' && patternChosen[0].pattern === 'triangle') {
								const randomE = emoteP[Math.floor(Math.random() * emoteP.length)];

								function createTriangle(height) {
									for (var i = 1; i <= height; i++) {
										kb.say(channel, (' ' + randomE + ' ').repeat(i))
									}
								}
								createTriangle(msgP[0]);
								return '';
							} else if (caseChosen[0].case === 'slow' && patternChosen[0].pattern === 'triangle') {
								const randomE = emoteP[Math.floor(Math.random() * emoteP.length)];

								function createTriangle(height) {
									for (var i = 1; i <= height; i++) {
										kb.say(channel, (' ' + randomE + ' ').repeat(i))
										sleep(1300);
									}
								}
								createTriangle(msgP[0]);
								return '';
							} else if (patternChosen[0].pattern != 'pyramid' && patternChosen[0].pattern != 'triangle') {
								return user['username'] + ', currently supporting only pyramid/triangle.'
							}
						}
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "reverse",
			aliases: null,
			description: "syntax: kb reverse [message] | message - reverse given word or sentence - cooldown 5s",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(" ").splice(2);

					function reverse(s) {
						let a = [...s];
						a.reverse();
						return a.join('');
					}
					if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 5000);
					}
					if (!msg[0]) {
						return user['username'] + ', please provide phrase to reverse :D';
					} else {
						return user['username'] + ", " + reverse(msg.join(" "));
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "locate",
			aliases: prefix + "location",
			description: "syntax: kb locate [IP/message] | IP - provide an IP adress to search for its location | " +
				"message - provide a non-numeric message to search for its location - cooldown 6s",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(" ").splice(2);
					console.log(msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, ""))

					function hasNumber(myString) {
						return /\d/.test(myString);
					}
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 6000);
					}
					const locate = await fetch("http://api.ipstack.com/" +
							msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '?access_key=' + api.locate)
						.then(response => response.json());

					if (locate.type != null && hasNumber(msg[0])) {
						return user['username'] + ", location for " + msg + " => type: " + locate.type + ", country: " +
							locate.country_name + ", region: " + locate.region_name + ", city: " +
							locate.city + " monkaS";
					} else {
						if (!msg[0]) {
							return user['username'] + ", please provide an IP or location to search :)";
						} else if (!hasNumber(msg[0]) && msg[0].match(/^\w+$/)) {
							const location = await fetch(api.geonames + msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "") +
									'&maxRows=1&username=kunszg')
								.then(response => response.json());
							return user['username'] + ', results: ' + location.totalResultsCount + " | location: " +
								location.geonames[0].countryName.replace("ń", "n") + ", " +
								location.geonames[0].adminName1.replace("ń", "n") + ", " +
								location.geonames[0].name.replace("ń", "n") + " | population: " +
								location.geonames[0].population + ", info: " +
								location.geonames[0].fcodeName;
						} else if (!msg[0].match(/^\w+$/) && !msg[0].includes('.')) {
							return user['username'] +
								', special character detected HONEYDETECTED'
						} else {
							return user['username'] +
								", could not find given location or location does not exist KKona";
						}
					}
				} catch (err) {
					errorLog(err)
					if (err.message.includes("read property")) {
						return user['username'] + ", location not found.";
					} else {
						return user['username'] + ", " + err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') +
							" FeelsDankMan !!!";
					}
				}
			}
		},

		{
			name: prefix + "neo",
			aliases: prefix + "asteroid",
			description: "shows information about a random Near Earth Object, " +
				"that is close to Earth in current day. Data refreshes every 24h - cooldown 5s",
			invocation: async (channel, user, message, args) => {
				try {
					const today = new Date().toLocaleDateString().split('/');
					const today2 = today[2] + '-' + today[0] + '-' + today[1];
					const neo = await fetch(api.nasa1 + today2 + api.nasa2)
						.then(response => response.json());

					const near_earth = Object.entries(neo.near_earth_objects).sort(([a], [b]) =>
						new Date(a) - new Date(b))[0][1];
					const random_near_earth = near_earth[Math.floor(Math.random() * near_earth.length)];
					const miss = random_near_earth.close_approach_data[0].miss_distance.kilometers;

					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 5000);
					}
					return user['username'] + ", near earth objects: " + neo.element_count + " | name: " +
						random_near_earth.name + " | diameter: " +
						random_near_earth.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3) +
						"km | miss distance: " + Math.trunc(miss + " ") + "km | is hazardous?: " +
						random_near_earth.is_potentially_hazardous_asteroid + " | orbiting body: " +
						random_near_earth.close_approach_data[0].orbiting_body;
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "twitter",
			aliases: null,
			description: "syntax: kb twitter [account] | no parameter - returns an error | " +
				"account - returns latest tweet from specified user - cooldown 8s",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.split(" ").splice(2);
					const fetchUrl = require("fetch").fetchUrl;
					const tweet = await new Promise((resolve, reject) => {
						fetchUrl(api.twitter + msg[0], function(error, meta, body) {
							if (error) {
								reject(error)
							} else {
								resolve(body.toString())
							}
						})
					});
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 8000);
					}
					if (!msg[0]) {
						return user['username'] + ', no account	name provided, see "kb help twitter" for explanation';
					} else {
						return user['username'] + ", " + tweet.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') +
						" FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "hosts",
			aliases: null,
			description: 'kb hosts [input] - get users that are hosting a specified channel (in input), no input will return an error.',
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.split(" ").splice(2);
					const hosts = await fetch(api.hosts + msg[0])
						.then(response => response.json());
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 8000);
					}
					const hostlist = hosts.sort().map(function(e) {
						return e.replace(/^(.{2})/, "$1\u{E0000}").split("").reverse().join("").replace(/^(.{2})/, "$1\u{E0000}").split("").reverse().join("")
					}); //character \u{06E4}
					if (!msg[0]) {
						return user['username'] + ", no channel provided.";
					} else {
						if (hosts.length < 25 && hosts.length != 0) {
							return user['username'] + ", users hosting " +
								msg[0].replace(/^(.{2})/, "$1\u{E0000}").split("").reverse().join("").replace(/^(.{2})/, "$1\u{E0000}").split("").reverse().join("") +
								" PagChomp 👉  " + hostlist.join(", ");
						} else if (hosts.length > 25) {
							return user['username'] + ", channel " +
								msg[0].replace(/^(.{2})/, "$1\u{E0000}").split("").reverse().join("").replace(/^(.{2})/, "$1\u{E0000}").split("").reverse().join("") +
								" is being hosted by " + hosts.length + " users";
						} else if (hosts.length === 0) {
							return user['username'] + ", channel is not being hosted by any user :("
						} else {
							return user['username'] + ", something fucked up eShrug";
						}
					}
				} catch (err) {
					errorLog(err)
					const msg = message.split(" ").splice(2);
					const fetchUrl = require("fetch").fetchUrl;
					const foo = await new Promise((resolve, reject) => {
						fetchUrl(api.hosts + msg[0], function(error, meta, body) {
							if (error) {
								reject(error)
							} else {
								resolve(body.toString())
							}
						})
					});
					return user['username'] + ", " + foo
				}
			}
		},

		{
			name: prefix + "bttv",
			aliases: null,
			invocation: async (channel, user, message, args) => {
				try {
					const fetchUrl = require("fetch").fetchUrl;
					const bttv = await new Promise((resolve, reject) => {
						fetchUrl(api.bttv + channel.substring(1), function(error, meta, body) {
							if (error) {
								reject(error)
							} else {
								resolve(body.toString())
							}
						})
					});
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 30000);
					}
					if (channel === '#nymn') {
						return user['username'] + ', I cannot display BTTV emotes in this channel :('
					} else {
						return user['username'] + ", " + bttv;
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "rp",
			aliases: prefix + "randomplaysound",
			permission: 'restricted',
			invocation: async (channel, user, message, args) => {
				try {
					const playsound = await fetch("https://supinic.com/api/bot/playsound/list")
						.then(response => response.json());
					const randomPs = playsound.data.playsounds[Math.floor(Math.random() *
						playsound.data.playsounds.length)]
					if (channel === "#supinic") {
						if (talkedRecently.has(user['user-id'])) {
							return '';
						} else {
							talkedRecently.add(user['user-id']);
							setTimeout(() => {
								talkedRecently.delete(user['user-id']);
							}, 5000);
						}
						return '$ps ' + randomPs.name;
					} else {
						return "";
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + '4Head',
			aliases: prefix + '4head',
			invocation: async (channel, user, message, args) => {
				try {
					const arr = [
						'general',
						'general',
						'general',
						'general',
						'general',
						'programming',
						'programming'
					];

					function lCase(string) {
						return string.charAt(0).toLowerCase() + string.slice(1);
					}

					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 4000);
					}

					const randomPs = arr[Math.floor(Math.random() * arr.length)];

					if (randomPs === 'programming') {
						const joke = await fetch(api.joke1)
							.then(response => response.json());

						setTimeout(() => {
							kb.say(channel, lCase(joke[0].punchline.replace(/\./g, '')) + ' 4HEad')
						}, 3000);
						return user['username'] + ', ' + lCase(joke[0].setup);
					} else if (randomPs === 'general') {
						const jokeGeneral = await fetch(api.joke2)
							.then(response => response.json());

						setTimeout(() => {
							kb.say(channel, lCase(jokeGeneral.punchline.replace(/\./g, '')) + ' 4HEad')
						}, 3000);
						return user['username'] + ', ' + lCase(jokeGeneral.setup);
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + "fl",
			aliases: prefix + "firstline",
			description: 'kb fl [input] - first line from database in current channel for given user, no input will return a first line of the executing user.',
			invocation: async (channel, user, message, args) => {
				try {
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 2000);
					}

					function format(seconds) {
						function pad(s) {
							return (s < 10 ? '0' : '') + s;
						}
						var hours = Math.floor(seconds / (60 * 60));
						var minutes = Math.floor(seconds % (60 * 60) / 60);
						var seconds = Math.floor(seconds % 60);
						if (hours === 0 && minutes != 0) {
							return minutes + 'm ' + seconds + "s";
						} else {
							if ((minutes === 0 && hours === 0) && seconds != 0) {
								return seconds + "s"
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);
					if (!msg[0]) {
						const firstline = await doQuery('SELECT * FROM logs_' + channel.replace('#', '') + ' WHERE username="' + user['username'] + '" ORDER BY DATE ASC');
						if (!firstline[0]) {
							return user['username'] + ", I don't have any logs from that user";
						} else {
							const banphrasePass = (await fetch(
								'https://nymn.pajbot.com/api/v1/banphrases/test', {
								method: "POST",
								url: "https://nymn.pajbot.com/api/v1/banphrases/test",
								body: "message=" + firstline[0].message,
								headers: {
									"Content-Type": "application/x-www-form-urlencoded"
								},
							}).then(response => response.json()))

							const reply =' ago) ' +  firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}") + 
								': ' + firstline[0].message;

							const serverDate = new Date().getTime();
							const timeDifference = (Math.abs(
								serverDate - (new Date(firstline[0].date).getTime()))
								)/1000/3600;
							const timeDifferenceRaw = (Math.abs(
								serverDate - (new Date(firstline[0].date).getTime()))
								);
							if (banphrasePass.banned === true) {
								if (channel==="#nymn") {
									if (timeDifference>48) {
										kb.whisper(user['username'], ', Your first line in this channel was: (' + 
											(timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...');
									} else {
										kb.whisper(user['username'], ', Your first line in this channel was: (' + 
											format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...');
									}
									return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
								} else {
									if (timeDifference>48) {
										if (firstline[0].message.length>430) {
											return user['username'] + ', Your first line in this channel was: (' + 
											(timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...';
										} else {
											return user['username'] + ', Your first line in this channel was: (' + 
											(timeDifference/24).toFixed(0) + 'd' + reply;
										}
									} else {
										if (firstline[0].message.length>430) {
											return user['username'] + ', Your first line in this channel was: (' + 
											format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...';
										} else {
											return user['username'] + ', Your first line in this channel was: (' + 
											format(timeDifferenceRaw/1000) + reply;
										}
									}
								}
							} else {
								if (timeDifference>48) {
									if (firstline[0].message.length>430) {
										return user['username'] + ', Your first line in this channel was: (' + 
										(timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...';
									} else {
										return user['username'] + ', Your first line in this channel was: (' + 
										(timeDifference/24).toFixed(0) + 'd' + reply;
									}
								} else {
									if (firstline[0].message.length>430) {
										return  user['username'] + ', Your first line in this channel was: (' + 
										format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...';
									} else {
										return user['username'] + ', Your first line in this channel was: (' + 
										format(timeDifferenceRaw/1000) + reply;
									}
								}
							}
						}
					} else {
						const sql = 'SELECT * FROM logs_' + channel.replace('#', '') + ' WHERE username=? ORDER BY DATE ASC';
						const inserts = [msg[0]];
						const firstline = await doQuery(mysql.format(sql, inserts));
						if (!firstline[0]) {
							return user['username'] + ", I don't have any logs from that user";
						} else {
							const banphrasePass = (await fetch(
								'https://nymn.pajbot.com/api/v1/banphrases/test', {
								method: "POST",
								url: "https://nymn.pajbot.com/api/v1/banphrases/test",
								body: "message=" + firstline[0].message,
								headers: {
									"Content-Type": "application/x-www-form-urlencoded"
								},
							}).then(response => response.json()))

							const reply =' ago) ' +  firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}") + 
								': ' + firstline[0].message;

							const serverDate = new Date().getTime();
							const timeDifference = (Math.abs(
								serverDate - (new Date(firstline[0].date).getTime()))
								)/1000/3600;
							const timeDifferenceRaw = (Math.abs(
								serverDate - (new Date(firstline[0].date).getTime()))
								);
							if (banphrasePass.banned === true) {
								if (channel==="#nymn") {
									if (timeDifference>48) {
										kb.whisper(user['username'], ', first line of that user in this channel: (' + 
											(timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...');
									} else {
										kb.whisper(user['username'], ', first line of that user in this channel: (' + 
											format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...');
									}
									return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
								} else {
									if (timeDifference>48) {
										if (firstline[0].message.length>430) {
											return user['username'] + ', first line of that user in this channel: (' + 
											(timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...';
										} else {
											return user['username'] + ', first line of that user in this channel: (' + 
											(timeDifference/24).toFixed(0) + 'd' + reply;
										}
									} else {
										if (firstline[0].message.length>430) {
											return user['username'] + ', first line of that user in this channel: (' + 
											format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...';
										} else {
											return user['username'] + ', first line of that user in this channel: (' + 
											format(timeDifferenceRaw/1000) + reply;
										}
									}
								}
							} else {
								if (timeDifference>48) {
									if (firstline[0].message.length>430) {
										return user['username'] + ', first line of that user in this channel: (' + 
										(timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...';
									} else {
										return user['username'] + ', first line of that user in this channel: (' + 
										(timeDifference/24).toFixed(0) + 'd' + reply;
									}
								} else {
									if (firstline[0].message.length>430) {
										return user['username'] + ', first line of that user in this channel: (' + 
										format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...';
									} else {
										return user['username'] + ', first line of that user in this channel: (' + 
										format(timeDifferenceRaw/1000) + reply;
									}
								}
							}
						}
					}

				} catch (err) {
					errorLog(err)
					return user['username'] + ' ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + "rl",
			aliases: prefix + "randomline",
			description: 'kb rl [input] - random line from current chat, use input to get random line from a specified user, no input will return a random quote.',
			invocation: async (channel, user, message, args) => {
				try {
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 2000);
					}

					function format(seconds) {
						function pad(s) {
							return (s < 10 ? '0' : '') + s;
						}
						var hours = Math.floor(seconds / (60 * 60));
						var minutes = Math.floor(seconds % (60 * 60) / 60);
						var seconds = Math.floor(seconds % 60);
						if (hours === 0 && minutes != 0) {
							return minutes + 'm ' + seconds + "s";
						} else {
							if ((minutes === 0 && hours === 0) && seconds != 0) {
								return seconds + "s"
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}			

					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);
					const serverDate = new Date().getTime();

					if (!msg[0]) {
						const maxID = await doQuery(
							'SELECT MAX(ID) AS number FROM logs_' + channel.replace('#', '')
							);

						// get random ID from the range of ID's in database
						const randNum = Math.floor(
							Math.random() * (maxID[0].number - 1)
							) + 1;

						const randomLine = await doQuery(
							'SELECT ID, username, message, date FROM logs_' + channel.replace('#', '') + 
							' WHERE ID="' + randNum + '"'
							);

						if (!randomLine[0]) {
							return user['username'] + ", I don't have any logs from this channel :z";
						} else {
							const banphrasePass = (await fetch(
								'https://nymn.pajbot.com/api/v1/banphrases/test', {
								method: "POST",
								url: "https://nymn.pajbot.com/api/v1/banphrases/test",
								body: "message=" + randomLine[0].message,
								headers: {
									"Content-Type": "application/x-www-form-urlencoded"
								},
							}).then(response => response.json()))

							const reply =' ago) ' +  randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}") + 
								': ' + randomLine[0].message;

							const timeDifference = (Math.abs(
								serverDate - (new Date(randomLine[0].date).getTime()))
								)/1000/3600;
							const timeDifferenceRaw = (Math.abs(
								serverDate - (new Date(randomLine[0].date).getTime()))
								);

							if (banphrasePass.banned === true) {
								if (channel==="#nymn") {
									if (timeDifference>48) {
										kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...');
									} else {
										kb.whisper(user['username'], '(' + format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...');
									}
									return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
								} else {
									if (timeDifference>48) {
										if (randomLine[0].message.length>430) {
											return '(' + (timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...';
										} else {
											return '(' + (timeDifference/24).toFixed(0) + 'd' + reply;
										}
									} else {
										if (randomLine[0].message.length>430) {
											return '(' + format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...';
										} else {
											return '(' + format(timeDifferenceRaw/1000) + reply;
										}
									}
								}
							} else {
								if (timeDifference>48) {
									if (randomLine[0].message.length>430) {
										return '(' + (timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...';
									} else {
										return '(' + (timeDifference/24).toFixed(0) + 'd' + reply;
									}
								} else {
									if (randomLine[0].message.length>430) {
										return '(' + format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...';
									} else {
										return '(' + format(timeDifferenceRaw/1000) + reply;
									}
								}
							}
						}
					} else if (typeof msg[0] !== 'undefined' && msg[0] != '') {

						const randomLine = await doQuery(
							'SELECT username, message, date FROM logs_' + channel.replace('#', '') + 
							' WHERE username="' + msg[0] + '" ORDER BY RAND() LIMIT 1'
							);

						if (!randomLine[0]) {
							return user['username'] + ', there are no logs in my database related to that user xD';
						} else {
							const banphrasePass = (await fetch(
								'https://nymn.pajbot.com/api/v1/banphrases/test', {
								method: "POST",
								url: "https://nymn.pajbot.com/api/v1/banphrases/test",
								body: "message=" + randomLine[0].message,
								headers: {
									"Content-Type": "application/x-www-form-urlencoded"
								},
							}).then(response => response.json()))

							const timeDifference = (Math.abs(
								serverDate - (new Date(randomLine[0].date).getTime()))
								)/1000/3600;
							const timeDifferenceRaw = (Math.abs(
								serverDate - (new Date(randomLine[0].date).getTime()))
								);

							const reply =' ago) ' + randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}") + 
								': ' + randomLine[0].message;
							if (banphrasePass.banned === true) {
								if (channel==="#nymn") {
									if (timeDifference>48) {
										kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...');
									} else {
										kb.whisper(user['username'], '(' + format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...');
									}
									return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
								} else {
									if (timeDifference>48) {
										if (randomLine[0].message.length>430) {
											return '(' + (timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...';
										} else {
											return '(' + (timeDifference/24).toFixed(0) + 'd' + reply;
										}
									} else {
										if (randomLine[0].message.length>430) {
											return '(' + format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...';
										} else {
											return '(' + format(timeDifferenceRaw/1000) + reply;
										}
									}
								}
							} else {
								if (timeDifference>48) {
									if (randomLine[0].message.length>430) {
										return '(' + (timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...';
									} else {
										return '(' + (timeDifference/24).toFixed(0) + 'd' + reply;
									}
								} else {
									if (randomLine[0].message.length>430) {
										return '(' + format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...';
									} else {
										return '(' + format(timeDifferenceRaw/1000) + reply;
									}
								}
							}
						}
					} 
				} catch (err) {
					errorLog(err)
					return user['username'] + ' ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + 'rq',
			aliases: prefix + 'randomquote',
			description: "Your random quote from the current chat",
			invocation: async (channel, user, message, args) => {
				try {
					const serverDate = new Date().getTime();
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 2000);
					}

					function format(seconds) {
						function pad(s) {
							return (s < 10 ? '0' : '') + s;
						}
						var hours = Math.floor(seconds / (60 * 60));
						var minutes = Math.floor(seconds % (60 * 60) / 60);
						var seconds = Math.floor(seconds % 60);
						if (hours === 0 && minutes != 0) {
							return minutes + 'm ' + seconds + "s";
						} else {
							if ((minutes === 0 && hours === 0) && seconds != 0) {
								return seconds + "s"
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}

					const randomLine = await doQuery(
						'SELECT ID, username, message, date FROM logs_' + channel.replace('#', '') + ' WHERE username="' +
						user['username'] + '" ORDER BY RAND() LIMIT 1'
						);

					if (!randomLine[0]) {
						return user['username'] + ", I don't have any logs from this channel :z";
					} else {
						const banphrasePass = (await fetch(
							'https://nymn.pajbot.com/api/v1/banphrases/test', {
							method: "POST",
							url: "https://nymn.pajbot.com/api/v1/banphrases/test",
							body: "message=" + randomLine[0].message,
							headers: {
								"Content-Type": "application/x-www-form-urlencoded"
							},
						}).then(response => response.json()))

						const reply =' ago) ' +  randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}") + 
							': ' + randomLine[0].message;

						const timeDifference = (Math.abs(
							serverDate - (new Date(randomLine[0].date).getTime()))
							)/1000/3600;
						const timeDifferenceRaw = (Math.abs(
							serverDate - (new Date(randomLine[0].date).getTime()))
							);

						if (banphrasePass.banned === true) {
							if (channel==="#nymn") {
								if (timeDifference>48) {
									kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...');
								} else {
									kb.whisper(user['username'], '(' + format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...');
								}
								return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
							} else {
								if (timeDifference>48) {
									if (randomLine[0].message.length>430) {
										return '(' + (timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...';
									} else {
										return '(' + (timeDifference/24).toFixed(0) + 'd' + reply;
									}
								} else {
									if (randomLine[0].message.length>430) {
										return '(' + format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...';
									} else {
										return '(' + format(timeDifferenceRaw/1000) + reply;
									}
								}
							}
						} else {
							if (timeDifference>48) {
								if (randomLine[0].message.length>430) {
									return '(' + (timeDifference/24).toFixed(0) + 'd' + reply.substring(0, 430) + '...';
								} else {
									return '(' + (timeDifference/24).toFixed(0) + 'd' + reply;
								}
							} else {
								if (randomLine[0].message.length>430) {
									return '(' + format(timeDifferenceRaw/1000) + reply.substring(0, 430) + '...';
								} else {
									return '(' + format(timeDifferenceRaw/1000) + reply;
								}
							}
						}
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + 'bots',
			aliases: prefix + 'bot',
			description: 'list of known bots and when they were last seen, registered in Supibot database. This list supports only bots active in ' + 
			"Supinic's".replace(/^(.{2})/, "$1\u{E0000}") + ' channel.',
			invocation: async (channel, user, message, args) => {
				try {
					const dateMinute = new Date().getMinutes()
					const time = await fetch("https://supinic.com/api/bot/active")
						.then(response => response.json());

					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 3000);
					}
					if (time.data.filter(i => i.lastSeenTimestamp != null)) {
						function format(seconds) {
							function pad(s) {
								return (s < 10 ? '0' : '') + s;
							}
							var hours = Math.floor(seconds/(60 * 60));
							var minutes = Math.floor(seconds % (60 * 60) / 60);
							var seconds = Math.floor(seconds % 60);
							if (hours === 0 && minutes != 0) {
								return minutes + 'm ago';
							} else {
								if (minutes === 0 && hours === 0) {
									return seconds + "s ago";
								} else if (seconds === 0 || hours === 0 && minutes === 0) {
									return 'just now';
								} else if (hours<168) {
									return hours + 'h ago';
								} else if (count.evaluate('720<' + hours + '<1440')) {
									return (hours/720).toFixed(2) + 'month ago';
								} else if (count.evaluate('720<' + hours + '>1440')) {
									return (hours/720).toFixed(2) + 'months ago';
								} else {
									return (hours/24).toFixed(0) + 'd ago';
								}
							}
						}
						const bots = time.data.filter(i => i.lastSeenTimestamp != null).map(
							i => ' ' + i.name + ' ' + format(
								((Math.abs(new Date() - new Date(i.lastSeenTimestamp))) / 1000))
						);
						return user['username'] + ', active known bots MrDestructoid 👉' + bots;
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + 'PepeLaugh',
			aliases: prefix + 'pepelaugh',
			description: 'information about how many NPM modules my bot has installed in node_modules directory.',
			invocation: async (channel, user, message, args) => {
				try {
					const {
						readdirSync
					} = require('fs')
					const getDirectories = source =>
						readdirSync('./node_modules', {
							withFileTypes: true
						})
						.filter(dirent => dirent.isDirectory())
						.map(dirent => dirent.name)
					return user['username'] + ', my node_modules directory has ' +
						getDirectories().length + ' modules PepeLaugh';
				} catch (err) {
					errorLog(err)
					return user['username'] + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + "dank",
			aliases: null,
			description: 'kb dank [input] - dank a random person (use input) or yourself (without input) FeelsDankMan',
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.split(" ").splice(2);

					if (talkedRecently2.has(user['user-id'])) { //if set has user id - ignore
						return '';
					} else {
						talkedRecently2.add(user['user-id']);
						setTimeout(() => {
							talkedRecently2.delete(user['user-id']);
						}, 2000);
					}

					if (!msg.join(' ').replace(/[\u{E0000}|\u{206d}]/gu, '')) {
						return user['username'] + ", FeelsDankMan oh zoinks, you just got flippin' danked " +
							"by yourself FeelsDankMan FeelsDankMan FeelsDankMan";
					} else {
						return user['username'] + ", you just danked " + msg.join(' ') + " FeelsDankMan 👍";
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + "help",
			aliases: null,
			description: "syntax: kb help [command] | no parameter - shows basic information about bot, " +
				"it's owner and host | command - shows description of a specified command - cooldown 5s",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.toLowerCase().split(' ').splice(2);
					if (talkedRecently2.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently2.add(user['user-id']);
						setTimeout(() => {
							talkedRecently2.delete(user['user-id']);
						}, 5000);
					}

					// if there is no parameter given, return basic command message
					if (!msg[0]) {
						return user['username'] + ", kunszgbot is owned by KUNszg, sponsored by " +
							"Sinris".replace(/^(.{2})/, "$1\u{E0000}") + ' and ' +
							'Leppunen'.replace(/^(.{2})/, "$1\u{E0000}") + " , Node JS " + process.version +
							", running on Ubuntu 19.10 GNU/" + process.platform + ' ' + process.arch +
							", for commands list use 'kb commands'.";

					} else if (commands.filter(i => i.name.substring(3).toLowerCase() === msg[0])) {
						// filter for command names matching the given parameter
						if (commands.filter(i => i.name.substring(3).toLowerCase() === msg[0]) &&
							commands.filter(i => i.name.substring(3).toLowerCase() === msg[0]).length != 0) {
							// if there is a specified command and the description exists - respond
							return user['username'] + ', ' + commands.filter((i =>
								i.name.substring(3).toLowerCase() === msg[0])).map(i => i.description)[0];
						} else if (commands.filter(i => i.name.substring(3).toLowerCase() === msg[0]) &&
							commands.filter(i => i.name.substring(3).toLowerCase() === msg[0]).length === 0) {
							// if specified command does not exist, throw an error
							throw 'command does not exist.';
						} else if (!(commands.filter((i => i.name.substring(3).toLowerCase() === msg[0])).map(i =>
								i.description))) {
							// if specified command exists but there is no description for it, throw an error
							throw 'description for that command does not exist.'
						}
					} else {
						// if something else that is not handled happens, throw an error
						throw 'internal error monkaS';
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ', ' + err + ' ';
				}
			}
		},

		{
			name: prefix + "joemama",
			aliases: prefix + "mama",
			description: 'random "your mom" joke.',
			invocation: async (channel, user, message, args) => {
				try {
					if (talkedRecently2.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently2.add(user['user-id']);
						setTimeout(() => {
							talkedRecently2.delete(user['user-id']);
						}, 5000);
					}
					const fetchUrl = require("fetch").fetchUrl;
					const joemama = await new Promise((resolve, reject) => {
						fetchUrl(api.joemama, function(error, meta, body) {
							if (error) {
								console.log(error);
								reject(error)
							} else {
								resolve(body.toString())
							}
						})
					});
					const laughingEmotes = [
						' 😬',
						' 4Head',
						' 4HEad',
						' ArgieB8',
						' FreakinStinkin',
						' AlienPls',
						' 🔥',
						' FireSpeed',
						' ConcernDoge',
						' haHAA',
						' CruW',
						' :O',
						' >(',
						' OMEGALUL',
						' LULW',
						' CurseLit',
						' 😂'
					]
					const emotesJoke = laughingEmotes[Math.floor(Math.random() * laughingEmotes.length)]

					function lCase(string) {
						return string.charAt(0).toLowerCase() + string.slice(1);
					}
					return user['username'] + ', ' + lCase(joemama.split('"')[3]) + emotesJoke;
				} catch (err) {
					errorLog(err)
					return user['username'] + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + "restart",
			aliases: null,
			permission: 'restricted',
			invocation: async (channel, user, message, args) => {
				try {
					const perms = allowEval.filter(
						i => i.ID === user['user-id']
					);
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);

					if (!perms[0]) {
						return "";
					} else {
						if (!msg[0]) {
							const shell = require('child_process');
							//pull from github
							kb.say(channel, 'pulling from @master PogChamp 👉 ' +
								await shell.execSync('sudo git pull').toString().replace(/-{2,}/g, "").replace(/\+{2,}/g, ""))

							setTimeout(() => {
								if (channel === '#nymn') {
									kb.say('nymn', 'restarting pajaWalk1 pajaWalk2 pajaWalk3 🚪')
								} else {
									kb.say(channel, 'restarting KKona ')
								}
							}, 4000);
							setTimeout(() => {
								process.kill(process.pid)
							}, 6000);
							return '';
						} else if (msg[0] === 'logger') {
							const shell = require('child_process');
							kb.say(channel, 'pulling from @master PogChamp 👉 ' +
								await shell.execSync('sudo git pull').toString().replace(/-{2,}/g, "").replace(/\+{2,}/g, ""))

							setTimeout(() => {
								if (channel === '#nymn') {
									kb.say('nymn', 'restarting logger pajaWalk1 pajaWalk2 pajaWalk3 🚪')
								} else {
									kb.say(channel, 'restarting logger KKona ')
								}
							}, 4000);
							setTimeout(() => {
								shell.execSync('pm2 restart logger')
							}, 4000);
							return '';
						} else {
							return 'imagine forgetting your own syntax OMEGALUL'
						}
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ' ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + 'github',
			aliases: prefix + 'git',
			description: 'link to my github repo and last commit timer.',
			invocation: async (channel, user, message, args) => {
				try {
					const commits = await fetch('https://api.github.com/repos/KUNszg/kbot/commits')
						.then(response => response.json());
					const commitDate = new Date(commits[0].commit.committer.date);
					const serverDate = new Date();
					const diff = Math.abs(commitDate - serverDate)
					const DifftoSeconds = (diff / 1000).toFixed(2);
					if (talkedRecently2.has(user['user-id'])) { //if set has user id - ignore
						return '';
					} else {
						talkedRecently2.add(user['user-id']);
						setTimeout(() => {
							talkedRecently2.delete(user['user-id']);
						}, 5000);
					}

					function format(seconds) {
						function pad(s) {
							return (s < 10 ? '0' : '') + s;
						}
						var hours = Math.floor(seconds / (60 * 60));
						var minutes = Math.floor(seconds % (60 * 60) / 60);
						var seconds = Math.floor(seconds % 60);
						if (hours === 0 && minutes != 0) {
							return minutes + 'm ' + seconds + "s";
						} else {
							if (minutes === 0 && hours === 0) {
								return seconds + "s"
							} else if (seconds === 0 || hours === 0 && minutes === 0) {
								return 'just now!'
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}
					return user['username'] + ', my public repo Okayga 👉' +
						' https://github.com/KUNszg/kbot last commit: ' + format(DifftoSeconds) + ' ago';
				} catch (err) {
					errorLog(err)
					return user['username'] + ', ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + 'suggest',
			aliases: null,
			description: 'kb suggest [input] - suggest something for me to improve/change in my bot.',
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2)
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 8000);
					}
					if (!msg[0]) {
						return user['username'] + ', no message provided FeelsDankMan';
					} else {
						const checkRepeatedSql = 'SELECT message FROM suggestions WHERE message=?';							
						const checkRepeatedInsert = [msg.join(' ')];
						const query = await doQuery(mysql.format(checkRepeatedSql, checkRepeatedInsert));

						if (!query[0]) {
							const sql = 'INSERT INTO suggestions (username, message, created) VALUES (?, ?, CURRENT_TIMESTAMP)';
							const insert = [user['username'], msg.join(' ')];
							await doQuery(mysql.format(sql, insert));

							const selectSql = 'SELECT ID FROM suggestions WHERE message=?';							
							const selectInsert = [msg.join(' ')];
							const suggestionID = await doQuery(mysql.format(selectSql, selectInsert));

							return user['username'] + ', suggestion saved with ID ' + suggestionID[0].ID + ' PogChamp';
						} else {
							return user['username'] + ", duplicate suggestion.";
						}
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ', ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + 'check',
			aliases: null,
			permission: 'restricted',
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.split(' ')[2];
					const perms = allowEval.filter(
						i => i.ID === user['user-id']
					);
					if (!perms[0]) {
						return "";
					} else {
						const query = await new Promise((reject, resolve) => {
							con.query('SELECT ID, message, username, status FROM suggestions WHERE ID="' + msg + '"',
								function(error, results, fields) {
									if (error) {
										reject(user['username'] + ', error xD 👉 ' + error);
									} else {
										if (!results[0].ID) {
											resolve(user['username'] + ', such ID does not exist FeelsDankMan');
										} else if (results[0].ID === msg) {
											resolve('from' + results[0].username + ': ' + results[0].message +
												' | status: ' + results[0].status);
										} else {
											resolve('from ' + results[0].username + ': ' + results[0].message +
												' | status: ' + results[0].status);
										}
									}
								})
						})
						return query;
					}
				} catch (returnValue) {
					return returnValue;
				}
			}
		},

		{
			name: prefix + 'supee',
			aliases: prefix + 'sp',
			permission: 'restricted',
			invocation: async (channel, user, message, args) => {
				try {
					if (talkedRecently.has('supee')) {
						return '';
					} else {
						talkedRecently.add('supee');
						setTimeout(() => {
							talkedRecently.delete('supee');
						}, 30000);
					}
					if (channel != '#supinic') {
						kb.say(channel, '');
					} else {
						const trichomp = new Promise((resolve, reject) => {
							const sql = 'INSERT INTO supee_count (username, timestamp) VALUES (?, ?)';
							const insert = [user['username'], new Date()]
							con.query(mysql.format(sql, insert),
								function(error, results, fields) {
									if (error) {
										kb.say(channel, user['username'] + 
											", I don't have any logs from this channel :/");
									} else {
										resolve(results)
									}
								})
						})
						trichomp.then(function(value) {
							con.query('SELECT COUNT(username) AS value FROM supee_count',
								function(error, results, fields) {
									if (error) {
										kb.say(channel, user['username'] + ', ' + error + ' 4Head');
									} else {
										kb.say(channel, user['username'] + ', supi ditched us ' + results[0].value + ' times peepoSadLaptop');
									}
								})
						})
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ', ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + 'cookie',
			aliases: null,
			description: 'after "kb cookie" type register/unregister to register or unregister from the database, ' +
				'type status for your rank info. Your prestige rank is set automatically - cooldown 10s',
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 8000);
					}
					const perms = allowModule.filter(
						i => i.ID === user['user-id']
					);
					switch (msg[0]) {
						case 'module':
							if (!perms[0]) {
								return '';
							} else {
								await doQuery('UPDATE cookieModule SET reminders="' + msg[1] + '" WHERE type="cookie"');
								kb.say(channel, 'updated "cookie" module status to ' + msg[1])
							}
							break;
						case 'force':
							const cookieApi = await fetch('https://api.roaringiron.com/cooldown/' + user['username'])
								.then(response => response.json());
							if (cookieApi.interval_unformatted === 3600) {
								return '$remind ' + user['username'] + ' eat cookie in 3630s';
							} else if (cookieApi.interval_unformatted === 7200) {
								return '$remind ' + user['username'] + ' eat cookie in 7230s';
							} else if (cookieApi.interval_unformatted === 1800) {
								return '$remind ' + user['username'] + ' eat cookie in 1830s';
							} else if (cookieApi.interval_unformatted === 1200) {
								return '$remind ' + user['username'] + ' eat cookie in 1230s';
							} else {
								return user['username'] + ' error WutFace';
							}
							break;
						case 'register':
							const resultsRegister = await doQuery('SELECT username FROM cookies WHERE username="' + user['username'] + '"');
							if (resultsRegister.length === 0 || resultsRegister[0].username === 0) {
								kb.say(channel, user['username'] + ', you have been successfully registered for ' +
									'a cookie reminder.');
								await doQuery('INSERT INTO cookies (username, created) VALUES ("' + user['username'] +
									'", CURRENT_TIMESTAMP)');
								await doQuery('INSERT INTO cookie_reminders (username) VALUES ("' + user['username'] +
									'")');
							} else if (resultsRegister[0].username === user['username']) {
								kb.say(channel, user['username'] + ', you are already registered for cookie ' +
									'reminders, type "kb help cookie" for command syntax.');
							} else {
								return '';
							}
							break;
						case 'unregister':
							const resultsUnregister = await doQuery('SELECT username FROM cookies WHERE username="' + user['username'] + '"');
							if (resultsUnregister != 0) {
								await doQuery('DELETE FROM cookies WHERE username="' + user['username'] + '"');
								await doQuery('DELETE FROM cookie_reminders WHERE username="' + user['username'] + '"');
								kb.say(channel, user['username'] +
									', you are no longer registered for a cookie reminder.');
							} else {
								kb.say(channel, user['username'] +
									", you are not registered for a cookie reminder, therefore you can't be" +
									" unregistered FeelsDankMan");
							}
							break;
						case 'status':
							const cookieStatus = await fetch('https://api.roaringiron.com/cooldown/' +
									user['user-id'] + '?id=true')
								.then(response => response.json());
							const cookiesEaten = await fetch('https://api.roaringiron.com/user/' +
									user['user-id'] + '?id=true')
								.then(response => response.json());
							const checkUser = await doQuery('SELECT username FROM cookies WHERE username="' + user['username'] + '"');
							if (checkUser.length === 0) {
								kb.say(channel, user['username'] + ', you are not registered in the database,' +
									' type "kb help cookie" for command syntax.');
							} else {
								await doQuery('SELECT username, created FROM cookies WHERE username="' + user['username'] + '"');
								kb.say(channel, user['username'] +
									', Your current reminder rank is prestige ' + 
									cookiesEaten.prestige + ' (' + cookiesEaten.rank + 
									') - time left until next cookie: ' + 
									cookieStatus.time_left_unformatted + ' - cookies: ' +
									cookiesEaten.cookies);
							}
							break;
						default:
							return user['username'] + ', invalid syntax. See "kb help cookie" for command help.';
					}
					return '';
				} catch (err) {
					errorLog(err)
					return user['username'] + ', ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + 'ed',
			aliases: null,
			description: 'after "kb ed" type register/unregister to register or unregister from the database - cooldown 10s',
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 10000);
					}
					const perms = allowModule.filter(
						i => i.ID === user['user-id']
					);
					switch (msg[0]) {
						case 'module':
							if (!perms[0]) {
								return '';
							} else {
								await doQuery('UPDATE cookieModule SET reminders="' + msg[1] + '" WHERE type="ed"');
								kb.say(channel, 'updated "ed" module status to ' + msg[1])
							}
							break;
						case 'register':
							const resultsRegister = await doQuery('SELECT username FROM ed WHERE username="' + user['username'] + '"');
							if (resultsRegister.length === 0 || resultsRegister[0].username === 0) {
								kb.say(channel, user['username'] + ', you have been successfully registered for ' +
									'a dungeon reminder, Your reminders will be whispered to you.');
								await doQuery('INSERT INTO ed (username, created) VALUES ("' + user['username'] +
									'", CURRENT_TIMESTAMP)');
								await doQuery('INSERT INTO ed_reminders (username) VALUES ("' + user['username'] +
									'")');
							} else if (resultsRegister[0].username === user['username']) {
								kb.say(channel, user['username'] + ', you are already registered for dungeon ' +
									'reminders, type "kb help ed" for command syntax.');
							} else {
								return '';
							}
							break;
						case 'unregister':
							const resultsUnregister = await doQuery('SELECT username FROM ed WHERE username="' + user['username'] + '"');
							if (resultsUnregister != 0) {
								await doQuery('DELETE FROM ed WHERE username="' + user['username'] + '"');
								await doQuery('DELETE FROM ed_reminders WHERE username="' + user['username'] + '"');
								kb.say(channel, user['username'] +
									', you are no longer registered for a dungeon reminder.');
							} else {
								kb.say(channel, user['username'] +
									", you are not registered for a dungeon reminder, therefore you can't be" +
									" unregistered FeelsDankMan");
							}
							break;
						default:
							return user['username'] + ', invalid syntax. See "kb help ed" for command help.';
					}
					return '';
				} catch (err) {
					errorLog(err)
					return user['username'] + ', ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		// todo - replace promises with await doQuery() 
		{
			name: prefix + 'stats',
			aliases: null,
			description: 'syntax: kb stats [-channel / -bruh / [input]] | no parameter - returns information about your logs in my  '  + 
			'database | -channel - returns information about the current channel | -bruh - returns amount of racists in the chat | [input] - provide a custom message - cooldown 8s',
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 8000);
					}
					
					commandsExecuted.push('1');
					if (((msg[0] != "-channel" && msg[0] != "-bruh") && msg.length != 0) && msg.length != 2) { 
						const sql = 'SELECT message, COUNT(message) AS value_occurance FROM ?? WHERE message=? GROUP BY message ORDER BY value_occurance DESC LIMIT 1;'
						const inserts = ['logs_' + channel.replace('#', ''), msg.join(' ')]
						const occurence = await doQuery(mysql.format(sql, inserts));
						const fetch = require('node-fetch');
						if (occurence.length === 0) {
							kb.say(channel, user['username'] + ', no message logs found for that query')
							return;
						}
						const output = user['username'] + ', message " ' + occurence[0].message.substr(0, 255) + 
							' " has been typed ' + occurence[0].value_occurance + ' times in this channel.';
						if (output.toString().length>500) {
							async function check1() {
								const banphrasePass = (await fetch('https://nymn.pajbot.com/api/v1/banphrases/test', {
									method: "POST",
									url: "https://nymn.pajbot.com/api/v1/banphrases/test",
									body: "message=" + output.substr(0, 500) + '...',
									headers: {
										"Content-Type": "application/x-www-form-urlencoded"
									},
								}).then(response => response.json()))
								if (banphrasePass.banned === true) {
									kb.say(channel, user['username'] +
										', the result is banphrased, I whispered it to you tho cmonBruh')
									kb.whisper(user['username'], output);
								} else {
									kb.say(channel, output.substr(0, 500) + '...');
								}
							}
							check1()
						} else {
							async function check2() {
								const banphrasePass = (await fetch('https://nymn.pajbot.com/api/v1/banphrases/test', {
									method: "POST",
									url: "https://nymn.pajbot.com/api/v1/banphrases/test",
									body: "message=" + output,
									headers: {
										"Content-Type": "application/x-www-form-urlencoded"
									},
								}).then(response => response.json()))
								if (banphrasePass.banned === true) {
									kb.say(channel, user['username'] +
										', the result is banphrased, I whispered it to you tho cmonBruh')
									kb.whisper(user['username'], output);
								} else {
									kb.say(channel, output);
								}
							}
							check2()
						}
					} else if (msg[0] === "-channel") {
						const rows = new Promise((resolve, reject) => {
							con.query('SELECT COUNT(ID) as value FROM logs_' + channel.replace('#', ''),
								function(error, results, fields) {
									if (error) {
										kb.say(channel, user['username'] + 
											", I don't have any logs from this channel :/");
									} else {
										resolve(results)
									}
								})
						})
						rows.then(function(values) {
							const tableSize = new Promise((resolve, reject) => {
								con.query('SELECT TABLE_NAME AS `Table`, (DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024 ' +
									'AS `size` FROM information_schema.TABLES WHERE TABLE_NAME = "logs_' +
									channel.replace('#', '') + '" ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;',
									function(error, results, fields) {
										if (error) {
											reject(error)
										} else {
											resolve(results)
										}
									})
							})
							tableSize.then(function(size) {
								const logs = new Promise((resolve, reject) => {
								con.query('SELECT TABLE_NAME AS `Table`, (DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024 ' +
									'AS `size` FROM information_schema.TABLES WHERE TABLE_NAME = "logs_' +
									channel.replace('#', '') + '" ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;',
									function(error, results, fields) {
										if (error) {
											reject(error)
										} else {
											resolve(results)
										}
									})
								})
								logs.then(function(log) {
									const loggers = new Promise((resolve, reject) => {
									con.query("SELECT date AS create_time FROM `logs_" + channel.replace("#", "") + 
										"` ORDER BY `date` ASC LIMIT 1",
										function(error, results, fields) {
											if (error) {
												reject(error)
											} else {
												resolve(results)
											}
										})
									})
									loggers.then(function(logg) {
										const logsDate = new Date(logg[0].create_time);
										const serverDate = new Date();
										const difference = Math.abs(serverDate - logsDate);
										const differenceToSec = difference/1000
										kb.say(channel, user['username'] + ', this channel has ' + values[0].value +
											' lines logged, which is ' + size[0].size.substring(0, 4) + 
											'MB total. Logs in this channel started ' + 
											(differenceToSec/86400).toFixed(0) + ' days ago')
									})
								})
							})
						})
					} else if (msg[0] === "-bruh") {
						if (!msg[1]) {
							const trichomp = new Promise((resolve, reject) => {
								con.query('SELECT COUNT(message) AS valueCount FROM logs_' + 
									channel.replace('#', '') + 
									' WHERE message LIKE "%nigg%" or message LIKE "%nibb%"',
									function(error, results, fields) {
										if (error) {
											kb.say(channel, user['username'] + 
												", I don't have any logs from this channel :/");
										} else {
											resolve(results)
										}
									})
							})
							trichomp.then(function(channelValue) {
								const trichompCount = new Promise((resolve, reject) => {
									con.query('SELECT COUNT(username) AS value FROM logs_' + 
										channel.replace('#', '') + 
										' WHERE (message LIKE "%nigg%" OR message LIKE "%nibb%") AND username="' +
										 user['username'] + '"',
										function(error, results, fields) {
											if (error) {
												reject(error)
											} else {
												resolve(results)
											}
										})
								})
								trichompCount.then(function(userValue) {
									if (channel === '#haxk') {
										if (userValue[0].value<2 && userValue[0].value != 1) {
											kb.say(channel, user['username'] + ', you have spelled it ' + 
												userValue[0].value + ' times, we coo TriHard - total of ' + 
												channelValue[0].valueCount + 
												' n bombs in this channel TriChomp TeaTime')
										} else if (userValue[0].value===1){
											kb.say(channel, user['username'] + ', you have spelled it ' +
												userValue[0].value + ' time WideHard - total of ' +
												channelValue[0].valueCount + 
												' n bombs in this channel TriChomp TeaTime')
										} else {
											kb.say(channel, user['username'] + ', you have spelled it ' + 
												userValue[0].value + ' times TriChomp Clap - total of ' + 
												channelValue[0].valueCount + 
												' n bombs in this channel TriChomp TeaTime')
										}
									} else {
										if (channelValue[0].valueCount === 0) {
											kb.say(channel, user['username'] + ', total of ' + 
												channelValue[0].valueCount + 
												' racists in this channel, we coo TriHard Clap')
										} else {
											kb.say(channel, user['username'] + ', total of ' + 
												channelValue[0].valueCount + 
												' racists in this channel cmonBruh')
										}
									}
								})
							})
						} else {
							const trichomp = new Promise((resolve, reject) => {
							con.query('SELECT COUNT(message) AS valueCount FROM logs_' + 
								channel.replace('#', '') + 
								' WHERE username="' + msg[1] + '" AND (message LIKE "%nigg%" or message LIKE "%nibb%")',
								function(error, results, fields) {
									if (error) {
										kb.say(channel, user['username'] + 
											", I don't have any logs from this channel :/");
									} else {
										resolve(results)
									}
								})
							})
							trichomp.then(function(channelValue) {
								const trichompCount = new Promise((resolve, reject) => {
									con.query('SELECT COUNT(username) AS value FROM logs_' + 
										channel.replace('#', '') + 
										' WHERE (message LIKE "%nigg%" OR message LIKE "%nibb%") AND username="' +
										 msg[1] + '"',
										function(error, results, fields) {
											if (error) {
												reject(error)
											} else {
												resolve(results)
											}
										})
								})
								trichompCount.then(function(userValue) {
									if (channel === '#haxk') {
										if (userValue[0].value<2 && userValue[0].value != 1) {
											kb.say(channel, user['username'] + ', user ' + 
												msg[1].replace(/^(.{2})/, "$1\u{E0000}") + ' has spelled it ' + 
												userValue[0].value + ' times, we coo TriHard')
										} else if (userValue[0].value===1){
											kb.say(channel, user['username'] + ', user ' + 
												msg[1].replace(/^(.{2})/, "$1\u{E0000}") + ' has spelled it ' +
												userValue[0].value + ' time WideHard')
										} else {
											kb.say(channel, user['username'] + ', user ' + 
												msg[1].replace(/^(.{2})/, "$1\u{E0000}") + ' has spelled it ' + 
												userValue[0].value + ' times TriChomp Clap')
										}
									} else {
										if (channelValue[0].valueCount === 0) {
											kb.say(channel, user['username'] + ', total of ' + 
												channelValue[0].valueCount + 
												' racist activities by user ' + 
												msg[1].replace(/^(.{2})/, "$1\u{E0000}")  + ', we coo TriHard Clap')
										} else {
											kb.say(channel, user['username'] + ', total of ' + 
												channelValue[0].valueCount + 
												' racist activities by user ' + msg[1].replace(/^(.{2})/, "$1\u{E0000}") + ' in this channel cmonBruh bruh')
										}
									}
								})
							})
						}
					} else {
						const userMessages = new Promise((resolve, reject) => {
							con.query('SELECT COUNT(username) as value FROM logs_' + channel.replace('#', '') +
								' WHERE username="' + user['username'] + '"',
								function(error, results, fields) {
									if (error) {
										kb.say(channel, user['username'] + 
											", I don't have any logs from this channel :/");
									} else {
										resolve(results)
									}
								})
						})
						userMessages.then(function(values) {
							const chatMessages = new Promise((resolve, reject) => {
								con.query('SELECT COUNT(username) as value FROM logs_' + channel.replace('#', ''),
									function(error, results, fields) {
										if (error) {
											reject(error)
										} else {
											resolve(results)
										}
									})
							})
							chatMessages.then(function(occurence) {
								const occurenceVal = new Promise((resolve, reject) => {
									con.query('SELECT message, COUNT(message) AS value_occurance FROM logs_' +
										channel.replace('#', '') + ' WHERE username="' + user['username'] +
										'" GROUP BY message ORDER BY value_occurance DESC LIMIT 1;',
										function(error, results, fields) {
											if (error) {
												reject(error)
											} else {
												resolve(results)
											}
										})
								})
								occurenceVal.then(function(val) {
									const fetch = require('node-fetch');
									const output = user['username'] + ", you have total of " + values[0].value +
										" lines logged, that's " + ((values[0].value / occurence[0].value) * 
											100).toFixed(2) +
										'% of all lines in this channel, your most frequently typed message is: " ' +
										val[0].message + ' " (' + val[0].value_occurance + ' times)';
									if (output.toString().length>500) {
										async function check1() {
											const banphrasePass = (await fetch('https://nymn.pajbot.com/api/v1/banphrases/test', {
												method: "POST",
												url: "https://nymn.pajbot.com/api/v1/banphrases/test",
												body: "message=" + val[0].message.substr(0, 255),
												headers: {
													"Content-Type": "application/x-www-form-urlencoded"
												},
											}).then(response => response.json()))
											if (banphrasePass.banned === true) {
												kb.say(channel, user['username'] +
													', the result is banphrased, I whispered it to you tho cmonBruh')
												kb.whisper(user['username'], output);
											} else {
												kb.say(channel, user['username'] + ", you have total of " + values[0].value +
													" lines logged, that's " + ((values[0].value / occurence[0].value) * 
														100).toFixed(2) +
													'% of all lines in this channel, your most frequently typed message is: " ' +
													val[0].message.substr(0, 255) + '...' + ' " (' + val[0].value_occurance + ' times)');
											}
										}
										check1()
									} else {
										async function check2() {
											const banphrasePass = (await fetch('https://nymn.pajbot.com/api/v1/banphrases/test', {
												method: "POST",
												url: "https://nymn.pajbot.com/api/v1/banphrases/test",
												body: "message=" + output,
												headers: {
													"Content-Type": "application/x-www-form-urlencoded"
												},
											}).then(response => response.json()))
											if (banphrasePass.banned === true) {
												kb.say(channel, user['username'] +
													', the result is banphrased, I whispered it to you tho cmonBruh')
												kb.whisper(user['username'], output);
											} else {
												kb.say(channel, user['username'] + ", you have total of " + values[0].value +
													" lines logged, that's " + ((values[0].value / occurence[0].value) * 
														100).toFixed(2) +
													'% of all lines in this channel, your most frequently typed message is: " ' +
													val[0].message.substr(0, 255) + ' " (' + val[0].value_occurance + ' times)');
											}
										}
										check2()
									}
								})
							})
						})
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ', ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + "surah",
			aliases: prefix + "dailysurah",
			invocation: async (channel, user, message, args) => {
				try {
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 8000);
					}
					const randomNumberFromRange = Math.floor(Math.random() * 6237) + 1;
					const quranApi = await fetch("http://api.alquran.cloud/ayah/" + randomNumberFromRange + 
						"/editions/quran-uthmani,en.pickthall").then(response => response.json());
					const output = quranApi.data[0].surah.englishName + ' - ' + 
						quranApi.data[0].surah.englishNameTranslation + ': ' + quranApi.data[0].text.split(' ').reverse().join(' ')  + ' - ' + 
						quranApi.data[1].text + ' ' + quranApi.data[0].page + ':' + quranApi.data[0].surah.numberOfAyahs;
					const banphrasePass = (await fetch('https://nymn.pajbot.com/api/v1/banphrases/test', {
						method: "POST",
						url: "https://nymn.pajbot.com/api/v1/banphrases/test",
						body: "message=" + output,
						headers: {
							"Content-Type": "application/x-www-form-urlencoded"
						},
					}).then(response => response.json()))
					if (channel === "#nymn") {
						if (banphrasePass.banned === true) {
							kb.whisper(user['username'], output);
							return user['username'] +
								', the result is banphrased, I whispered it to you tho cmonBruh';		
						} else {
							return user['username'] + ', ' + output;
						}
					} else {
						return user['username'] + ', ' + output;
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ', error FeelsDankMan!!!'
				}
			}	
		},

		{
			name: prefix + "twitchcon",
			aliases: prefix + 'tc',
			description: "kb tc [user] - returns if given user has TwitchCon Amsterdam 2020 badge (the badge has to be displayed globally) - cooldown 5s",
			invocation: async (channel, user, message, args) => {
				try {
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 5000);
					}
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2)
					const tcStatus = await fetch("https://api.ivr.fi/twitch/badges/" + msg[0])
						.then(response => response.json());
					const checkBadge = tcStatus.badges.filter(i=>i.id === "twitchconAmsterdam2020")
					if (!msg[0]) {
						return user['username'] + ', no user provided.';
					} else {	
						if (checkBadge.length === 0) {
							return user['username'] + ', that user has no TwitchCon Amsterdam 2020 global badge set, or is not attending the event :/';
						} else {
							if (checkBadge[0].id === "twitchconAmsterdam2020") {
								return user['username'] + ', that user is attending TwitchCon Amsterdam 2020 PogChamp !!!';
							} else {
								return user['username'] + ', that user has no TwitchCon Amsterdam 2020 global badge set, or is not attending the event :/';
							}
						}	
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ' ' + err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/\d/g, '').replace(/./g, '') + ' FeelsDankMan !!!';
				}
			}	 
		},

		{
			name: prefix + "commands",
			aliases: null,
			invocation: async (channel, user, message, args) => {
				return '';
			}
		},
	];

	kb.on("chat", async (channel, user, message, self) => {
		const input = message.split(' ')
		if (user['user-id'] === "441611405") return;
		if (user['user-id'] === "81613973") return;
		if (user['user-id'] === "176481960") return; //boiiiann
		if (self) return;

		commands.forEach(async command => {
			if (
				((input[0].replace('kbot', 'kb') + ' ' +
					input[1]).replace(/,/, '').replace('@', '').toLowerCase() === command.name) ||
				(command.aliases && (input[0].replace('kbot', 'kb') + ' ' +
					input[1]).replace(/,/, '').replace('@', '').toLowerCase() === command.aliases)
			) {
				let result = await command.invocation(channel, user, message);
				if (!result) {
					kb.say(channel, '');
					return;
				}
				if (repeatedMessages[channel] === result) {
					result += " \u{E0000}";
				}
				repeatedMessages[channel] = result;

				const colorList = [
					"Blue", "BlueViolet", "CadetBlue", "Chocolate",
					"Coral", "DodgerBlue", "Firebrick", "GoldenRod",
					"Green", "HotPink", "OrangeRed", "Red", "SeaGreen",
					"SpringGreen", "YellowGreen"
				];

				const colors = colorList[Math.floor(Math.random() * colorList.length)]
				kb.say(channel, "/color " + colors);

				async function sendResponse() {
					const test = (await fetch('https://nymn.pajbot.com/api/v1/banphrases/test', {
						method: "POST",
						url: "https://nymn.pajbot.com/api/v1/banphrases/test",
						body: "message=" + result,
						headers: {
							"Content-Type": "application/x-www-form-urlencoded"
						},
					}).then(response => response.json()))
					if (channel === '#nymn') {
						if (test.banned === true) {
							kb.say(channel, user['username'] +
								', the result is banphrased, I whispered it to you tho cmonBruh')
							kb.whisper(user['username'], result);
							return;
						} else {
							if (!result) {
								kb.say(channel, "");
							} else {
								if (result.replace(/[\u{E0000}|\u{206d}]/gu, '') === "undefined") {
									kb.say(channel, 'Internal error monkaS')
									return;
								} else if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
									kb.say(channel, user['username'] + ', TriHard oauth key');
									return;
								} else if (result.toLowerCase() === 'object') {
									if (channel === '#nymn') {
										kb.say(channel, ' object peepoSquad')
										return;
									} else {
										kb.say(channel, ' object 🦍')
										return;
									}
								} else {
									commandsExecuted.push('1');
									kb.say(channel, result);
								}
							}
						}
					} else {
						if (!result) {
							kb.say(channel, "");
						} else {
							if (result.replace(/[\u{E0000}|\u{206d}]/gu, '') === "undefined") {
								kb.say(channel, 'Internal error monkaS')
								return;
							} else if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
								kb.say(channel, user['username'] + ', TriHard oauth key');
								return;
							} else if (result.toLowerCase() === 'object') {
								if (channel === '#nymn') {
									kb.say(channel, ' object peepoSquad')
									return;
								} else {
									kb.say(channel, ' object 🦍')
									return;
								}
							} else {
								commandsExecuted.push('1');
								kb.say(channel, result);
							}
						}
					}
				}
				sendResponse()
			}
		});
	});
	const talkedRecently3 = new Set();
	const commandlist = [{
		name: prefix + "commands",
		aliases: null,
		invocation: (channel, user, args) => {
			try {
				const trackObj = commands.filter(
					i => i.name && i.permission != 'restricted'
				);
				const xd = trackObj.map(
					i => i.name
				);
				const xdd = ((xd.sort().toString().replace(/,/g, " | ").replace(/kb/g, '') + " |").split('|')).length;

				if (talkedRecently3.has(user['user-id'])) { //if set has user id - ignore
					return '';
				} else {
					talkedRecently3.add(user['user-id']);
					setTimeout(() => {
						// removes the user from the set after 10s
						talkedRecently3.delete(user['user-id']);
					}, 10000);
				}
				const xddd = xdd - 1
				return user['username'] + ", " + xddd + " active commands PogChamp 👉 (prefix: kb) | " +
					xd.sort().toString().replace(/,/g, " | ").replace(/kb/g, '') + " |".split(' | ')

			} catch (err) {
				async function errorLog() {
					const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
					const insert = [returnValue, new Date()];
					await doQuery(mysql.format(sql, insert));
				}
				errorLog()
				return user['username'] + ", " + err + " FeelsDankMan !!!";
			}
		}
	}, ];

	kb.on("chat", async (channel, user, message, self) => {
		const input = message.split(' ')
		if (user['user-id'] === "441611405") return;
		if (user['user-id'] === "81613973") return;
		if (user['user-id'] === "249408349") return;
		if (user['user-id'] === "176481960") return; // boiiiann
		if (self) return;
		commandlist.forEach(async command => {
			if (
				((input[0].replace('kbot', 'kb') + ' ' +
					input[1]).replace(/,/, '').replace('@', '').toLowerCase() === command.name) ||
				(command.aliases && (input[0].replace('kbot', 'kb') + ' ' +
					input[1]).replace(/,/, '').replace('@', '').toLowerCase() === command.aliases)
			) {
				let result = await command.invocation(channel, user, message);

				// If a message would be duplicated in a row in a channel, add something to make it not duplicate
				if (repeatedMessages[channel] === result) {
					result += " \u{E0000}";
				}

				repeatedMessages[channel] = result;
				commandsExecuted.push('1');
				kb.say(channel, result);

			}
		})
	})
	const pingAmount = [];
	async function sendOnlineStatus() {
		pingAmount.push('ping')
		const test = (await fetch(api.supinic, {
			method: 'PUT',
		}).then(response => response.json()))
		console.log(test)
	}
	setInterval(() => {
		sendOnlineStatus()
	}, 600000);

	const dankPrefix = '?';
	const talkedRecently2 = new Set();
	const dankeval = [{
			name: 'HONEYDETECTED',
			aliases: null,
			invocation: async (channel, user, message, args) => {
				if (user['user-id'] != '68136884') {
					return '';
				} else {
					return 'HONEYDETECTED POŁĄCZONO PONOWNIE KKurwa 7';
				}
			}
		},

		{
			name: dankPrefix + 'cookie',
			aliases: '!cookie',
			permission: 'restricted',
			invocation: async (channel, user, args) => {
				try {
					if (talkedRecently.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently.add(user['user-id']);
						setTimeout(() => {
							talkedRecently.delete(user['user-id']);
						}, 3000);
					}
					const cookieModule = await doQuery('SELECT reminders FROM cookieModule WHERE type="cookie"');
					if (cookieModule[0].reminders === "false") {
						return '';
					} else {
						const cookieApi = await fetch('https://api.roaringiron.com/cooldown/' +
								user['user-id'] + '?id=true')
							.then(response => response.json());
						const cookieStatus = await fetch('https://api.roaringiron.com/user/' +
								user['user-id'] + '?id=true')
							.then(response => response.json());
						const query = await doQuery('SELECT username FROM cookies WHERE username="' + user['username'] + '"');
						if (query.length === 0) {
							kb.say(channel, '');
						} else {
							commandsExecuted.push('1');
							Date.prototype.addMinutes = function(minutes) {
								var copiedDate = new Date(this.getTime());
								return new Date(copiedDate.getTime() + minutes * 60000);
							}
							if (cookieStatus.prestige === 1) {
								if (cookieApi.seconds_left < 3580 || cookieApi.seconds_left === 0) {
									kb.whisper(user['username'],
										' your cookie is still on cooldown (' +
										cookieApi.time_left_formatted + '), wait 1h intervals. ' +
										'To force your cookie reminder do ' +
										'"kb cookie force" in the chat.');
								} else {
									const now = new Date();
									kb.say(channel, user['username'] + ', I will remind you to eat the cookie in 1h :)');
								 	await doQuery('UPDATE cookie_reminders SET channel="' + channel.replace('#', '') + '", fires="' + 
										now.addMinutes(60).toISOString().slice(0, 19).replace('T', ' ') + '", status="scheduled" ' + 
										'WHERE username="' + user['username'] + '"');
							 	}
							} else if (cookieStatus.prestige === 2) {
								if (cookieApi.seconds_left < 1780 || cookieApi.seconds_left === 0) {
									kb.whisper(user['username'],
										' your cookie is still on cooldown (' +
										cookieApi.time_left_formatted +
										'), wait 30m intervals. To force your cookie reminder do ' +
										' "kb cookie force" in the chat.');
								} else {
									const now = new Date();
									kb.say(channel, user['username'] + ', I will remind you to eat the cookie in 30m :)');
									await doQuery('UPDATE cookie_reminders SET channel="' + channel.replace('#', '') + '", fires="' + 
										now.addMinutes(30).toISOString().slice(0, 19).replace('T', ' ') + '", status="scheduled" ' + 
										'WHERE username="' + user['username'] + '"');
								}
							} else if (cookieStatus.prestige === 3) {
								if (cookieApi.seconds_left < 1180 || cookieApi.seconds_left === 0) {
									kb.whisper(user['username'],
										' your cookie is still on cooldown (' +
										cookieApi.time_left_formatted +
										'), wait 20m intervals. To force your cookie reminder do ' +
										'"kb cookie force" the in chat.');
								} else {
									const now = new Date();
									kb.say(channel, user['username'] + ', I will remind you in to eat the cookie in 20m :)');
									await doQuery('UPDATE cookie_reminders SET channel="' + channel.replace('#', '') + '", fires="' + 
										now.addMinutes(20).toISOString().slice(0, 19).replace('T', ' ') + '", status="scheduled" ' + 
										'WHERE username="' + user['username'] + '"');
								}
							} else if (cookieStatus.prestige === 4) {
								if (cookieApi.can_claim === false) {
									kb.whisper(user['username'] +
										' your cookie is still on cooldown (' +
										cookieApi.time_left_formatted + '), wait intervals. ' +
										'To force your cookie reminder do ' +
										'"kb cookie force" in chat.');
								} else {
									kb.whisper(user['username'], user['username'] + ', this rank is currently ' +
										'not supported, see "kb help cookie" for command syntax.');
								}
							} else if (cookieStatus.prestige === 5) {
								if (cookieApi.can_claim === false) {
									kb.whisper(user['username'] +
										' your cookie is still on cooldown (' +
										cookieApi.time_left_formatted +
										'), wait intervals. To force your cookie reminder do ' +
										'"kb cookie force" in chat.');
								} else {
									kb.whisper(user['username'], user['username'] +
										', this rank is currently not supported, see ' +
										'"kb help cookie" for command syntax.');
								}
							} else if (cookieStatus.prestige === 0 ) {
								if (cookieApi.cookieApi < 7180 || cookieApi.seconds_left === 0) {
									kb.whisper(user['username'],
										' your cookie is still on cooldown (' +
										cookieApi.time_left_formatted +
										'), wait 2h intervals. To force your cookie reminder do ' +
										'"kb cookie force" in chat.');
								} else {
									const now = new Date();
									kb.say(channel, user['username'] + ', I will remind you to eat the cookie in 2h :)');
									await doQuery('UPDATE cookie_reminders SET channel="' + channel.replace('#', '') + '", fires="' + 
										now.addMinutes(120).toISOString().slice(0, 19).replace('T', ' ') + '", status="scheduled" ' + 
										'WHERE username="' + user['username'] + '"');
								}
							} else {
								kb.say(channel, '')
							}
						}
					}
					return '';
				} catch (err) {
					errorLog(err);
				}
			}
		},
		
		{
			name: "+ed",
			aliases: null,
			invocation: async (channel, user, message, args) => {
				if (talkedRecently2.has(user['user-id'])) { 
					return '';
				} else {
					talkedRecently2.add(user['user-id']);
					setTimeout(() => {
						talkedRecently2.delete(user['user-id']);
					}, 2000);
				}
				const cookieModule = await doQuery('SELECT reminders FROM cookieModule WHERE type="ed"');
				if (cookieModule[0].reminders === "false") {
					return '';
				} else {
					const checkUsername = await doQuery('SELECT username FROM ed WHERE username="' + user['username'] + '"');
					if (checkUsername.length === 0) {
						return '';
				    } else {
						commandsExecuted.push("1");
						const value = await doQuery('SELECT status AS val FROM ed_reminders WHERE username="' + checkUsername[0].username + '"');
						if (value[0].val === "scheduled") {
							return '';
						} else {
							Date.prototype.addMinutes = function(minutes) {
								var copiedDate = new Date(this.getTime());
								return new Date(copiedDate.getTime() + minutes * 60000);
							}
							const now = new Date();
							kb.whisper(user['username'], 'I will remind you to enter the dungeon in 10m :)');
							const update = await doQuery('UPDATE ed_reminders SET channel="' + channel.replace('#', '') + '", fires="' + 
									now.addMinutes(10).toISOString().slice(0, 19).replace('T', ' ') + '", status="scheduled" ' + 
									'WHERE username="' + user['username'] + '"');
						}
					}
				}
				return '';
			}
		},

		{
			name: "kunszgbot",
			aliases: "kunszgbot,",
			invocation: async (channel, user, message, args) => {
				try {
					if (talkedRecently2.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently2.add(user['user-id']);
						setTimeout(() => {
							talkedRecently2.delete(user['user-id']);
						}, 30000);
					}
					if (user['user-id'] === '68136884') {
						return ''
					}
					return 'get 🅱️inged back ' + user['username'] + ' FeelsDankMan';
				} catch	(err) {
					errorLog(err)
					return user['username'] + ', ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: "AlienPls",
			aliases: null,
			invocation: async (channel, user, message, args) => {
				try {
					const allowedChannels = [{
							ID: '#supinic'
						},
						{
							ID: '#nymn'
						},
						{
							ID: '#pajlada'
						}
					];
					const checkChannels = allowedChannels.filter(
						i => i.ID === channel
					);
					const checkChannelsMap = checkChannels.map(
						i => i.ID
					)
					if (channel === checkChannelsMap[0] && user['user-id'] === "178087241") {
						return "AlienPls";
					} else {
						return '';
					}
				} catch (err) {
					return user['username'] + ', ' + err + 'FeelsDankMan !!!'
				} 
			}
		},

		{
			name: dankPrefix + "deval",
			aliases: null,
			invocation: async (channel, user, message, args) => {
				try {
					if (user['user-id'] != "178087241") {
						return ''.replace(/[\u{E0000}|\u{206d}]/gu, '');
					} else {
						function reverse(s) {
							return s.split('').reverse().join('');
						}

						function hasNumber(myString) {
							return /\d/.test(myString);
						}

						function sleep(milliseconds) {
							const start = new Date().getTime();
							for (var i = 0; i < 1e7; i++) {
								if ((new Date().getTime() - start) > milliseconds) {
									break;
								}
							}
						}
						const msg = message.split(" ");
						const msg2 = msg.shift();
						const ev = await eval('(async () => {' +
							msg.join(" ").replace(/[\u{E0000}|\u{206d}]/gu, '') + '})()');
						console.log(ev);
						return String(ev);
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: "test",
			aliases: "test \u{E0000}",
			invocation: (channel, user, args) => {
				if (user['user-id'] === "178087241" || user['user-id'] === "229225576") { //kunszg
					return user['username'] + ", FeelsGoodMan test successful FeelsGoodMan";
				} else {
					return "";
				}
			}
		},
	];

	kb.on("chat", async (channel, user, message, self) => {
		if (user['user-id'] === "249408349") return;
		if (self) return;
		dankeval.forEach(async smart => {
			if ((message.split(' ')[0] === smart.name) ||
				(smart.aliases && message.split(' ')[0] === smart.aliases)) {
				let result = await smart.invocation(channel, user, message);
				if (!result) {
					kb.say(channel, '');
				}
				if (result === "undefined") {
					kb.say(channel, user['username'] + ", FeelsDankMan something fucked up")
					return;
				} else {
					if (result === '') {
						kb.say(channel, '')
						return;
					} else if (repeatedMessages[channel] === result) {
						result += " \u{E0000}";
					}
				}
				repeatedMessages[channel] = result;
				if (result === "undefined") {
					return;
				} else {
					commandsExecuted.push('1');
					kb.say(channel, result.toString());
				}
			}
		});
	});

	// unfire clogging reminders
	async function unfire() {
		const unfire = await doQuery('SELECT username, channel, fires, status FROM cookie_reminders WHERE status!="fired" ORDER BY fires ASC');

		if (!unfire[0]) {
			return;
		} else {

			// some KKona shit going out there
			const serverDate = new Date();
			const fires = new Date(unfire[0].fires);
			const diff = serverDate - fires
			const differenceToSec = diff/1000;

			if (differenceToSec>15) {

				// update the database with fired reminder
				const selectUnfiredUsers = await doQuery('SELECT * FROM cookie_reminders WHERE fires < TIMESTAMPADD(SECOND, -8, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;')
				if (!selectUnfiredUsers[0]) {
					return '';
				} else {
					const dateUnfiredUsers = new Date(selectUnfiredUsers[0].fires)
					const unfiredDiff = (serverDate - dateUnfiredUsers)/1000/60
					kb.say(selectUnfiredUsers[0].channel, selectUnfiredUsers[0].username + ', you had an unfired cookie reminder ' + unfiredDiff.toFixed(0) + ' minutes ago, sorry about that and eat your cookie please :)')
					await doQuery('UPDATE cookie_reminders SET status="fired" WHERE fires < TIMESTAMPADD(SECOND, -8, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;');
				}
			}
		}
	}
	setInterval(() => {
		unfire()
	}, 10000)

	// check and send reminders - cookie
	async function reminder() {

		{
			const value = await doQuery('SELECT username, channel, fires, status FROM cookie_reminders WHERE status!="fired" ORDER BY fires ASC');
			
			// if there is no "fired" argument, ignore
			if (!value[0]) {
				return;
			} else {

				// some KKona shit going out there
				const serverDate = new Date();
				const fires = new Date(value[0].fires);
				const diff = serverDate - fires
				const differenceToSec = diff/1000;

				// consider only cases where reminder is apart from current date by 7 seconds
				if ((differenceToSec<=7) && !(differenceToSec<0)) {
					const limit = new Set();

					// make sure not to repeat the same reminder by adding a unique username
					// to the Set Object and delete it after 10s 
					if (limit.has(value[0].username)) {
						return;
					} else {
						limit.add(value[0].username)
						kb.say(value[0].channel, '(cookie reminder) ' + value[0].username + ', eat cookie please :) 🍪 ')
						setTimeout(() => {limit.delete(value[0].username)}, 10000)		
					}

					// update the database with fired reminder
					await doQuery('UPDATE cookie_reminders SET status="fired" WHERE username="' + 
						value[0].username + '" AND status="scheduled"');
				}
			}
		}
	
		{
			const value = await doQuery('SELECT username, channel, fires, status FROM ed_reminders WHERE status!="fired" ORDER BY fires ASC');

			// if there is no "fired" argument, ignore
			if (!value[0]) {
				return;
			} else {

				// some KKona shit going out there
				const serverDate = new Date();
				const fires = new Date(value[0].fires);
				const diff = serverDate - fires
				const differenceToSec = diff/1000;

				// consider only cases where reminder is apart from current date by 7 seconds
				if ((differenceToSec<=7) && !(differenceToSec<0)) {
					const limit = new Set();

					// make sure not to repeat the same reminder by adding a unique username
					// to the Set Object and delete it after 10s 
					if (limit.has(value[0].username)) {
						return;
					} else {
						limit.add(value[0].username)
						kb.whisper(value[0].username, '(ed reminder) ' + value[0].username + ', enter dungeon please :) 🏰 ')
						setTimeout(() => {limit.delete(value[0].username)}, 10000)		
					}

					// update the database with fired reminder
					await doQuery('UPDATE ed_reminders SET status="fired" WHERE username="' + 
						value[0].username + '" AND status="scheduled"');
				}
			}
		}
	}
	setInterval(() => {
		reminder()
	}, 1000)

	{
		//active commands
		kb.on('chat', function(channel, user, message) {
			if (channel === '#haxk' && message === "!xd") {
				kb.say('haxk', "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠛⠛⠛⠛⠛⠛⠿⠿⣿⣿⣿⣿⣿ ⣿⣿⣯⡉⠉⠉⠙⢿⣿⠟⠉⠉⠉⣩⡇⠄⠄⢀⣀⣀⡀⠄⠄⠈⠹⣿⣿⣿ ⣿⣿⣿⣷⣄⠄⠄⠈⠁⠄⠄⣠⣾⣿⡇⠄⠄⢸⣿⣿⣿⣷⡀⠄⠄⠘⣿⣿ ⣿⣿⣿⣿⣿⣶⠄⠄⠄⠠⣾⣿⣿⣿⡇⠄⠄⢸⣿⣿⣿⣿⡇⠄⠄⠄⣿⣿ ⣿⣿⣿⣿⠟⠁⠄⠄⠄⠄⠙⢿⣿⣿⡇⠄⠄⠸⠿⠿⠿⠟⠄⠄⠄⣰⣿⣿ ⣿⡿⠟⠁⠄⢀⣰⣶⣄⠄⠄⠈⠻⣿⡇⠄⠄⠄⠄⠄⠄⠄⢀⣠⣾⣿⣿⣿ ⣿⣷⣶⣶⣶⣿⣿⣿⣿⣷⣶⣶⣶⣿⣷⣶⣶⣶⣶⣶⣶⣿⣿⣿⣿⣿⣿⣿ ");
			} else if (channel==="#supinic"&&message.split(' ')[0]==="+join") {
				if (user['user-id']==='68136884') { //supibot
					kb.say('supinic', '+join count me in KKona')
					return;
				}
			} else if (channel==="#supinic"&&message.includes("$ps sneeze")) {
				if (talkedRecently.has(user['user-id'])) {
					return;
				} else {
					talkedRecently.add(user['user-id']);
					setTimeout(() => {
						talkedRecently.delete(user['user-id']);
					}, 5000);
				}
				kb.say('supinic', ' bless u peepoSadDank')
				return;
			} else {
				return; 
			}
		});
		kb.on("resub", function(channel, username, months) {
			if (channel != "#supinic") return;
			else
				kb.say("Supinic", username + " has resubscribed, welcome back in hackermans club HACKERMANS")
		});

		kb.on("timeout", function(channel, username, message, duration) {
			if (channel != "#supinic") {
				return;
			} else {
				if (duration == '1') {
					kb.say(channel, username + " vanished Article13 magicWand ")
				} else {
					kb.say(channel, username + " has been timed out for " + duration + "s Article13 magicWand ")
				}
			}
		});

		kb.on("ban", function(channel, username) {
			if (channel != "#supinic") return;
			else
				kb.say("Supinic", username + " has been permamently banned pepeMeltdown")
		});

		kb.on("hosted", function(channel, username, viewers) {
			if (channel != "#supinic") return;
			else
				kb.say("Supinic", username + " hosted supinic with " + viewers + " viewers HACKERMANS ")
		});

		kb.on("subgift", (channel, username, streakMonths, recipient, userstate) => {
			if (channel != "#supinic") return;
			else
				kb.say("Supinic", username + " has gifted a sub to " + recipient + " and it's their " +
					streakMonths + " month/s resub! ppBounce ")
		});

		kb.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
			if (channel != "#supinic") return;
			else
				kb.say("Supinic", username + " is giving away " + numbOfSubs + " and they have already gifted " +
					userstate + " subs to Supinic peepoPooPoo ")
			let senderCount = ~~userstate["msg-param-sender-count"];
		});

		kb.on("subscription", (channel, username) => {
			if (channel != "#supinic") return;
			else
				kb.say("Supinic", username + " has subscribed! Welcome to the HACKERMANS 's club ")
		});

		kb.on("raided", (channel, username, viewers) => {
			if (channel != "#supinic") return;
			else
				kb.say("Supinic", username + " raided supinic with " + viewers + " viewers PagChomp ")
		});

		kb.on("giftpaidupgrade", (channel, username, sender, userstate) => {
			if (channel != "#supinic") return;
			else
				kb.say("Supinic", username + " is continuing the gifted sub they got from " + sender + " PagChomp ")
		});
	}
})

const Discord = require('discord.js');
const disco = new Discord.Client();

disco.on('ready', () => {
	console.log(`Logged in as ${disco.user.tag}!`);
});

disco.on('message', async msg => {
	if (msg.content === '?uptime') {
		try {
			const fs = require("fs");
			const stats = fs.statSync("./bot.js");
			const fileSizeInBytes = stats['size'];
			const size = fileSizeInBytes / 1000

			function format(seconds) {
				function pad(s) {
					return (s < 10 ? '0' : '') + s;
				}

				var hours = Math.floor(seconds / (60 * 60));
				var minutes = Math.floor(seconds % (60 * 60) / 60);
				var seconds = Math.floor(seconds % 60);
				return hours + 'h ' + minutes + 'm ' + seconds + "s";
			}
			const uptime = process.uptime();

			const os = require('os');
			const up = os.uptime() / 3600; //system uptime in hours
			const up2 = os.uptime() / 86400; //system uptime in days

			const linecount = require('linecount')
			const lines = await new Promise((resolve, reject) => { //line count

				linecount('./bot.js', (err, count) => {
					if (err) {
						reject(err);
					} else {
						resolve(count);
					}
				});
			});

			msg.reply(
				"Code is running for " + format(uptime) +
				" and has " + lines + " lines total, size of the bot file is " + size.toFixed(3) + " KB," +
				" my system runs for: " + up.toFixed(1) + "h (" + up2.toFixed(2) + " days)");

		} catch (err) {
			msg.reply(err);
		}
	}
});
disco.on('message', async msg => {
	if (msg.content.split(' ')[0] === '?joke') {
		try {
			function firstLettertoLowerCase(string) {
				return string.charAt(0).toLowerCase() + string.slice(1);
			}
			const arr = [
				'general',
				'general',
				'general',
				'general',
				'general',
				'programming',
				'programming'
			]
			const randomPs = arr[Math.floor(Math.random() * arr.length)];
			console.log(randomPs)
			if (randomPs === 'programming') {
				const joke = await fetch(api.joke1)
					.then(response => response.json());
				setTimeout(() => {
					msg.channel.send(firstLettertoLowerCase(joke[0].punchline.replace(/\./g, '')) + ' 😂')
				}, 4000);
				msg.reply(firstLettertoLowerCase(joke[0].setup));
			} else if (randomPs === 'general') {
				const jokeGeneral = await fetch(api.joke2)
					.then(response => response.json());
				setTimeout(() => {
					msg.channel.send(firstLettertoLowerCase(jokeGeneral.punchline.replace(/\./g, '')) + ' 😂 ')
				}, 4000);
				msg.reply(firstLettertoLowerCase(jokeGeneral.setup));
			}

		} catch (err) {
			console.log(err);
			msg.reply(err);
		}
	}
}); {
	const talkedRecently = new Set();
	disco.on('message', async msg => {
		if (msg.content.split(' ')[0] === '?ping') {

			try {
				const msg1 = msg.content.split(' ');
				const msg2 = msg1.shift();
				const used = process.memoryUsage().heapUsed / 1024 / 1024;

				if (talkedRecently.has(disco.user.tag)) { //if set has user id - ignore
					return '';
				} else {
					talkedRecently.add(disco.user.tag);
					setTimeout(() => {
						// removes the user from the set after 10s
						talkedRecently.delete(disco.user.tag);
					}, 5000);
				}
				if (!msg1[0]) {
					const ping = await kb.ping();
					msg.reply(", pong FeelsDankMan 🏓 ppHop 🏓💻, latency: " + ping * 1000 + "ms, memory usage: " +
						(used).toFixed(2) + " MB (" + ((used / 8000) * 100).toFixed(2) + "%)");
				}
			} catch (err) {
				if (err.message.includes("undefined")) {
					msg.channel.send(err + ", N OMEGALUL")
				}
				msg.channel.send(err + " FeelsDankMan !!!");
			}
		}
	})
}

disco.login(api.discord);