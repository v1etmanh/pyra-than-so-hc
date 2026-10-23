-- ==========================================================
-- SUPABASE CHAT SESSIONS & MESSAGES MIGRATION
-- Supports 10-turn follow-up conversations with local SQLite sync
-- ==========================================================

-- 1. Create public.chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    intent TEXT,
    mode TEXT DEFAULT 'single',
    context_data JSONB,
    question_count INT DEFAULT 0,
    max_questions INT DEFAULT 10,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create public.chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    turn_index INT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'mascot')),
    text TEXT NOT NULL,
    card_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_turn ON public.chat_messages(session_id, turn_index ASC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Policies for chat_sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users can view own chat sessions'
    ) THEN
        CREATE POLICY "Users can view own chat sessions"
        ON public.chat_sessions FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users can insert/update own chat sessions'
    ) THEN
        CREATE POLICY "Users can insert/update own chat sessions"
        ON public.chat_sessions FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Policies for chat_messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can view own chat messages'
    ) THEN
        CREATE POLICY "Users can view own chat messages"
        ON public.chat_messages FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.chat_sessions s
                WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can insert own chat messages'
    ) THEN
        CREATE POLICY "Users can insert own chat messages"
        ON public.chat_messages FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.chat_sessions s
                WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.chat_sessions s
                WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid()
            )
        );
    END IF;
END $$;
