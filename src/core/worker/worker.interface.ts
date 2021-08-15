interface WorkerInterface {
  start(): Promise<void>;

  dispose(): Promise<void>;
}

export default WorkerInterface;
