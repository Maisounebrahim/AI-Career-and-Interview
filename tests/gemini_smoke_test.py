import sys
sys.path.insert(0, r"c:\Users\PMT\OneDrive\Desktop\project")

from config import Config
from ai_service import get_ai_client, ai_chat, _effective_model

print("=== Config check ===")
print("  AI_PROVIDER :", Config.AI_PROVIDER)
print("  AI_MODEL    :", Config.AI_MODEL)
print("  AI_API_BASE :", Config.AI_API_BASE)
print("  ai_available:", Config.ai_available())
print("  eff. model  :", _effective_model())

print()
print("=== Live Gemini API test ===")
result = ai_chat([
    {"role": "system", "content": "You are a helpful career coach. Answer in exactly one sentence."},
    {"role": "user",   "content": "Give me one concrete tip for writing a strong CV summary."}
])

if result["success"]:
    print("  SUCCESS!")
    print("  Gemini reply:", result["content"])
else:
    print("  FAILED:", result.get("error"))
