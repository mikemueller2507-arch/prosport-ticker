const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:ticker@prosport-app.de',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const LEAGUES = [
  { id: 'NFL', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' },
  { id: 'NBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard' },
  { id: 'NHL', url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard' },
  { id: 'MLB', url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard' },
  { id: 'NCAAF', url: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard' },
  { id: 'BUNDESLIGA', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard' },
  { id: 'BL2', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.2/scoreboard' },
  { id: 'DFB', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.dfb_pokal/scoreboard' },
  { id: 'PREMIER', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard' },
  { id: 'LALIGA', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard' },
  { id: 'SERIEA', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard' },
  { id: 'UCL', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard' },
  { id: 'UEL', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.europa/scoreboard' },
  { id: 'UECL', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.europa.conf/scoreboard' },
  { id: 'UNL', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.nations/scoreboard' }
];

module.exports = async (req, res) => {
  try {
    const subscription = JSON.parse(process.env.IPHONE_PUSH_SUBSCRIPTION || 'null');
    if (!subscription) {
      return res.status(200).json({ status: 'Warte auf iPhone Push-Subscription' });
    }

    let notificationsSent = 0;

    for (const league of LEAGUES) {
      const response = await fetch(league.url);
      if (!response.ok) continue;
      const data = await response.json();

      const liveEvents = (data.events || []).filter(e => e.status?.type?.state === 'in');

      for (const event of liveEvents) {
        const comp = event.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home') || comp.competitors[0];
        const away = comp.competitors.find(c => c.homeAway === 'away') || comp.competitors[1];
        const lastPlay = comp.situation?.lastPlay?.text || event.status?.type?.shortDetail || 'Live-Update';

        const payload = JSON.stringify({
          title: `[${league.id}] ${home.team.abbreviation} ${home.score} : ${away.score} ${away.team.abbreviation}`,
          body: lastPlay,
          icon: home.team.logo,
          tag: `game-${event.id}`
        });

        await webpush.sendNotification(subscription, payload);
        notificationsSent++;
      }
    }

    res.status(200).json({ status: 'OK', notificationsSent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
