let clubs;
let gameWeekNumber;
let gameWeekFixtures;
let leagueUrl;
let playersInformation;
let teamsState = {};
let count = 0;
let previousLinks;
let interval;
let players = {}
let running = false;

const NOTPLAYED = 1;
const PLAYING = 2;
const PLAYED = 3;

function getJSON(url) {
  return fetch(url).then(function(response) {
    return response.json();
  });
}

function calculatePoints(playerId) {
  let playerUrl = `https://fantasy.premierleague.com/drf/element-summary/${playerId}`;

  return getJSON(playerUrl).then((data) => {
    let pointCategories = data.explain[0].explain;
    let points = Object.values(pointCategories).reduce((a, b) => {
      return a + b.points;
    }, 0);
    return points;
  });
}

function getClubCurrentFixture(club) {
  let currentFixtureId = club['current_event_fixture'][0].id;

  for (let i = 0; i < gameWeekFixtures.length; i++) {
    if (gameWeekFixtures[i].id === currentFixtureId) {
       return gameWeekFixtures[i];
    }
  }
}

function playingStatus(fixture) {
  if (fixture.started) {
    if (fixture.finished) {
      return PLAYED;
    } else {
      return PLAYING;
    }
  } else {
    return NOTPLAYED;
  }
}

function getInfo() {
  getJSON('https://fantasy.premierleague.com/drf/bootstrap-static').then((data) => {
    clubs = data.teams;
    gameWeekNumber = data['current-event'];
    playersInformation = data.elements;

    let liveEventUrl = `https://fantasy.premierleague.com/drf/event/${gameWeekNumber}/live`;

    getJSON(liveEventUrl).then((data) => {
      gameWeekFixtures = data.fixtures;

      getJSON(leagueUrl).then((data) => {
        let teams = data.standings.results;

        teams.map(function(team) {
          let points;
          let entry = team.entry;
          let teamUrl = `https://fantasy.premierleague.com/drf/entry/${entry}/event/${gameWeekNumber}/picks`;
          let teamIndex = team.rank - 1;

          getJSON(teamUrl).then((data) => {
            data.picks.map((pick) => {
              let playerId = pick.element - 1;

              let player = playersInformation[playerId];
              let club = clubs[player.team - 1];
              let isCaptain = pick['is_captain'];

              if (!players.hasOwnProperty(playerId)) {
                players[playerId] = 0;
              }

              calculatePoints(pick.element).then((result) => {
                points = result;
                count++;

                let clubFixture = getClubCurrentFixture(club);
                let state = playingStatus(clubFixture);

                let obj = {
                  name: player['web_name'],
                  isCaptain,
                  points,
                  state,
                  currentPlayingChance: player['chance_of_playing_this_round'],
                  nextPlayingChance: player['chance_of_playing_next_round'],
                  position: pick.position
                };

                if (teamsState[entry]) {
                  teamsState[entry].push(obj);
                } else {
                  teamsState[entry] = [obj];
                }
                if (count === teams.length * 15) {
                  startup();
                }
              });
            });
          });
        });
      });
    });
  });
}

function buildTooltip(team) {
  team.sort((a, b) => a.position - b.position);

  let playedBody = '';
  let playingBody = '';
  let notPlayedBody = '';

  let wrapperStart = `<div class="tooltip-text">`;
  let wrapperEnd =   `</div>`;

  let playedBodyStart = `<h3 class="tooltip-title">Played</h3>
                            <table class="tooltip-table">
                              <tbody>`;

  let playingBodyStart = `<h3 class="tooltip-title">Playing</h3>
                            <table class="tooltip-table">
                              <tbody>`;

  let notPlayedBodyStart = `<h3 class="tooltip-title">Not Played</h3>
                            <table class="tooltip-table">
                              <tbody>`;

  let bodyEnd =  `</tbody>
                    </table>`;

  for (let player of team) {
    let notPlaying = false;

    let isBench = player.position > 11;

    if (player.currentPlayingChance !== null) {
      notPlaying = player.currentPlayingChance < 100;
    }

    let playerRowStart = '<tr><td>';
    let playerRowBody = `${player.name} (${player.points}) ${isBench ? '<i>B</i>' : ''}`;
    let playerRowEnd = '</td></tr>';

    let playerRow = notPlaying ? `${playerRowStart}<s>${playerRowBody}</s>${playerRowEnd}`
                               : `${playerRowStart}${playerRowBody}${playerRowEnd}`;

    let playerRowBold = `${playerRowStart}<b>${playerRowBody}</b>${playerRowEnd}`;


    switch (player.state) {
      case PLAYED:
        playedBody += player.isCaptain ? playerRowBold : playerRow;
        break;
      case PLAYING:
        playingBody += player.isCaptain ? playerRowBold : playerRow;
        break;
      case NOTPLAYED:
        notPlayedBody += player.isCaptain ? playerRowBold : playerRow;
        break;
    }
  }


  if (playedBody) {
    playedBody = playedBodyStart + playedBody + bodyEnd;
  }

  if (playingBody) {
    playingBody = playingBodyStart + playingBody + bodyEnd;
  }

  if (notPlayedBody) {
    notPlayedBody = notPlayedBodyStart + notPlayedBody + bodyEnd;
  }

  return wrapperStart + notPlayedBody + playingBody + playedBody + wrapperEnd;
}

function startup() {
  console.log(teamsState);
  let links = $('a[href^="/a/team/"]').splice(2);

  if (links.length > 0) {
    clearInterval(interval);
    interval = null;
  }

  for (let i = 0; i < links.length; i++) {
    let link = links[i];

    let teamId = link.href.split('/').slice(-1)[0];
    let team = teamsState[teamId];
    let content = buildTooltip(team);

    let template = document.createElement('div');
    template.innerHTML = content;
    template = template.firstChild;

    $("body").append(template);

    tippy(document.querySelector(`a[href="/a/team/${teamId}"]`), {
      html: template,
      arrow: true,
      theme: 'light',
      placement: 'right',
      distance: 20
    });
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (Object.keys(teamsState).length === 0 && !running) {
      running = true;
      let leagueCode = request.url.split("/").slice(-2)[0];

      if(request.url.includes('classic')) {
        leagueUrl = `https://fantasy.premierleague.com/drf/leagues-classic-standings/${leagueCode}`;
      } else if (request.url.includes('h2h')) {
        leagueUrl = `https://fantasy.premierleague.com/drf/leagues-h2h-standings/${leagueCode}`;
      } else {
        console.log('Unknown League Type');
      }
      getInfo();
   } else {
    startup();
    interval = interval || setInterval(startup, 5000);
   }
});


