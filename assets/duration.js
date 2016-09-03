var numWritten = {"and":0, "a":1, "an":1, "one":1, "two":2, "three":3, "four":4, "five":5,
		"six":6, "seven":7, "eight":8, "nine":9, "ten":10, "eleven":11, "twelve":12,
		"thirteen":13, "fourteen":14, "fifteen":15, "sixteen":16, "seventeen":17,
		"eighteen":18, "nineteen":19, "twenty":20, "thirty":30, "forty":40, "fifty":50,
		"sixty":60, "seventy":70, "eighty":80, "ninety":90, "hundred":100, "thousand":1000};

var unitsFirstLetter = {"s":1, "m":60, "h":3600};	

var testDigits = new RegExp("[0-9]+");
var testUnits = new RegExp("[A-z]+");	

exports.duration = function duration(text) {
	var dur = 0;
	var words = relavantWords(text.toLowerCase());
	var units;

	for (var i = 0; i < words.length; i++) {
		// if it's a number & unit
		if (testDigits.test(words[i]) && testUnits.test(words[i])) {
			var n = words[i].match(/[0-9]+/)[0]
			var u = words[i].match(/[A-z]/)[0];

			dur += parseInt(n) * unitsFirstLetter[u];
		}

		// otherwise we're dealing with the unit alone
		else if (testUnits.test(words[i])) {
			var u = unitsFirstLetter[words[i][0]];

			// assemble a number, like [3, 100, 40, 5] into 345
			var numbers = [];
			for (var j = i-1; j >= 0; j--) {
		        numbers.unshift(parseInt(words[j]));
		        
		      	if (j > 0 && testUnits.test(words[j-1])) {
		        	break;
		        }
			};
			var n = getNumber(numbers);

			dur += n * u
		} 
	};

	if (dur == 0) { return false; }
	else { return dur; } 
}

function relavantWords(text) {
	// first check for any numbers written out
	var words = text.replace("-"," ").split(" ");
	for (var i = 0; i < words.length; i++) {
		var keyNum = Object.keys(numWritten).indexOf(words[i]);
		if (keyNum >= 0) {
			words[i] = numWritten[words[i]];
		} 
	};	
	
	var relavant = [];
	// go through each word
	for (var i = 0; i < words.length; i++) {
		// if it has a digit, it's definitely relavant
		if (testDigits.test(words[i])) {
			relavant.push(words[i]);
		}	
		// to capture units, see if the previous one had numbers and no digits
		else if (testDigits.test(words[i-1]) && !testUnits.test(words[i-1])) {
			relavant.push(words[i]);
		}
	};
	return relavant;
}

function getNumber(numbers) {
	if (numbers[0] == 0) { numbers[0] = 1;} // **exception: if 0 is first, then change it to a 1
	if (numbers.length == 1) { return numbers[0]; }
	else {
		var twoNums = numbers.splice(0,2);

		if (twoNums[0] > twoNums[1]) {
			// two numbers and the first one's bigger: add them
			// fifty three, twenty nine
			var s = twoNums[0] + twoNums[1];
			numbers.unshift(s);
			return getNumber(numbers);
		}

		else {
			// two numbers and the first one's smaller: multiply
			// four hundred = 4 * 100
			var m = twoNums[0] * twoNums[1];
			numbers.unshift(m);
			return getNumber(numbers);
		}
	}
}