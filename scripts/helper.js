var gameweeks;
var gwNumber;
var playerInfo;
var clubs;

function getInfo(leagueUrl) {
  $.get("https://fantasy.premierleague.com/drf/bootstrap-static", function(data) {
    playerInfo = data.elements;
    gameweeks = data.events;
    gwNumber = data['current-event'];
    clubs = data.teams;
    getLeagueInfo(leagueUrl);
  });
}

function getLeagueInfo(leagueUrl) {
  var url;
  var league_code = leagueUrl.split("/").slice(-2)[0];

  if(leagueUrl.indexOf("classic") > -1) {
    url = "https://fantasy.premierleague.com/drf/leagues-classic-standings/" + league_code;
  }
  else if(leagueUrl.indexOf("h2h") > -1) {
    url = "https://fantasy.premierleague.com/drf/leagues-h2h-standings/" + league_code;
  }

  $.get(url, function(data) {
    var teams = data.standings.results;

    for(var i in teams) {
      teamUrl = "https://fantasy.premierleague.com/drf/entry/" + teams[i].entry + "/event/" + gwNumber + "/picks";
      var teamPicks;
      $.get(teamUrl, function(data) {
        teamPicks = data.picks;
        for(var j in teamPicks) {
          var currentSelection = teamPicks[j];
          var selectionIdIndex = currentSelection.element - 1;
          //if not benched
          var playerObj = playerInfo[selectionIdIndex];
          var clubObj = clubs[playerObj.team -1];
          console.log(playerObj['web_name'], clubObj.name);
        }
      });
    }
  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    getInfo(request.url);
    setTimeout(function() {
      $('a[href^="/a/team/"]').addClass('tooltip2')
      .append(`<div class="tooltiptext">
                <h1>Played</h1>
                <table>
                  <tbody>
                    <tr><td>Hazard</td</tr>
                    <tr><td>Morata</td</tr>
                    <tr><td>Salah</td</tr>
                    <tr><td>Kane</td</tr>
                    <tr><td>Grob</td</tr>
                  </tbody>
                </table>
              </div>`);
    }, 5000);
});