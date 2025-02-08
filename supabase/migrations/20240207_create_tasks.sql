-- Create tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    validation_required BOOLEAN NOT NULL DEFAULT false,
    random_payout BOOLEAN NOT NULL DEFAULT false,
    min_points INTEGER,
    max_points INTEGER,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow users to view tasks they created or are assigned to
CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (
        auth.uid() = creator_id OR 
        auth.uid() = assignee_id
    );

-- Allow users to create tasks
CREATE POLICY "Users can create tasks"
    ON tasks FOR INSERT
    WITH CHECK (
        auth.uid() = creator_id AND
        EXISTS (
            SELECT 1 FROM pairings
            WHERE status = 'approved'
            AND (
                (user_id = creator_id AND partner_id = assignee_id) OR
                (user_id = assignee_id AND partner_id = creator_id)
            )
        )
    );

-- Allow users to update tasks they created
CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at(); 