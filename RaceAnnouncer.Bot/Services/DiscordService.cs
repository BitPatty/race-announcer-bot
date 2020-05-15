using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Discord;
using Discord.Rest;
using Discord.WebSocket;
using RaceAnnouncer.Common;
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
    public event EventHandler<SocketMessage>?         /**/ OnCommandReceived;

    #endregion EventHandlers

    /// <summary>
    /// Base client
    /// </summary>
    private readonly DiscordSocketClient _discordClient;

    /// <summary>
    /// User IDs of bot administrators
    /// </summary>
    private readonly string[] _admins = Environment.GetEnvironmentVariable("ADMINS")?.Split(",") ?? new string[0];

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
      _discordClient.MessageReceived    /**/ += OnClientMessageReceived;
      _discordClient.Log                /**/ += OnClientLog;
    }

    private Task OnClientLog(LogMessage arg)
    {
      if (arg.Exception != null)
        Logger.Error($"[Discord Client] {arg.Message}", arg.Exception);
      else
        Logger.Debug($"[Discord Client] {arg.Severity} : {arg.Message}");

      return Task.CompletedTask;
    }

    /// <summary>
    /// Authenticates the bot
    /// </summary>
    /// <param name="token">The bots token</param>
    public async Task AuthenticateAsync(string token)
     => await _discordClient.LoginAsync(TokenType.Bot, token).ConfigureAwait(false);

    /// <summary>
    /// Starts the client
    /// </summary>
    public async Task StartAsync()
      => await _discordClient.StartAsync().ConfigureAwait(false);

    /// <summary>
    /// Stops the client
    /// </summary>
    public void Stop()
      => _discordClient.StopAsync().Wait();

    /// <summary>
    /// Gets the list of text channels
    /// </summary>
    /// <returns>Returns the list of text channels</returns>
    public IEnumerable<SocketTextChannel> GetTextChannels()
      => _discordClient.Guilds.SelectMany(g => g.TextChannels);

    /// <summary>
    /// Gets the list of guilds
    /// </summary>
    /// <returns>Returns the list of guilds</returns>
    public IEnumerable<SocketGuild> GetGuilds()
      => _discordClient.Guilds;

    /// <summary>
    /// Gets the guild with the specified <paramref name="guildId"/>
    /// </summary>
    /// <param name="guildId">The guilds snowflake</param>
    /// <returns>Returns the guild</returns>
    public SocketGuild? GetGuild(ulong guildId)
      => _discordClient.Guilds.SingleOrDefault(g => g.Id.Equals(guildId));

    /// <summary>
    /// Get a single text channel with the specified id
    /// </summary>
    /// <param name="channelId">The channel id</param>
    /// <returns>Returns the channel</returns>
    public SocketTextChannel GetTextChannel(ulong channelId)
      => GetTextChannels().First(c => c.Id.Equals(channelId));

    /// <summary>
    /// Checks whether the bot has the necessary permissions in the specified channel
    /// </summary>
    /// <param name="guildId">The guild id</param>
    /// <param name="channelId">The channel id</param>
    /// <returns>Returns true if the permissions are set correctly</returns>
    public bool? HasRequiredPermissions(ulong guildId, ulong channelId)
    {
      Logger.Info($"Checking channel permissions {guildId}/{channelId}");

      SocketTextChannel channel = GetTextChannel(channelId);
      if (channel == null) return null;

      ChannelPermissions? permissions = GetGuild(guildId)?.CurrentUser?.GetPermissions(GetTextChannel(channelId));
      if (permissions == null) return null;

      ChannelPermissions channelPermissions = (ChannelPermissions)permissions;

      return channelPermissions.ViewChannel
        && channelPermissions.ReadMessageHistory
        && channelPermissions.SendMessages
        && channelPermissions.EmbedLinks;
    }

    /// <summary>
    /// Checks whether a channel is available
    /// </summary>
    /// <param name="channelId">The channels snowflake</param>
    /// <returns>Returns the channel with the specified <paramref name="channelId"/></returns>
    public bool IsChannelAvailable(ulong channelId)
      => _discordClient.Guilds
          .Select(g => g.Channels.SingleOrDefault(c => c.Id.Equals(channelId))).Count() == 1;

    #region Messages

    public async Task<RestUserMessage> Reply(SocketMessage message, string content)
      => await message.Channel.SendMessageAsync($"{message.Author.Mention} {content}");

    /// <summary>
    /// Sends an embed to the specified <paramref name="channelId"/>
    /// </summary>
    /// <param name="channelId">The channels snowflake</param>
    /// <param name="embed"></param>
    /// <returns>Returns the posted message</returns>
    public async Task<RestUserMessage?> SendEmbedAsync(ulong channelId, Embed embed)
      => await _discordClient.Guilds
          .SelectMany(g => g.TextChannels.Where(c => c.Id.Equals(channelId)))
          .First()
          .SendMessageAsync(text: "", embed: embed).ConfigureAwait(false);

    /// <summary>
    /// Replaces an embed in an existing message
    /// </summary>
    /// <param name="message">The message</param>
    /// <param name="embed">The new embed</param>
    public async Task ModifyMessageAsync(RestUserMessage message, Embed embed)
      => await message.ModifyAsync(m => { m.Embed = embed; m.Content = ""; }).ConfigureAwait(false);

    /// <summary>
    /// Attempts to find a message with the specified <paramref name="messageId"/>
    /// in the specified <paramref name="channel"/>
    /// </summary>
    /// <param name="channel">The channel</param>
    /// <param name="messageId">The messages snowflake</param>
    /// <returns>Returns the message</returns>
    public async Task<RestUserMessage?> FindMessageAsync(Channel channel, ulong messageId)
      => await _discordClient.Guilds
          .SelectMany(g => g.TextChannels.Where(c => c.Id.Equals(channel.Snowflake)))
          .First()
          .GetMessageAsync(messageId).ConfigureAwait(false) as RestUserMessage;

    #endregion Message

    #region EventForwarders

    private System.Threading.Tasks.Task OnClientConnected()
    {
      OnConnected?.Invoke(this, null);
      return Task.CompletedTask;
    }

    private System.Threading.Tasks.Task OnClientDisconnected(Exception arg)
    {
      Logger.Error("Discord disconnected. Exception thrown: ", arg);
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

    private Task OnClientMessageReceived(SocketMessage arg)
    {
      if (arg == null
        || OnCommandReceived == null
        || arg.Author == null) return Task.CompletedTask;

      bool isMention = arg
        .MentionedUsers
        .Any(u => u.IsBot && u.Id.Equals(_discordClient.CurrentUser.Id));

      if (!isMention) return Task.CompletedTask;

      SocketGuild guild = _discordClient
        .Guilds
        .FirstOrDefault(g => g
          .Channels
          .FirstOrDefault(c => c.Id.Equals(arg.Channel.Id))
        != null);

      bool userIsAdmin =
        !arg.Author.IsBot
        && !arg.Author.IsWebhook
        && !string.IsNullOrWhiteSpace(arg.Author.Id.ToString())
        && _admins.SingleOrDefault(a => a.Equals(arg.Author.Id.ToString())) != null;

      bool userHasManageGuildPermission = guild
        .GetUser(arg.Author.Id)
        .GuildPermissions
        .ManageGuild;

      if (!userHasManageGuildPermission && !userIsAdmin) return Task.CompletedTask;

      Logger.Debug($"Bot was mentioned by {arg.Author.Username}{arg.Author.Discriminator}: {arg.Content}");

      OnCommandReceived?.Invoke(this, arg);

      return Task.CompletedTask;
    }

    #endregion EventForwarders

    public void Dispose()
    {
      _discordClient.Dispose();
    }
  }
}
