using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Discord;
using Discord.Rest;
using Discord.WebSocket;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.Bot.Services
{
  public class DiscordService : IDisposable
  {
    #region EventHandlers

    public event EventHandler<EventArgs?>?            /**/ OnReady;
    public event EventHandler<EventArgs?>?            /**/ OnConnected;
    public event EventHandler<Exception?>?            /**/ OnDisconnected;
    public event EventHandler<SocketTextChannel>?     /**/ OnChannelCreated;
    public event EventHandler<SocketGuild>?           /**/ OnGuildJoined;
    public event EventHandler<SocketGuild>?           /**/ OnGuildLeft;
    public event EventHandler<SocketTextChannel>?     /**/ OnChannelDestroyed;

    #endregion EventHandlers

    /// <summary>
    /// Base client
    /// </summary>
    private readonly DiscordSocketClient _discordClient;

    public DiscordService()
    {
      _discordClient                    /**/ = new DiscordSocketClient();
      _discordClient.Ready              /**/ += OnClientReady;
      _discordClient.Disconnected       /**/ += OnClientDisconnected;
      _discordClient.Connected          /**/ += OnClientConnected;
      _discordClient.ChannelCreated     /**/ += OnClientChannelCreated;
      _discordClient.JoinedGuild        /**/ += OnClientJoinedGuild;
      _discordClient.ChannelDestroyed   /**/ += OnClientChannelDestroyed;
      _discordClient.LeftGuild          /**/ += OnClientLeftGuild;
    }

    public async Task Authenticate(string token)
     => await _discordClient.LoginAsync(TokenType.Bot, token).ConfigureAwait(false);

    public async Task Start()
      => await _discordClient.StartAsync().ConfigureAwait(false);

    public void Stop()
      => _discordClient.StopAsync().Wait();

    public IEnumerable<SocketTextChannel> GetTextChannels()
      => _discordClient.Guilds.SelectMany(g => g.TextChannels);

    public SocketGuild GetGuild(ulong guildId)
      => _discordClient.Guilds.FirstOrDefault(g => g.Id.Equals(guildId));

    public bool IsChannelAvailable(ulong channelId)
      => _discordClient.Guilds
          .Select(g => g.Channels.FirstOrDefault(c => c.Id.Equals(channelId))).Count() == 1;

    #region Messages

    public async Task<RestUserMessage?> SendMessageAsync(ulong channelId, Embed embed)
      => await _discordClient.Guilds
          .SelectMany(g => g.TextChannels.Where(c => c.Id.Equals(channelId)))
          .First()
          .SendMessageAsync(text: "", embed: embed).ConfigureAwait(false);

    public async Task ModifyMessageAsync(RestUserMessage message, Embed embed)
      => await message.ModifyAsync(m => { m.Embed = embed; m.Content = ""; }).ConfigureAwait(false);

    public async Task<RestUserMessage?> FindMessageAsync(Channel channel, ulong messageId)
      => await _discordClient.Guilds
          .SelectMany(g => g.TextChannels.Where(c => c.Id.Equals(channel.Snowflake)))
          .First()
          .GetMessageAsync(messageId).ConfigureAwait(false) as RestUserMessage;

    #endregion Message

    #region EventForwarder

    private System.Threading.Tasks.Task OnClientConnected()
    {
      OnConnected?.Invoke(this, null);
      return Task.CompletedTask;
    }

    private System.Threading.Tasks.Task OnClientDisconnected(Exception arg)
    {
      OnDisconnected?.Invoke(this, arg);
      return Task.CompletedTask;
    }

    private System.Threading.Tasks.Task OnClientReady()
    {
      OnReady?.Invoke(this, null);
      return Task.CompletedTask;
    }

    private Task OnClientLeftGuild(SocketGuild arg)
    {
      OnGuildLeft?.Invoke(this, arg);
      return Task.CompletedTask;
    }

    private Task OnClientChannelDestroyed(SocketChannel arg)
    {
      if (arg is SocketTextChannel c) OnChannelDestroyed?.Invoke(this, c);
      return Task.CompletedTask;
    }

    private Task OnClientJoinedGuild(SocketGuild arg)
    {
      OnGuildJoined?.Invoke(this, arg);
      return Task.CompletedTask;
    }

    private Task OnClientChannelCreated(SocketChannel arg)
    {
      if (arg is SocketTextChannel c) OnChannelCreated?.Invoke(this, c);
      return Task.CompletedTask;
    }

    #endregion EventForwarder

    public void Dispose()
    {
      _discordClient.Dispose();
    }
  }
}
