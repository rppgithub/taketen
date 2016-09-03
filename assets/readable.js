exports.readable = function readable(seconds) {
  var units = ["hour", "minute", "second"];
  var stats = numberOf([], seconds);
  var tally = [];
  for (var i = 0; i < stats.length; i++) {
    if (stats[i] == 1) {
      tally.push(stats[i] + " " + units[i]);
    } else if (stats[i] > 0) { // but not 1
      tally.push(stats[i] + " " + units[i] + "s");
    }
  }

  var res = "";
  for (var i = 0; i < tally.length; i++) {
    if (i == tally.length - 3) {
      res += tally[i] + ", ";
    } else if (i == tally.length - 2) {
      res += tally[i] + " and ";
    } else {
      res += tally[i];
    }
  }

  return res;
}

function numberOf(progress, seconds) {
  switch (progress.length) {
    case 0: // get hours
      var hours = Math.floor(seconds / 3600);
      progress.push(hours);
      return numberOf(progress, seconds - (hours * 3600));
      break;
    case 1: // get minutes
      var minutes = Math.floor(seconds / 60);
      progress.push(minutes);
      return numberOf(progress, seconds - (minutes * 60));
      break;
    case 2:
      progress.push(seconds);
      return progress;
      break;
  }
}