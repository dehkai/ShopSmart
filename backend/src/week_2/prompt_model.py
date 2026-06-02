import os
import sys

from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

_DEV_LLM_PROVIDER = os.environ.get("DEV_LLM_PROVIDER", "").strip().lower()
_DEV_OLLAMA_MODEL = os.environ.get("DEV_OLLAMA_MODEL", "llama3.1")

OLLAMA_MODELS = {"llama3.1", "phi3", "deepseek-r1:1.5b", "gemma3"}
GEMINI_MODELS = {
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
}
GROQ_MODELS = {
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma3-27b-it",
    "gemma3-12b-it",
    "gemma3-4b-it",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
}

DEFAULT_MODEL = "gemini-2.5-flash-lite"


def prompt_model(model: str, prompt: str, api_key: str | None = None) -> str:
    text, _ = call_model(model, prompt, api_key)
    return text


def call_model(model: str, prompt: str, api_key: str | None = None) -> tuple[str, int]:
    try:
        if _DEV_LLM_PROVIDER == "ollama":
            return _call_ollama(_DEV_OLLAMA_MODEL, prompt)
        if model in GEMINI_MODELS:
            return _call_gemini(model, prompt, api_key)
        elif model in GROQ_MODELS:
            return _call_groq(model, prompt, api_key)
        elif model in OLLAMA_MODELS:
            return _call_ollama(model, prompt)
        else:
            return (
                f"[Error] Unknown model '{model}'. "
                f"Supported: {OLLAMA_MODELS | GEMINI_MODELS | GROQ_MODELS}",
                0,
            )
    except Exception as e:
        return f"[Error] Unexpected failure: {e}", 0


def _call_gemini(model: str, prompt: str, api_key: str | None = None) -> tuple[str, int]:
    try:
        from google import genai

        key = api_key or os.environ.get("GEMINI_API") or os.environ.get("GOOGLE_API_KEY")
        if not key:
            return "[Gemini Error] GEMINI_API environment variable not set.", 0

        client = genai.Client(api_key=key)
        response = client.models.generate_content(model=model, contents=prompt)
        tokens = response.usage_metadata.total_token_count or 0
        return response.text, tokens
    except Exception as e:
        return f"[Gemini Error] {e}", 0


def _call_groq(model: str, prompt: str, api_key: str | None = None) -> tuple[str, int]:
    try:
        import json
        import urllib.request

        key = api_key or os.environ.get("GROQ_API_KEY")
        if not key:
            return "[Groq Error] No API key provided.", 0

        payload = json.dumps({
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
        }).encode()

        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read())

        text = body["choices"][0]["message"]["content"]
        tokens = body.get("usage", {}).get("total_tokens", 0)
        return text, tokens
    except Exception as e:
        return f"[Groq Error] {e}", 0


def _call_ollama(model: str, prompt: str) -> tuple[str, int]:
    try:
        import ollama

        response = ollama.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )
        tokens = (response.prompt_eval_count or 0) + (response.eval_count or 0)
        return response.message.content, tokens
    except Exception as e:
        return f"[Ollama Error] {e}", 0

def main():
    if len(sys.argv) >= 3:
        model = sys.argv[1]
        prompt = sys.argv[2]
    else:
        model = "llama3.1"
        prompt = "Say hello in one sentence."

    response = prompt_model(model, prompt)
    print("--- RESPONSE ---")
    print(response)


if __name__ == "__main__":
    main()
