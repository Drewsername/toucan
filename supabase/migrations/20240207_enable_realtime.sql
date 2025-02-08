-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Enable replication on tasks table
ALTER TABLE tasks REPLICA IDENTITY FULL; 