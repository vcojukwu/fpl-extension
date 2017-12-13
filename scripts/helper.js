var gameweeks;
var gwNumber;
var gwFixtures;
var playerInfo;
var clubs;
teamsState = [];

function getInfo(leagueUrl) {
  $.get("https://fantasy.premierleague.com/drf/bootstrap-static", function(data) {
    playerInfo = data.elements;
    gameweeks = data.events;
    gwNumber = data['current-event'];
    clubs = data.teams;

    var live_event_url = 'https://fantasy.premierleague.com/drf/event/' + gwNumber + '/live';
    $.get(live_event_url, function(data) {
      gwFixtures = data.fixtures;
      getLeagueInfo(leagueUrl);
    });
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
    $.each(teams, function (i, item) {
      var teamPicks;
      var played = [];
      var playing = [];
      var notPlayed = [];
      var state = {};

      state['name'] = teams[i]['entry_name'];
      teamsState[i] = state;

      var teamUrl = "https://fantasy.premierleague.com/drf/entry/" + teams[i].entry + "/event/" + gwNumber + "/picks";
      $.get(teamUrl, function(data) {
        teamPicks = data.picks;

        for(var j in teamPicks) {
          var currentSelection = teamPicks[j];
          var selectionIdIndex = currentSelection.element - 1;
          //if not benched
          var playerObj = playerInfo[selectionIdIndex];
          var clubObj = clubs[playerObj.team -1];

          var current_fixture_id = clubObj['current_event_fixture'][0].id;
          var club_current_fixture;

          for (var k = 0; k < gwFixtures.length; k++) {
            if (gwFixtures[k].id === current_fixture_id) {
              club_current_fixture = gwFixtures[k];
              break;
            }
          }

          var obj = {
            name: playerObj['web_name'],
            isCaptain: currentSelection['is_captain']
          };

          if (!club_current_fixture.started) {
            notPlayed.push(obj);
          } else if (club_current_fixture.started) {
              if (club_current_fixture.finished) {
                played.push(obj);
              } else {
                playing.push(obj);
              }
          }
        }

        state['played'] = played;
        state['playing'] = playing;
        state['notPlayed'] = notPlayed;
        teamsState[i] = state;

        if (i === teams.length -1) {
          var event = new Event('ready');
          window.dispatchEvent(event);
        }
      });
    });
  });
}

window.addEventListener("ready", function() {
  console.log(teamsState);
});

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