import { SourceConnectorIdentifier } from '../enums';
import Game from './game.interface';
import Race from './race.interface';

interface SourceConnector<T extends SourceConnectorIdentifier> {
  get connectorType(): T;

  getActiveRaces(): Promise<Race[]>;
  getRace(race: Race): Promise<Race | null>;
  listGames(): Promise<Game[]>;
}

export default SourceConnector;
