// 0: generateResponse: start timer
var start = ["Fine, I'll give you %d.", 
			"Alright, %d it is.",
			"%d and counting.",
			"What the hell do you need %d for!? Ugh, fine.",
			"Okay I'll see you in %d."];

// 1: generateResponse: unknown message
var unknown = ["I have absolutely no idea what that means.",
			"Let's cut to the chase: how long do you wanna procrastinate for?",
			"Just give me an amount of time already.",
			"Listen, my only job is to help you get back to work. So tell me how long you wanna procrastinate for.",
			"I really don't know what you're trying to say.",
			"You're killing time and it's killing me. How long do you wanna procrastinate for?"];

// 2: newTimer: time is up
var time = ["%d is up! Time to get the hell off.",
			"Alright it's been %d. Back to work!",
			"Time! It's been %d. Say 'bye' to Facebook.",
			"Back to work! %d is up!"];

// 3: initReminders: reminder text to get off
var reminder = ["Why are you still here?",
				"Good lord get off already.",
				"I'm throwing a fit.",
				"Get some goddamn work done.",
				"Enough slacking. Get. Off.",
				"I won't be able to sleep knowing you're still on here. GET OFF.",
				"Why are you still reading these!? Stop it!!",
				"Are you even listening? Now you've wasted even more time.",
				"What are you even doing!? There can't possibly be more things to look at.",
				"GO AWAY. Holy shit how many times do I have to tell you?",
				"I didn't know it was humanly possible to procrastinate like this.",
				"Get back to work!! You're embarrassing me.",
				"You seemed to understand me before--now what's the problem!?",
				"You're killing me softly.",
				"I'm begging you. Please, just get back to work.",
				"Stop. Reading. These. Go find something else to do.",
				"You've spent enough time here. Do us all a favor and get off Facebook.",
				"I promise you you're not missing anything else. Close Facebook.",
				"I'll hold down the fort. You--go do literally anything else.",
				"You make me sick.",
				"You procrastinating swine."];

// 4: workerTurnsSlacker: when someone comes back--varies with time
var returns = ["Back already!?!",
			"I hope you got a lot done.",
			"What are you doing here?",
			"I see how it is.",
			"Goddammit.",
			"Classic slacker."];

exports.start = function fStart(readable) {
	var rand = Math.floor(Math.random()*start.length);
	return start[rand].replace("%d", readable);
}

exports.unknown = function fUnknown() {
	var rand = Math.floor(Math.random()*unknown.length);
	return unknown[rand];
}

exports.time = function fTime(readable) {
	var rand = Math.floor(Math.random()*time.length);
	return time[rand].replace("%d", readable);;
}

exports.reminder = function fReminder() {
	var rand = Math.floor(Math.random()*reminder.length);
	return reminder[rand];
}

exports.returns = function fReturns() {
	var rand = Math.floor(Math.random()*returns.length);
	return returns[rand]+" Let me know when you want me to kick you off.";
}



