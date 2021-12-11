import { TaskIdentifier } from '../../src/models/enums';
import { v4 as uuidv4 } from 'uuid';
import RedisService from '../../src/core/redis/redis-service';

describe('Job Orchestration', () => {
  beforeAll(async () => {
    await RedisService.connect();
  });

  afterAll(async () => {
    await RedisService.dispose();
  });

  test('Can reserve job', async () => {
    const randomInstanceUuid = uuidv4();
    const randomPostfix = uuidv4();

    const reservationSuccessful = await RedisService.tryReserveTask(
      TaskIdentifier.ANNOUNCEMENT_SYNC,
      randomPostfix,
      randomInstanceUuid,
      1,
    );

    expect(reservationSuccessful).toBe(true);
  });

  test('Cannot reserve same job twice by same instance', async () => {
    const randomPostfix = uuidv4();
    const randomInstanceUuid = uuidv4();

    const reservationSuccessfulA = await RedisService.tryReserveTask(
      TaskIdentifier.ANNOUNCEMENT_SYNC,
      randomPostfix,
      randomInstanceUuid,
      10,
    );

    expect(reservationSuccessfulA).toBe(true);

    const reservationSuccessfulB = await RedisService.tryReserveTask(
      TaskIdentifier.ANNOUNCEMENT_SYNC,
      randomPostfix,
      randomInstanceUuid,
      10,
    );

    expect(reservationSuccessfulB).toBe(false);
  });

  test('Cannot reserve same job with two instances', async () => {
    const randomPostfix = uuidv4();
    const randomInstanceUuidA = uuidv4();
    const randomInstanceUuidB = uuidv4();

    const reservationSuccessfulA = await RedisService.tryReserveTask(
      TaskIdentifier.ANNOUNCEMENT_SYNC,
      randomPostfix,
      randomInstanceUuidA,
      10,
    );

    expect(reservationSuccessfulA).toBe(true);

    const reservationSuccessfulB = await RedisService.tryReserveTask(
      TaskIdentifier.ANNOUNCEMENT_SYNC,
      randomPostfix,
      randomInstanceUuidB,
      10,
    );

    expect(reservationSuccessfulB).toBe(false);
  });

  test('Job expires after specified timeframe', async () => {
    const randomInstanceUuid = uuidv4();
    const randomPostfix = uuidv4();
    const ttl = 3;

    const reservationSuccessfulA = await RedisService.tryReserveTask(
      TaskIdentifier.ANNOUNCEMENT_SYNC,
      randomPostfix,
      randomInstanceUuid,
      ttl,
    );

    expect(reservationSuccessfulA).toBe(true);

    await new Promise<void>((resolve) =>
      setTimeout(() => resolve(), (ttl + 1) * 1000),
    );

    const reservationSuccessfulB = await RedisService.tryReserveTask(
      TaskIdentifier.ANNOUNCEMENT_SYNC,
      randomPostfix,
      randomInstanceUuid,
      3,
    );

    expect(reservationSuccessfulB).toBe(true);
  });
});
