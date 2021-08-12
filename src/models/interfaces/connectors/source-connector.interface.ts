import { GameInformation, RaceInformation } from '..';
import { SourceConnectorIdentifier } from '../../enums';

interface SourceConnector<T extends SourceConnectorIdentifier> {
  get connectorType(): T;
  getActiveRaces(): Promise<RaceInformation[]>;
  getRaceById(identifier: string): Promise<RaceInformation | null>;
  listGames(): Promise<GameInformation[]>;
}

export default SourceConnector;
