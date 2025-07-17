import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Usar acesso direto fará o programa falhar se as variáveis não estiverem no .env
# Isso garante que supabase_url e supabase_key sempre serão strings.
supabase_url: str = os.environ["SUPABASE_URL"]
supabase_key: str = os.environ["SUPABASE_KEY"]

# Verifica se as variáveis não estão vazias (opcional, mas boa prática)
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL e SUPABASE_KEY não podem estar vazias.")

supabase: Client = create_client(supabase_url, supabase_key)