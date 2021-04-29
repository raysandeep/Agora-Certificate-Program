var APP_ID = "519c2b0efd5a4dcfb63d1f6d7fdbb2c4";
var isLoggedIn = false;
var username = null;
var channel = null;
var users = [];
var isRaised = false;

var tokens = {};

var full_name = localStorage.getItem("full_name");

const client = AgoraRTM.createInstance(APP_ID);

function qs(key) {
	var vars = [],
		hash;
	var hashes = window.location.href
		.slice(window.location.href.indexOf("?") + 1)
		.split("&");
	for (var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split("=");
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars[key];
}

function startEvent(usertype) {
	chatDiv = document.getElementById("chats-pannel");
	chatDiv.scrollTop = chatDiv.scrollHeight;
	var username = localStorage.getItem("username");
	var event_id = qs("event_id");
	if (username === null) {
		window.location.href = "signin.html";
	}
	if (event_id === null || event_id === "" || event_id === undefined) {
		window.location.href = "dashboard.html";
	}
	console.log(username, event_id);
	if (localStorage.getItem("user_type") != usertype)
		window.location.href = "dashboard.html";
	// alert('redirecting')

	var myHeaders = new Headers();
	myHeaders.append("Content-Type", "application/json");
	myHeaders.append("Authorization", `Token ${localStorage.getItem("token")}`);
	data = {
		event_id: event_id,
	};
	fetch("http://127.0.0.1:8000/api/core/join/session/", {
		method: "POST",
		headers: myHeaders,
		body: JSON.stringify(data),
		redirect: "follow",
	})
		.then((response) => response.json())
		.then(async (result) => {
			if (result.status == 200) {
				console.log(result);
				tokens = result;
				startAgoraRTM(username, result.channel);
				startAgoraLiveStream(event_id);
				if (result.usertype == 1) {
					await startAgoraRTC(
						result.channel,
						result.uid,
						result.rtc,
						"host",
						true
					);
				} else {
					await startAgoraRTC(
						result.channel,
						result.uid,
						result.rtc,
						"audience",
						true
					);
				}
			} else {
				alert(result.message);
				window.location.href = "dashboard.html";
			}
		})
		.catch((error) => {
			// alert(error.message)
			console.log(error);
		});
}

async function startAgoraRTC(channel, uid, token, role, publish) {
	var options = {
		appid: "519c2b0efd5a4dcfb63d1f6d7fdbb2c4",
		channel: channel,
		uid: uid,
		token: token,
		role: role, // host or audience
	};
	await join(options, publish);
}

function startAgoraRTM(accountName, channelName) {
	username = accountName;
	client
		.login({ uid: accountName, token: tokens.rtm })
		.then(() => {
			console.log("Logged In");
			isLoggedIn = true;
			channel = client.createChannel(channelName);

			channel
				.join()
				.then(() => {
					console.log("Joined Channel");

					channel.on("ChannelMessage", ({ text }, senderId) => {
						data = JSON.parse(text);
						console.log(data);
						handleMessage(data, senderId);
					});

					client
						.addOrUpdateLocalUserAttributes({ f: full_name })
						.then(() => {
							console.log("set local user attributes success!");
						});

					channel.getMembers().then((members) => {
						handleChannelMembers(members);
					});

					channel.on("MemberJoined", (memberId) => {
						console.log(memberId);
						document.getElementById(
							"users"
						).innerHTML += `<p id="${memberId}">${memberId}</p>`;
					});

					channel.on("MemberLeft", (memberId) => {
						document.querySelector(`#${memberId}`).remove();
					});

					client.on("MessageFromPeer", function (message, peerId) {
						handlePeerMessage(JSON.parse(message), peerId);
					});
				})
				.catch((error) => {
					console.log("Agora Join Channel Failed!", error);
				});
		})
		.catch((error) => {
			console.log("Agora Login Failed!", error);
		});
}

function handlePeerMessage(message, peerId) {
	if (msg.action == "REQUESTINGNAME") {
		sendMessageToPeer(
			{ action: "NAME", username: username, full_name: full_name },
			peerId
		);
	} else if (msg.action == "BIO") {
		bio.push({
			userId: userID,
			bio: msg.bio,
		});
	}
}

function sendPeerMessage(msg, userId) {
	client
		.sendMessageToPeer(msg, userId)
		.then((sendResult) => {
			if (!sendResult.hasPeerReceived) {
				console.log("Peer offline");
			} else {
				console.log("Peer message sent!");
			}
		})
		.catch((error) => {
			console.log("Peer message failed due to ", error);
		});
}

function handleChannelMembers(members) {
	for (var i = 0; i < users.length; i++) {
		client
			.getUserAttributes(members[i])
			.then((result) => console.log(result))
			.error((err) => console.log(err));
	}
	users = members;
	console.log(users);
	for (var i = 0; i < users.length; i++)
		if (i % 2 == 0)
			document.getElementById(
				"users"
			).innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center" style="background-color: #a3daff;" id="${users[i]}">
								<p id="${users[i]}-p">${users[i]} </p> 
									<div class="image-parent">
										<img src="https://s3.eu-central-1.amazonaws.com/bootstrapbaymisc/blog/24_days_bootstrap/don_quixote.jpg" class="img-fluid" alt="quixote">
									</div>
								  </li>`;
		else
			document.getElementById(
				"users"
			).innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center"  id="${users[i]}">
							<p id="${users[i]}-p">${users[i]} </p> 
								<div class="image-parent">
									<img src="https://s3.eu-central-1.amazonaws.com/bootstrapbaymisc/blog/24_days_bootstrap/don_quixote.jpg" class="img-fluid" alt="quixote">
								</div>
							  </li>`;
}

function handleMessage(data, senderId) {
	if (data.message === "RaiseHand") {
		console.log(`Raise Hand ${senderId}`);
		document.getElementById(
			`${senderId}-p`
		).innerHTML = `${senderId} <i class="fas fa-hand-paper"></i>`;
	} else if (data.message === "LowerHand") {
		document.getElementById(`${senderId}-p`).innerHTML = `${senderId}`;
	} else if (data.message === "Poll") {
		var options;
		for (var i = 0; i < data.data.options.length; i++) {
			options += `<button onclick="answerPoll('${data.data.id}','${data.data.options[i].id}')">${data.data.options[i].text}</div>`;
		}
		document.getElementById(`answer-polls`).innerHTML += `
		<div id="${data.data.id}"><p>${data.data.text}</p>${options}</div>
		`;
	} else if (data.message === "AnswerPoll") {
	} else if (data.message === "TEXTMESSAGE") {
		console.log(`recievied message from ${data.message}`);
		$("#chats-pannel")
			.append(`<div class='c-user__chat  c-user__chat-other'>
			<span>${data.data.name}</span>
			<p>${data.data.message}</p>
			</div>`);
	}
}

function raiseHand() {
	var text = "";
	console.log(isRaised);
	if (isRaised == false) {
		text = "RaiseHand";
	} else {
		text = "LowerHand";
	}

	channel
		.sendMessage({
			text: JSON.stringify({ message: text }),
		})
		.then(() => {
			console.log(username);
			classlist = document.getElementById("raise-hand-icon").classList;
			if (!isRaised) {
				document.getElementById(
					`${username}-p`
				).innerHTML = `${username} <i class="fas fa-hand-paper"></i>`;
				classlist.remove("far");
				classlist.add("fas");
				isRaised = true;
			} else {
				document.getElementById(
					`${username}-p`
				).innerHTML = `${username}`;
				classlist.remove("fas");
				classlist.add("far");
				isRaised = false;
			}
		})
		.catch((error) => {
			console.log(error);
		});
}

function lowerHand() {
	channel
		.sendMessage({
			text: JSON.stringify({ message: "LowerHand" }),
		})
		.then(() => {
			console.log(username);
			document.getElementById(`${username}-p`).innerHTML = `${username}`;
		})
		.catch((error) => {
			console.log(error);
		});
}

function publishPollinChannel(pollData) {
	channel
		.sendMessage({
			text: JSON.stringify({ message: "Poll", data: pollData }),
		})
		.then(() => {
			console.log("Message Sent!");
		})
		.catch((error) => {
			console.log(error);
		});
}

function answerPoll(pollId, answerId) {
	channel
		.sendMessage({
			text: JSON.stringify({
				message: "AnswerPoll",
				data: { id: pollId, answer: answerId },
			}),
		})
		.then(() => {
			console.log("Message Sent!");
		})
		.catch((error) => {
			console.log(error);
		});
}

function populateUsers() {}

function sendMessage() {
	var textmsg = document.getElementById("text-message").value;
	if (textmsg === null || textmsg === "") {
		return;
	}

	channel
		.sendMessage({
			text: JSON.stringify({
				message: "TEXTMESSAGE",
				data: { name: full_name, message: textmsg },
			}),
		})
		.then(() => {
			console.log("Message Sent!");
			$("#chats-pannel").append(`<div class='c-user__chat '>
				<span>${full_name}(You)</span>
				<p>${textmsg}</p>
			</div>`);
			document.getElementById("text-message").value = "";
		})
		.catch((error) => {
			console.log(error);
		});
}
