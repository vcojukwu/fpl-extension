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
      state['id'] = teams[i]['entry'];
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

function buildTooltip(team) {
  var played = team.played;
  var playing = team.playing;
  var notPlayed = team.notPlayed;

  var played_body = '';
  var playing_body = '';
  var not_played_body = '';

  var wrapper_start = `<div class="tooltip-text">`;
  var wrapper_end =   `</div>`;

  if (played.length > 0) {
    var played_body_start = `<h3 class="tooltip-title">Played</h1>
                            <table class="tooltip-table">
                              <tbody>`;

    var played_body_end =  `</tbody>
                          </table>`;

    played_body = played_body_start;

    for (var i in played) {
      var name = played[i].name;
      var isCaptain = played[i].isCaptain;
      if(played_body) {
        if (isCaptain) {
          played_body += `<tr><td><b>${name}</b></td</tr>`;
        } else {
          played_body += `<tr><td>${name}</td</tr>`;
        }
      }
    }

    played_body += played_body_end;
  }

  if (playing.length > 0) {
    var playing_body_start = `<h3 class="tooltip-title">Playing</h1>
                            <table class="tooltip-table">
                              <tbody>`;

    var playing_body_end =  `</tbody>
                          </table>`;

    playing_body = playing_body_start;

    for (var i in playing) {
      var name = playing[i].name;
      var isCaptain = playing[i].isCaptain;
      if(playing_body) {
        if (isCaptain) {
          playing_body += `<tr><td><b>${name}</b></td</tr>`;
        } else {
          playing_body += `<tr><td>${name}</td</tr>`;
        }
      }
    }

    playing_body += playing_body_end;
  }

  if (notPlayed.length > 0) {
    var not_played_body_start = `<h3 class="tooltip-title">Not Played</h1>
                            <table class="tooltip-table">
                              <tbody>`;

    var not_played_body_end =  `</tbody>
                          </table>`;

    not_played_body = not_played_body_start;

    for (var i in notPlayed) {
      var name = notPlayed[i].name;
      var isCaptain = notPlayed[i].isCaptain;
      if(not_played_body) {
        if (isCaptain) {
          not_played_body += `<tr><td><b>${name}</b></td</tr>`;
        } else {
          not_played_body += `<tr><td>${name}</td</tr>`;
        }
      }
    }

    not_played_body += not_played_body_end;
  }

  return wrapper_start + played_body + playing_body + not_played_body + wrapper_end;
}

window.addEventListener("ready", function() {
  console.log(teamsState);
  var links = $('a[href^="/a/team/"]').splice(2);

  for (var i in links) {
    var link = links[i];
    var team = teamsState[i];

    var team_id = link.href.split('/').slice(-1)[0];
    var str = `a[href="/a/team/${team_id}"]`;
    var linkElem = $(str);

    var content = buildTooltip(team);
    linkElem.addClass('tooltip2')
      .append(content);
  }

});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    //getInfo(request.url);
    setTimeout(function() {
      getInfo(request.url);
    }, 5000);
});
