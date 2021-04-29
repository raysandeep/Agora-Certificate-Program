// create Agora rtc
var rtc = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
var localTracks = {
	videoTrack: null,
	audioTrack: null,
};
var remoteUsers = {};
// Agora rtc options
var options = {
	appid: "519c2b0efd5a4dcfb63d1f6d7fdbb2c4",
	channel: null,
	uid: null,
	token: null,
	role: "audience", // host or audience
};

var total_users = 0;
var pinned_uid = 0;
// // the demo can auto join channel with params in url
// $(() => {
// 	var urlParams = new URL(location.href).searchParams;
// 	options.appid = urlParams.get("appid");
// 	options.channel = urlParams.get("channel");
// 	options.token = urlParams.get("token");
// 	if (options.appid && options.channel) {
// 		$("#appid").val(options.appid);
// 		$("#token").val(options.token);
// 		$("#channel").val(options.channel);
// 		$("#join-form").submit();
// 	}
// });

async function join(options, publish) {
	rtc.setClientRole(options.role);

	// add event listener to play remote tracks when remote user publishs.
	rtc.on("user-published", handleUserPublished);
	rtc.on("user-unpublished", handleUserUnpublished);

	// join the channel
	options.uid = await rtc.join(
		options.appid,
		options.channel,
		options.token,
		options.uid
	);

	rtc.on("network-quality", (stats) => {
		console.log("downlinkNetworkQuality", stats.downlinkNetworkQuality);
		console.log("uplinkNetworkQuality", stats.uplinkNetworkQuality);
		// document.getElementById();
	});

	if (options.role === "host" && publish == true) {
		localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
		localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
		localTracks.videoTrack.play("local-player");
		await rtc.publish(Object.values(localTracks));
		console.log("publish success");
	}

	setInterval(rtc.getRemoteNetworkQuality(), 10000);
}

async function leave() {
	for (trackName in localTracks) {
		var track = localTracks[trackName];
		if (track) {
			track.stop();
			track.close();
			localTracks[trackName] = undefined;
		}
	}

	// remove remote users and player views
	remoteUsers = {};
	$("#remote-playerlist").html("");

	// leave the channel
	await rtc.leave();

	// $("#local-player-name").text("");
	$("#host-join").attr("disabled", false);
	$("#audience-join").attr("disabled", false);
	$("#leave").attr("disabled", true);
	console.log("rtc leaves channel success");
}

async function subscribe(user, mediaType) {
	const uid = user.uid;
	// subscribe to a remote user
	await rtc.subscribe(user, mediaType);
	console.log("subscribe success");
	if (mediaType === "video") {
		// const player = ;
		// console.log(player);
		if (pinned_uid == 0) {
			console.log(uid, pinned_uid);
			// document.getElementById("pinned_stream").innerHTML = player;
			$("#pinned-stream").append(
				$(
					`<div id="player-${uid}" class="player" onclick="swapThis(this)"></div>`
				)
			);
		} else {
			$("#remote-playerlist").append(
				$(
					`<div id="player-${uid}" class="player" onclick="swapThis(this)"></div>`
				)
			);
		}
		console.log(uid, pinned_uid);
		pinned_uid = uid;
		user.videoTrack.play(`player-${uid}`);
	}
	if (mediaType === "audio") {
		user.audioTrack.play();
	}
}

function handleUserPublished(user, mediaType) {
	const id = user.uid;
	remoteUsers[id] = user;
	subscribe(user, mediaType);
}

function handleUserUnpublished(user) {
	const id = user.uid;
	delete remoteUsers[id];
	$(`#player-wrapper-${id}`).remove();
}

function startAgoraLiveStream(channelName) {
	console.log(`in main.js -> ${channelName}`);
}
