import os
import sys

# Force output to be unbuffered to avoid Render log swallowing
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

try:
    print("--- STARTING CAMPUSMIND AI SERVICE BRIDGE ---", flush=True)
    import uvicorn
    from app.main import app

    port = int(os.getenv("PORT", "8000"))
    print(f"Successfully loaded FastAPI app. Binding to 0.0.0.0:{port}", flush=True)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, log_level="info")
except Exception as e:
    import traceback
    print("CRITICAL: Fatal exception occurred during service startup!", file=sys.stderr, flush=True)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)