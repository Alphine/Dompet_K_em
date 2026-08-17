import os
import io
import json
from emergentintegrations.llm.openai import OpenAISpeechToText
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")


async def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    buf = io.BytesIO(file_bytes)
    buf.name = filename
    response = await stt.transcribe(file=buf, model="whisper-1", response_format="json", language="id")
    return getattr(response, "text", str(response))


async def parse_transaction_draft(transcript: str, business: dict) -> dict:
    system = (
        f"Anda mengekstrak data transaksi keuangan dari ucapan pemilik usaha \"{business.get('business_name')}\". "
        "Balas HANYA dengan JSON valid (tanpa markdown, tanpa penjelasan tambahan) dengan format persis: "
        '{"type": "SALE" atau "EXPENSE", "amount": angka_dalam_rupiah_atau_null, '
        '"counterparty_or_category": "nama pelanggan jika SALE, atau kategori pengeluaran jika EXPENSE", '
        '"notes": "ringkasan singkat"}. '
        "Jika ucapan menyebut menjual/laku/dapat uang dari pelanggan -> type SALE. "
        "Jika menyebut membeli/bayar/keluar uang untuk biaya -> type EXPENSE. "
        "Jika jumlah uang tidak jelas, set amount ke null."
    )
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id="voice-parse", system_message=system).with_model("gemini", "gemini-3.1-pro-preview")
    raw = await chat.send_message(UserMessage(text=transcript))
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    try:
        data = json.loads(text)
    except Exception:
        data = {"type": "EXPENSE", "amount": None, "counterparty_or_category": None, "notes": transcript}
    if data.get("type") not in ("SALE", "EXPENSE"):
        data["type"] = "EXPENSE"
    return data
