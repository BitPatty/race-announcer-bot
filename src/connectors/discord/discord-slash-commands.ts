/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2021 Matteias Collet <matteias.collet@bluewin.ch>
 * Official Repository: https://github.com/BitPatty/RaceAnnouncerBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
  prepare: async (
    interaction: Discord.CommandInteraction,
  ): Promise<HelpCommand> => {
    await interaction.deferReply({ ephemeral: true });
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
  prepare: async (
    interaction: Discord.CommandInteraction,
  ): Promise<ListTrackersCommand> => {
    await interaction.deferReply({ ephemeral: true });
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
      await interaction.reply({
        content: 'Invalid channel',
        ephemeral: true,
      });
      return null;
    }

    const mentionedChannelInGuild = interaction.guild?.channels.cache.find(
      (c) => c.id === mentionedChannel.id,
    );

    if (
      !mentionedChannelInGuild ||
      mentionedChannelInGuild.type !== 'GUILD_TEXT'
    ) {
      await interaction.reply({
        content: 'Invalid channel',
        ephemeral: true,
      });
      return null;
    }

    const selectedProvider = parseEnumValue(
      SourceConnectorIdentifier,
      interaction.options.getString('provider'),
    );

    if (!selectedProvider) {
      await interaction.reply({
        content: 'Invalid Provider',
        ephemeral: true,
      });
      return null;
    }

    const selectedSlug = interaction.options.getString('slug');

    if (!selectedSlug) {
      await interaction.reply({
        content: 'Missing slug',
        ephemeral: true,
      });
      return null;
    }

    await interaction.deferReply({ ephemeral: true });
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
      await interaction.reply({
        content: 'Invalid Provider',
        ephemeral: true,
      });
      return null;
    }

    const selectedSlug = interaction.options.getString('slug');

    if (!selectedSlug) {
      await interaction.reply({
        content: 'Missing slug',
        ephemeral: true,
      });
      return null;
    }

    await interaction.deferReply({ ephemeral: true });
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
