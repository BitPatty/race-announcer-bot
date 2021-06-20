import { DestinationConnectorIdentifier } from '../enums';

interface DestinationConnector<T extends DestinationConnectorIdentifier> {
  get connectorType(): T;

  connect(): Promise<void>;

  dispose(): Promise<void>;
}

export default DestinationConnector;
