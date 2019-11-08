using System;
using NUnit.Framework;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Tests.TestHelpers;
using RaceAnnouncer.Schema.Models;
using System.Linq;
using RaceAnnouncer.Schema.Models.Enumerations;

[System.Diagnostics.CodeAnalysis.SuppressMessage("Design", "RCS1110:Declare type inside namespace.", Justification = "NUnit 3 Spec")]

[SetUpFixture]
public class NUnitSetup
{
  [OneTimeSetUp]
  public void OneTimeSetup()
  {
    /*
    using DatabaseContext context = ContextHelper.GetContext();
    ContextHelper.ResetDatabase(context);

    AddGuilds(context);
    AddChannels(context);
    AddGames(context);
    AddRaces(context);
    AddEntrants(context);
    AddTrackers(context);
    AddAnnouncements(context);
    */
  }

  private void AddGuilds(DatabaseContext context)
  {
    for (ulong i = 0; i < 10; i++)
      context.Guilds.Add(new Guild(i, $"Guild {i}"));

    context.SaveChanges();
  }

  private void AddChannels(DatabaseContext context)
  {
    for (int i = 0; i < context.Guilds.Count(); i++)
    {
      Guild guild =
        context
        .Guilds
        .OrderBy(g => g.Id)
        .ToArray()[i];

      for (ulong j = 0; j < 10; j++)
      {
        context.Channels.Add(
          new Channel(
            guild
            , ((ulong)i * 100) + j
            , $"Channel {((ulong)i * 100) + j}"));
      }

      context.SaveChanges();
    }
  }

  private void AddGames(DatabaseContext context)
  {
    for (int i = 0; i < 100; i++)
      context.Games.Add(new Game($"g{i}", $"Game {i}", i));

    context.SaveChanges();
  }

  private void AddRaces(DatabaseContext context)
  {
    Random rand = new Random();

    for (int i = 0; i < 1000; i++)
    {
      Game game = context.Games.ToArray()[rand.Next(0, context.Games.Count())];

      context.Races.Add(
        new Race(
          game
          , $"Goal {i}"
          , $"srl_{i}"
          , 123
          , rand.Next(0, 100) < 30
          , SRLApiClient.Endpoints.RaceState.EntryOpen));
    }

    context.SaveChanges();
  }

  private void AddEntrants(DatabaseContext context)
  {
    for (int i = 0; i < context.Races.Count(); i++)
    {
      Race race = context.Races.ToArray()[i];

      for (int j = 0; j < 10; j++)
      {
        context.Entrants.Add(
          new Entrant(
            race
            , $"Entrant {(i * 100) + j}"
            , SRLApiClient.Endpoints.EntrantState.Entered
            , null
            , null));
      }
    }
  }

  private void AddTrackers(DatabaseContext context)
  {
    Random rand = new Random();

    for (int i = 0; i < 50; i++)
    {
      Game game = context.Games.ToArray()[rand.Next(0, context.Games.Count())];

      context.Trackers.Add(
        new Tracker(
          context.Channels.ToArray()[rand.Next(0, context.Channels.Count())]
          , game
        )
        {
          State = (TrackerState)rand.Next(1, 4)
        });
    }

    context.SaveChanges();
  }

  private void AddAnnouncements(DatabaseContext context)
  {
    Random rand = new Random();

    for (int i = 0; i < 50; i++)
    {
      Tracker tracker = context.Trackers.ToArray()[rand.Next(0, context.Trackers.Count())];
      Channel channel = context.Channels.ToArray()[rand.Next(0, context.Channels.Count())];
      Race race = context.Races.ToArray()[rand.Next(0, context.Races.Count())];

      context.Announcements.Add(
        new Announcement(
          channel
          , tracker
          , race
          , (ulong)i));
    }

    context.SaveChanges();
  }
}
