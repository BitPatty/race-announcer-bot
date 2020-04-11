using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using SRLApiClient;
using SRLApiClient.Endpoints.Games;
using SRLApiClient.Endpoints.Races;
using RaceAnnouncer.Bot.Util;
using SRLApiClient.Exceptions;
using RaceAnnouncer.Common;

namespace RaceAnnouncer.Bot.Services
{
  public class SRLService : IDisposable
  {
    public event EventHandler<IReadOnlyCollection<Race>>? OnUpdate;

    private readonly Timer _updateTimer;

    private readonly SRLClient _client;

    private bool _isUpdateTriggerEnabled = false;

    public bool IsUpdateTriggerEnabled
    {
      get => _isUpdateTriggerEnabled;
      set
      {
        Logger.Info($"Switching update trigger state to {value}");
        _isUpdateTriggerEnabled = value;
      }
    }

    public SRLService(double interval = 10000)
    {
      if (interval < 5000) throw new ArgumentException($"{nameof(interval)}: Value must be greater than 5000: '{interval}' given.");

      _client = new SRLClient(poolSize: 5);

      _updateTimer = new Timer(interval);
      _updateTimer.Elapsed += Timer_Elapsed;
    }

    public IReadOnlyCollection<Game> GetGameList()
      => _client.Games.GetAll();

    public async Task<Race> GetRaceAsync(string srlId)
      => await _client.Races.GetAsync(srlId).ConfigureAwait(false);

    public void StartTimer()
      => _updateTimer.Start();

    public void StopTimer()
      => _updateTimer.Stop();

    private void Timer_Elapsed(object sender, ElapsedEventArgs e)
    {
      Logger.Info("Update timer elapsed");

      if (IsUpdateTriggerEnabled)
      {
        Logger.Info("Loading SRL races");

        try
        {
          OnUpdate?.Invoke(this, _client.Races
            .GetActive()
            .Where(r => r.Game.Id != 0 && !r.Game.Abbreviation.Equals("newgame"))
            .ToList()
            .AsReadOnly()
          );

          Logger.Info("SRL races loaded");
        }
        catch (Exception ex)
        {
          Logger.Error($"Exception thrown", ex);
        }
      }
    }

    public void Dispose()
    {
      _client.Dispose();
      _updateTimer.Dispose();
    }
  }
}
