import * as Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import {
  AddTrackerCommand,
  ChatMessage,
  HelpCommand,
  ListTrackersCommand,
  RemoveTrackerCommand,
} from '../../models/interfaces';

import {
  BotCommandType,
  MessageChannelType,
  SourceConnectorIdentifier,
} from '../../models/enums';

import { parseEnumValue } from '../../utils/enum.utils';

const providerChoices = [
  ['RaceTimeGG', SourceConnectorIdentifier.RACETIME_GG],
  ['SpeedRunsLive', SourceConnectorIdentifier.SPEEDRUNSLIVE],
] as [string, string][];

const transformInteractionToChatMessage = (
  interaction: Discord.CommandInteraction,
): ChatMessage => {
  return {
    identifier: interaction.id,
    channel: {
      name: null,
      identifier: interaction.channelId,
      serverIdentifier: interaction.guildId,
      type: MessageChannelType.TEXT_CHANNEL,
    },
    author: {
      identifier: interaction.user.id,
    },
  };
};

const helpCommand = {
  template: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays the help text for the bot usage'),
  prepare: (interaction: Discord.CommandInteraction): Promise<HelpCommand> => {
    return Promise.resolve({
      type: BotCommandType.HELP,
      message: transformInteractionToChatMessage(interaction),
    });
  },
};

const listTrackersCommand = {
  template: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Lists the trackers registered in the current guild'),
  prepare: (
    interaction: Discord.CommandInteraction,
  ): Promise<ListTrackersCommand> => {
    return Promise.resolve({
      type: BotCommandType.LIST_TRACKERS,
      channelIdentifier: interaction.channelId,
      serverIdentifier: interaction.guildId,
      message: transformInteractionToChatMessage(interaction),
    });
  },
};

const registerTrackerCommand = {
  template: new SlashCommandBuilder()
    .setName('track')
    .setDescription('Registers a new tracker')

    .addStringOption((o) =>
      o
        .setName('provider')
        .setDescription('The race provider')
        .setRequired(true)
        .addChoices(providerChoices),
    )
    .addStringOption((o) =>
      o.setName('slug').setDescription('The games slug').setRequired(true),
    )
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription(
          'The channel in which the announcements should be posted.',
        )
        .setRequired(true),
    ),
  prepare: async (
    interaction: Discord.CommandInteraction,
  ): Promise<AddTrackerCommand | null> => {
    const mentionedChannel = interaction.options.getChannel('channel');
    if (!mentionedChannel) {
      await interaction.reply('Invalid channel');
      return null;
    }

    const mentionedChannelInGuild = interaction.guild?.channels.cache.find(
      (c) => c.id === mentionedChannel.id,
    );

    if (
      !mentionedChannelInGuild ||
      mentionedChannelInGuild.type !== 'GUILD_TEXT'
    ) {
      await interaction.reply('Invalid channel');
      return null;
    }

    const selectedProvider = parseEnumValue(
      SourceConnectorIdentifier,
      interaction.options.getString('provider'),
    );

    if (!selectedProvider) {
      await interaction.reply('Invalid Provider');
      return null;
    }

    const selectedSlug = interaction.options.getString('slug');

    if (!selectedSlug) {
      await interaction.reply('Missing slug');
      return null;
    }

    return {
      type: BotCommandType.ADD_TRACKER,
      sourceIdentifier: selectedProvider as SourceConnectorIdentifier,
      gameIdentifier: selectedSlug,
      targetChannelIdentifier: mentionedChannel.id,
      message: transformInteractionToChatMessage(interaction),
    };
  },
};

const removeTrackerCommand = {
  template: new SlashCommandBuilder()
    .setName('untrack')
    .setDescription('Removes an existing tracker')

    .addStringOption((o) =>
      o
        .setName('provider')
        .setDescription('The race provider')
        .setRequired(true)
        .addChoices(providerChoices),
    )
    .addStringOption((o) =>
      o.setName('slug').setDescription('The games slug').setRequired(true),
    ),
  prepare: async (
    interaction: Discord.CommandInteraction,
  ): Promise<RemoveTrackerCommand | null> => {
    const selectedProvider = parseEnumValue(
      SourceConnectorIdentifier,
      interaction.options.getString('provider'),
    );

    if (!selectedProvider) {
      await interaction.reply('Invalid Provider');
      return null;
    }

    const selectedSlug = interaction.options.getString('slug');

    if (!selectedSlug) {
      await interaction.reply('Missing slug');
      return null;
    }

    return {
      type: BotCommandType.REMOVE_TRACKER,
      sourceIdentifier: selectedProvider as SourceConnectorIdentifier,
      serverIdentifier: interaction.guildId,
      gameIdentifier: selectedSlug,
      message: transformInteractionToChatMessage(interaction),
    };
  },
};

const discordSlashCommands = [
  helpCommand,
  listTrackersCommand,
  registerTrackerCommand,
  removeTrackerCommand,
];

export default discordSlashCommands;
