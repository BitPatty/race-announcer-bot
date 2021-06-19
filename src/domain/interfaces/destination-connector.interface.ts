import { DestinationConnectorIdentifier } from '../enums';

interface DestinationConnector<T extends DestinationConnectorIdentifier> {
  get connectorType(): T;
}

export default DestinationConnector;
