-- Applied after the base chat tables migration. Safe to run repeatedly.
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
ON public.chat_messages(session_id, created_at DESC);

REVOKE ALL ON TABLE public.chat_sessions FROM anon;
REVOKE ALL ON TABLE public.chat_messages FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO authenticated;

