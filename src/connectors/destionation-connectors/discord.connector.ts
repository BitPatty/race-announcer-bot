import { DestinationConnector } from '../../domain/interfaces';
import { DestinationConnectorIdentifier } from '../../domain/enums';

class DiscordConnector
  implements DestinationConnector<DestinationConnectorIdentifier.DISCORD>
{
  get connectorType(): DestinationConnectorIdentifier.DISCORD {
    return DestinationConnectorIdentifier.DISCORD;
  }
}

export default DiscordConnector;
